import { Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TransactionForm } from '../components/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import type { RootStackParamList } from '../navigation/types';

export function AddTransactionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const { addTransaction } = useFinance();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('transaction.title')} subtitle={t('dashboard.subtitle')} />
      <TransactionForm
        initialType={route.params?.initialType}
        submitLabel={t('common.save')}
        onSubmit={async (input) => {
          await addTransaction(input);
          Alert.alert(t('transaction.saved'));
        }}
      />
    </Screen>
  );
}
