import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMenu } from '@/src/api/menuApi';
import { ProductThumbnail } from '@/src/components/ProductThumbnail';
import { getAllProducts, getCategories, type CategoryRow, type ProductRow } from '@/src/db/queries/menu';
import { useCartStore } from '@/src/store/cartStore';
import { colors, fonts, radius } from '@/src/theme';

type CategoryWithProducts = CategoryRow & { products: ProductRow[] };

export default function OrderScreen() {
  const router = useRouter();
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
  const [data, setData] = useState<CategoryWithProducts[]>([]);
  const [offline, setOffline] = useState(false);

  const loadFromCache = useCallback(async () => {
    const [allCategories, allProducts] = await Promise.all([getCategories(), getAllProducts()]);
    setData(
      allCategories
        .map((category) => ({
          ...category,
          products: allProducts.filter((product) => product.categoryId === category.id && product.isActive),
        }))
        .filter((category) => category.products.length > 0)
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMenu()
        .then(() => setOffline(false))
        .catch(() => setOffline(true))
        .finally(loadFromCache);
    }, [loadFromCache])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Order</Text>
        <Pressable style={styles.cartButton} onPress={() => router.push('/order/cart')}>
          <Text style={styles.cartButtonText}>Keranjang{cartCount > 0 ? ` (${cartCount})` : ''}</Text>
        </Pressable>
      </View>

      {offline && <Text style={styles.offlineNotice}>Gak ada koneksi - menu terakhir yg tersimpan, order tetap bisa disimpan.</Text>}

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada produk. Tambah dulu di tab Menu.</Text>
        }
        renderItem={({ item: category }) => (
          <View style={styles.categoryBlock}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.grid}>
              {category.products.map((product) => (
                <Pressable
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/order/product/${product.id}`)}
                >
                  <ProductThumbnail uri={product.imageUrl} size={64} />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>Rp{product.basePrice.toLocaleString('id-ID')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary },
  cartButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  cartButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontFamily: fonts.regular },
  offlineNotice: {
    fontSize: 12,
    color: colors.warningText,
    backgroundColor: colors.warningBg,
    padding: 8,
    borderRadius: radius.sm,
    marginBottom: 12,
    fontFamily: fonts.regular,
  },
  categoryBlock: { marginBottom: 20 },
  categoryName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.card,
  },
  productName: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textPrimary, marginTop: 8, marginBottom: 4 },
  productPrice: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.regular },
});
