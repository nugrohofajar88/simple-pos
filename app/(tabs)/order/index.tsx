import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllProducts, getCategories, type CategoryRow, type ProductRow } from '@/src/db/queries/menu';
import { useCartStore } from '@/src/store/cartStore';

type CategoryWithProducts = CategoryRow & { products: ProductRow[] };

export default function OrderScreen() {
  const router = useRouter();
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
  const [data, setData] = useState<CategoryWithProducts[]>([]);

  const load = useCallback(async () => {
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
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Order</Text>
        <Pressable style={styles.cartButton} onPress={() => router.push('/order/cart')}>
          <Text style={styles.cartButtonText}>Keranjang{cartCount > 0 ? ` (${cartCount})` : ''}</Text>
        </Pressable>
      </View>

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
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  cartButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cartButtonText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  categoryBlock: { marginBottom: 20 },
  categoryName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  productName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 13, color: '#555' },
});
