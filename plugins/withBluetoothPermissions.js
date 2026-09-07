const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSIONS = [
  {
    name: 'android.permission.BLUETOOTH_SCAN',
    attrs: { 'android:usesPermissionFlags': 'neverForLocation', 'tools:targetApi': '31' },
  },
  { name: 'android.permission.BLUETOOTH_CONNECT' },
  { name: 'android.permission.BLUETOOTH', attrs: { 'android:maxSdkVersion': '30' } },
  { name: 'android.permission.BLUETOOTH_ADMIN', attrs: { 'android:maxSdkVersion': '30' } },
];

function withBluetoothPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    for (const permission of PERMISSIONS) {
      const alreadyExists = manifest['uses-permission'].some(
        (entry) => entry.$['android:name'] === permission.name
      );
      if (alreadyExists) continue;

      manifest['uses-permission'].push({
        $: { 'android:name': permission.name, ...(permission.attrs ?? {}) },
      });
    }

    return config;
  });
}

module.exports = withBluetoothPermissions;
