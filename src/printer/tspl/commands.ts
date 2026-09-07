export function size(widthMm: number, heightMm: number): string {
  return `SIZE ${widthMm} mm,${heightMm} mm\r\n`;
}

export function gap(gapMm: number, offsetMm = 0): string {
  return `GAP ${gapMm} mm,${offsetMm} mm\r\n`;
}

export function cls(): string {
  return `CLS\r\n`;
}

export function text(
  x: number,
  y: number,
  content: string,
  font: string = '3',
  rotation = 0,
  xMul = 1,
  yMul = 1
): string {
  return `TEXT ${x},${y},"${font}",${rotation},${xMul},${yMul},"${content}"\r\n`;
}

export function bar(x: number, y: number, width: number, height: number): string {
  return `BAR ${x},${y},${width},${height}\r\n`;
}

export function barcode1D(
  x: number,
  y: number,
  content: string,
  codeType = '128',
  height = 60,
  readable: 0 | 1 = 1,
  rotation = 0,
  narrow = 2,
  wide = 2
): string {
  return `BARCODE ${x},${y},"${codeType}",${height},${readable},${rotation},${narrow},${wide},"${content}"\r\n`;
}

export function qrcode(
  x: number,
  y: number,
  content: string,
  eccLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  cellWidth = 4,
  mode: 'A' | 'M' = 'A',
  rotation = 0
): string {
  return `QRCODE ${x},${y},${eccLevel},${cellWidth},${mode},${rotation},"${content}"\r\n`;
}

export function print(sets = 1, copies = 1): string {
  return `PRINT ${sets},${copies}\r\n`;
}
