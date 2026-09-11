import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cartItemTotal, cartSubtotal, useCartStore } from '@/src/store/cartStore';
import { colors, fonts, radius } from '@/src/theme';

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
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 12 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontFamily: fonts.regular },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary },
  itemModifiers: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.regular },
  itemNote: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontStyle: 'italic', fontFamily: fonts.regular },
  itemPrice: { fontSize: 14, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.medium },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  qtyValue: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary, minWidth: 20, textAlign: 'center' },
  removeLink: { color: colors.destructive, fontSize: 13, fontFamily: fonts.regular },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 8 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  subtotalValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary },
  checkoutButton: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.sm, alignItems: 'center' },
  checkoutButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold, fontSize: 16 },
});
