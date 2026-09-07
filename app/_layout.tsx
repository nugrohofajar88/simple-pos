import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/src/db/client';
import migrations from '@/src/db/migrations/migrations';
import { seedIfEmpty } from '@/src/db/seed';
import { useSeedStore } from '@/src/store/seedStore';
import { SyncService } from '@/src/sync/SyncService';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success && !useSeedStore.getState().hasSeeded) {
      seedIfEmpty(db).then(() => useSeedStore.getState().setHasSeeded(true));
    }
  }, [success]);

  useEffect(() => {
    if (success) {
      SyncService.syncAll().catch(() => {});
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Gagal migrasi database: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  errorText: { color: '#dc2626', textAlign: 'center' },
});
