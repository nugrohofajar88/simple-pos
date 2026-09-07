import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrencyInput } from '@/src/components/CurrencyInput';
import { useCapitalStore } from '@/src/store/capitalStore';

export default function CapitalScreen() {
  const router = useRouter();
  const initialCapital = useCapitalStore((state) => state.initialCapital);
  const setInitialCapital = useCapitalStore((state) => state.setInitialCapital);
  const [draft, setDraft] = useState(String(initialCapital));

  const handleSave = () => {
    const value = Number(draft);
    if (Number.isNaN(value) || value < 0) {
      Alert.alert('Nilai tidak valid', 'Masukkan angka yang benar.');
      return;
    }
    setInitialCapital(value);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Modal Awal</Text>
      <Text style={styles.label}>Jumlah Modal Awal</Text>
      <CurrencyInput style={styles.input} value={draft} onChangeText={setDraft} placeholder="mis. 1.000.000" />
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Simpan</Text>
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
