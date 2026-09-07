import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { type BluetoothDevice } from 'react-native-bluetooth-classic';

export type { BluetoothDevice };

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 31) return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);

  return (
    granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
  );
}

function isBluetoothEnabled(): Promise<boolean> {
  return RNBluetoothClassic.isBluetoothEnabled();
}

function requestBluetoothEnabled(): Promise<boolean> {
  return RNBluetoothClassic.requestBluetoothEnabled();
}

function getPairedDevices(): Promise<BluetoothDevice[]> {
  return RNBluetoothClassic.getBondedDevices();
}

async function connect(device: BluetoothDevice): Promise<boolean> {
  const alreadyConnected = await device.isConnected();
  if (alreadyConnected) return true;
  return device.connect();
}

function disconnect(device: BluetoothDevice): Promise<boolean> {
  return device.disconnect();
}

function writeText(device: BluetoothDevice, text: string): Promise<boolean> {
  return device.write(text, 'ascii');
}

export const BluetoothTransport = {
  requestBluetoothPermissions,
  isBluetoothEnabled,
  requestBluetoothEnabled,
  getPairedDevices,
  connect,
  disconnect,
  writeText,
};
