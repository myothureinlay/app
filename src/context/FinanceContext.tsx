import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  archiveCategory,
  buildTransactionsCsv,
  buildReportsCsv,
  clearFinanceData,
  createCategory,
  createTransaction,
  createWallet,
  deleteTransaction,
  exportBackupPayload,
  fetchCategories,
  fetchTransactionById,
  fetchTransactions,
  fetchWallets,
  importBackupPayload,
  restoreTransaction,
  type TransactionFilters,
  updateCategory,
  updateTransaction,
} from '../database/repository';
import type {
  AppSettings,
  BackupPayload,
  Category,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionWithMeta,
  Wallet,
} from '../types';

interface FinanceContextValue {
  isReady: boolean;
  wallets: Wallet[];
  categories: Category[];
  transactions: TransactionWithMeta[];
  refresh: () => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  editTransaction: (input: UpdateTransactionInput) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  restoreDeletedTransaction: (id: string) => Promise<void>;
  addWallet: (input: Pick<Wallet, 'name' | 'currency' | 'balance' | 'color' | 'icon'>) => Promise<void>;
  addCategory: (input: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) => Promise<void>;
  editCategory: (input: Pick<Category, 'id' | 'name' | 'type' | 'color' | 'icon'>) => Promise<void>;
  archiveCategoryById: (id: string) => Promise<void>;
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
  const [transactions, setTransactions] = useState<TransactionWithMeta[]>([]);

  const refresh = async () => {
    const [nextWallets, nextCategories, nextTransactions] = await Promise.all([
      fetchWallets(),
      fetchCategories(),
      fetchTransactions(),
    ]);
    setWallets(nextWallets);
    setCategories(nextCategories);
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
      addCategory: async (input) => {
        await createCategory(input);
        await refresh();
      },
      editCategory: async (input) => {
        await updateCategory(input);
        await refresh();
      },
      archiveCategoryById: async (id) => {
        await archiveCategory(id);
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
    [isReady, wallets, categories, transactions]
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
