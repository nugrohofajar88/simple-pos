import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createProduct } from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import { ProductImagePicker } from '@/src/components/ProductImagePicker';
import { getCategories, type CategoryRow } from '@/src/db/queries/menu';
import { colors, fonts, radius } from '@/src/theme';

export default function NewProductScreen() {
  const router = useRouter();
  const { categoryId: initialCategoryId } = useLocalSearchParams<{ categoryId?: string }>();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(
    initialCategoryId ? Number(initialCategoryId) : null
  );
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const rows = await getCategories();
      setCategories(rows);
      if (categoryId === null && rows.length > 0) setCategoryId(rows[0].id);
    })();
  }, []);

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
      await createProduct({
        categoryId,
        name: name.trim(),
        basePrice: price,
        costPrice: cost,
        imageUri,
      });
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Kategori</Text>
      {categories.length === 0 ? (
        <Text style={styles.emptyHint}>Belum ada kategori. Tambah dulu di tab Menu.</Text>
      ) : (
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
      )}

      <Text style={styles.label}>Gambar</Text>
      <ProductImagePicker uri={imageUri} onChange={setImageUri} />

      <Text style={styles.label}>Nama Produk</Text>
      <AppTextInput style={styles.input} value={name} onChangeText={setName} placeholder="mis. Cafe Latte" />

      <Text style={styles.label}>Harga Dasar</Text>
      <CurrencyInput style={styles.input} value={basePrice} onChangeText={setBasePrice} placeholder="mis. 22.000" />

      <Text style={styles.label}>HPP / Harga Pokok (opsional)</Text>
      <CurrencyInput style={styles.input} value={costPrice} onChangeText={setCostPrice} placeholder="mis. 12.000" />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8, backgroundColor: colors.background },
  label: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontFamily: fonts.regular },
  chipTextActive: { color: colors.onPrimary, fontFamily: fonts.semiBold },
  emptyHint: { color: colors.textMuted, fontSize: 13, marginBottom: 4, fontFamily: fonts.regular },
  saveButton: { backgroundColor: colors.primary, padding: 14, borderRadius: radius.sm, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold, fontSize: 16 },
});
