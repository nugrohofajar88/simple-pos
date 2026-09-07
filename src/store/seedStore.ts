import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SeedState = {
  hasSeeded: boolean;
  setHasSeeded: (value: boolean) => void;
};

export const useSeedStore = create<SeedState>()(
  persist(
    (set) => ({
      hasSeeded: false,
      setHasSeeded: (value) => set({ hasSeeded: value }),
    }),
    {
      name: 'pos-seed-state',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
