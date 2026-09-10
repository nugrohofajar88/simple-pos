import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { apiFetch, ApiError } from '@/src/api/client';
import { fetchMenu } from '@/src/api/menuApi';
import { db } from '@/src/db/client';
import { expenses, orderItemModifiers, orderItems, orders, otherIncomes } from '@/src/db/schema';
import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';
import { useCapitalStore } from '@/src/store/capitalStore';
import { useStoreSettingsStore } from '@/src/store/storeSettingsStore';

function sqliteNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function toIso(sqliteTimestamp: string): string {
  return `${sqliteTimestamp.replace(' ', 'T')}Z`;
}

/**
 * Kirim order yg belum ke-sync (outbox) - order SELALU dibuat lokal dulu (checkout offline-safe),
 * `remoteId IS NULL` = "belum ke-sync", ditandai begitu server konfirmasi diterima.
 */
async function pushOrders(): Promise<void> {
  // Order yg udah ditandai deletedAt (dihapus sebelum sempat ke-sync) dikecualikan - gak perlu
  // dikirim sama sekali, pushDeletedOrders() yg beresin (langsung hapus lokal, gak ada yg
  // perlu diberitahu server krn belum pernah kekirim).
  const dirty = await db.select().from(orders).where(and(isNull(orders.remoteId), isNull(orders.deletedAt)));
  if (dirty.length === 0) return;

  const payload = [];
  for (const order of dirty) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const itemsPayload = [];
    for (const item of items) {
      const modifiers = await db
        .select()
        .from(orderItemModifiers)
        .where(eq(orderItemModifiers.orderItemId, item.id));

      // productId lokal = id server LANGSUNG (cache menu gak lagi pakai remoteId terpisah).
      itemsPayload.push({
        productRemoteId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        qty: item.qty,
        note: item.note,
        printed: item.printed,
        createdAt: toIso(item.createdAt),
        modifiers: modifiers.map((m) => ({
          modifierGroupName: m.modifierGroupName,
          modifierOptionName: m.modifierOptionName,
          priceDelta: m.priceDelta,
        })),
      });
    }

    payload.push({
      localId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      subtotal: order.subtotal,
      total: order.total,
      paymentMethod: order.paymentMethod,
      note: order.note,
      createdAt: toIso(order.createdAt),
      items: itemsPayload,
    });
  }

  const { results } = await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ orders: payload }) });
  for (const r of results) {
    await db.update(orders).set({ remoteId: r.remoteId, syncedAt: sqliteNow() }).where(eq(orders.id, r.localId));
  }
}

/**
 * Order yg ditandai deletedAt (lihat src/db/queries/orders.ts:deleteOrder) - kirim sinyal hapus
 * ke server kalau udah pernah sync (remoteId ada), baru baris lokalnya beneran dihapus. Order yg
 * belum sempat sync (remoteId null) langsung dihapus lokal aja, gak ada yg perlu diberitahu server.
 */
async function pushDeletedOrders(): Promise<void> {
  const pending = await db.select().from(orders).where(isNotNull(orders.deletedAt));
  if (pending.length === 0) return;

  for (const order of pending) {
    if (order.remoteId) {
      try {
        await apiFetch(`/orders/${order.remoteId}`, { method: 'DELETE' });
      } catch (error) {
        // 404 = emang udah gak ada di server (mis. sudah dihapus dari web duluan) - anggap
        // tujuan tercapai, lanjut bersihkan lokal. Error lain (offline/500) - coba lagi nanti.
        if (!(error instanceof ApiError) || error.status !== 404) continue;
      }
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      await db.delete(orderItemModifiers).where(eq(orderItemModifiers.orderItemId, item.id));
    }
    await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
    await db.delete(orders).where(eq(orders.id, order.id));
  }
}

async function pushExpenses(): Promise<void> {
  const dirty = await db.select().from(expenses).where(isNull(expenses.remoteId));
  if (dirty.length === 0) return;

  const payload = dirty.map((e) => ({
    localId: e.id,
    description: e.description,
    amount: e.amount,
    createdAt: toIso(e.createdAt),
  }));

  const { results } = await apiFetch('/expenses', { method: 'POST', body: JSON.stringify({ expenses: payload }) });
  for (const r of results) {
    await db.update(expenses).set({ remoteId: r.remoteId, syncedAt: sqliteNow() }).where(eq(expenses.id, r.localId));
  }
}

async function pushOtherIncomes(): Promise<void> {
  const dirty = await db.select().from(otherIncomes).where(isNull(otherIncomes.remoteId));
  if (dirty.length === 0) return;

  const payload = dirty.map((i) => ({
    localId: i.id,
    description: i.description,
    amount: i.amount,
    createdAt: toIso(i.createdAt),
  }));

  const { results } = await apiFetch('/other-incomes', {
    method: 'POST',
    body: JSON.stringify({ otherIncomes: payload }),
  });
  for (const r of results) {
    await db.update(otherIncomes).set({ remoteId: r.remoteId, syncedAt: sqliteNow() }).where(eq(otherIncomes.id, r.localId));
  }
}

async function pushSettings(): Promise<void> {
  const storeName = useStoreSettingsStore.getState().storeName;
  const initialCapital = useCapitalStore.getState().initialCapital;

  await apiFetch('/settings', {
    method: 'POST',
    body: JSON.stringify({ storeName, initialCapital }),
  });
}

/**
 * Tombol "Sync Sekarang" / auto-sync (app dibuka, setelah checkout/tambah belanja): kirim outbox
 * order/belanja/settings, lalu refresh cache menu lokal dari server.
 */
async function syncAll(): Promise<void> {
  await pushOrders();
  await pushDeletedOrders();
  await pushExpenses();
  await pushOtherIncomes();
  await pushSettings();
  await fetchMenu();
  useSyncSettingsStore.getState().setLastSyncedAt(new Date().toISOString());
}

export const SyncService = {
  syncAll,
  pushOrders,
  pushDeletedOrders,
  pushExpenses,
  pushOtherIncomes,
  pushSettings,
};
