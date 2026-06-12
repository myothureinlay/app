import { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface CardProps extends PropsWithChildren {
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { theme } = useAppPreferences();
  const shadowStyle =
    Platform.OS === 'web'
      ? ({ boxShadow: `0 12px 24px ${theme.colors.shadow}14` } as ViewStyle)
      : ({
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: theme.cardStyle === 'flat' ? 0.03 : 0.08,
          shadowRadius: 24,
          elevation: theme.elevation.card,
        } as ViewStyle);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: theme.cardStyle === 'flat' ? 0 : StyleSheet.hairlineWidth,
        },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
});
