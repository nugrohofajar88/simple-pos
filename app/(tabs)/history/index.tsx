import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOrders, type OrderRow } from '@/src/db/queries/orders';
import { SyncService } from '@/src/sync/SyncService';

const POLL_INTERVAL_MS = 20000;

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const load = useCallback(async () => {
    setOrders(await getOrders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => {
        SyncService.pullOrders().then(load).catch(() => {});
      }, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Riwayat Order</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada order.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.orderRow} onPress={() => router.push(`/history/${item.id}`)}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderMeta}>
                {item.customerName ? `${item.customerName} · ` : ''}
                {item.paymentMethod} · {formatDateTime(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.orderTotal}>Rp{item.total.toLocaleString('id-ID')}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 15, fontWeight: '600' },
  orderMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: '700' },
});
