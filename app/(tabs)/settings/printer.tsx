import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { useLabelSettingsStore } from '@/src/printer/labelSettingsStore';
import { BluetoothTransport, type BluetoothDevice } from '@/src/printer/BluetoothTransport';
import { usePrinterStore } from '@/src/printer/printerStore';
import * as tspl from '@/src/printer/tspl/commands';
import { colors, fonts, radius } from '@/src/theme';

function buildTestLabel(settings: {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  marginXDots: number;
  marginYDots: number;
}): string {
  const x = settings.marginXDots;
  const y0 = settings.marginYDots;
  return (
    tspl.size(settings.widthMm, settings.heightMm) +
    tspl.gap(settings.gapMm) +
    tspl.cls() +
    tspl.text(x, y0, 'POS TEST PRINT') +
    tspl.text(x, y0 + 40, new Date().toLocaleString('id-ID')) +
    tspl.qrcode(x, y0 + 80, 'https://example.com/pos-test') +
    tspl.print(1, 1)
  );
}

export default function PrinterSettingsScreen() {
  const pairedAddress = usePrinterStore((state) => state.pairedAddress);
  const pairedName = usePrinterStore((state) => state.pairedName);
  const setPairedDevice = usePrinterStore((state) => state.setPairedDevice);
  const setStatus = usePrinterStore((state) => state.setStatus);

  const labelSettings = useLabelSettingsStore((state) => state);
  const [draftWidth, setDraftWidth] = useState(String(labelSettings.widthMm));
  const [draftHeight, setDraftHeight] = useState(String(labelSettings.heightMm));
  const [draftGap, setDraftGap] = useState(String(labelSettings.gapMm));
  const [draftMarginX, setDraftMarginX] = useState(String(labelSettings.marginXDots));
  const [draftMarginY, setDraftMarginY] = useState(String(labelSettings.marginYDots));

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAddress, setBusyAddress] = useState<string | null>(null);

  const loadPairedDevices = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await BluetoothTransport.requestBluetoothPermissions();
      if (!granted) {
        Alert.alert('Izin ditolak', 'Permission Bluetooth diperlukan untuk melihat & connect printer.');
        return;
      }

      const enabled = await BluetoothTransport.isBluetoothEnabled();
      if (!enabled) {
        await BluetoothTransport.requestBluetoothEnabled();
      }

      const paired = await BluetoothTransport.getPairedDevices();
      setDevices(paired);
    } catch (error) {
      Alert.alert('Gagal memuat device', String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    async (device: BluetoothDevice) => {
      setBusyAddress(device.address);
      try {
        const connected = await BluetoothTransport.connect(device);
        if (!connected) {
          Alert.alert('Gagal connect', `Tidak bisa connect ke ${device.name}`);
          return;
        }
        setPairedDevice(device.address, device.name);
        setStatus('connected');
        Alert.alert('Berhasil', `${device.name} dijadikan printer default.`);
      } catch (error) {
        setStatus('error');
        Alert.alert('Error', String(error));
      } finally {
        setBusyAddress(null);
      }
    },
    [setPairedDevice, setStatus]
  );

  const handleTestPrint = useCallback(
    async (device: BluetoothDevice) => {
      setBusyAddress(device.address);
      try {
        const connected = await BluetoothTransport.connect(device);
        if (!connected) {
          Alert.alert('Gagal connect', `Tidak bisa connect ke ${device.name}`);
          return;
        }
        const ok = await BluetoothTransport.writeText(device, buildTestLabel(labelSettings));
        if (!ok) {
          Alert.alert('Gagal cetak', 'Data terkirim tapi printer menolak/gagal.');
          return;
        }
        Alert.alert('Berhasil', `Label test terkirim ke ${device.name}`);
      } catch (error) {
        Alert.alert('Error', String(error));
      } finally {
        setBusyAddress(null);
      }
    },
    [labelSettings]
  );

  const handleSaveLabelSettings = () => {
    const widthMm = Number(draftWidth);
    const heightMm = Number(draftHeight);
    const gapMm = Number(draftGap);
    const marginXDots = Number(draftMarginX);
    const marginYDots = Number(draftMarginY);

    if ([widthMm, heightMm, gapMm, marginXDots, marginYDots].some((v) => Number.isNaN(v) || v < 0)) {
      Alert.alert('Nilai tidak valid', 'Isi semua field dengan angka yang benar.');
      return;
    }

    useLabelSettingsStore.getState().setLabelSettings({ widthMm, heightMm, gapMm, marginXDots, marginYDots });
    Alert.alert('Tersimpan', 'Ukuran label sudah diperbarui. Coba Test Print lagi untuk cek hasilnya.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Koneksi Printer</Text>
      <Text style={styles.note}>
        {pairedName
          ? `Printer default saat ini: ${pairedName}`
          : 'Belum ada printer default. Pilih dari daftar di bawah.'}
      </Text>

      <View style={styles.labelSettingsBlock}>
        <Text style={styles.sectionTitle}>Ukuran Label</Text>
        <Text style={styles.hint}>Kalau hasil cetak kepotong/geser, sesuaikan Margin Kiri di sini lalu Test Print lagi.</Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Lebar Label (mm)</Text>
            <AppTextInput style={styles.fieldInput} value={draftWidth} onChangeText={setDraftWidth} keyboardType="numeric" />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Tinggi Label (mm)</Text>
            <AppTextInput style={styles.fieldInput} value={draftHeight} onChangeText={setDraftHeight} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Gap (mm)</Text>
            <AppTextInput style={styles.fieldInput} value={draftGap} onChangeText={setDraftGap} keyboardType="numeric" />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Margin Kiri (dots)</Text>
            <AppTextInput style={styles.fieldInput} value={draftMarginX} onChangeText={setDraftMarginX} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Margin Atas (dots)</Text>
            <AppTextInput style={styles.fieldInput} value={draftMarginY} onChangeText={setDraftMarginY} keyboardType="numeric" />
          </View>
        </View>
        <Pressable style={styles.button} onPress={handleSaveLabelSettings}>
          <Text style={styles.buttonText}>Simpan Ukuran Label</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={loadPairedDevices} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>Muat Daftar Printer</Text>}
      </Pressable>

      <FlatList
        style={styles.list}
        data={devices}
        keyExtractor={(item) => item.address}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada device. Pastikan printer sudah di-pairing lewat Settings Bluetooth Android dulu.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name || '(tanpa nama)'}</Text>
              <Text style={styles.deviceAddress}>{item.address}</Text>
              {pairedAddress === item.address && <Text style={styles.connected}>Default</Text>}
            </View>
            <View style={styles.actionCol}>
              <Pressable
                style={styles.selectButton}
                onPress={() => handleSelect(item)}
                disabled={busyAddress === item.address}
              >
                {busyAddress === item.address ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Pilih</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.testButton}
                onPress={() => handleTestPrint(item)}
                disabled={busyAddress === item.address}
              >
                <Text style={styles.buttonText}>Test</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary },
  note: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.regular },
  labelSettingsBlock: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldCol: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.semiBold },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 8,
    fontSize: 14,
    backgroundColor: colors.card,
  },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: radius.sm, alignItems: 'center' },
  buttonText: { color: colors.onPrimary, fontFamily: fonts.semiBold },
  list: { flex: 1, marginTop: 8 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontFamily: fonts.regular },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontFamily: fonts.medium, color: colors.textPrimary },
  deviceAddress: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  connected: { fontSize: 12, color: colors.success, marginTop: 2, fontFamily: fonts.semiBold },
  actionCol: { flexDirection: 'row', gap: 8 },
  selectButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  testButton: { backgroundColor: colors.success, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
});
