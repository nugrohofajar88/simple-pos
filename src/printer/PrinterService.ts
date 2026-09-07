import type { OrderItemModifierRow, OrderItemRow, OrderRow } from '@/src/db/queries/orders';
import { useLabelSettingsStore } from '@/src/printer/labelSettingsStore';
import { BluetoothTransport, type BluetoothDevice } from '@/src/printer/BluetoothTransport';
import { usePrinterStore } from '@/src/printer/printerStore';
import { buildDrinkLabel } from '@/src/printer/templates/drinkLabelTemplate';
import { buildReceipt } from '@/src/printer/templates/receiptTemplate';
import { useStoreSettingsStore } from '@/src/store/storeSettingsStore';

const LABEL_SETTLE_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToSavedDevice(): Promise<BluetoothDevice> {
  const { pairedAddress, setStatus } = usePrinterStore.getState();
  if (!pairedAddress) {
    throw new Error('Printer belum dipilih. Pilih printer dulu di Pengaturan > Koneksi Printer.');
  }

  setStatus('connecting');
  try {
    const granted = await BluetoothTransport.requestBluetoothPermissions();
    if (!granted) throw new Error('Izin Bluetooth ditolak.');

    const devices = await BluetoothTransport.getPairedDevices();
    const device = devices.find((d) => d.address === pairedAddress);
    if (!device) throw new Error('Printer tersimpan tidak ditemukan. Pastikan sudah di-pairing & menyala.');

    const connected = await BluetoothTransport.connect(device);
    if (!connected) throw new Error('Gagal connect ke printer.');

    setStatus('connected');
    return device;
  } catch (error) {
    setStatus('error');
    throw error;
  }
}

type ItemWithModifiers = OrderItemRow & { modifiers: OrderItemModifierRow[] };

async function printLabelsForOrder(order: OrderRow, items: ItemWithModifiers[]): Promise<void> {
  const device = await connectToSavedDevice();
  const { widthMm, heightMm, gapMm, marginXDots, marginYDots } = useLabelSettingsStore.getState();

  for (const item of items) {
    const label = buildDrinkLabel({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      productName: item.productName,
      modifiers: item.modifiers.map((m) => m.modifierOptionName),
      note: item.note,
      widthMm,
      heightMm,
      gapMm,
      marginXDots,
      marginYDots,
    });

    for (let i = 0; i < item.qty; i++) {
      const ok = await BluetoothTransport.writeText(device, label);
      if (!ok) throw new Error(`Gagal cetak label untuk ${item.productName}.`);
      await sleep(LABEL_SETTLE_MS);
    }
  }
}

async function printReceiptForOrder(order: OrderRow, items: ItemWithModifiers[]): Promise<void> {
  const device = await connectToSavedDevice();
  const storeName = useStoreSettingsStore.getState().storeName;
  const receipt = buildReceipt({ order, items, storeName });
  const ok = await BluetoothTransport.writeText(device, receipt);
  if (!ok) throw new Error('Gagal cetak nota.');
}

export const PrinterService = {
  connectToSavedDevice,
  printLabelsForOrder,
  printReceiptForOrder,
};
