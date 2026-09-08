import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SyncSettingsState = {
  apiBaseUrl: string;
  apiToken: string;
  lastSyncedAt: string | null;
  setCredentials: (apiBaseUrl: string, apiToken: string) => void;
  setLastSyncedAt: (value: string) => void;
};

export const useSyncSettingsStore = create<SyncSettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: '',
      apiToken: '',
      lastSyncedAt: null,
      setCredentials: (apiBaseUrl, apiToken) => set({ apiBaseUrl, apiToken }),
      setLastSyncedAt: (value) => set({ lastSyncedAt: value }),
    }),
    {
      name: 'pos-sync-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
