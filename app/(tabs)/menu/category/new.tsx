import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createCategory } from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';
import { colors, fonts, radius } from '@/src/theme';

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
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.background },
  label: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  saveButton: { backgroundColor: colors.primary, padding: 14, borderRadius: radius.sm, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold, fontSize: 16 },
});
