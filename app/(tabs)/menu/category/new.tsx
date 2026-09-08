import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createCategory } from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';

export default function NewCategoryScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Nama kategori harus diisi.');
      return;
    }
    setSaving(true);
    try {
      await createCategory(name.trim());
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Nama Kategori</Text>
      <AppTextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="mis. Kopi, Non-Kopi, Snack"
        autoFocus
      />
      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
