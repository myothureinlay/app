import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { formatMoney } from '../utils/money';
import { Card } from './Card';

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface MonthlyChartDatum {
  key: string;
  label: string;
  income: number;
  expenses: number;
  cashflow: number;
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  const { theme } = useAppPreferences();

  return (
    <Card style={{ gap: 10 }}>
      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
      {children}
    </Card>
  );
}

export function MonthlyBarChart({ data }: { data: MonthlyChartDatum[] }) {
  const { theme } = useAppPreferences();
  const width = 320;
  const height = 180;
  const chartHeight = 122;
  const max = Math.max(...data.flatMap((row) => [row.income, row.expenses]), 1);
  const groupWidth = width / Math.max(data.length, 1);
  const barWidth = Math.min(16, groupWidth / 3.2);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={0} x2={width} y1={chartHeight} y2={chartHeight} stroke={theme.colors.border} strokeWidth={1} />
      {data.map((row, index) => {
        const x = index * groupWidth + groupWidth / 2;
        const incomeHeight = (row.income / max) * chartHeight;
        const expenseHeight = (row.expenses / max) * chartHeight;
        return (
          <G key={row.key}>
            <Rect
              x={x - barWidth - 2}
              y={chartHeight - incomeHeight}
              width={barWidth}
              height={Math.max(1, incomeHeight)}
              rx={3}
              fill={theme.colors.success}
            />
            <Rect
              x={x + 2}
              y={chartHeight - expenseHeight}
              width={barWidth}
              height={Math.max(1, expenseHeight)}
              rx={3}
              fill={theme.colors.danger}
            />
            <SvgText x={x} y={chartHeight + 20} textAnchor="middle" fontSize={10} fill={theme.colors.textMuted}>
              {row.label}
            </SvgText>
          </G>
        );
      })}
      <SvgText x={0} y={height - 8} fontSize={10} fill={theme.colors.success}>
        Income
      </SvgText>
      <SvgText x={70} y={height - 8} fontSize={10} fill={theme.colors.danger}>
        Expenses
      </SvgText>
    </Svg>
  );
}

export function LineTrendChart({ data }: { data: MonthlyChartDatum[] }) {
  const { theme } = useAppPreferences();
  const width = 320;
  const height = 160;
  const chartHeight = 110;
  const values = data.map((row) => row.cashflow);
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);
  const step = width / Math.max(data.length - 1, 1);
  const mid = chartHeight / 2;
  const points = data.map((row, index) => {
    const x = index * step;
    const y = mid - (row.cashflow / maxAbs) * (chartHeight / 2 - 10);
    return { x, y, row };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={0} x2={width} y1={mid} y2={mid} stroke={theme.colors.border} strokeWidth={1} />
      <Path d={path} fill="none" stroke={theme.colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <G key={point.row.key}>
          <Circle cx={point.x} cy={point.y} r={4} fill={theme.colors.primary} />
          <SvgText x={point.x} y={chartHeight + 22} textAnchor="middle" fontSize={10} fill={theme.colors.textMuted}>
            {point.row.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

export function DonutChart({ data }: { data: ChartDatum[] }) {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const size = 164;
  const radius = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, row) => sum + Math.abs(row.value), 0);
  let offset = 0;

  if (total <= 0) {
    return <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t('reports.noData')}</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.surfaceElevated} strokeWidth={strokeWidth} fill="none" />
        {data.map((row) => {
          const value = Math.abs(row.value);
          const dash = (value / total) * circumference;
          const segment = (
            <Circle
              key={row.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={row.color ?? theme.colors.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return segment;
        })}
        <SvgText x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={18} fontWeight="900" fill={theme.colors.text}>
          {data.length}
        </SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {data.slice(0, 5).map((row) => (
          <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: row.color ?? theme.colors.primary }} />
            <Text style={{ flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
              {row.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function HorizontalBarChart({ data, currency }: { data: ChartDatum[]; currency: string }) {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const max = Math.max(...data.map((row) => Math.abs(row.value)), 1);

  if (data.length === 0) {
    return <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t('reports.noData')}</Text>;
  }

  return (
    <View style={{ gap: 12 }}>
      {data.slice(0, 8).map((row) => (
        <View key={row.key} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>
              {formatMoney(row.value, currency as never)}
            </Text>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceElevated, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.max(4, (Math.abs(row.value) / max) * 100)}%`,
                backgroundColor: row.color ?? theme.colors.primary,
                borderRadius: 5,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
