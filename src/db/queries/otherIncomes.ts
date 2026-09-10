import { desc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { otherIncomes } from '@/src/db/schema';

export type OtherIncomeRow = typeof otherIncomes.$inferSelect;

export async function getOtherIncomes() {
  return db.select().from(otherIncomes).orderBy(desc(otherIncomes.createdAt));
}

export async function createOtherIncome(input: { description: string; amount: number }) {
  const [row] = await db.insert(otherIncomes).values(input).returning();
  return row;
}

export async function deleteOtherIncome(id: number) {
  await db.delete(otherIncomes).where(eq(otherIncomes.id, id));
}
