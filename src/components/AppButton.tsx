import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { iconForStyle } from '../utils/icons';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  shape?: 'default' | 'circle';
  style?: ViewStyle;
  disabled?: boolean;
}

export function AppButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  shape = 'default',
  style,
  disabled,
}: AppButtonProps) {
  const { theme, settings } = useAppPreferences();
  const colors = theme.colors;
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? theme.buttonStyle === 'tonal'
            ? `${colors.primary}18`
            : colors.surfaceElevated
          : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : variant === 'secondary' && theme.buttonStyle === 'tonal' ? colors.primary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        shape === 'circle' ? styles.circle : null,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? 'transparent' : colors.border,
          borderRadius: shape === 'circle' ? 999 : theme.radius.md,
          opacity: disabled ? 0.55 : pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={18} color={foreground} /> : null}
      {title ? (
        <Text style={[styles.title, { color: foreground }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  circle: {
    width: 42,
    height: 42,
    minHeight: 42,
    paddingHorizontal: 0,
    borderRadius: 999,
  },
});
