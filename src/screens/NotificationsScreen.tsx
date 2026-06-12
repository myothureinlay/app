import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { formatMoney } from '../utils/money';

type NotificationSection = 'today' | 'yesterday' | 'earlier';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  icon: string;
  color: string;
  section: NotificationSection;
}

function relativeSection(dateIso?: string | null): NotificationSection {
  if (!dateIso) return 'earlier';
  const now = new Date();
  const date = new Date(dateIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((today - day) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  return 'earlier';
}

function formatTimestamp(dateIso: string | null | undefined, locale: string) {
  if (!dateIso) return '';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateIso));
}

export function NotificationsScreen() {
  const { theme, settings } = useAppPreferences();
  const { wallets, budgets, goals, backupMetadata, transactions } = useFinance();
  const { t, locale } = useI18n();
  const latestBackup = backupMetadata.find((item) => item.provider === 'local') ?? backupMetadata[0];
  const latestTransaction = transactions.find((transaction) => !transaction.deletedAt);

  const items: NotificationItem[] = [
    ...budgets
      .filter((budget) => budget.isOverBudget || budget.progress >= budget.alertThreshold)
      .slice(0, 3)
      .map((budget) => ({
        id: `budget-${budget.id}`,
        title: budget.isOverBudget ? t('notifications.budgetOverTitle') : t('notifications.budgetNearTitle'),
        message: `${budget.name} - ${Math.round(budget.progress)}% ${t('notifications.used')}`,
        timestamp: budget.updatedAt,
        icon: 'speedometer-outline',
        color: budget.isOverBudget ? theme.colors.danger : theme.colors.warning,
        section: relativeSection(budget.updatedAt),
      })),
    ...goals
      .filter((goal) => goal.status === 'active' && goal.progress < 100)
      .slice(0, 2)
      .map((goal) => ({
        id: `goal-${goal.id}`,
        title: t('notifications.goalReminderTitle'),
        message: `${goal.name} - ${Math.round(goal.progress)}% ${t('goal.contribution')}`,
        timestamp: goal.updatedAt,
        icon: 'flag-outline',
        color: goal.color || theme.colors.accent,
        section: relativeSection(goal.updatedAt),
      })),
    ...wallets
      .filter((wallet) => !wallet.isArchived && wallet.balance <= 0)
      .slice(0, 2)
      .map((wallet) => ({
        id: `wallet-${wallet.id}`,
        title: t('notifications.lowBalanceTitle'),
        message: `${wallet.name} - ${formatMoney(wallet.balance, wallet.currency)}`,
        timestamp: wallet.updatedAt,
        icon: 'wallet-outline',
        color: theme.colors.danger,
        section: relativeSection(wallet.updatedAt),
      })),
    latestBackup
      ? {
          id: `backup-${latestBackup.id}`,
          title: latestBackup.status === 'ready' ? t('notifications.backupReadyTitle') : t('notifications.backupSetupTitle'),
          message:
            latestBackup.status === 'ready'
              ? `${t('notifications.lastBackup')} ${formatTimestamp(latestBackup.lastBackupAt, locale)}`
              : t('notifications.backupSetupBody'),
          timestamp: latestBackup.lastBackupAt ?? new Date().toISOString(),
          icon: 'cloud-upload-outline',
          color: latestBackup.status === 'ready' ? theme.colors.success : theme.colors.warning,
          section: relativeSection(latestBackup.lastBackupAt ?? new Date().toISOString()),
        }
      : {
          id: 'backup-reminder',
          title: t('notifications.backupSetupTitle'),
          message: t('notifications.backupLocalBody'),
          timestamp: new Date().toISOString(),
          icon: 'archive-outline',
          color: theme.colors.primary,
          section: 'today' as NotificationSection,
        },
    latestTransaction
      ? {
          id: `transaction-${latestTransaction.id}`,
          title: t('notifications.recentTransactionTitle'),
          message: `${latestTransaction.categoryName ?? t(`types.${latestTransaction.type}`)} - ${formatMoney(latestTransaction.amount, latestTransaction.currency)}`,
          timestamp: latestTransaction.date,
          icon: latestTransaction.categoryIcon ?? 'receipt-outline',
          color: latestTransaction.categoryColor ?? theme.colors.primary,
          section: relativeSection(latestTransaction.date),
        }
      : {
          id: 'transaction-reminder',
          title: t('notifications.transactionReminderTitle'),
          message: t('notifications.transactionReminderBody'),
          timestamp: new Date().toISOString(),
          icon: 'receipt-outline',
          color: theme.colors.secondary,
          section: 'today' as NotificationSection,
        },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const sections: Array<{ key: NotificationSection; title: string }> = [
    { key: 'today', title: t('notifications.today') },
    { key: 'yesterday', title: t('notifications.yesterday') },
    { key: 'earlier', title: t('notifications.earlier') },
  ];

  return (
    <Screen>
      <ScreenHeader title={t('notifications.title')} subtitle={t('notifications.subtitle')} />
      {items.length === 0 ? (
        <EmptyState title={t('empty.title')} body={t('notifications.empty')} icon="notifications-outline" />
      ) : (
        sections.map((section) => {
          const rows = items.filter((item) => item.section === section.key);
          if (rows.length === 0) return null;

          return (
            <View key={section.key} style={{ gap: 10 }}>
              <SectionHeader title={section.title} />
              <Card style={{ gap: 0, paddingVertical: 4 }}>
                {rows.map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      paddingVertical: 12,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: theme.colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: `${item.color}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon as never} size={19} color={item.color} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{item.title}</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 }}>{item.message}</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>
                        {formatTimestamp(item.timestamp, locale)}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          );
        })
      )}
    </Screen>
  );
}
