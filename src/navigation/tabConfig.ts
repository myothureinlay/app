import type { RootTabParamList } from './types';

export interface TabConfigItem {
  name: keyof RootTabParamList;
  titleKey: string;
  icon: string;
}

export const mainTabConfig: TabConfigItem[] = [
  { name: 'Dashboard', titleKey: 'nav.dashboard', icon: 'grid-outline' },
  { name: 'Records', titleKey: 'nav.records', icon: 'receipt-outline' },
  { name: 'Reports', titleKey: 'nav.reports', icon: 'bar-chart-outline' },
  { name: 'Investments', titleKey: 'nav.investments', icon: 'trending-up-outline' },
];

export function iconForTab(name: keyof RootTabParamList) {
  return mainTabConfig.find((item) => item.name === name)?.icon ?? 'ellipse-outline';
}
