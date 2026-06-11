import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TransactionForm } from '../components/TransactionForm';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { RootStackParamList } from '../navigation/types';
import type { TransactionWithMeta } from '../types';

export function EditTransactionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditTransaction'>>();
  const navigation = useNavigation();
  const { theme } = useAppPreferences();
  const { getTransaction, editTransaction } = useFinance();
  const { t } = useI18n();
  const [transaction, setTransaction] = useState<TransactionWithMeta | null | undefined>(undefined);

  useEffect(() => {
    getTransaction(route.params.transactionId, true).then(setTransaction).catch(() => setTransaction(null));
  }, [route.params.transactionId, getTransaction]);

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

  return (
    <Screen>
      <ScreenHeader title={t('transaction.editTitle')} />
      <TransactionForm
        initialTransaction={transaction}
        submitLabel={t('common.save')}
        onSubmit={async (input) => {
          await editTransaction({ ...input, id: transaction.id });
          Alert.alert(t('transaction.updated'));
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
