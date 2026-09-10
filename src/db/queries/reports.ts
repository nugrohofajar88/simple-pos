import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { expenses, orders } from '@/src/db/schema';

function parseCreatedAt(isoLike: string): Date {
  return new Date(isoLike.replace(' ', 'T') + 'Z');
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameLocalMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function dateKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export type DailyRevenue = { dateKey: string; label: string; total: number };

export type RevenueSummary = {
  todayTotal: number;
  monthTotal: number;
  expenseMonthTotal: number;
  last7Days: DailyRevenue[];
};

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const [completedOrders, allExpenses] = await Promise.all([
    db.select().from(orders).where(and(eq(orders.status, 'completed'), isNull(orders.deletedAt))),
    db.select().from(expenses),
  ]);
  const now = new Date();

  let todayTotal = 0;
  let monthTotal = 0;

  const last7Days: DailyRevenue[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    last7Days.push({ dateKey: dateKeyOf(day), label: day.toLocaleDateString('id-ID', { weekday: 'short' }), total: 0 });
  }
  const last7DaysMap = new Map(last7Days.map((d) => [d.dateKey, d]));

  for (const order of completedOrders) {
    const createdAt = parseCreatedAt(order.createdAt);

    if (isSameLocalDay(createdAt, now)) todayTotal += order.total;
    if (isSameLocalMonth(createdAt, now)) monthTotal += order.total;

    const bucket = last7DaysMap.get(dateKeyOf(createdAt));
    if (bucket) bucket.total += order.total;
  }

  let expenseMonthTotal = 0;
  for (const expense of allExpenses) {
    const createdAt = parseCreatedAt(expense.createdAt);
    if (isSameLocalMonth(createdAt, now)) expenseMonthTotal += expense.amount;
  }

  return { todayTotal, monthTotal, expenseMonthTotal, last7Days };
}
