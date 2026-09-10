import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchOtherIncomes } from '@/src/api/reportApi';
import { deleteOtherIncome, getOtherIncomes } from '@/src/db/queries/otherIncomes';

type DisplayOtherIncome = {
  key: string;
  localId: number | null;
  description: string;
  amount: number;
  createdAt: string;
  pending: boolean;
};

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.includes('T') ? isoLike : `${isoLike.replace(' ', 'T')}Z`);
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OtherIncomesScreen() {
  const router = useRouter();
  const [incomes, setIncomes] = useState<DisplayOtherIncome[]>([]);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const local = await getOtherIncomes();
    const pending = local.filter((i) => !i.remoteId);

    try {
      const remote = await fetchOtherIncomes();
      setOffline(false);
      const merged: DisplayOtherIncome[] = [
        ...remote.map((i) => ({
          key: `remote-${i.id}`,
          localId: null,
          description: i.description,
          amount: i.amount,
          createdAt: i.createdAt,
          pending: false,
        })),
        ...pending.map((i) => ({
          key: `local-${i.id}`,
          localId: i.id,
          description: i.description,
          amount: i.amount,
          createdAt: i.createdAt,
          pending: true,
        })),
      ];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setIncomes(merged);
    } catch {
      // Gak ada koneksi - fallback ke semua data lokal HP ini aja.
      setOffline(true);
      setIncomes(
        local.map((i) => ({
          key: `local-${i.id}`,
          localId: i.id,
          description: i.description,
          amount: i.amount,
          createdAt: i.createdAt,
          pending: !i.remoteId,
        }))
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (income: DisplayOtherIncome) => {
    if (!income.localId) return;
    Alert.alert('Hapus Pendapatan', `Yakin hapus "${income.description}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteOtherIncome(income.localId!);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pendapatan Lain</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/report/other-income/new')}>
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </Pressable>
      </View>

      {offline && (
        <Text style={styles.offlineNotice}>Gak ada koneksi - nampilin data HP ini aja.</Text>
      )}

      <FlatList
        data={incomes}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada catatan pendapatan lain.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowDescription}>
                {item.description} {item.pending ? <Text style={styles.pendingBadge}>(belum sync)</Text> : null}
              </Text>
              <Text style={styles.rowDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.rowAmount}>Rp{item.amount.toLocaleString('id-ID')}</Text>
            {item.localId ? (
              <Pressable onPress={() => handleDelete(item)}>
                <Text style={styles.deleteLink}>Hapus</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  offlineNotice: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  rowInfo: { flex: 1 },
  rowDescription: { fontSize: 14, fontWeight: '600', color: '#222' },
  pendingBadge: { fontSize: 11, fontWeight: '400', color: '#b45309' },
  rowDate: { fontSize: 12, color: '#888', marginTop: 2 },
  rowAmount: { fontSize: 14, color: '#333' },
  deleteLink: { color: '#dc2626', fontSize: 13 },
});
