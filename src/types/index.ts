export type CurrencyCode = 'USDT' | 'USD' | 'MMK' | 'THB';
export type BaseCurrency = 'USD' | 'MMK' | 'THB';
export type TransactionType =
  | 'income'
  | 'expense'
  | 'exchange'
  | 'adjustment'
  | 'loan_given'
  | 'loan_received'
  | 'loan_repayment_paid'
  | 'loan_repayment_received'
  | 'interest_income'
  | 'interest_expense'
  | 'fee'
  | 'loss'
  | 'compensation_received'
  | 'compensation_paid'
  | 'refund'
  | 'tax'
  | 'investment'
  | 'transfer';
export type ThemePreset =
  | 'light'
  | 'dark'
  | 'ocean'
  | 'emerald'
  | 'royalPurple'
  | 'sunset'
  | 'goldBlack'
  | 'minimalGray'
  | 'myanmarJade';
export type ThemePreference = ThemePreset | 'system';
export type LanguageCode = 'en' | 'my' | 'th' | 'zh-Hans';
export type CurrencyFilter = 'all' | CurrencyCode;
export type IconStyle = 'line';

export interface AppSettings {
  theme: ThemePreference;
  language: LanguageCode;
  baseCurrency: BaseCurrency;
  dashboardCurrencyFilter: CurrencyFilter;
  iconStyle: IconStyle;
  accentColor?: string;
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

export type CategoryType = 'income' | 'expense' | 'loan' | 'debt' | 'transfer' | 'adjustment' | 'other';

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
  counterparty?: string | null;
  relatedTransactionId?: string | null;
  feeAmount: number;
  feeCurrency?: CurrencyCode | null;
  metadata?: string | null;
  deletedAt?: string | null;
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
  counterparty?: string | null;
  relatedTransactionId?: string | null;
  feeAmount?: number;
  feeCurrency?: CurrencyCode | null;
  metadata?: string | null;
}

export interface UpdateTransactionInput extends CreateTransactionInput {
  id: string;
}

export interface SummaryTotals {
  income: number;
  expenses: number;
  compensation: number;
  losses: number;
  loans: number;
  balance: number;
  currencyLabel: string;
  hasMixedBaseCurrency: boolean;
}

export interface BackupPayload {
  version: 1 | 2;
  exportedAt: string;
  settings: AppSettings;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  exchangeRates?: Record<string, Record<string, number>>;
  reportMetadata?: Record<string, unknown>;
}
