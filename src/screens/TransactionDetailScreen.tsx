import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { reportColorByType, transactionTypeIcons } from '../logic/ledger';
import type { RootStackParamList } from '../navigation/types';
import type { TransactionWithMeta } from '../types';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';

export function TransactionDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetail'>>();
  const navigation = useNavigation<any>();
  const { theme } = useAppPreferences();
  const { getTransaction, removeTransaction, restoreDeletedTransaction } = useFinance();
  const { t, locale } = useI18n();
  const [transaction, setTransaction] = useState<TransactionWithMeta | null | undefined>(undefined);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'restore' | null>(null);

  const load = async () => {
    const next = await getTransaction(route.params.transactionId, true);
    setTransaction(next);
  };

  useEffect(() => {
    load().catch(() => setTransaction(null));
  }, [route.params.transactionId]);

  if (transaction === undefined) {
    return (
      <Screen scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  if (!transaction) {
    return (
      <Screen>
        <EmptyState title={t('empty.title')} body={t('empty.transactions')} />
      </Screen>
    );
  }

  const accent = reportColorByType[transaction.type] ?? theme.colors.primary;

  return (
    <Screen>
      <ScreenHeader
        title={t('transaction.detail')}
        subtitle={transaction.deletedAt ? t('transaction.deletedRecord') : t(`types.${transaction.type}`)}
      />

      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: theme.radius.md,
              backgroundColor: `${accent}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={(transaction.categoryIcon ?? transactionTypeIcons[transaction.type]) as never} size={26} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>
              {transaction.categoryName ?? t(`types.${transaction.type}`)}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              {formatDate(transaction.date, locale)} · {transaction.walletName}
            </Text>
          </View>
        </View>
        <Text style={{ color: accent, fontSize: 28, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(transaction.amount, transaction.currency)}
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <DetailRow label={t('common.type')} value={t(`types.${transaction.type}`)} />
        <DetailRow label={t('common.wallet')} value={transaction.walletName} />
        {transaction.toWalletName ? <DetailRow label={t('transaction.toWallet')} value={transaction.toWalletName} /> : null}
        {transaction.toAmount ? <DetailRow label={t('transaction.receivedAmount')} value={formatMoney(transaction.toAmount, transaction.toCurrency ?? transaction.currency)} /> : null}
        <DetailRow label={t('transaction.baseAmount')} value={formatMoney(transaction.baseAmount, transaction.baseCurrency)} />
        {transaction.feeAmount ? <DetailRow label={t('transaction.feeAmount')} value={formatMoney(transaction.feeAmount, transaction.feeCurrency ?? transaction.currency)} /> : null}
        {transaction.counterparty ? <DetailRow label={t('transaction.counterparty')} value={transaction.counterparty} /> : null}
        {transaction.note ? <DetailRow label={t('common.note')} value={transaction.note} /> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <AppButton
          title={t('common.edit')}
          icon="create-outline"
          variant="secondary"
          disabled={Boolean(transaction.deletedAt)}
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('EditTransaction' as never, { transactionId: transaction.id } as never)}
        />
        {transaction.deletedAt ? (
          <AppButton
            title={t('common.restore')}
            icon="refresh-circle-outline"
            style={{ flex: 1 }}
            onPress={() => setConfirmMode('restore')}
          />
        ) : (
          <AppButton
            title={t('common.delete')}
            icon="trash-outline"
            variant="danger"
            style={{ flex: 1 }}
            onPress={() => setConfirmMode('delete')}
          />
        )}
      </View>

      <ConfirmDialog
        visible={confirmMode === 'delete'}
        title={t('transaction.deleteConfirmTitle')}
        body={t('transaction.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmMode(null)}
        onConfirm={async () => {
          setConfirmMode(null);
          await removeTransaction(transaction.id);
          await load();
        }}
      />
      <ConfirmDialog
        visible={confirmMode === 'restore'}
        title={t('transaction.restoreConfirmTitle')}
        body={t('transaction.restoreConfirmBody')}
        confirmLabel={t('common.restore')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmMode(null)}
        onConfirm={async () => {
          setConfirmMode(null);
          await restoreDeletedTransaction(transaction.id);
          await load();
        }}
      />
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Text style={{ width: 116, color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>{label}</Text>
      <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
