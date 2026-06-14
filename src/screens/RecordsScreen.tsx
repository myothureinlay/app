import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { DatePickerField } from '../components/DatePickerField';
import { EmptyState } from '../components/EmptyState';
import { PickerField } from '../components/PickerField';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { TextField } from '../components/TextField';
import { TransactionItem } from '../components/TransactionItem';
import { getCurrencyBadge } from '../constants/currencies';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { reportColorByType, transactionTypeIcons, transactionTypes } from '../logic/ledger';
import type { CurrencyCode, TransactionType, TransactionWithMeta } from '../types';
import { formatDate } from '../utils/dates';

type SortMode = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

function groupByDate(records: TransactionWithMeta[]) {
  return records.reduce<Array<{ key: string; rows: TransactionWithMeta[] }>>((groups, record) => {
    const key = record.date.slice(0, 10);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.rows.push(record);
      return groups;
    }
    groups.push({ key, rows: [record] });
    return groups;
  }, []);
}

export function RecordsScreen() {
  const navigation = useNavigation<any>();
  const { theme, settings } = useAppPreferences();
  const { categories, currencies, wallets, transactions, getTransactions, removeTransaction, restoreDeletedTransaction } = useFinance();
  const { t, locale } = useI18n();
  const [records, setRecords] = useState<TransactionWithMeta[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [currency, setCurrency] = useState<CurrencyCode | 'all'>('all');
  const [walletId, setWalletId] = useState('all');
  const [parentCategoryId, setParentCategoryId] = useState('all');
  const [subcategoryId, setSubcategoryId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');

  const parentCategories = categories.filter((category) => !category.parentId && !category.removedAt);
  const subcategories = categories.filter((category) => {
    if (!category.parentId || category.removedAt) return false;
    return parentCategoryId === 'all' || category.parentId === parentCategoryId;
  });
  const currencyOptions = currencies.length > 0 ? currencies.filter((item) => item.isActive).map((item) => item.code) : ['USD'];

  useEffect(() => {
    let active = true;
    getTransactions({
      includeDeleted: true,
      search,
      type,
      currency,
      walletId,
      parentCategoryId,
      subcategoryId,
      from: from || undefined,
      to: to || undefined,
      sort,
    })
      .then((nextRecords) => {
        if (active) setRecords(nextRecords);
      })
      .catch(() => {
        if (active) setRecords([]);
      });

    return () => {
      active = false;
    };
  }, [currency, from, getTransactions, parentCategoryId, search, sort, subcategoryId, to, transactions, type, walletId]);

  const grouped = useMemo(() => groupByDate(records), [records]);
  const activeFilterCount = [search.trim(), type !== 'all', currency !== 'all', walletId !== 'all', parentCategoryId !== 'all', subcategoryId !== 'all', from, to].filter(Boolean).length;

  const confirmDelete = (record: TransactionWithMeta) => {
    Alert.alert(t('records.deleteTitle'), t('records.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: () => removeTransaction(record.id),
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('nav.records')}
        subtitle={t('records.subtitle')}
        action={
          <AppButton
            title={activeFilterCount > 0 ? `${t('reports.filters')} (${activeFilterCount})` : t('reports.filters')}
            icon="options-outline"
            variant="secondary"
            onPress={() => setFiltersVisible(true)}
          />
        }
      />

      <Card style={{ gap: 10, backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}30` }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: theme.radius.md,
              backgroundColor: `${theme.colors.primary}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>{records.length}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('records.matchingRecords')}</Text>
          </View>
          <AppButton title="" icon="add-outline" onPress={() => navigation.navigate('AddTransaction')} style={{ width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0 }} />
        </View>
      </Card>

      {grouped.length === 0 ? (
        <EmptyState
          title={t('records.noRecords')}
          body={t('records.noRecordsBody')}
          icon="receipt-outline"
          actionLabel={t('records.addRecord')}
          actionIcon="add-circle-outline"
          onAction={() => navigation.navigate('AddTransaction')}
        />
      ) : (
        grouped.map((group) => (
          <View key={group.key} style={{ gap: 8 }}>
            <SectionHeader title={formatDate(`${group.key}T00:00:00.000Z`, locale)} />
            <Card style={{ gap: 6 }}>
              {group.rows.map((record) => (
                <View key={record.id} style={{ gap: 6 }}>
                  <TransactionItem
                    transaction={record}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: record.id })}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 54 }}>
                    {record.deletedAt ? (
                      <>
                        <Text style={{ flex: 1, color: theme.colors.danger, fontSize: 12, fontWeight: '800' }}>
                          {t('records.deletedStatus')}
                        </Text>
                        <AppButton
                          title={t('records.restoreRecord')}
                          icon="refresh-outline"
                          variant="secondary"
                          onPress={() => restoreDeletedTransaction(record.id)}
                          style={{ minHeight: 34, paddingHorizontal: 10 }}
                        />
                      </>
                    ) : (
                      <>
                        <Text style={{ flex: 1, color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                          {record.note || record.subcategoryName || record.parentCategoryName || t(`types.${record.type}`)}
                        </Text>
                        <AppButton
                          title=""
                          icon="create-outline"
                          variant="ghost"
                          onPress={() => navigation.navigate('EditTransaction', { transactionId: record.id })}
                          style={{ minHeight: 34, width: 40 }}
                        />
                        <AppButton
                          title=""
                          icon="trash-outline"
                          variant="ghost"
                          onPress={() => confirmDelete(record)}
                          style={{ minHeight: 34, width: 40 }}
                        />
                      </>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ))
      )}

      <BottomSheet
        visible={filtersVisible}
        title={t('reports.filters')}
        onClose={() => setFiltersVisible(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppButton
              title={t('reports.resetFilters')}
              icon="refresh-outline"
              variant="secondary"
              onPress={() => {
                setSearch('');
                setType('all');
                setCurrency('all');
                setWalletId('all');
                setParentCategoryId('all');
                setSubcategoryId('all');
                setFrom('');
                setTo('');
                setSort('newest');
              }}
              style={{ flex: 1 }}
            />
            <AppButton title={t('dateRange.apply')} icon="checkmark-outline" onPress={() => setFiltersVisible(false)} style={{ flex: 1 }} />
          </View>
        }
      >
        <TextField label={t('records.search')} value={search} onChangeText={setSearch} placeholder={t('records.searchPlaceholder')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <DatePickerField label={t('dateRange.startDate')} value={from} onChangeText={setFrom} />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerField label={t('dateRange.endDate')} value={to} onChangeText={setTo} />
          </View>
        </View>
        <PickerField
          label={t('records.sort')}
          value={sort}
          onChange={setSort}
          options={[
            { label: t('records.newest'), value: 'newest', icon: 'arrow-down-outline' },
            { label: t('records.oldest'), value: 'oldest', icon: 'arrow-up-outline' },
            { label: t('records.amountHighLow'), value: 'amount_desc', icon: 'trending-down-outline' },
            { label: t('records.amountLowHigh'), value: 'amount_asc', icon: 'trending-up-outline' },
          ]}
          icon="swap-vertical-outline"
        />
        <PickerField
          label={t('transaction.type')}
          value={type}
          onChange={setType}
          options={[
            { label: t('common.all'), value: 'all', icon: 'layers-outline' },
            ...transactionTypes.map((item) => ({
              label: t(`types.${item}`),
              value: item,
              icon: transactionTypeIcons[item],
              color: reportColorByType[item],
            })),
          ]}
          icon="swap-horizontal-outline"
          searchable
        />
        <PickerField
          label={t('common.currency')}
          value={currency}
          onChange={setCurrency}
          options={[{ label: t('common.all'), value: 'all', icon: 'layers-outline' }, ...currencyOptions.map((item) => ({ label: item, value: item, icon: 'cash-outline', badge: getCurrencyBadge(item) }))]}
          icon="cash-outline"
          searchable
        />
        <PickerField
          label={t('common.wallet')}
          value={walletId}
          onChange={setWalletId}
          options={[
            { label: t('common.all'), value: 'all', icon: 'wallet-outline' },
            ...wallets.map((wallet) => ({
              label: wallet.name,
              value: wallet.id,
              icon: wallet.icon,
              color: wallet.color,
            })),
          ]}
          icon="wallet-outline"
          searchable
        />
        <PickerField
          label={t('category.parentCategory')}
          value={parentCategoryId}
          onChange={(value) => {
            setParentCategoryId(value);
            setSubcategoryId('all');
          }}
          options={[
            { label: t('common.all'), value: 'all', icon: 'pricetags-outline' },
            ...parentCategories.map((category) => ({ label: category.name, value: category.id, icon: category.icon, color: category.color })),
          ]}
          icon="pricetags-outline"
          searchable
        />
        <PickerField
          label={t('category.subcategory')}
          value={subcategoryId}
          onChange={setSubcategoryId}
          options={[
            { label: t('common.all'), value: 'all', icon: 'layers-outline' },
            { label: t('category.noSubcategory'), value: 'none', icon: 'remove-circle-outline' },
            ...subcategories.map((category) => ({
              label: category.name,
              value: category.id,
              icon: category.icon,
              color: category.color,
              detail: categories.find((parent) => parent.id === category.parentId)?.name,
            })),
          ]}
          icon="pricetag-outline"
          searchable
        />
      </BottomSheet>

    </Screen>
  );
}
