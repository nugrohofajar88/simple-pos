import { apiFetch } from '@/src/api/client';
import type { DailyRevenue, RevenueSummary } from '@/src/db/queries/reports';

export async function fetchSummary(): Promise<RevenueSummary> {
  const { data } = await apiFetch('/reports/summary');
  return {
    todayTotal: data.todayTotal,
    monthTotal: data.monthTotal,
    expenseMonthTotal: data.expenseMonthTotal,
    last7Days: data.last7Days as DailyRevenue[],
  };
}

export type RemoteOrder = {
  id: number;
  orderNumber: string;
  status: 'completed' | 'voided';
  customerName: string | null;
  subtotal: number;
  total: number;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
};

export async function fetchOrders(): Promise<RemoteOrder[]> {
  const { data } = await apiFetch('/orders');
  return data.orders;
}

export type RemoteExpense = {
  id: number;
  description: string;
  amount: number;
  createdAt: string;
};

export async function fetchExpenses(): Promise<RemoteExpense[]> {
  const { data } = await apiFetch('/expenses');
  return data.expenses;
}
