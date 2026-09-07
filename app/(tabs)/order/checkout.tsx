import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { createOrder } from '@/src/db/queries/orders';
import { cartSubtotal, useCartStore } from '@/src/store/cartStore';
import { SyncService } from '@/src/sync/SyncService';

const PAYMENT_METHODS = ['Cash', 'QRIS', 'Debit'] as const;

export default function CheckoutScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>('Cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const subtotal = cartSubtotal(items);

  const handleConfirm = async () => {
    if (items.length === 0) {
      Alert.alert('Keranjang kosong', 'Tambah item dulu sebelum checkout.');
      return;
    }
    setSaving(true);
    try {
      const order = await createOrder({ items, paymentMethod, customerName, note });
      clear();
      SyncService.pushOrders().catch(() => {});
      Alert.alert('Order Tersimpan', `No. Order: ${order.orderNumber}`, [
        { text: 'OK', onPress: () => router.push('/order') },
      ]);
    } catch (error) {
      Alert.alert('Gagal menyimpan order', String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Checkout</Text>

        <Text style={styles.label}>Nama Pelanggan (untuk label)</Text>
        <AppTextInput
          style={styles.noteInput}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="mis. Budi"
        />

        <Text style={styles.label}>Metode Bayar</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method}
              style={[styles.methodChip, paymentMethod === method && styles.methodChipActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[styles.methodChipText, paymentMethod === method && styles.methodChipTextActive]}>
                {method}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Catatan Order (opsional)</Text>
        <AppTextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="mis. meja no. 5" />

        <View style={styles.summaryBlock}>
          {items.map((item) => (
            <View key={item.cartItemId} style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {item.qty}x {item.productName}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rp{subtotal.toLocaleString('id-ID')}</Text>
        </View>

        <Pressable style={styles.confirmButton} onPress={handleConfirm} disabled={saving}>
          <Text style={styles.confirmButtonText}>{saving ? 'Menyimpan...' : 'Konfirmasi & Simpan Order'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  methodChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  methodChipText: { color: '#333' },
  methodChipTextActive: { color: '#fff', fontWeight: '600' },
  noteInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 16 },
  summaryBlock: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginBottom: 12 },
  summaryRow: { paddingVertical: 4 },
  summaryText: { fontSize: 14, color: '#333' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginBottom: 20,
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  confirmButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 32 },
  confirmButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
