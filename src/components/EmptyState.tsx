import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
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
  const { theme } = useAppPreferences();

  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 22, paddingHorizontal: 18 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: `${theme.colors.primary}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={24} color={theme.colors.primary} />
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{body}</Text>
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} icon={actionIcon} onPress={onAction} style={{ marginTop: 4, alignSelf: 'stretch' }} />
      ) : null}
    </Card>
  );
}
