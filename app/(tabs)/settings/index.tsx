import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { resetAllData } from '@/src/db/queries/reset';
import { useCapitalStore } from '@/src/store/capitalStore';
import { useCartStore } from '@/src/store/cartStore';
import { useStoreSettingsStore } from '@/src/store/storeSettingsStore';

export default function SettingsScreen() {
  const storeName = useStoreSettingsStore((state) => state.storeName);
  const setStoreName = useStoreSettingsStore((state) => state.setStoreName);
  const [draftStoreName, setDraftStoreName] = useState(storeName);
  const [resetting, setResetting] = useState(false);

  const handleSaveStoreName = () => {
    if (!draftStoreName.trim()) {
      Alert.alert('Nama kosong', 'Nama toko harus diisi.');
      return;
    }
    setStoreName(draftStoreName.trim());
    Alert.alert('Tersimpan', 'Nama toko sudah diperbarui.');
  };

  const performReset = async () => {
    setResetting(true);
    try {
      await resetAllData();
      useCapitalStore.getState().setInitialCapital(0);
      useStoreSettingsStore.getState().setStoreName('TOKO KOPI');
      useCartStore.getState().clear();
      setDraftStoreName('TOKO KOPI');
      Alert.alert('Berhasil', 'Semua data sudah direset.');
    } catch (error) {
      Alert.alert('Gagal reset', String(error));
    } finally {
      setResetting(false);
    }
  };

  const handleResetPress = () => {
    Alert.alert(
      'Reset Semua Data?',
      'Semua kategori, produk, modifier, order, riwayat, belanja, modal awal, dan nama toko akan dihapus/dikembalikan ke default. Setting printer (pairing & ukuran label) TIDAK ikut terhapus. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjutkan',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Konfirmasi Terakhir', 'Yakin? Semua data akan hilang permanen.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Ya, Reset Sekarang', style: 'destructive', onPress: performReset },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Pengaturan</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Nama Toko (tampil di nota)</Text>
        <AppTextInput style={styles.input} value={draftStoreName} onChangeText={setDraftStoreName} />
        <Pressable style={styles.saveButton} onPress={handleSaveStoreName}>
          <Text style={styles.saveButtonText}>Simpan</Text>
        </Pressable>
      </View>

      <Link href="/settings/printer" asChild>
        <Pressable style={styles.item}>
          <Text style={styles.itemText}>Koneksi Printer</Text>
        </Pressable>
      </Link>

      <Link href="/settings/sync" asChild>
        <Pressable style={styles.item}>
          <Text style={styles.itemText}>Sinkronisasi Back-Office</Text>
        </Pressable>
      </Link>

      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Zona Berbahaya</Text>
        <Pressable style={styles.resetButton} onPress={handleResetPress} disabled={resetting}>
          {resetting ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.resetButtonText}>Reset Semua Data</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  section: { gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  item: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
  dangerSection: { marginTop: 24, gap: 8 },
  dangerTitle: { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  resetButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: { color: '#dc2626', fontWeight: '600' },
});
