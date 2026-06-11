import { Modal, Pressable, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { AppButton } from './AppButton';
import { Card } from './Card';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { theme } = useAppPreferences();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 420 }}>
          <Card style={{ gap: 14 }}>
            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>{title}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 }}>{body}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton title={cancelLabel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
              <AppButton
                title={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                onPress={onConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
