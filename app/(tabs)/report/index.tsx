import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchSummary } from '@/src/api/reportApi';
import { getRevenueSummary, type RevenueSummary } from '@/src/db/queries/reports';
import { useCapitalStore } from '@/src/store/capitalStore';
import { colors, fonts, radius, cardShadow } from '@/src/theme';

const CHART_HEIGHT = 140;

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

export default function ReportScreen() {
  const router = useRouter();
  const initialCapital = useCapitalStore((state) => state.initialCapital);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await fetchSummary());
      setOffline(false);
    } catch {
      // Gak ada koneksi - fallback ke agregat lokal (order/belanja bikinan HP ini aja).
      setSummary(await getRevenueSummary());
      setOffline(true);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const maxTotal = Math.max(...summary.last7Days.map((d) => d.total), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Laporan</Text>

        {offline && (
          <Text style={styles.offlineNotice}>
            Gak ada koneksi - nampilin data HP ini aja, bisa beda dgn rekap gabungan di web.
          </Text>
        )}

        <Pressable style={styles.capitalCard} onPress={() => router.push('/report/capital')}>
          <View>
            <Text style={styles.capitalLabel}>Modal Awal</Text>
            <Text style={styles.capitalValue}>{formatRupiah(initialCapital)}</Text>
          </View>
          <Text style={styles.capitalEditHint}>Ubah</Text>
        </Pressable>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Omzet Hari Ini</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.todayTotal)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Omzet Bulan Ini</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.monthTotal)}</Text>
          </View>
        </View>

        <Pressable style={styles.expenseCard} onPress={() => router.push('/report/expenses')}>
          <View>
            <Text style={styles.summaryLabel}>Belanja Bulan Ini</Text>
            <Text style={styles.summaryValue}>{formatRupiah(summary.expenseMonthTotal)}</Text>
          </View>
          <Pressable style={styles.addExpenseButton} onPress={() => router.push('/report/expense/new')}>
            <Text style={styles.addExpenseButtonText}>+ Belanja</Text>
          </Pressable>
        </Pressable>

        <Pressable style={styles.expenseCard} onPress={() => router.push('/report/other-incomes')}>
          <View>
            <Text style={styles.summaryLabel}>Pendapatan Lain</Text>
            <Text style={styles.capitalEditHint}>Lihat daftar</Text>
          </View>
          <Pressable style={styles.addExpenseButton} onPress={() => router.push('/report/other-income/new')}>
            <Text style={styles.addExpenseButtonText}>+ Pendapatan Lain</Text>
          </Pressable>
        </Pressable>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Omzet 7 Hari Terakhir</Text>
          <View style={styles.chart}>
            {summary.last7Days.map((day) => (
              <View key={day.dateKey} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {day.total > 0 ? (day.total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : ''}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(4, (day.total / maxTotal) * (CHART_HEIGHT - 24)) },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartHint}>Angka dalam ribuan rupiah (mis. 22 = Rp22.000)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 16 },
  offlineNotice: {
    fontSize: 12,
    color: colors.warningText,
    backgroundColor: colors.warningBg,
    padding: 8,
    borderRadius: radius.sm,
    marginBottom: 12,
    fontFamily: fonts.regular,
  },
  capitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...cardShadow,
  },
  capitalLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontFamily: fonts.regular },
  capitalValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.textPrimary },
  capitalEditHint: { color: colors.primary, fontSize: 13, fontFamily: fonts.semiBold },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    ...cardShadow,
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontFamily: fonts.regular },
  summaryValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
    ...cardShadow,
  },
  addExpenseButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  addExpenseButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold, fontSize: 13 },
  chartCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    ...cardShadow,
  },
  chartTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary, marginBottom: 12 },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontSize: 10, color: colors.textSecondary, marginBottom: 2, fontFamily: fonts.regular },
  barTrack: { justifyContent: 'flex-end', height: CHART_HEIGHT - 24 },
  bar: { width: 18, backgroundColor: colors.secondary, borderRadius: 4 },
  barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontFamily: fonts.regular },
  chartHint: { fontSize: 11, color: colors.textMuted, marginTop: 10, textAlign: 'center', fontFamily: fonts.regular },
});
