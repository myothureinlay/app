import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { buildCategoryTree } from '../logic/categories';
import { categoryTypes } from '../logic/ledger';
import type { Category, CategoryType } from '../types';

const categoryColors = ['#16A34A', '#EF4444', '#F97316', '#8B5CF6', '#0EA5E9', '#EC4899', '#F59E0B', '#64748B'];
const categoryIcons = [
  'briefcase-outline',
  'restaurant-outline',
  'car-outline',
  'home-outline',
  'card-outline',
  'cash-outline',
  'receipt-outline',
  'swap-horizontal-outline',
  'arrow-up-circle-outline',
  'arrow-down-circle-outline',
  'document-text-outline',
  'alert-circle-outline',
  'sparkles-outline',
  'heart-outline',
  'school-outline',
  'airplane-outline',
  'basket-outline',
  'cart-outline',
  'medical-outline',
  'fitness-outline',
  'bus-outline',
  'train-outline',
  'bicycle-outline',
  'speedometer-outline',
  'wifi-outline',
  'phone-portrait-outline',
  'flash-outline',
  'water-outline',
  'game-controller-outline',
  'film-outline',
  'gift-outline',
  'people-outline',
  'person-add-outline',
  'business-outline',
  'storefront-outline',
  'construct-outline',
  'hammer-outline',
  'shield-checkmark-outline',
  'medal-outline',
  'trophy-outline',
  'diamond-outline',
  'wallet-outline',
  'calculator-outline',
  'library-outline',
  'globe-outline',
  'earth-outline',
  'trending-up-outline',
  'trending-down-outline',
  'bar-chart-outline',
  'pie-chart-outline',
  'stats-chart-outline',
  'calendar-outline',
  'time-outline',
  'cloud-outline',
  'leaf-outline',
  'flower-outline',
];

const iconByType: Record<CategoryType, string> = {
  income: 'trending-up-outline',
  expense: 'trending-down-outline',
  loan: 'arrow-up-circle-outline',
  debt: 'arrow-down-circle-outline',
  transfer: 'swap-horizontal-outline',
  adjustment: 'options-outline',
  other: 'ellipse-outline',
};

export function ManageCategoriesScreen() {
  const { theme } = useAppPreferences();
  const { categories, addCategory, editCategory, removeCategoryById } = useFinance();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [parentId, setParentId] = useState('none');
  const [color, setColor] = useState(categoryColors[1]);
  const [icon, setIcon] = useState(iconByType.expense);
  const [iconSearch, setIconSearch] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const filteredIcons = categoryIcons.filter((item) => item.includes(iconSearch.trim().toLowerCase()));
  const parentOptions = categories
    .filter((category) => !category.parentId && !category.removedAt && category.id !== editing?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const filteredTree = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tree;
    return tree
      .map((parent) => {
        const children = parent.children.filter((child) => child.name.toLowerCase().includes(query));
        if (parent.name.toLowerCase().includes(query) || children.length > 0) {
          return { ...parent, children };
        }
        return null;
      })
      .filter(Boolean) as typeof tree;
  }, [search, tree]);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setType(editing.type);
    setParentId(editing.parentId ?? 'none');
    setColor(editing.color);
    setIcon(editing.icon);
  }, [editing]);

  const reset = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setParentId('none');
    setColor(categoryColors[1]);
    setIcon(iconByType.expense);
    setIconSearch('');
  };

  const closeForm = () => {
    setFormVisible(false);
    reset();
  };

  const openAdd = (nextParentId = 'none') => {
    reset();
    const parent = parentOptions.find((category) => category.id === nextParentId);
    if (parent) {
      setParentId(parent.id);
      setType(parent.type);
      setColor(parent.color);
      setIcon(parent.icon);
    }
    setFormVisible(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setType(category.type);
    setParentId(category.parentId ?? 'none');
    setColor(category.color);
    setIcon(category.icon);
    setFormVisible(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert(t('manage.categoryName'));
      return;
    }

    const nextParentId = parentId === 'none' ? null : parentId;
    if (editing) {
      await editCategory({
        id: editing.id,
        name: name.trim(),
        type,
        parentId: nextParentId,
        color,
        icon,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type,
        parentId: nextParentId,
        color,
        icon,
      });
    }
    Alert.alert(t('manage.categorySaved'));
    closeForm();
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('nav.categories')}
        subtitle={t('manage.categoryHierarchySubtitle')}
        action={<AppButton title="" icon="add-outline" shape="circle" onPress={() => openAdd()} />}
      />

      <TextField label={t('common.search')} value={search} onChangeText={setSearch} placeholder={t('manage.searchCategories')} />

      <View style={{ gap: 10 }}>
        {filteredTree.length === 0 ? (
          <EmptyState
            title={t('empty.title')}
            body={t('empty.categories')}
            icon="pricetags-outline"
            actionLabel={t('manage.addCategory')}
            actionIcon="add-circle-outline"
            onAction={() => openAdd()}
          />
        ) : (
          filteredTree.map((parent) => {
            const isExpanded = expanded[parent.id] ?? true;
            return (
              <View key={parent.id} style={{ gap: 8 }}>
                <Pressable accessibilityRole="button" onPress={() => openEdit(parent)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setExpanded((current) => ({ ...current, [parent.id]: !isExpanded }))}
                      style={({ pressed }) => ({
                        width: 34,
                        height: 34,
                        borderRadius: theme.radius.md,
                        backgroundColor: pressed ? theme.colors.surfaceElevated : `${parent.color}14`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      })}
                    >
                      <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={18} color={parent.color} />
                    </Pressable>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: theme.radius.md,
                        backgroundColor: `${parent.color}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={parent.icon as never} size={20} color={parent.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>
                        {parent.name}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {t(`categoryTypes.${parent.type}`)} · {parent.children.length} {t('category.subcategories')}
                      </Text>
                    </View>
                    <AppButton title="" icon="add-outline" variant="ghost" onPress={() => openAdd(parent.id)} />
                    <AppButton title="" icon="trash-outline" variant="ghost" onPress={() => setRemoveTarget(parent)} />
                  </Card>
                </Pressable>

                {isExpanded ? (
                  <View style={{ gap: 8, paddingLeft: 24 }}>
                    {parent.children.map((child) => (
                      <Pressable key={child.id} accessibilityRole="button" onPress={() => openEdit(child)}>
                        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: theme.radius.md,
                              backgroundColor: `${child.color}20`,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name={child.icon as never} size={18} color={child.color} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>
                              {child.name}
                            </Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{parent.name}</Text>
                          </View>
                          <AppButton title="" icon="trash-outline" variant="ghost" onPress={() => setRemoveTarget(child)} />
                        </Card>
                      </Pressable>
                    ))}
                    <AppButton
                      title={t('category.addSubcategory')}
                      icon="add-circle-outline"
                      variant="secondary"
                      onPress={() => openAdd(parent.id)}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <BottomSheet
        visible={formVisible}
        title={editing ? t('manage.editCategory') : parentId === 'none' ? t('category.addParentCategory') : t('category.addSubcategory')}
        onClose={closeForm}
      >
        <TextField label={t('manage.categoryName')} value={name} onChangeText={setName} />
        <SelectField
          label={t('category.parentCategory')}
          value={parentId}
          onChange={(value) => {
            setParentId(value);
            const parent = parentOptions.find((category) => category.id === value);
            if (parent) setType(parent.type);
          }}
          options={[
            { label: t('category.noParent'), value: 'none', icon: 'pricetags-outline' },
            ...parentOptions.map((category) => ({
              label: category.name,
              value: category.id,
              icon: category.icon,
              color: category.color,
              detail: t(`categoryTypes.${category.type}`),
            })),
          ]}
          icon="pricetags-outline"
          searchable
        />
        <SelectField
          label={t('common.type')}
          value={type}
          onChange={(value) => {
            setType(value);
            setIcon(iconByType[value]);
          }}
          options={categoryTypes.map((item) => ({ label: t(`categoryTypes.${item}`), value: item, icon: iconByType[item] }))}
          icon="pricetag-outline"
        />
        <TextField label={t('manage.searchIcons')} value={iconSearch} onChangeText={setIconSearch} />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('common.icon')}</Text>
        <ChipGroup
          value={icon}
          onChange={setIcon}
          options={(filteredIcons.length > 0 ? filteredIcons : categoryIcons).slice(0, 24).map((item) => ({ label: ' ', value: item, icon: item, color }))}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' }}>{t('common.color')}</Text>
        <ChipGroup
          value={color}
          onChange={setColor}
          options={categoryColors.map((item) => ({ label: ' ', value: item, color: item }))}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('common.save')} icon="checkmark-outline" onPress={submit} style={{ flex: 1 }} />
          <AppButton title={t('common.cancel')} variant="secondary" onPress={closeForm} style={{ flex: 1 }} />
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(removeTarget)}
        title={t('manage.removeCategory')}
        body={t('manage.removeCategoryBody')}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (removeTarget) {
            const decision = await removeCategoryById(removeTarget.id);
            Alert.alert(t('common.remove'), decision.warning ?? t('manage.categoryRemoved'));
          }
          setRemoveTarget(null);
        }}
      />
    </Screen>
  );
}
