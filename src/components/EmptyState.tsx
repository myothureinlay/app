import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { iconForStyle } from '../utils/icons';
import { AppButton } from './AppButton';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  body,
  icon = 'file-tray-outline',
  actionLabel,
  actionIcon = 'add-outline',
  onAction,
}: EmptyStateProps) {
  const { theme, settings } = useAppPreferences();

  return (
    <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 16 }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: `${theme.colors.primary}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={22} color={theme.colors.primary} />
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>{body}</Text>
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} icon={actionIcon} onPress={onAction} style={{ marginTop: 4, alignSelf: 'stretch' }} />
      ) : null}
    </Card>
  );
}
