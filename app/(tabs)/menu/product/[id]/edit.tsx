import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import { deleteProduct, getCategories, getProduct, updateProduct, type CategoryRow } from '@/src/db/queries/menu';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [productFound, setProductFound] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [product, categoryRows] = await Promise.all([getProduct(productId), getCategories()]);
      setCategories(categoryRows);
      if (product) {
        setCategoryId(product.categoryId);
        setName(product.name);
        setBasePrice(String(product.basePrice));
        setCostPrice(String(product.costPrice));
      } else {
        setProductFound(false);
      }
      setLoading(false);
    })();
  }, [productId]);

  const handleSave = async () => {
    const price = Number(basePrice);
    const cost = costPrice ? Number(costPrice) : 0;
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Nama produk harus diisi.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Kategori belum dipilih', 'Pilih kategori dulu.');
      return;
    }
    if (!basePrice || Number.isNaN(price) || price < 0) {
      Alert.alert('Harga tidak valid', 'Masukkan harga dasar yang benar.');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      Alert.alert('HPP tidak valid', 'Masukkan HPP yang benar, atau kosongkan.');
      return;
    }
    setSaving(true);
    try {
      await updateProduct(productId, { categoryId, name: name.trim(), basePrice: price, costPrice: cost });
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus Produk', `Yakin hapus produk "${name}"? Modifier terkait juga akan terhapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(productId);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!productFound) {
    return (
      <View style={styles.center}>
        <Text>Produk tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Edit Produk</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Kategori</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[styles.chip, categoryId === category.id && styles.chipActive]}
                onPress={() => setCategoryId(category.id)}
              >
                <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Nama Produk</Text>
          <AppTextInput style={styles.input} value={name} onChangeText={setName} />

          <View style={styles.row}>
            <View style={styles.rowCol}>
              <Text style={styles.label}>Harga Dasar</Text>
              <CurrencyInput style={styles.input} value={basePrice} onChangeText={setBasePrice} />
            </View>
            <View style={styles.rowCol}>
              <Text style={styles.label}>HPP (opsional)</Text>
              <CurrencyInput style={styles.input} value={costPrice} onChangeText={setCostPrice} />
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Pressable style={styles.modifierButton} onPress={() => router.push(`/menu/product/${productId}/modifiers`)}>
            <Text style={styles.modifierButtonText}>Kelola Modifier (Size / Suhu / Gula)</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Hapus Produk</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#111' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  rowCol: { flex: 1 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modifierButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modifierButtonText: { color: '#2563eb', fontWeight: '600' },
  deleteButton: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
});
