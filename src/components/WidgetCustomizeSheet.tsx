import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import type { WidgetPreferences } from '../types';
import { AppButton } from './AppButton';
import { BottomSheet } from './BottomSheet';
import { Card } from './Card';

export interface WidgetDescriptor {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
}

export function normalizeWidgetOrder(widgets: WidgetDescriptor[], order?: string[]) {
  const known = new Set(widgets.map((widget) => widget.id));
  const saved = (order ?? []).filter((id) => known.has(id));
  const missing = widgets.map((widget) => widget.id).filter((id) => !saved.includes(id));
  return [...saved, ...missing];
}

export function visibleWidgets<T extends WidgetDescriptor>(widgets: T[], preferences?: WidgetPreferences) {
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));
  const hidden = new Set(preferences?.hidden ?? []);
  return normalizeWidgetOrder(widgets, preferences?.order)
    .map((id) => byId.get(id))
    .filter((widget): widget is T => {
      if (!widget) return false;
      return !hidden.has(widget.id);
    });
}

interface WidgetCustomizeSheetProps {
  visible: boolean;
  title: string;
  widgets: WidgetDescriptor[];
  preferences?: WidgetPreferences;
  onChange: (preferences: WidgetPreferences) => void;
  onClose: () => void;
}

function IconControl({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppPreferences();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: pressed ? theme.colors.surface : theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon as never} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

export function WidgetCustomizeSheet({
  visible,
  title,
  widgets,
  preferences,
  onChange,
  onClose,
}: WidgetCustomizeSheetProps) {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const order = normalizeWidgetOrder(widgets, preferences?.order);
  const hidden = new Set(preferences?.hidden ?? []);
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));

  const update = (nextOrder: string[], nextHidden: Set<string>) => {
    onChange({
      order: nextOrder,
      hidden: Array.from(nextHidden).filter((id) => byId.has(id)),
    });
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const nextOrder = [...order];
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    update(nextOrder, hidden);
  };

  const toggle = (id: string) => {
    const nextHidden = new Set(hidden);
    if (nextHidden.has(id)) {
      nextHidden.delete(id);
    } else {
      nextHidden.add(id);
    }
    update(order, nextHidden);
  };

  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      footer={
        <AppButton
          title={t('widgets.reset')}
          icon="refresh-outline"
          variant="secondary"
          onPress={() => update(widgets.map((widget) => widget.id), new Set())}
        />
      }
    >
      {order.map((id, index) => {
        const widget = byId.get(id);
        if (!widget) return null;
        const accent = widget.color ?? theme.colors.primary;
        const isHidden = hidden.has(id);

        return (
          <Card
            key={id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              opacity: isHidden ? 0.68 : 1,
            }}
          >
            <View style={[styles.widgetIcon, { backgroundColor: `${accent}18` }]}>
              <Ionicons name={widget.icon as never} size={18} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
                {widget.title}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                {isHidden ? t('widgets.hidden') : widget.subtitle ?? t('widgets.visible')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconControl
                icon="chevron-up-outline"
                label={t('widgets.moveUp')}
                disabled={index === 0}
                onPress={() => move(id, -1)}
              />
              <IconControl
                icon="chevron-down-outline"
                label={t('widgets.moveDown')}
                disabled={index === order.length - 1}
                onPress={() => move(id, 1)}
              />
              <IconControl
                icon={isHidden ? 'add-circle-outline' : 'remove-circle-outline'}
                label={isHidden ? t('widgets.show') : t('widgets.hide')}
                onPress={() => toggle(id)}
              />
            </View>
          </Card>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
