import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { theme } = useAppPreferences();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              {
                backgroundColor: selected ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon as never}
                size={16}
                color={selected ? '#FFFFFF' : theme.colors.textMuted}
              />
            ) : null}
            <Text
              style={[styles.label, { color: selected ? '#FFFFFF' : theme.colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
});
