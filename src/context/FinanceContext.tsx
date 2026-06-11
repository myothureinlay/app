import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  buildTransactionsCsv,
  createCategory,
  createTransaction,
  createWallet,
  exportBackupPayload,
  fetchCategories,
  fetchTransactions,
  fetchWallets,
  importBackupPayload,
  type TransactionFilters,
} from '../database/repository';
import type {
  AppSettings,
  BackupPayload,
  Category,
  CreateTransactionInput,
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
  addWallet: (input: Pick<Wallet, 'name' | 'currency' | 'balance' | 'color' | 'icon'>) => Promise<void>;
  addCategory: (input: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) => Promise<void>;
  getTransactions: (filters?: TransactionFilters) => Promise<TransactionWithMeta[]>;
  createCsv: () => string;
  createBackup: (settings: AppSettings) => Promise<BackupPayload>;
  importBackup: (payload: BackupPayload) => Promise<AppSettings>;
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
      addWallet: async (input) => {
        await createWallet(input);
        await refresh();
      },
      addCategory: async (input) => {
        await createCategory(input);
        await refresh();
      },
      getTransactions: fetchTransactions,
      createCsv: () => buildTransactionsCsv(transactions),
      createBackup: exportBackupPayload,
      importBackup: async (payload) => {
        const settings = await importBackupPayload(payload);
        await refresh();
        return settings;
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
