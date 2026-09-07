import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteExpense, getExpenses, type ExpenseRow } from '@/src/db/queries/expenses';

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  const load = useCallback(async () => {
    setExpenses(await getExpenses());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (expense: ExpenseRow) => {
    Alert.alert('Hapus Belanja', `Yakin hapus "${expense.description}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(expense.id);
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

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada catatan belanja.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowDescription}>{item.description}</Text>
              <Text style={styles.rowDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.rowAmount}>Rp{item.amount.toLocaleString('id-ID')}</Text>
            <Pressable onPress={() => handleDelete(item)}>
              <Text style={styles.deleteLink}>Hapus</Text>
            </Pressable>
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
  rowDate: { fontSize: 12, color: '#888', marginTop: 2 },
  rowAmount: { fontSize: 14, color: '#333' },
  deleteLink: { color: '#dc2626', fontSize: 13 },
});
