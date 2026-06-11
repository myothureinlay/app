import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>{title}</Text>
      {action}
    </View>
  );
}
