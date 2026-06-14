import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { iconForStyle } from '../utils/icons';
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
  const { theme, settings } = useAppPreferences();
  const accent = color ?? theme.colors.primary;

  return (
    <Card style={{ flex: 1, gap: 8, minHeight: 92, padding: 11 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${accent}24`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={19} color={accent} />
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value, currency as never)}
      </Text>
    </Card>
  );
}
