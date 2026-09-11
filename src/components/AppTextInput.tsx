import { TextInput, type TextInputProps } from 'react-native';

import { colors, fonts } from '@/src/theme';

export function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[{ color: colors.textPrimary, fontFamily: fonts.regular }, props.style]}
    />
  );
}
