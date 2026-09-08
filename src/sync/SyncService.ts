import { eq, isNull } from 'drizzle-orm';

import { apiFetch } from '@/src/api/client';
import { fetchMenu } from '@/src/api/menuApi';
import { db } from '@/src/db/client';
import { expenses, orderItemModifiers, orderItems, orders } from '@/src/db/schema';
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
  const dirty = await db.select().from(orders).where(isNull(orders.remoteId));
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
  await pushExpenses();
  await pushSettings();
  await fetchMenu();
  useSyncSettingsStore.getState().setLastSyncedAt(new Date().toISOString());
}

export const SyncService = {
  syncAll,
  pushOrders,
  pushExpenses,
  pushSettings,
};
