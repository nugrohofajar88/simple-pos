export function init(): string {
  return '\x1B\x40';
}

export function alignLeft(): string {
  return '\x1B\x61\x00';
}

export function alignCenter(): string {
  return '\x1B\x61\x01';
}

export function boldOn(): string {
  return '\x1B\x45\x01';
}

export function boldOff(): string {
  return '\x1B\x45\x00';
}

export function line(text = ''): string {
  return `${text}\n`;
}

export function hr(width = 32): string {
  return `${'-'.repeat(width)}\n`;
}

export function feed(lines = 1): string {
  return '\n'.repeat(lines);
}
