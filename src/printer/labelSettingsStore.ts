import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LabelSettingsState = {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  marginXDots: number;
  marginYDots: number;
  setLabelSettings: (settings: {
    widthMm: number;
    heightMm: number;
    gapMm: number;
    marginXDots: number;
    marginYDots: number;
  }) => void;
};

export const useLabelSettingsStore = create<LabelSettingsState>()(
  persist(
    (set) => ({
      widthMm: 40,
      heightMm: 30,
      gapMm: 2,
      marginXDots: 70,
      marginYDots: 15,
      setLabelSettings: (settings) => set(settings),
    }),
    {
      name: 'pos-label-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
