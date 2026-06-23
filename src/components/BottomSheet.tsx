import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({ visible, title, onClose, children, footer }: BottomSheetProps) {
  const { theme, settings } = useAppPreferences();
  const isAurora = settings.theme === 'auroraGlass';
  const sheetShadowStyle = Platform.select({
    web: {
      boxShadow: `0 -3px 14px ${theme.colors.shadow}${isAurora ? '22' : '12'}`,
    } as ViewStyle,
    default: {
      elevation: theme.elevation.sheet,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isAurora ? 0.08 : 0.04,
      shadowRadius: isAurora ? 10 : 7,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isAurora ? '#0A1829F2' : theme.colors.surface,
              borderColor: theme.colors.border,
            },
            sheetShadowStyle,
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.colors.surfaceElevated, opacity: pressed ? 0.74 : 1 },
              ]}
            >
              <Ionicons name="close-outline" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#9CA3AF66',
    marginBottom: 8,
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    gap: 8,
    paddingBottom: 18,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
});
