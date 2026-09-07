import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StoreSettingsState = {
  storeName: string;
  setStoreName: (name: string) => void;
};

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set) => ({
      storeName: 'TOKO KOPI',
      setStoreName: (name) => set({ storeName: name }),
    }),
    {
      name: 'pos-store-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
