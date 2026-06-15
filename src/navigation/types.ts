export type RootStackParamList = {
  MainTabs:
    | {
        screen?: keyof RootTabParamList;
        params?: RootTabParamList[keyof RootTabParamList];
      }
    | undefined;
  AddTransaction: { initialType?: import('../types').TransactionType } | undefined;
  Settings: undefined;
  ManageWallets: undefined;
  ManageCategories: undefined;
  TransactionDetail: { transactionId: string };
  EditTransaction: { transactionId: string };
  EditProfile: undefined;
  ThemePicker: undefined;
  LanguagePicker: undefined;
  ManageCurrencies: undefined;
  Budgets: undefined;
  Goals: undefined;
  GoogleBackup: undefined;
  Notifications: undefined;
  UserManual: undefined;
  About: undefined;
};

export type RootTabParamList = {
  Dashboard: undefined;
  Records: undefined;
  Reports: undefined;
  Investments: { openAddNonce?: number } | undefined;
};
