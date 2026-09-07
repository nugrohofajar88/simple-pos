import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CapitalState = {
  initialCapital: number;
  setInitialCapital: (value: number) => void;
};

export const useCapitalStore = create<CapitalState>()(
  persist(
    (set) => ({
      initialCapital: 0,
      setInitialCapital: (value) => set({ initialCapital: value }),
    }),
    {
      name: 'pos-capital-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
