export type CurrencyCode = 'USDT' | 'USD' | 'MMK' | 'THB';
export type BaseCurrency = 'USD' | 'MMK' | 'THB';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguageCode = 'en' | 'my' | 'th';
export type CurrencyFilter = 'all' | CurrencyCode;

export interface AppSettings {
  theme: ThemePreference;
  language: LanguageCode;
  baseCurrency: BaseCurrency;
  dashboardCurrencyFilter: CurrencyFilter;
}

export interface Wallet {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  color: string;
  icon: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  toWalletId?: string | null;
  toAmount?: number | null;
  toCurrency?: CurrencyCode | null;
  categoryId?: string | null;
  date: string;
  note?: string | null;
  exchangeRate: number;
  baseCurrency: BaseCurrency;
  baseAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithMeta extends Transaction {
  walletName: string;
  walletColor: string;
  toWalletName?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  walletId: string;
  toWalletId?: string | null;
  toAmount?: number | null;
  toCurrency?: CurrencyCode | null;
  categoryId?: string | null;
  date: string;
  note?: string;
  exchangeRate: number;
  baseCurrency: BaseCurrency;
  baseAmount: number;
}

export interface SummaryTotals {
  income: number;
  expenses: number;
  balance: number;
  currencyLabel: string;
  hasMixedBaseCurrency: boolean;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
}
