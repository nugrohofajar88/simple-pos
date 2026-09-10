import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteOrder,
  getOrderDetail,
  type OrderItemModifierRow,
  type OrderItemRow,
  type OrderRow,
} from '@/src/db/queries/orders';
import { PrinterService } from '@/src/printer/PrinterService';
import { usePrinterStore } from '@/src/printer/printerStore';
import { SyncService } from '@/src/sync/SyncService';

type ItemWithModifiers = OrderItemRow & { modifiers: OrderItemModifierRow[] };

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemWithModifiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState<'label' | 'receipt' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pairedName = usePrinterStore((state) => state.pairedName);

  useEffect(() => {
    (async () => {
      const detail = await getOrderDetail(Number(orderId));
      if (detail) {
        setOrder(detail.order);
        setItems(detail.items);
      }
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order tidak ditemukan.</Text>
      </View>
    );
  }

  const handlePrintLabel = async () => {
    setPrinting('label');
    try {
      await PrinterService.printLabelsForOrder(order, items);
      Alert.alert('Berhasil', 'Label sudah dikirim ke printer.');
    } catch (error) {
      Alert.alert('Gagal cetak label', (error as Error).message ?? String(error));
    } finally {
      setPrinting(null);
    }
  };

  const handlePrintReceipt = async () => {
    setPrinting('receipt');
    try {
      await PrinterService.printReceiptForOrder(order, items);
      Alert.alert('Berhasil', 'Nota sudah dikirim ke printer.');
    } catch (error) {
      Alert.alert('Gagal cetak nota', (error as Error).message ?? String(error));
    } finally {
      setPrinting(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Order',
      `Yakin hapus order "${order.orderNumber}"? Order gak bisa diedit - kalau salah, hapus lalu buat order baru. Kalau order ini sudah tersinkron ke web, akan ikut terhapus di sana juga begitu HP online.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteOrder(order.id);
              SyncService.pushDeletedOrders().catch(() => {});
              router.back();
            } catch (error) {
              Alert.alert('Gagal hapus', (error as Error).message ?? String(error));
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.meta}>{formatDateTime(order.createdAt)}</Text>
        {order.customerName ? <Text style={styles.meta}>Pelanggan: {order.customerName}</Text> : null}
        <Text style={styles.meta}>Bayar: {order.paymentMethod}</Text>
        {order.note ? <Text style={styles.meta}>Catatan: {order.note}</Text> : null}

        <View style={styles.itemsBlock}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.qty}x {item.productName}
                </Text>
                {item.modifiers.length > 0 && (
                  <Text style={styles.itemModifiers}>
                    {item.modifiers.map((m) => m.modifierOptionName).join(', ')}
                  </Text>
                )}
                {item.note ? <Text style={styles.itemNote}>Catatan: {item.note}</Text> : null}
              </View>
              <Text style={styles.itemPrice}>
                Rp
                {(
                  (item.unitPrice + item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) *
                  item.qty
                ).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rp{order.total.toLocaleString('id-ID')}</Text>
        </View>

        <Text style={styles.printerStatus}>
          {pairedName ? `Printer: ${pairedName}` : 'Belum ada printer default (atur di Pengaturan)'}
        </Text>

        <View style={styles.printRow}>
          <Pressable style={styles.printButton} onPress={handlePrintLabel} disabled={printing !== null}>
            {printing === 'label' ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <Text style={styles.printButtonText}>Cetak Label</Text>
            )}
          </Pressable>
          <Pressable style={styles.printButton} onPress={handlePrintReceipt} disabled={printing !== null}>
            {printing === 'receipt' ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <Text style={styles.printButtonText}>Cetak Nota</Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
          {deleting ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.deleteButtonText}>Hapus Order</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orderNumber: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  itemsBlock: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 16, paddingTop: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemModifiers: { fontSize: 12, color: '#666', marginTop: 2 },
  itemNote: { fontSize: 12, color: '#888', marginTop: 2, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, color: '#333' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  printerStatus: { fontSize: 12, color: '#888', marginTop: 16 },
  printRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 32 },
  printButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  printButtonText: { color: '#2563eb', fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
});
