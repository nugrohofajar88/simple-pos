import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SyncSettingsState = {
  apiBaseUrl: string;
  apiToken: string;
  lastSyncedAt: string | null;
  lastPulledAt: string | null;
  setCredentials: (apiBaseUrl: string, apiToken: string) => void;
  setLastSyncedAt: (value: string) => void;
  setLastPulledAt: (value: string) => void;
};

export const useSyncSettingsStore = create<SyncSettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: '',
      apiToken: '',
      lastSyncedAt: null,
      lastPulledAt: null,
      setCredentials: (apiBaseUrl, apiToken) => set({ apiBaseUrl, apiToken }),
      setLastSyncedAt: (value) => set({ lastSyncedAt: value }),
      setLastPulledAt: (value) => set({ lastPulledAt: value }),
    }),
    {
      name: 'pos-sync-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
