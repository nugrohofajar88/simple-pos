import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
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
import { colors, fonts } from '@/src/theme';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

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

  if (!success || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.background },
  errorText: { color: colors.destructive, textAlign: 'center', fontFamily: fonts.regular },
});
