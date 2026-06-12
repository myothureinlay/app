import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { AboutScreen } from '../screens/AboutScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { GoogleBackupScreen } from '../screens/GoogleBackupScreen';
import { LanguagePickerScreen } from '../screens/LanguagePickerScreen';
import { ManageCategoriesScreen } from '../screens/ManageCategoriesScreen';
import { ManageCurrenciesScreen } from '../screens/ManageCurrenciesScreen';
import { ManageWalletsScreen } from '../screens/ManageWalletsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ThemePickerScreen } from '../screens/ThemePickerScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { UserManualScreen } from '../screens/UserManualScreen';
import { iconForStyle } from '../utils/icons';
import type { RootStackParamList, RootTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MainTabs() {
  const { theme, settings } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: theme.radius.md + 8,
          borderTopWidth: 0,
          borderWidth: 1,
          elevation: theme.elevation.card,
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Dashboard'
              ? 'grid-outline'
              : route.name === 'Add'
                ? 'add-circle-outline'
                : route.name === 'Reports'
                  ? 'bar-chart-outline'
                  : 'settings-outline';
          return <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('nav.dashboard') }} />
      <Tab.Screen name="Add" component={AddTransactionScreen} options={{ title: t('nav.add') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: t('nav.reports') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useAppPreferences();
  const { t } = useI18n();

  const navigationTheme: NavigationTheme = {
    dark: theme.scheme === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '900' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ManageWallets" component={ManageWalletsScreen} options={{ title: t('nav.wallets') }} />
        <Stack.Screen
          name="ManageCategories"
          component={ManageCategoriesScreen}
          options={{ title: t('nav.categories') }}
        />
        <Stack.Screen
          name="TransactionDetail"
          component={TransactionDetailScreen}
          options={{ title: t('nav.transactionDetail') }}
        />
        <Stack.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
          options={{ title: t('nav.editTransaction') }}
        />
        <Stack.Screen name="ThemePicker" component={ThemePickerScreen} options={{ title: t('nav.themes') }} />
        <Stack.Screen name="LanguagePicker" component={LanguagePickerScreen} options={{ title: t('nav.languages') }} />
        <Stack.Screen name="ManageCurrencies" component={ManageCurrenciesScreen} options={{ title: t('nav.currencies') }} />
        <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ title: t('nav.budgets') }} />
        <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: t('nav.goals') }} />
        <Stack.Screen name="GoogleBackup" component={GoogleBackupScreen} options={{ title: t('nav.googleBackup') }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('nav.notifications') }} />
        <Stack.Screen name="UserManual" component={UserManualScreen} options={{ title: t('nav.userManual') }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: t('nav.about') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
