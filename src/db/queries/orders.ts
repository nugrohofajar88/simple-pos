import { desc, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { orderItemModifiers, orderItems, orders } from '@/src/db/schema';
import type { CartItem } from '@/src/store/cartStore';
import { cartSubtotal } from '@/src/store/cartStore';
import { useDeviceStore } from '@/src/store/deviceStore';

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderItemModifierRow = typeof orderItemModifiers.$inferSelect;

function sqliteNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function todayDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function generateOrderNumber(): Promise<string> {
  const dateKey = todayDateKey();
  const deviceCode = useDeviceStore.getState().deviceCode;
  const prefix = `ORD-${dateKey}-${deviceCode}-`;
  const todayOrders = await db.select().from(orders).where(like(orders.orderNumber, `${prefix}%`));
  const sequence = String(todayOrders.length + 1).padStart(3, '0');
  return `${prefix}${sequence}`;
}

export async function createOrder(input: {
  items: CartItem[];
  paymentMethod: string;
  customerName?: string;
  note?: string;
}) {
  const orderNumber = await generateOrderNumber();
  const subtotal = cartSubtotal(input.items);

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        status: 'completed',
        customerName: input.customerName || null,
        subtotal,
        total: subtotal,
        paymentMethod: input.paymentMethod,
        note: input.note ?? null,
      })
      .returning();

    for (const item of input.items) {
      const [insertedItem] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          qty: item.qty,
          note: item.note || null,
          printed: false,
        })
        .returning();

      if (item.modifiers.length > 0) {
        await tx.insert(orderItemModifiers).values(
          item.modifiers.map((modifier) => ({
            orderItemId: insertedItem.id,
            modifierGroupName: modifier.modifierGroupName,
            modifierOptionName: modifier.modifierOptionName,
            priceDelta: modifier.priceDelta,
          }))
        );
      }
    }

    return order;
  });
}

export async function getOrders() {
  return db.select().from(orders).where(isNull(orders.deletedAt)).orderBy(desc(orders.createdAt));
}

export async function getOrderDetail(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  const itemsWithModifiers = [];
  for (const item of items) {
    const modifiers = await db
      .select()
      .from(orderItemModifiers)
      .where(eq(orderItemModifiers.orderItemId, item.id));
    itemsWithModifiers.push({ ...item, modifiers });
  }

  return { order, items: itemsWithModifiers };
}

/**
 * Order tetap immutable - "hapus" cuma nandain deletedAt (order langsung hilang dari UI),
 * baris beneran kehapus (lokal + server) begitu SyncService.pushDeletedOrders() konfirmasi.
 */
export async function deleteOrder(orderId: number) {
  await db.update(orders).set({ deletedAt: sqliteNow() }).where(eq(orders.id, orderId));
}
