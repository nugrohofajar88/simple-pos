import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchOrders } from '@/src/api/reportApi';
import { getOrders, type OrderRow } from '@/src/db/queries/orders';

type DisplayOrder = {
  key: string;
  localId: number | null;
  orderNumber: string;
  customerName: string | null;
  paymentMethod: string;
  total: number;
  createdAt: string;
};

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike.includes('T') ? isoLike : `${isoLike.replace(' ', 'T')}Z`);
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const local = await getOrders();
    const localByNumber = new Map(local.map((o) => [o.orderNumber, o]));

    try {
      const remote = await fetchOrders();
      setOffline(false);
      const remoteNumbers = new Set(remote.map((o) => o.orderNumber));
      const pendingLocal = local.filter((o) => !remoteNumbers.has(o.orderNumber));

      const merged: DisplayOrder[] = [
        ...remote.map((o) => ({
          key: `remote-${o.id}`,
          localId: localByNumber.get(o.orderNumber)?.id ?? null,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          paymentMethod: o.paymentMethod,
          total: o.total,
          createdAt: o.createdAt,
        })),
        ...pendingLocal.map((o) => ({
          key: `local-${o.id}`,
          localId: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          paymentMethod: o.paymentMethod,
          total: o.total,
          createdAt: o.createdAt,
        })),
      ];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(merged);
    } catch {
      // Gak ada koneksi - fallback ke order HP ini aja.
      setOffline(true);
      setOrders(
        local.map((o) => ({
          key: `local-${o.id}`,
          localId: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          paymentMethod: o.paymentMethod,
          total: o.total,
          createdAt: o.createdAt,
        }))
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Riwayat Order</Text>

      {offline && <Text style={styles.offlineNotice}>Gak ada koneksi - nampilin order HP ini aja.</Text>}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada order.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.orderRow}
            disabled={!item.localId}
            onPress={() => item.localId && router.push(`/history/${item.localId}`)}
          >
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderMeta}>
                {item.customerName ? `${item.customerName} · ` : ''}
                {item.paymentMethod} · {formatDateTime(item.createdAt)}
                {!item.localId ? ' · dari HP lain' : ''}
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
  offlineNotice: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
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
