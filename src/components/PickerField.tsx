import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { BottomSheet } from './BottomSheet';

export interface PickerOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
  color?: string;
  detail?: string;
}

interface PickerFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: PickerOption<T>[];
  title?: string;
  placeholder?: string;
  searchable?: boolean;
}

export function PickerField<T extends string>({
  label,
  value,
  onChange,
  options,
  title,
  placeholder,
  searchable,
}: PickerFieldProps<T>) {
  const { theme } = useAppPreferences();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => `${option.label} ${option.detail ?? ''}`.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.iconSlot,
            {
              backgroundColor: `${selected?.color ?? theme.colors.primary}18`,
            },
          ]}
        >
          {selected?.icon ? (
            <Ionicons name={selected.icon as never} size={18} color={selected.color ?? theme.colors.primary} />
          ) : (
            <View style={[styles.dot, { backgroundColor: selected?.color ?? theme.colors.primary }]} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
            {selected?.label ?? placeholder ?? label}
          </Text>
          {selected?.detail ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {selected.detail}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down-outline" size={20} color={theme.colors.textMuted} />
      </Pressable>

      <BottomSheet visible={visible} title={title ?? label} onClose={() => setVisible(false)}>
        {searchable ? (
          <View
            style={[
              styles.search,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder ?? label}
              placeholderTextColor={theme.colors.textMuted}
              style={{ flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: 0 }}
            />
          </View>
        ) : null}
        {filtered.map((option) => {
          const selectedOption = option.value === value;
          const accent = option.color ?? theme.colors.primary;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                onChange(option.value);
                setVisible(false);
                setQuery('');
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: selectedOption ? accent : theme.colors.border,
                  backgroundColor: selectedOption ? `${accent}14` : pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${accent}18` }]}>
                {option.icon ? (
                  <Ionicons name={option.icon as never} size={18} color={accent} />
                ) : (
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{option.label}</Text>
                {option.detail ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{option.detail}</Text>
                ) : null}
              </View>
              {selectedOption ? <Ionicons name="checkmark-circle-outline" size={22} color={accent} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSlot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  search: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  option: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
