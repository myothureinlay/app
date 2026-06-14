import { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface CardProps extends PropsWithChildren {
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { theme, settings } = useAppPreferences();
  const isAurora = settings.theme === 'auroraGlass';
  const shadowStyle =
    Platform.OS === 'web'
      ? ({ boxShadow: `0 8px 18px ${theme.colors.shadow}${isAurora ? '1F' : '0D'}` } as ViewStyle)
      : ({
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: isAurora ? 8 : 6 },
          shadowOpacity: isAurora ? 0.12 : theme.cardStyle === 'flat' ? 0.02 : 0.055,
          shadowRadius: isAurora ? 18 : 12,
          elevation: theme.elevation.card,
        } as ViewStyle);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isAurora ? theme.colors.surface : theme.colors.surface,
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
    padding: 12,
  },
});
