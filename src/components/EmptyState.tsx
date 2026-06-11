import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: string;
}

export function EmptyState({ title, body, icon = 'file-tray-outline' }: EmptyStateProps) {
  const { theme } = useAppPreferences();

  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
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
    </Card>
  );
}
