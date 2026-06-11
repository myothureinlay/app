import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

interface ReportCardProps {
  label: string;
  value: number;
  currency: string;
  icon: string;
  color?: string;
}

export function ReportCard({ label, value, currency, icon, color }: ReportCardProps) {
  const { theme } = useAppPreferences();
  const accent = color ?? theme.colors.primary;

  return (
    <Card style={{ flex: 1, gap: 12, minHeight: 112 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.md,
          backgroundColor: `${accent}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as never} size={18} color={accent} />
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value, currency as never)}
      </Text>
    </Card>
  );
}
