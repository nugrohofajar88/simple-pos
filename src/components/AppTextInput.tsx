import { TextInput, type TextInputProps } from 'react-native';

export function AppTextInput(props: TextInputProps) {
  return <TextInput placeholderTextColor="#999" {...props} style={[{ color: '#111' }, props.style]} />;
}
