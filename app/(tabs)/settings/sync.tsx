import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { SyncService } from '@/src/sync/SyncService';
import { useSyncSettingsStore } from '@/src/sync/syncSettingsStore';
import { useDeviceStore } from '@/src/store/deviceStore';
import { colors, fonts, radius } from '@/src/theme';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SyncSettingsScreen() {
  const apiBaseUrl = useSyncSettingsStore((state) => state.apiBaseUrl);
  const apiToken = useSyncSettingsStore((state) => state.apiToken);
  const lastSyncedAt = useSyncSettingsStore((state) => state.lastSyncedAt);
  const setCredentials = useSyncSettingsStore((state) => state.setCredentials);
  const deviceCode = useDeviceStore((state) => state.deviceCode);

  const [draftUrl, setDraftUrl] = useState(apiBaseUrl);
  const [draftToken, setDraftToken] = useState(apiToken);
  const [syncing, setSyncing] = useState(false);

  const handleSaveCredentials = () => {
    if (!draftUrl.trim() || !draftToken.trim()) {
      Alert.alert('Belum lengkap', 'Isi URL API dan token dulu.');
      return;
    }
    setCredentials(draftUrl.trim(), draftToken.trim());
    Alert.alert('Tersimpan', 'URL & token sinkronisasi sudah disimpan.');
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await SyncService.syncAll();
      Alert.alert('Berhasil', 'Sinkronisasi selesai.');
    } catch (error) {
      Alert.alert('Gagal sinkronisasi', (error as Error).message ?? String(error));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sinkronisasi</Text>
      <Text style={styles.hint}>
        Isi URL back-office & token dari halaman Settings di web (Generate Token), lalu Sync Sekarang.
      </Text>
      <Text style={styles.hint}>Kode device ini: {deviceCode} (dipakai di nomor order, beda tiap HP)</Text>

      <Text style={styles.label}>URL Back-Office</Text>
      <AppTextInput
        style={styles.input}
        value={draftUrl}
        onChangeText={setDraftUrl}
        placeholder="https://simple-pos-backoffice.test"
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={styles.label}>Token</Text>
      <AppTextInput
        style={styles.input}
        value={draftToken}
        onChangeText={setDraftToken}
        placeholder="Tempel token dari web di sini"
        autoCapitalize="none"
      />

      <Pressable style={styles.saveButton} onPress={handleSaveCredentials}>
        <Text style={styles.saveButtonText}>Simpan</Text>
      </Pressable>

      <Text style={styles.status}>
        {lastSyncedAt ? `Sync terakhir: ${formatDateTime(lastSyncedAt)}` : 'Belum pernah sync.'}
      </Text>

      <Pressable style={styles.syncButton} onPress={handleSyncNow} disabled={syncing}>
        {syncing ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.syncButtonText}>Sync Sekarang</Text>}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.background },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 4, fontFamily: fonts.regular },
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
  status: { fontSize: 12, color: colors.textSecondary, marginTop: 16, textAlign: 'center', fontFamily: fonts.regular },
  syncButton: { backgroundColor: colors.success, padding: 14, borderRadius: radius.sm, alignItems: 'center', marginTop: 8 },
  syncButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold, fontSize: 16 },
});
