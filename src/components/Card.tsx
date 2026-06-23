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
      ? ({ boxShadow: `0 2px 7px ${theme.colors.shadow}${isAurora ? '14' : '08'}` } as ViewStyle)
      : ({
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: isAurora ? 3 : 1 },
          shadowOpacity: isAurora ? 0.06 : theme.cardStyle === 'flat' ? 0.01 : 0.03,
          shadowRadius: isAurora ? 9 : 5,
          elevation: isAurora ? 2 : theme.elevation.card,
        } as ViewStyle);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isAurora ? theme.colors.surface : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md + 4,
          borderWidth: StyleSheet.hairlineWidth,
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
