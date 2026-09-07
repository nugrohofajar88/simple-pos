import { and, eq, gt, isNull, or } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { sqliteNow } from '@/src/db/queries/menu';
import {
  categories,
  expenses,
  modifierGroups,
  modifierOptions,
  orderItemModifiers,
  orderItems,
  orders,
  products,
} from '@/src/db/schema';
import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';
import { useCapitalStore } from '@/src/store/capitalStore';
import { useStoreSettingsStore } from '@/src/store/storeSettingsStore';

function toIso(sqliteTimestamp: string): string {
  return `${sqliteTimestamp.replace(' ', 'T')}Z`;
}

function isoToSqlite(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

function isRemoteNewer(localUpdatedAt: string | null, remoteUpdatedAt: string): boolean {
  if (!localUpdatedAt) return true;
  return new Date(remoteUpdatedAt).getTime() > new Date(toIso(localUpdatedAt)).getTime();
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const { apiBaseUrl, apiToken } = useSyncSettingsStore.getState();
  if (!apiBaseUrl || !apiToken) {
    throw new Error('URL API & token belum diatur di Pengaturan > Sinkronisasi.');
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiToken}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

async function pushCategories(): Promise<void> {
  const dirty = await db
    .select()
    .from(categories)
    .where(or(isNull(categories.syncedAt), gt(categories.updatedAt, categories.syncedAt)));
  if (dirty.length === 0) return;

  const items = dirty.map((c) => ({
    localId: c.id,
    remoteId: c.remoteId,
    name: c.name,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    updatedAt: toIso(c.updatedAt),
    deletedAt: c.deletedAt ? toIso(c.deletedAt) : null,
  }));

  const { results } = await apiFetch('/categories/sync', { method: 'POST', body: JSON.stringify({ items }) });
  for (const r of results) {
    await db.update(categories).set({ remoteId: r.remoteId, syncedAt: sqliteNow() }).where(eq(categories.id, r.localId));
  }
}

async function pushProducts(): Promise<void> {
  const dirty = await db
    .select()
    .from(products)
    .where(or(isNull(products.syncedAt), gt(products.updatedAt, products.syncedAt)));
  if (dirty.length === 0) return;

  const items = [];
  for (const p of dirty) {
    const [category] = await db.select().from(categories).where(eq(categories.id, p.categoryId));
    if (!category?.remoteId) continue;

    items.push({
      localId: p.id,
      remoteId: p.remoteId,
      categoryId: category.remoteId,
      name: p.name,
      basePrice: p.basePrice,
      costPrice: p.costPrice,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      updatedAt: toIso(p.updatedAt),
      deletedAt: p.deletedAt ? toIso(p.deletedAt) : null,
    });
  }
  if (items.length === 0) return;

  const { results } = await apiFetch('/products/sync', { method: 'POST', body: JSON.stringify({ items }) });
  for (const r of results) {
    await db.update(products).set({ remoteId: r.remoteId, syncedAt: sqliteNow() }).where(eq(products.id, r.localId));
  }
}

async function pushModifierGroups(): Promise<void> {
  const dirty = await db
    .select()
    .from(modifierGroups)
    .where(or(isNull(modifierGroups.syncedAt), gt(modifierGroups.updatedAt, modifierGroups.syncedAt)));
  if (dirty.length === 0) return;

  const items = [];
  for (const g of dirty) {
    const [product] = await db.select().from(products).where(eq(products.id, g.productId));
    if (!product?.remoteId) continue;

    items.push({
      localId: g.id,
      remoteId: g.remoteId,
      productId: product.remoteId,
      name: g.name,
      selectionType: g.selectionType,
      isRequired: g.isRequired,
      sortOrder: g.sortOrder,
      updatedAt: toIso(g.updatedAt),
      deletedAt: g.deletedAt ? toIso(g.deletedAt) : null,
    });
  }
  if (items.length === 0) return;

  const { results } = await apiFetch('/modifier-groups/sync', { method: 'POST', body: JSON.stringify({ items }) });
  for (const r of results) {
    await db
      .update(modifierGroups)
      .set({ remoteId: r.remoteId, syncedAt: sqliteNow() })
      .where(eq(modifierGroups.id, r.localId));
  }
}

async function pushModifierOptions(): Promise<void> {
  const dirty = await db
    .select()
    .from(modifierOptions)
    .where(or(isNull(modifierOptions.syncedAt), gt(modifierOptions.updatedAt, modifierOptions.syncedAt)));
  if (dirty.length === 0) return;

  const items = [];
  for (const o of dirty) {
    const [group] = await db.select().from(modifierGroups).where(eq(modifierGroups.id, o.modifierGroupId));
    if (!group?.remoteId) continue;

    items.push({
      localId: o.id,
      remoteId: o.remoteId,
      modifierGroupId: group.remoteId,
      name: o.name,
      priceDelta: o.priceDelta,
      isDefault: o.isDefault,
      sortOrder: o.sortOrder,
      updatedAt: toIso(o.updatedAt),
      deletedAt: o.deletedAt ? toIso(o.deletedAt) : null,
    });
  }
  if (items.length === 0) return;

  const { results } = await apiFetch('/modifier-options/sync', { method: 'POST', body: JSON.stringify({ items }) });
  for (const r of results) {
    await db
      .update(modifierOptions)
      .set({ remoteId: r.remoteId, syncedAt: sqliteNow() })
      .where(eq(modifierOptions.id, r.localId));
  }
}

async function pushDirtyMenu(): Promise<void> {
  await pushCategories();
  await pushProducts();
  await pushModifierGroups();
  await pushModifierOptions();
}

async function pullMenu(): Promise<void> {
  const { lastPulledAt } = useSyncSettingsStore.getState();
  const query = lastPulledAt ? `?since=${encodeURIComponent(lastPulledAt)}` : '';
  const { data, serverTime } = await apiFetch(`/menu${query}`);

  for (const c of data.categories) {
    const [existing] = await db.select().from(categories).where(eq(categories.remoteId, c.id));
    if (existing) {
      if (isRemoteNewer(existing.updatedAt, c.updatedAt)) {
        await db
          .update(categories)
          .set({
            name: c.name,
            sortOrder: c.sortOrder,
            isActive: c.isActive,
            deletedAt: c.deletedAt ? isoToSqlite(c.deletedAt) : null,
            updatedAt: isoToSqlite(c.updatedAt),
            syncedAt: sqliteNow(),
          })
          .where(eq(categories.id, existing.id));
      }
    } else if (!c.deletedAt) {
      await db.insert(categories).values({
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        remoteId: c.id,
        updatedAt: isoToSqlite(c.updatedAt),
        syncedAt: sqliteNow(),
      });
    }
  }

  for (const p of data.products) {
    const [category] = await db.select().from(categories).where(eq(categories.remoteId, p.categoryId));
    if (!category) continue;

    const [existing] = await db.select().from(products).where(eq(products.remoteId, p.id));
    if (existing) {
      if (isRemoteNewer(existing.updatedAt, p.updatedAt)) {
        await db
          .update(products)
          .set({
            categoryId: category.id,
            name: p.name,
            basePrice: p.basePrice,
            costPrice: p.costPrice,
            isActive: p.isActive,
            sortOrder: p.sortOrder,
            deletedAt: p.deletedAt ? isoToSqlite(p.deletedAt) : null,
            updatedAt: isoToSqlite(p.updatedAt),
            syncedAt: sqliteNow(),
          })
          .where(eq(products.id, existing.id));
      }
    } else if (!p.deletedAt) {
      await db.insert(products).values({
        categoryId: category.id,
        name: p.name,
        basePrice: p.basePrice,
        costPrice: p.costPrice,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
        remoteId: p.id,
        updatedAt: isoToSqlite(p.updatedAt),
        syncedAt: sqliteNow(),
      });
    }
  }

  for (const g of data.modifierGroups) {
    const [product] = await db.select().from(products).where(eq(products.remoteId, g.productId));
    if (!product) continue;

    const [existing] = await db.select().from(modifierGroups).where(eq(modifierGroups.remoteId, g.id));
    if (existing) {
      if (isRemoteNewer(existing.updatedAt, g.updatedAt)) {
        await db
          .update(modifierGroups)
          .set({
            productId: product.id,
            name: g.name,
            selectionType: g.selectionType,
            isRequired: g.isRequired,
            sortOrder: g.sortOrder,
            deletedAt: g.deletedAt ? isoToSqlite(g.deletedAt) : null,
            updatedAt: isoToSqlite(g.updatedAt),
            syncedAt: sqliteNow(),
          })
          .where(eq(modifierGroups.id, existing.id));
      }
    } else if (!g.deletedAt) {
      await db.insert(modifierGroups).values({
        productId: product.id,
        name: g.name,
        selectionType: g.selectionType,
        isRequired: g.isRequired,
        sortOrder: g.sortOrder,
        remoteId: g.id,
        updatedAt: isoToSqlite(g.updatedAt),
        syncedAt: sqliteNow(),
      });
    }
  }

  for (const o of data.modifierOptions) {
    const [group] = await db.select().from(modifierGroups).where(eq(modifierGroups.remoteId, o.modifierGroupId));
    if (!group) continue;

    const [existing] = await db.select().from(modifierOptions).where(eq(modifierOptions.remoteId, o.id));
    if (existing) {
      if (isRemoteNewer(existing.updatedAt, o.updatedAt)) {
        await db
          .update(modifierOptions)
          .set({
            modifierGroupId: group.id,
            name: o.name,
            priceDelta: o.priceDelta,
            isDefault: o.isDefault,
            sortOrder: o.sortOrder,
            deletedAt: o.deletedAt ? isoToSqlite(o.deletedAt) : null,
            updatedAt: isoToSqlite(o.updatedAt),
            syncedAt: sqliteNow(),
          })
          .where(eq(modifierOptions.id, existing.id));
      }
    } else if (!o.deletedAt) {
      await db.insert(modifierOptions).values({
        modifierGroupId: group.id,
        name: o.name,
        priceDelta: o.priceDelta,
        isDefault: o.isDefault,
        sortOrder: o.sortOrder,
        remoteId: o.id,
        updatedAt: isoToSqlite(o.updatedAt),
        syncedAt: sqliteNow(),
      });
    }
  }

  useSyncSettingsStore.getState().setLastPulledAt(serverTime);
}

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

      let productRemoteId: number | null = null;
      if (item.productId) {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        productRemoteId = product?.remoteId ?? null;
      }

      itemsPayload.push({
        productRemoteId,
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

async function pullOrders(): Promise<void> {
  const { lastPulledOrdersAt } = useSyncSettingsStore.getState();
  const query = lastPulledOrdersAt ? `?since=${encodeURIComponent(lastPulledOrdersAt)}` : '';
  const { data, serverTime } = await apiFetch(`/orders${query}`);

  for (const o of data.orders) {
    const [existingByRemote] = await db.select().from(orders).where(eq(orders.remoteId, o.id));
    if (existingByRemote) continue;

    // Order kita sendiri yg push-nya sukses tapi belum sempat ke-tandai remoteId lokal
    // (mis. response kepotong) - backfill aja, jangan insert baris baru (orderNumber unique).
    const [existingByNumber] = await db.select().from(orders).where(eq(orders.orderNumber, o.orderNumber));
    if (existingByNumber) {
      await db
        .update(orders)
        .set({ remoteId: o.id, syncedAt: sqliteNow() })
        .where(eq(orders.id, existingByNumber.id));
      continue;
    }

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customerName,
        subtotal: o.subtotal,
        total: o.total,
        paymentMethod: o.paymentMethod,
        note: o.note,
        createdAt: isoToSqlite(o.createdAt),
        remoteId: o.id,
        syncedAt: sqliteNow(),
      })
      .returning();

    for (const i of o.items ?? []) {
      let productId: number | null = null;
      if (i.productRemoteId) {
        const [product] = await db.select().from(products).where(eq(products.remoteId, i.productRemoteId));
        productId = product?.id ?? null;
      }

      const [newItem] = await db
        .insert(orderItems)
        .values({
          orderId: newOrder.id,
          productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          qty: i.qty,
          note: i.note,
          printed: i.printed ?? false,
          createdAt: isoToSqlite(i.createdAt),
        })
        .returning();

      for (const m of i.modifiers ?? []) {
        await db.insert(orderItemModifiers).values({
          orderItemId: newItem.id,
          modifierGroupName: m.modifierGroupName,
          modifierOptionName: m.modifierOptionName,
          priceDelta: m.priceDelta,
        });
      }
    }
  }

  useSyncSettingsStore.getState().setLastPulledOrdersAt(serverTime);
}

async function pullExpenses(): Promise<void> {
  const { lastPulledExpensesAt } = useSyncSettingsStore.getState();
  const query = lastPulledExpensesAt ? `?since=${encodeURIComponent(lastPulledExpensesAt)}` : '';
  const { data, serverTime } = await apiFetch(`/expenses${query}`);

  for (const e of data.expenses) {
    const [existingByRemote] = await db.select().from(expenses).where(eq(expenses.remoteId, e.id));
    if (existingByRemote) continue;

    // Belanja kita sendiri yg push-nya sukses tapi belum sempat ke-tandai remoteId lokal -
    // expenses gak punya kolom unik, jadi dicek dari isi datanya biar gak duplikat.
    const createdAtSqlite = isoToSqlite(e.createdAt);
    const [existingByContent] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.description, e.description),
          eq(expenses.amount, e.amount),
          eq(expenses.createdAt, createdAtSqlite)
        )
      );
    if (existingByContent) {
      await db
        .update(expenses)
        .set({ remoteId: e.id, syncedAt: sqliteNow() })
        .where(eq(expenses.id, existingByContent.id));
      continue;
    }

    await db.insert(expenses).values({
      description: e.description,
      amount: e.amount,
      createdAt: createdAtSqlite,
      remoteId: e.id,
      syncedAt: sqliteNow(),
    });
  }

  useSyncSettingsStore.getState().setLastPulledExpensesAt(serverTime);
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

async function syncAll(): Promise<void> {
  await pushDirtyMenu();
  await pushOrders();
  await pushExpenses();
  await pushSettings();
  await pullMenu();
  await pullOrders();
  await pullExpenses();
  useSyncSettingsStore.getState().setLastSyncedAt(new Date().toISOString());
}

export const SyncService = {
  syncAll,
  pushDirtyMenu,
  pullMenu,
  pushOrders,
  pushExpenses,
  pushSettings,
  pullOrders,
  pullExpenses,
};
