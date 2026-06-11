import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface ChipOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
  color?: string;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChipGroup<T extends string>({ options, value, onChange }: ChipGroupProps<T>) {
  const { theme } = useAppPreferences();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        const accent = option.color ?? theme.colors.primary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                borderColor: selected ? accent : theme.colors.border,
                backgroundColor: selected ? accent : theme.colors.surface,
              },
            ]}
          >
            {option.icon ? (
              <Ionicons name={option.icon as never} size={15} color={selected ? '#FFFFFF' : accent} />
            ) : null}
            <Text style={[styles.text, { color: selected ? '#FFFFFF' : theme.colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
