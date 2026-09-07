import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import { createExpense } from '@/src/db/queries/expenses';

export default function NewExpenseScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = Number(amount);
    if (!description.trim()) {
      Alert.alert('Keterangan kosong', 'Isi keterangan belanja (mis. beli susu, gas, dll).');
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      Alert.alert('Jumlah tidak valid', 'Masukkan jumlah belanja yang benar.');
      return;
    }
    setSaving(true);
    try {
      await createExpense({ description: description.trim(), amount: value });
      router.back();
    } catch (error) {
      Alert.alert('Gagal simpan', String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tambah Belanja</Text>

      <Text style={styles.label}>Keterangan</Text>
      <AppTextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="mis. Beli susu & gula"
      />

      <Text style={styles.label}>Jumlah (Rp)</Text>
      <CurrencyInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="mis. 150.000" />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
