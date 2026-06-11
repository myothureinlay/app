import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: number;
  currency: string;
  icon: string;
  color: string;
}

export function StatCard({ label, value, currency, icon, color }: StatCardProps) {
  const { theme } = useAppPreferences();

  return (
    <Card style={{ flex: 1, minHeight: 124, gap: 12 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: `${color}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={18} color={color} />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(value, currency as never)}
        </Text>
      </View>
    </Card>
  );
}
