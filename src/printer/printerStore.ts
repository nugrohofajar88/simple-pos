import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PrinterState = {
  pairedAddress: string | null;
  pairedName: string | null;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  setPairedDevice: (address: string, name: string) => void;
  setStatus: (status: PrinterState['status']) => void;
  clear: () => void;
};

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      pairedAddress: null,
      pairedName: null,
      status: 'idle',
      setPairedDevice: (address, name) => set({ pairedAddress: address, pairedName: name }),
      setStatus: (status) => set({ status }),
      clear: () => set({ pairedAddress: null, pairedName: null, status: 'idle' }),
    }),
    {
      name: 'pos-printer-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pairedAddress: state.pairedAddress, pairedName: state.pairedName }),
    }
  )
);
