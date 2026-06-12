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
  icon?: string;
}

export function PickerField<T extends string>({
  label,
  value,
  onChange,
  options,
  title,
  placeholder,
  searchable,
  icon,
}: PickerFieldProps<T>) {
  const { theme } = useAppPreferences();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const fallbackIcon = icon ?? 'ellipse-outline';
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => `${option.label} ${option.detail ?? ''}`.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{label}</Text>
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
          <Ionicons name={(selected?.icon ?? fallbackIcon) as never} size={17} color={selected?.color ?? theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
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
            <Ionicons name="search-outline" size={17} color={theme.colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder ?? label}
              placeholderTextColor={theme.colors.textMuted}
              style={{ flex: 1, color: theme.colors.text, fontSize: 14, paddingVertical: 0 }}
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
                <Ionicons name={(option.icon ?? fallbackIcon) as never} size={17} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }}>{option.label}</Text>
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
    minHeight: 46,
    borderRadius: 10,
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
  search: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  option: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
