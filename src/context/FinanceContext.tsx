import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  addGoalContribution,
  buildTransactionsCsv,
  buildReportsCsv,
  clearFinanceData,
  createBudget,
  createCategory,
  createCurrency,
  createGoal,
  createTransaction,
  createWallet,
  deleteTransaction,
  exportBackupPayload,
  fetchBackupMetadata,
  fetchBudgets,
  fetchCategories,
  fetchCurrencies,
  fetchGoals,
  fetchTransactionById,
  fetchTransactions,
  fetchWallets,
  importBackupPayload,
  removeBudget,
  removeCategory,
  removeCurrency,
  removeGoal,
  removeWallet,
  restoreTransaction,
  type TransactionFilters,
  updateBudget,
  updateCategory,
  updateCurrency,
  updateGoal,
  updateTransaction,
} from '../database/repository';
import type {
  AppSettings,
  BackupPayload,
  BackupMetadata,
  Budget,
  BudgetWithUsage,
  Category,
  CreateTransactionInput,
  CurrencyDefinition,
  Goal,
  GoalContribution,
  GoalWithProgress,
  UpdateTransactionInput,
  TransactionWithMeta,
  Wallet,
} from '../types';
import type { RemoveDecision } from '../logic/removal';

interface FinanceContextValue {
  isReady: boolean;
  wallets: Wallet[];
  categories: Category[];
  currencies: CurrencyDefinition[];
  budgets: BudgetWithUsage[];
  goals: GoalWithProgress[];
  backupMetadata: BackupMetadata[];
  transactions: TransactionWithMeta[];
  refresh: () => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  editTransaction: (input: UpdateTransactionInput) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  restoreDeletedTransaction: (id: string) => Promise<void>;
  addWallet: (input: Pick<Wallet, 'name' | 'currency' | 'balance' | 'color' | 'icon'>) => Promise<void>;
  removeWalletById: (id: string) => Promise<RemoveDecision>;
  addCategory: (input: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) => Promise<void>;
  editCategory: (input: Pick<Category, 'id' | 'name' | 'type' | 'color' | 'icon'>) => Promise<void>;
  removeCategoryById: (id: string) => Promise<RemoveDecision>;
  addCurrency: (input: Pick<CurrencyDefinition, 'code' | 'name' | 'symbol' | 'decimalPlaces' | 'type' | 'isFavorite'>) => Promise<void>;
  editCurrency: (input: Pick<CurrencyDefinition, 'code' | 'name' | 'symbol' | 'decimalPlaces' | 'type' | 'isFavorite' | 'isActive'>) => Promise<void>;
  removeCurrencyByCode: (code: string) => Promise<void>;
  addBudget: (input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isRemoved'>) => Promise<void>;
  editBudget: (input: Budget) => Promise<void>;
  removeBudgetById: (id: string) => Promise<void>;
  addGoal: (input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editGoal: (input: Goal) => Promise<void>;
  removeGoalById: (id: string) => Promise<void>;
  addContribution: (input: Omit<GoalContribution, 'id' | 'createdAt'>) => Promise<void>;
  getTransactions: (filters?: TransactionFilters) => Promise<TransactionWithMeta[]>;
  getTransaction: (id: string, includeDeleted?: boolean) => Promise<TransactionWithMeta | null>;
  createCsv: () => string;
  createReportsCsv: (settings: AppSettings) => string;
  createBackup: (settings: AppSettings) => Promise<BackupPayload>;
  importBackup: (payload: BackupPayload) => Promise<AppSettings>;
  clearData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithUsage[]>([]);
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithMeta[]>([]);

  const refresh = async () => {
    const [nextWallets, nextCategories, nextCurrencies, nextTransactions, nextBackupMetadata] = await Promise.all([
      fetchWallets(),
      fetchCategories(),
      fetchCurrencies(),
      fetchTransactions(),
      fetchBackupMetadata(),
    ]);
    const [nextBudgets, nextGoals] = await Promise.all([
      fetchBudgets(false, nextTransactions),
      fetchGoals(),
    ]);
    setWallets(nextWallets);
    setCategories(nextCategories);
    setCurrencies(nextCurrencies);
    setBudgets(nextBudgets);
    setGoals(nextGoals);
    setBackupMetadata(nextBackupMetadata);
    setTransactions(nextTransactions);
    setIsReady(true);
  };

  useEffect(() => {
    refresh().catch((error) => {
      console.error('Failed to initialize finance data', error);
      setIsReady(true);
    });
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      isReady,
      wallets,
      categories,
      currencies,
      budgets,
      goals,
      backupMetadata,
      transactions,
      refresh,
      addTransaction: async (input) => {
        await createTransaction(input);
        await refresh();
      },
      editTransaction: async (input) => {
        await updateTransaction(input);
        await refresh();
      },
      removeTransaction: async (id) => {
        await deleteTransaction(id);
        await refresh();
      },
      restoreDeletedTransaction: async (id) => {
        await restoreTransaction(id);
        await refresh();
      },
      addWallet: async (input) => {
        await createWallet(input);
        await refresh();
      },
      removeWalletById: async (id) => {
        const decision = await removeWallet(id);
        await refresh();
        return decision;
      },
      addCategory: async (input) => {
        await createCategory(input);
        await refresh();
      },
      editCategory: async (input) => {
        await updateCategory(input);
        await refresh();
      },
      removeCategoryById: async (id) => {
        const decision = await removeCategory(id);
        await refresh();
        return decision;
      },
      addCurrency: async (input) => {
        await createCurrency(input);
        await refresh();
      },
      editCurrency: async (input) => {
        await updateCurrency(input);
        await refresh();
      },
      removeCurrencyByCode: async (code) => {
        await removeCurrency(code);
        await refresh();
      },
      addBudget: async (input) => {
        await createBudget(input);
        await refresh();
      },
      editBudget: async (input) => {
        await updateBudget(input);
        await refresh();
      },
      removeBudgetById: async (id) => {
        await removeBudget(id);
        await refresh();
      },
      addGoal: async (input) => {
        await createGoal(input);
        await refresh();
      },
      editGoal: async (input) => {
        await updateGoal(input);
        await refresh();
      },
      removeGoalById: async (id) => {
        await removeGoal(id);
        await refresh();
      },
      addContribution: async (input) => {
        await addGoalContribution(input);
        await refresh();
      },
      getTransactions: fetchTransactions,
      getTransaction: fetchTransactionById,
      createCsv: () => buildTransactionsCsv(transactions),
      createReportsCsv: (settings) => buildReportsCsv(transactions, wallets, settings.baseCurrency),
      createBackup: exportBackupPayload,
      importBackup: async (payload) => {
        const settings = await importBackupPayload(payload);
        await refresh();
        return settings;
      },
      clearData: async () => {
        await clearFinanceData();
        await refresh();
      },
    }),
    [isReady, wallets, categories, currencies, budgets, goals, backupMetadata, transactions]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return value;
}
