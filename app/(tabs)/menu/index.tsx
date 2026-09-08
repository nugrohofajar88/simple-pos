import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMenu } from '@/src/api/menuApi';
import { getAllProducts, getCategories, type CategoryRow, type ProductRow } from '@/src/db/queries/menu';

type CategoryWithProducts = CategoryRow & { products: ProductRow[] };

export default function MenuScreen() {
  const router = useRouter();
  const [data, setData] = useState<CategoryWithProducts[]>([]);
  const [offline, setOffline] = useState(false);

  const loadFromCache = useCallback(async () => {
    const [allCategories, allProducts] = await Promise.all([getCategories(), getAllProducts()]);
    setData(
      allCategories.map((category) => ({
        ...category,
        products: allProducts.filter((product) => product.categoryId === category.id),
      }))
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
        <Text style={styles.title}>Kelola Menu</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/menu/category/new')}>
          <Text style={styles.addButtonText}>+ Kategori</Text>
        </Pressable>
      </View>

      {offline && (
        <Text style={styles.offlineNotice}>
          Gak ada koneksi - nampilin data terakhir yg tersimpan, edit menu butuh internet.
        </Text>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada kategori. Tambah dulu lewat tombol di atas.</Text>}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() => router.push(`/menu/category/${item.id}`)}
            >
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryEditHint}>Edit</Text>
            </Pressable>

            {item.products.length === 0 ? (
              <Text style={styles.noProducts}>Belum ada produk di kategori ini.</Text>
            ) : (
              item.products.map((product) => (
                <Pressable
                  key={product.id}
                  style={styles.productRow}
                  onPress={() => router.push(`/menu/product/${product.id}/edit`)}
                >
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>Rp{product.basePrice.toLocaleString('id-ID')}</Text>
                </Pressable>
              ))
            )}

            <Pressable
              style={styles.addProductButton}
              onPress={() => router.push({ pathname: '/menu/product/new', params: { categoryId: String(item.id) } })}
            >
              <Text style={styles.addProductButtonText}>+ Produk di {item.name}</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  offlineNotice: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  listContent: { paddingBottom: 24 },
  categoryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fb',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#111' },
  categoryEditHint: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  noProducts: { fontSize: 13, color: '#999', fontStyle: 'italic', paddingVertical: 12, paddingHorizontal: 14 },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  productName: { fontSize: 14, color: '#222' },
  productPrice: { fontSize: 14, color: '#555', fontWeight: '500' },
  addProductButton: { paddingVertical: 12, paddingHorizontal: 14 },
  addProductButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
});
