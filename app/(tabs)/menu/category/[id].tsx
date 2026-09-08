import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteCategory, updateCategory } from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';
import { getCategory } from '@/src/db/queries/menu';

export default function CategoryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);
  const router = useRouter();

  const [name, setName] = useState('');
  const [categoryFound, setCategoryFound] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const category = await getCategory(categoryId);
      if (category) {
        setName(category.name);
      } else {
        setCategoryFound(false);
      }
      setLoading(false);
    })();
  }, [categoryId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Nama kategori harus diisi.');
      return;
    }
    setSaving(true);
    try {
      await updateCategory(categoryId, name.trim());
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus Kategori', `Yakin hapus kategori "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(categoryId);
            router.back();
          } catch (error) {
            Alert.alert('Tidak bisa hapus', String((error as Error).message ?? error));
          }
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

  if (!categoryFound) {
    return (
      <View style={styles.center}>
        <Text>Kategori tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Nama Kategori</Text>
      <AppTextInput style={styles.input} value={name} onChangeText={setName} autoFocus />
      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
      </Pressable>
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Hapus Kategori</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  deleteButton: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
});
