import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ManageCategoriesScreen } from '../screens/ManageCategoriesScreen';
import { ManageWalletsScreen } from '../screens/ManageWalletsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { RootStackParamList, RootTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MainTabs() {
  const { theme } = useAppPreferences();
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
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Dashboard'
              ? 'grid'
              : route.name === 'Add'
                ? 'add-circle'
                : route.name === 'Reports'
                  ? 'bar-chart'
                  : 'settings';
          return <Ionicons name={icon as never} size={size} color={color} />;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
