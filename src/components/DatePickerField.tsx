import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { iconForStyle } from '../utils/icons';
import { AppButton } from './AppButton';
import { BottomSheet } from './BottomSheet';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

function dateToValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function valueToDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function calendarCells(month: Date) {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day, 12));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePickerField({ label, value, onChangeText }: DatePickerFieldProps) {
  const { theme, settings } = useAppPreferences();
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(startOfMonth(valueToDate(value)));
  const selectedDate = valueToDate(value);
  const cells = useMemo(() => calendarCells(month), [month]);
  const weekdays = useMemo(() => {
    const base = new Date(2026, 5, 7);
    return Array.from({ length: 7 }).map((_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index))
    );
  }, [locale]);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const selectedLabel = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate);

  const moveMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMonth(startOfMonth(valueToDate(value)));
          setVisible(true);
        }}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View style={[styles.iconSlot, { backgroundColor: `${theme.colors.primary}18` }]}>
          <Ionicons name={iconForStyle('calendar-outline', settings.iconStyle) as never} size={17} color={theme.colors.primary} />
        </View>
        <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name={iconForStyle('chevron-down-outline', settings.iconStyle) as never} size={18} color={theme.colors.textMuted} />
      </Pressable>

      <BottomSheet visible={visible} title={label} onClose={() => setVisible(false)}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <AppButton title="" icon="chevron-back-outline" variant="secondary" onPress={() => moveMonth(-1)} style={{ width: 42, paddingHorizontal: 0 }} />
            <Text style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
              {monthLabel}
            </Text>
            <AppButton title="" icon="chevron-forward-outline" variant="secondary" onPress={() => moveMonth(1)} style={{ width: 42, paddingHorizontal: 0 }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 4 }}>
            {weekdays.map((day) => (
              <Text key={day} style={{ flex: 1, color: theme.colors.textMuted, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>
                {day}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {cells.map((cell, index) => {
              const selected = cell && dateToValue(cell) === value;
              return (
                <Pressable
                  key={`${cell?.toISOString() ?? 'empty'}-${index}`}
                  accessibilityRole={cell ? 'button' : undefined}
                  disabled={!cell}
                  onPress={() => {
                    if (!cell) return;
                    onChangeText(dateToValue(cell));
                    setVisible(false);
                  }}
                  style={({ pressed }) => ({
                    width: `${(100 - 6 * 4) / 7}%`,
                    aspectRatio: 1,
                    borderRadius: theme.radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? theme.colors.primary : pressed ? theme.colors.surfaceElevated : 'transparent',
                  })}
                >
                  {cell ? (
                    <Text style={{ color: selected ? '#FFFFFF' : theme.colors.text, fontSize: 13, fontWeight: selected ? '900' : '800' }}>
                      {cell.getDate()}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <AppButton
            title={t('dateRange.today')}
            icon="today-outline"
            variant="secondary"
            onPress={() => {
              const today = new Date();
              onChangeText(dateToValue(today));
              setMonth(startOfMonth(today));
              setVisible(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  iconSlot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
