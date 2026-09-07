import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cartItemTotal, cartSubtotal, useCartStore } from '@/src/store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = cartSubtotal(items);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Keranjang</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        ListEmptyComponent={<Text style={styles.empty}>Keranjang masih kosong.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.modifiers.length > 0 && (
                <Text style={styles.itemModifiers}>
                  {item.modifiers.map((m) => m.modifierOptionName).join(', ')}
                </Text>
              )}
              {item.note ? <Text style={styles.itemNote}>Catatan: {item.note}</Text> : null}
              <Text style={styles.itemPrice}>Rp{cartItemTotal(item).toLocaleString('id-ID')}</Text>
            </View>

            <View style={styles.qtyStepper}>
              <Pressable style={styles.qtyButton} onPress={() => updateQty(item.cartItemId, item.qty - 1)}>
                <Text style={styles.qtyButtonText}>-</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <Pressable style={styles.qtyButton} onPress={() => updateQty(item.cartItemId, item.qty + 1)}>
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => removeItem(item.cartItemId)}>
              <Text style={styles.removeLink}>Hapus</Text>
            </Pressable>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Total</Text>
            <Text style={styles.subtotalValue}>Rp{subtotal.toLocaleString('id-ID')}</Text>
          </View>
          <Pressable style={styles.checkoutButton} onPress={() => router.push('/order/checkout')}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemModifiers: { fontSize: 12, color: '#666', marginTop: 2 },
  itemNote: { fontSize: 12, color: '#888', marginTop: 2, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, color: '#333', marginTop: 4 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 16, fontWeight: '600' },
  qtyValue: { fontSize: 15, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  removeLink: { color: '#dc2626', fontSize: 13 },
  footer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 8 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 16, fontWeight: '600' },
  subtotalValue: { fontSize: 18, fontWeight: '700' },
  checkoutButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
