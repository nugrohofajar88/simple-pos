import * as esc from '@/src/printer/escpos/commands';
import type { OrderItemModifierRow, OrderItemRow, OrderRow } from '@/src/db/queries/orders';

const PAPER_WIDTH = 32;

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  return date.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

export function buildReceipt(input: {
  order: OrderRow;
  items: (OrderItemRow & { modifiers: OrderItemModifierRow[] })[];
  storeName?: string;
}): string {
  const storeName = input.storeName ?? 'TOKO KOPI';
  let buffer = esc.init();

  buffer += esc.alignCenter() + esc.boldOn() + esc.line(storeName) + esc.boldOff();
  buffer += esc.line(formatDateTime(input.order.createdAt));
  buffer += esc.alignLeft();
  buffer += esc.hr(PAPER_WIDTH);

  buffer += esc.line(`No: ${input.order.orderNumber}`);
  if (input.order.customerName) {
    buffer += esc.line(`Pelanggan: ${input.order.customerName}`);
  }
  buffer += esc.hr(PAPER_WIDTH);

  for (const item of input.items) {
    buffer += esc.line(`${item.qty}x ${item.productName}`);
    if (item.modifiers.length > 0) {
      buffer += esc.line(`  ${item.modifiers.map((m) => m.modifierOptionName).join(', ')}`);
    }
    const itemTotal = (item.unitPrice + item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) * item.qty;
    buffer += esc.line(`  ${formatRupiah(itemTotal)}`);
  }

  buffer += esc.hr(PAPER_WIDTH);
  buffer += esc.boldOn() + esc.line(`TOTAL: ${formatRupiah(input.order.total)}`) + esc.boldOff();
  buffer += esc.line(`Bayar: ${input.order.paymentMethod}`);
  if (input.order.note) {
    buffer += esc.line(`Catatan: ${input.order.note}`);
  }

  buffer += esc.feed(1);
  buffer += esc.alignCenter() + esc.line('Terima kasih!');
  buffer += esc.feed(3);

  return buffer;
}
