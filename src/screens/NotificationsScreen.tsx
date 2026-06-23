import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useFinance } from '../context/FinanceContext';
import { useI18n } from '../i18n/useI18n';
import { iconForStyle } from '../utils/icons';
import { formatMoney } from '../utils/money';

type NotificationSection = 'today' | 'yesterday' | 'earlier';
type NotificationTarget =
  | 'Dashboard'
  | 'Reports'
  | 'Settings'
  | 'AddTransaction'
  | 'Budgets'
  | 'Goals'
  | 'GoogleBackup'
  | 'ManageWallets'
  | 'TransactionDetail';

interface NotificationItem {
  id: string;
  titleKey: string;
  messageKey: string;
  title: string;
  message: string;
  type: 'budget' | 'goal' | 'backup' | 'transaction' | 'wallet' | 'report' | 'settings';
  createdAt: string;
  read: boolean;
  targetScreen: NotificationTarget;
  targetId?: string;
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
  const navigation = useNavigation<any>();
  const { theme, settings, updateSettings } = useAppPreferences();
  const { wallets, budgets, goals, backupMetadata, transactions } = useFinance();
  const { t, locale } = useI18n();
  const latestBackup = backupMetadata.find((item) => item.provider === 'local') ?? backupMetadata[0];
  const latestTransaction = transactions.find((transaction) => !transaction.deletedAt);
  const readIds = new Set(settings.notifications?.readIds ?? []);
  const hiddenIds = new Set(settings.notifications?.hiddenIds ?? []);

  const rawItems: Omit<NotificationItem, 'read'>[] = [
    ...budgets
      .filter((budget) => budget.isOverBudget || budget.progress >= budget.alertThreshold)
      .slice(0, 3)
      .map((budget) => ({
        id: `budget-${budget.id}`,
        titleKey: budget.isOverBudget ? 'notifications.budgetOverTitle' : 'notifications.budgetNearTitle',
        messageKey: 'notifications.used',
        title: budget.isOverBudget ? t('notifications.budgetOverTitle') : t('notifications.budgetNearTitle'),
        message: `${budget.name} - ${Math.round(budget.progress)}% ${t('notifications.used')}`,
        type: 'budget' as const,
        createdAt: budget.updatedAt,
        targetScreen: 'Budgets' as const,
        targetId: budget.id,
        icon: 'speedometer-outline',
        color: budget.isOverBudget ? theme.colors.danger : theme.colors.warning,
        section: relativeSection(budget.updatedAt),
      })),
    ...goals
      .filter((goal) => goal.status === 'active' && goal.progress < 100)
      .slice(0, 2)
      .map((goal) => ({
        id: `goal-${goal.id}`,
        titleKey: 'notifications.goalReminderTitle',
        messageKey: 'goal.contribution',
        title: t('notifications.goalReminderTitle'),
        message: `${goal.name} - ${Math.round(goal.progress)}% ${t('goal.contribution')}`,
        type: 'goal' as const,
        createdAt: goal.updatedAt,
        targetScreen: 'Goals' as const,
        targetId: goal.id,
        icon: 'flag-outline',
        color: goal.color || theme.colors.accent,
        section: relativeSection(goal.updatedAt),
      })),
    ...wallets
      .filter((wallet) => !wallet.isArchived && wallet.balance <= 0)
      .slice(0, 2)
      .map((wallet) => ({
        id: `wallet-${wallet.id}`,
        titleKey: 'notifications.lowBalanceTitle',
        messageKey: 'common.wallet',
        title: t('notifications.lowBalanceTitle'),
        message: `${wallet.name} - ${formatMoney(wallet.balance, wallet.currency)}`,
        type: 'wallet' as const,
        createdAt: wallet.updatedAt,
        targetScreen: 'ManageWallets' as const,
        targetId: wallet.id,
        icon: 'wallet-outline',
        color: theme.colors.danger,
        section: relativeSection(wallet.updatedAt),
      })),
    latestBackup
      ? {
          id: `backup-${latestBackup.id}`,
          titleKey: latestBackup.status === 'ready' ? 'notifications.backupReadyTitle' : 'notifications.backupSetupTitle',
          messageKey: latestBackup.status === 'ready' ? 'notifications.lastBackup' : 'notifications.backupSetupBody',
          title: latestBackup.status === 'ready' ? t('notifications.backupReadyTitle') : t('notifications.backupSetupTitle'),
          message:
            latestBackup.status === 'ready'
              ? `${t('notifications.lastBackup')} ${formatTimestamp(latestBackup.lastBackupAt, locale)}`
              : t('notifications.backupSetupBody'),
          type: 'backup' as const,
          createdAt: latestBackup.lastBackupAt ?? new Date().toISOString(),
          targetScreen: 'GoogleBackup' as const,
          targetId: latestBackup.id,
          icon: 'cloud-upload-outline',
          color: latestBackup.status === 'ready' ? theme.colors.success : theme.colors.warning,
          section: relativeSection(latestBackup.lastBackupAt ?? new Date().toISOString()),
        }
      : {
          id: 'backup-reminder',
          titleKey: 'notifications.backupSetupTitle',
          messageKey: 'notifications.backupLocalBody',
          title: t('notifications.backupSetupTitle'),
          message: t('notifications.backupLocalBody'),
          type: 'backup' as const,
          createdAt: new Date().toISOString(),
          targetScreen: 'Settings' as const,
          icon: 'archive-outline',
          color: theme.colors.primary,
          section: 'today' as NotificationSection,
        },
    latestTransaction
      ? {
          id: `transaction-${latestTransaction.id}`,
          titleKey: 'notifications.recentTransactionTitle',
          messageKey: `types.${latestTransaction.type}`,
          title: t('notifications.recentTransactionTitle'),
          message: `${latestTransaction.categoryName ?? t(`types.${latestTransaction.type}`)} - ${formatMoney(latestTransaction.amount, latestTransaction.currency)}`,
          type: 'transaction' as const,
          createdAt: latestTransaction.date,
          targetScreen: 'TransactionDetail' as const,
          targetId: latestTransaction.id,
          icon: latestTransaction.categoryIcon ?? 'receipt-outline',
          color: latestTransaction.categoryColor ?? theme.colors.primary,
          section: relativeSection(latestTransaction.date),
        }
      : {
          id: 'transaction-reminder',
          titleKey: 'notifications.transactionReminderTitle',
          messageKey: 'notifications.transactionReminderBody',
          title: t('notifications.transactionReminderTitle'),
          message: t('notifications.transactionReminderBody'),
          type: 'transaction' as const,
          createdAt: new Date().toISOString(),
          targetScreen: 'AddTransaction' as const,
          icon: 'receipt-outline',
          color: theme.colors.secondary,
          section: 'today' as NotificationSection,
        },
    {
      id: 'report-reminder',
      titleKey: 'notifications.reportReminderTitle',
      messageKey: 'notifications.reportReminderBody',
      title: t('notifications.reportReminderTitle'),
      message: t('notifications.reportReminderBody'),
      type: 'report' as const,
      createdAt: new Date().toISOString(),
      targetScreen: 'Reports' as const,
      icon: 'bar-chart-outline',
      color: theme.colors.accent,
      section: 'today' as NotificationSection,
    },
  ];

  const items: NotificationItem[] = rawItems
    .filter((item) => !hiddenIds.has(item.id))
    .map((item) => ({ ...item, read: readIds.has(item.id) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sections: Array<{ key: NotificationSection; title: string }> = [
    { key: 'today', title: t('notifications.today') },
    { key: 'yesterday', title: t('notifications.yesterday') },
    { key: 'earlier', title: t('notifications.earlier') },
  ];

  const persist = (nextReadIds: Set<string>, nextHiddenIds: Set<string>) =>
    updateSettings({
      notifications: {
        readIds: Array.from(nextReadIds),
        hiddenIds: Array.from(nextHiddenIds),
      },
    });

  const markRead = async (id: string) => {
    if (readIds.has(id)) return;
    const nextReadIds = new Set(readIds);
    nextReadIds.add(id);
    await persist(nextReadIds, hiddenIds);
  };

  const clearOne = (id: string) => {
    const nextHiddenIds = new Set(hiddenIds);
    nextHiddenIds.add(id);
    persist(readIds, nextHiddenIds);
  };

  const clearAll = () => {
    const nextHiddenIds = new Set(hiddenIds);
    rawItems.forEach((item) => nextHiddenIds.add(item.id));
    persist(readIds, nextHiddenIds);
  };

  const openTarget = async (item: NotificationItem) => {
    await markRead(item.id);
    if (item.targetScreen === 'TransactionDetail' && item.targetId) {
      navigation.navigate('TransactionDetail', { transactionId: item.targetId });
      return;
    }
    if (['Dashboard', 'Reports'].includes(item.targetScreen)) {
      navigation.navigate('MainTabs', { screen: item.targetScreen });
      return;
    }
    navigation.navigate(item.targetScreen ?? 'Settings');
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        action={
          items.length > 0 ? (
            <AppButton title={t('notifications.clearAll')} icon="trash-outline" variant="secondary" onPress={clearAll} style={{ minHeight: 40 }} />
          ) : undefined
        }
      />
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
                      gap: 10,
                      paddingVertical: 10,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: theme.colors.border,
                      opacity: item.read ? 0.68 : 1,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openTarget(item)}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: 'row',
                        gap: 12,
                        borderRadius: 12,
                        backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent',
                      })}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: `${item.color}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={iconForStyle(item.icon, settings.iconStyle) as never} size={18} color={item.color} />
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {!item.read ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.primary }} /> : null}
                          <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{item.title}</Text>
                        </View>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 }}>{item.message}</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>
                          {formatTimestamp(item.createdAt, locale)}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('notifications.clearOne')}
                      onPress={() => clearOne(item.id)}
                      style={({ pressed }) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent',
                      })}
                    >
                      <Ionicons name={iconForStyle('close-circle-outline', settings.iconStyle) as never} size={18} color={theme.colors.textMuted} />
                    </Pressable>
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
