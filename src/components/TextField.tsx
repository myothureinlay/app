import { Text, TextInput, TextInputProps, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...props }: TextFieldProps) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...props}
        style={[
          {
            minHeight: props.multiline ? 92 : 50,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
          },
          style,
        ]}
      />
    </View>
  );
}
