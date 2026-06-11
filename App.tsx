import { StatusBar } from 'expo-status-bar';

import { AppPreferencesProvider, useAppPreferences } from './src/context/AppPreferencesContext';
import { FinanceProvider } from './src/context/FinanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function Root() {
  const { resolvedScheme } = useAppPreferences();

  return (
    <FinanceProvider>
      <AppNavigator />
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AppPreferencesProvider>
      <Root />
    </AppPreferencesProvider>
  );
}
