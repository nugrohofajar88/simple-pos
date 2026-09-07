import { db } from '@/src/db/client';
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

export async function resetAllData() {
  return db.transaction(async (tx) => {
    await tx.delete(orderItemModifiers);
    await tx.delete(orderItems);
    await tx.delete(orders);
    await tx.delete(modifierOptions);
    await tx.delete(modifierGroups);
    await tx.delete(products);
    await tx.delete(categories);
    await tx.delete(expenses);
  });
}
