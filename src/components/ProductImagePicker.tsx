import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/src/theme';

type Props = {
  uri: string | null;
  onChange: (uri: string) => void;
};

export function ProductImagePicker({ uri, onChange }: Props) {
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin ditolak', 'Aplikasi butuh akses galeri untuk memilih gambar produk.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.thumbnail} onPress={pick}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <Text style={styles.placeholderText}>+</Text>
        )}
      </Pressable>
      <Pressable onPress={pick}>
        <Text style={styles.link}>{uri ? 'Ganti Gambar' : 'Pilih Gambar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholderText: { fontSize: 24, color: colors.textMuted, fontFamily: fonts.regular },
  link: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 14 },
});
