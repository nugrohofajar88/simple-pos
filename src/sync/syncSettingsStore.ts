import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SyncSettingsState = {
  apiBaseUrl: string;
  apiToken: string;
  lastSyncedAt: string | null;
  lastPulledAt: string | null;
  lastPulledOrdersAt: string | null;
  lastPulledExpensesAt: string | null;
  setCredentials: (apiBaseUrl: string, apiToken: string) => void;
  setLastSyncedAt: (value: string) => void;
  setLastPulledAt: (value: string) => void;
  setLastPulledOrdersAt: (value: string) => void;
  setLastPulledExpensesAt: (value: string) => void;
};

export const useSyncSettingsStore = create<SyncSettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: '',
      apiToken: '',
      lastSyncedAt: null,
      lastPulledAt: null,
      lastPulledOrdersAt: null,
      lastPulledExpensesAt: null,
      setCredentials: (apiBaseUrl, apiToken) => set({ apiBaseUrl, apiToken }),
      setLastSyncedAt: (value) => set({ lastSyncedAt: value }),
      setLastPulledAt: (value) => set({ lastPulledAt: value }),
      setLastPulledOrdersAt: (value) => set({ lastPulledOrdersAt: value }),
      setLastPulledExpensesAt: (value) => set({ lastPulledExpensesAt: value }),
    }),
    {
      name: 'pos-sync-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
