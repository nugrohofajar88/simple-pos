import type { TextInputProps } from 'react-native';

import { AppTextInput } from '@/src/components/AppTextInput';

function formatThousands(digits: string): string {
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

type CurrencyInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: string;
  onChangeText: (rawDigits: string) => void;
};

export function CurrencyInput({ value, onChangeText, ...props }: CurrencyInputProps) {
  return (
    <AppTextInput
      {...props}
      value={formatThousands(value)}
      onChangeText={(text) => onChangeText(text.replace(/[^\d]/g, ''))}
      keyboardType="numeric"
    />
  );
}
