import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import { createOtherIncome } from '@/src/db/queries/otherIncomes';
import { SyncService } from '@/src/sync/SyncService';
import { colors, fonts, radius } from '@/src/theme';

export default function NewOtherIncomeScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = Number(amount);
    if (!description.trim()) {
      Alert.alert('Keterangan kosong', 'Isi keterangan pendapatan (mis. jual barang bekas, titipan, dll).');
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      Alert.alert('Jumlah tidak valid', 'Masukkan jumlah pendapatan yang benar.');
      return;
    }
    setSaving(true);
    try {
      await createOtherIncome({ description: description.trim(), amount: value });
      SyncService.pushOtherIncomes().catch(() => {});
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tambah Pendapatan Lain</Text>

      <Text style={styles.label}>Keterangan</Text>
      <AppTextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="mis. Jual barang bekas, titipan"
      />

      <Text style={styles.label}>Jumlah (Rp)</Text>
      <CurrencyInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="mis. 100.000" />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary },
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
