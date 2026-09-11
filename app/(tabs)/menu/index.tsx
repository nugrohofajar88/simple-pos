import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMenu } from '@/src/api/menuApi';
import { getAllProducts, getCategories, type CategoryRow, type ProductRow } from '@/src/db/queries/menu';
import { colors, fonts, radius, cardShadow } from '@/src/theme';

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
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary },
  addButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  addButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold },
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
  listContent: { paddingBottom: 24 },
  categoryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 14,
    overflow: 'hidden',
    ...cardShadow,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryName: { fontSize: 16, fontFamily: fonts.bold, color: colors.textPrimary },
  categoryEditHint: { fontSize: 12, color: colors.primary, fontFamily: fonts.semiBold },
  noProducts: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productName: { fontSize: 14, color: colors.textPrimary, fontFamily: fonts.regular },
  productPrice: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.medium },
  addProductButton: { paddingVertical: 12, paddingHorizontal: 14 },
  addProductButtonText: { color: colors.primary, fontSize: 13, fontFamily: fonts.semiBold },
});
