import { desc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { expenses } from '@/src/db/schema';

export type ExpenseRow = typeof expenses.$inferSelect;

export async function getExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
}

export async function createExpense(input: { description: string; amount: number }) {
  const [row] = await db.insert(expenses).values(input).returning();
  return row;
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
}
