import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchExpenses } from '@/src/api/reportApi';
import { deleteExpense, getExpenses } from '@/src/db/queries/expenses';

type DisplayExpense = {
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

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<DisplayExpense[]>([]);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const local = await getExpenses();
    const pending = local.filter((e) => !e.remoteId);

    try {
      const remote = await fetchExpenses();
      setOffline(false);
      const merged: DisplayExpense[] = [
        ...remote.map((e) => ({
          key: `remote-${e.id}`,
          localId: null,
          description: e.description,
          amount: e.amount,
          createdAt: e.createdAt,
          pending: false,
        })),
        ...pending.map((e) => ({
          key: `local-${e.id}`,
          localId: e.id,
          description: e.description,
          amount: e.amount,
          createdAt: e.createdAt,
          pending: true,
        })),
      ];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setExpenses(merged);
    } catch {
      // Gak ada koneksi - fallback ke semua data lokal HP ini aja.
      setOffline(true);
      setExpenses(
        local.map((e) => ({
          key: `local-${e.id}`,
          localId: e.id,
          description: e.description,
          amount: e.amount,
          createdAt: e.createdAt,
          pending: !e.remoteId,
        }))
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (expense: DisplayExpense) => {
    if (!expense.localId) return;
    Alert.alert('Hapus Belanja', `Yakin hapus "${expense.description}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(expense.localId!);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Belanja</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/report/expense/new')}>
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </Pressable>
      </View>

      {offline && (
        <Text style={styles.offlineNotice}>Gak ada koneksi - nampilin data HP ini aja.</Text>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada catatan belanja.</Text>}
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
