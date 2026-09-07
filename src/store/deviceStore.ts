import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateDeviceCode(): string {
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

type DeviceState = {
  deviceCode: string;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    () => ({
      deviceCode: generateDeviceCode(),
    }),
    {
      name: 'pos-device-state',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
