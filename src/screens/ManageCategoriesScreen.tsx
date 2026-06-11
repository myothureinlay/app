import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Screen } from '../components/Screen';
import { SegmentedControl } from '../components/SegmentedControl';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { CategoryType } from '../types';

const categoryColors = ['#16A34A', '#EF4444', '#F97316', '#8B5CF6', '#0EA5E9', '#EC4899'];
const iconByType: Record<CategoryType, string> = {
  income: 'briefcase',
  expense: 'pricetag',
  transfer: 'swap-horizontal',
};

export function ManageCategoriesScreen() {
  const { theme } = useAppPreferences();
  const { categories, addCategory } = useFinance();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState(categoryColors[1]);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert(t('manage.categoryName'));
      return;
    }

    await addCategory({
      name: name.trim(),
      type,
      color,
      icon: iconByType[type],
    });
    setName('');
  };

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>{t('manage.addCategory')}</Text>
        <TextField label={t('manage.categoryName')} value={name} onChangeText={setName} />
        <SegmentedControl
          value={type}
          onChange={setType}
          options={[
            { label: t('common.income'), value: 'income', icon: 'arrow-down' },
            { label: t('common.expense'), value: 'expense', icon: 'arrow-up' },
            { label: t('common.exchange'), value: 'transfer', icon: 'swap-horizontal' },
          ]}
        />
        <ChipGroup
          value={color}
          onChange={setColor}
          options={categoryColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <AppButton title={t('common.save')} icon="checkmark" onPress={submit} />
      </Card>

      <View style={{ gap: 10 }}>
        {categories.map((category) => (
          <Card key={category.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: `${category.color}22`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={category.icon as never} size={20} color={category.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>{category.name}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{category.type}</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
