import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, action }: ScreenHeaderProps) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '900' }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
