import * as tspl from '@/src/printer/tspl/commands';

function boldText(x: number, y: number, content: string, font: string): string {
  return tspl.text(x, y, content, font) + tspl.text(x + 1, y, content, font);
}

export function buildDrinkLabel(input: {
  orderNumber: string;
  customerName?: string | null;
  productName: string;
  modifiers: string[];
  note?: string | null;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  marginXDots: number;
  marginYDots: number;
}): string {
  const x = input.marginXDots;
  let y = input.marginYDots;
  let buffer = tspl.size(input.widthMm, input.heightMm) + tspl.gap(input.gapMm) + tspl.cls();

  if (input.customerName) {
    buffer += boldText(x, y, input.customerName, '3');
    y += 30;
  }

  buffer += tspl.text(x, y, input.productName, '3');
  y += 40;

  for (const modifier of input.modifiers) {
    buffer += tspl.text(x, y, modifier, '2');
    y += 25;
  }

  if (input.note) {
    buffer += tspl.text(x, y, input.note, '1');
    y += 25;
  }

  buffer += tspl.text(x, y, input.orderNumber, '1');

  buffer += tspl.print(1, 1);
  return buffer;
}
