export type CurrencyCode = string;
export type BaseCurrency = string;
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
export type ThemePreference = ThemePreset | 'system' | 'custom';
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
  showRemovedWallets?: boolean;
  googleAutoBackup?: 'off' | 'daily' | 'weekly' | 'monthly';
  customTheme?: CustomThemeSettings;
}

export interface CustomThemeSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  borderRadius: number;
  cardStyle: 'flat' | 'soft' | 'elevated';
}

export interface Wallet {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  color: string;
  icon: string;
  sortOrder: number;
  isDefault: boolean;
  isArchived: boolean;
  removedAt?: string | null;
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
  removedAt?: string | null;
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
  version: 1 | 2 | 3;
  exportedAt: string;
  settings: AppSettings;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currencies?: CurrencyDefinition[];
  budgets?: Budget[];
  goals?: Goal[];
  goalContributions?: GoalContribution[];
  backupMetadata?: BackupMetadata[];
  exchangeRates?: Record<string, Record<string, number>>;
  reportMetadata?: Record<string, unknown>;
}

export type CurrencyKind = 'fiat' | 'crypto' | 'custom';

export interface CurrencyDefinition {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  type: CurrencyKind;
  isActive: boolean;
  isFavorite: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Budget {
  id: string;
  name: string;
  categoryId?: string | null;
  currency: CurrencyCode;
  amountLimit: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  alertThreshold: number;
  isRemoved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithUsage extends Budget {
  categoryName?: string | null;
  categoryColor?: string | null;
  usedAmount: number;
  remainingAmount: number;
  progress: number;
  isOverBudget: boolean;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'removed';
export type GoalType = 'target_amount' | 'monthly_saving' | 'emergency_fund' | 'debt_payoff' | 'custom';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currency: CurrencyCode;
  currentAmount: number;
  monthlyTargetAmount?: number | null;
  deadline?: string | null;
  linkedWalletId?: string | null;
  notes?: string | null;
  icon: string;
  color: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  note?: string | null;
  transactionId?: string | null;
  createdAt: string;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  remainingAmount: number;
  suggestedMonthlySaving: number;
}

export interface BackupMetadata {
  id: string;
  provider: 'local' | 'google';
  mode: 'replace' | 'append';
  lastBackupAt?: string | null;
  autoBackup: 'off' | 'daily' | 'weekly' | 'monthly';
  status: 'ready' | 'needs_setup' | 'failed';
  details?: string | null;
}
