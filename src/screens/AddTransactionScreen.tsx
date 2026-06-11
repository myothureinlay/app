import { Alert } from 'react-native';

import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { TransactionForm } from '../components/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';

export function AddTransactionScreen() {
  const { addTransaction } = useFinance();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('transaction.title')} subtitle={t('dashboard.subtitle')} />
      <TransactionForm
        submitLabel={t('common.save')}
        onSubmit={async (input) => {
          await addTransaction(input);
          Alert.alert(t('transaction.saved'));
        }}
      />
    </Screen>
  );
}
