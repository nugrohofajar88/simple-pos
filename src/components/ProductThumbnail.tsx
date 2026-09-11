import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/src/theme';

type Props = {
  uri: string | null;
  size?: number;
};

export function ProductThumbnail({ uri, size = 40 }: Props) {
  const boxStyle = { width: size, height: size, borderRadius: radius.sm };
  if (!uri) {
    return <View style={[styles.placeholder, boxStyle]} />;
  }
  return <Image source={{ uri }} style={[styles.image, boxStyle]} contentFit="cover" />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    backgroundColor: colors.surfaceContainerLow,
  },
});
