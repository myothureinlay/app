import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultRatesToBase } from '../constants/currencies';
import type { BaseCurrency, Category, CreateTransactionInput, Wallet } from '../types';
import { createId } from '../utils/ids';

const baseCurrency: BaseCurrency = 'USD';

function nowIso() {
  return new Date().toISOString();
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function baseAmount(amount: number, currency: CreateTransactionInput['currency']) {
  return amount * defaultRatesToBase[baseCurrency][currency];
}

const wallets: Wallet[] = [
  {
    id: 'wallet_binance_usdt',
    name: 'Binance USDT',
    currency: 'USDT',
    balance: 0,
    color: '#16A7A0',
    icon: 'logo-bitcoin',
    sortOrder: 1,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'wallet_cash_mmk',
    name: 'Cash MMK',
    currency: 'MMK',
    balance: 0,
    color: '#FF8A4C',
    icon: 'wallet',
    sortOrder: 2,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'wallet_cash_thb',
    name: 'Cash THB',
    currency: 'THB',
    balance: 0,
    color: '#5E6AD2',
    icon: 'cash',
    sortOrder: 3,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'wallet_usd_cash',
    name: 'USD Cash',
    currency: 'USD',
    balance: 0,
    color: '#22C55E',
    icon: 'card',
    sortOrder: 4,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'wallet_bank_other',
    name: 'Bank or Other',
    currency: 'MMK',
    balance: 0,
    color: '#F5A524',
    icon: 'business',
    sortOrder: 5,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const categories: Category[] = [
  {
    id: 'cat_salary',
    name: 'Salary',
    type: 'income',
    icon: 'briefcase',
    color: '#16A34A',
    sortOrder: 1,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_freelance',
    name: 'Freelance',
    type: 'income',
    icon: 'laptop',
    color: '#14B8A6',
    sortOrder: 2,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_food',
    name: 'Food',
    type: 'expense',
    icon: 'restaurant',
    color: '#EF4444',
    sortOrder: 3,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_transport',
    name: 'Transport',
    type: 'expense',
    icon: 'car',
    color: '#F97316',
    sortOrder: 4,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_rent',
    name: 'Rent',
    type: 'expense',
    icon: 'home',
    color: '#8B5CF6',
    sortOrder: 5,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_utilities',
    name: 'Utilities',
    type: 'expense',
    icon: 'flash',
    color: '#0EA5E9',
    sortOrder: 6,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    type: 'expense',
    icon: 'bag',
    color: '#EC4899',
    sortOrder: 7,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'cat_exchange',
    name: 'Exchange',
    type: 'transfer',
    icon: 'swap-horizontal',
    color: '#6366F1',
    sortOrder: 8,
    isDefault: true,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const transactions: CreateTransactionInput[] = [
  {
    type: 'income',
    amount: 2600,
    currency: 'USDT',
    walletId: 'wallet_binance_usdt',
    categoryId: 'cat_salary',
    date: dateDaysAgo(8),
    note: 'Monthly retainer',
    exchangeRate: defaultRatesToBase.USD.USDT,
    baseCurrency,
    baseAmount: baseAmount(2600, 'USDT'),
  },
  {
    type: 'income',
    amount: 800000,
    currency: 'MMK',
    walletId: 'wallet_cash_mmk',
    categoryId: 'cat_freelance',
    date: dateDaysAgo(6),
    note: 'Local project payment',
    exchangeRate: defaultRatesToBase.USD.MMK,
    baseCurrency,
    baseAmount: baseAmount(800000, 'MMK'),
  },
  {
    type: 'expense',
    amount: 190,
    currency: 'USDT',
    walletId: 'wallet_binance_usdt',
    categoryId: 'cat_rent',
    date: dateDaysAgo(5),
    note: 'Apartment deposit top-up',
    exchangeRate: defaultRatesToBase.USD.USDT,
    baseCurrency,
    baseAmount: baseAmount(190, 'USDT'),
  },
  {
    type: 'transfer',
    amount: 300,
    currency: 'USDT',
    walletId: 'wallet_binance_usdt',
    toWalletId: 'wallet_cash_mmk',
    toAmount: 1260000,
    toCurrency: 'MMK',
    categoryId: 'cat_exchange',
    date: dateDaysAgo(4),
    note: 'USDT to MMK cash',
    exchangeRate: defaultRatesToBase.USD.USDT,
    baseCurrency,
    baseAmount: baseAmount(300, 'USDT'),
  },
  {
    type: 'transfer',
    amount: 200,
    currency: 'USDT',
    walletId: 'wallet_binance_usdt',
    toWalletId: 'wallet_usd_cash',
    toAmount: 200,
    toCurrency: 'USD',
    categoryId: 'cat_exchange',
    date: dateDaysAgo(3),
    note: 'USDT to USD cash',
    exchangeRate: defaultRatesToBase.USD.USDT,
    baseCurrency,
    baseAmount: baseAmount(200, 'USDT'),
  },
  {
    type: 'expense',
    amount: 145000,
    currency: 'MMK',
    walletId: 'wallet_cash_mmk',
    categoryId: 'cat_food',
    date: dateDaysAgo(2),
    note: 'Groceries and dinner',
    exchangeRate: defaultRatesToBase.USD.MMK,
    baseCurrency,
    baseAmount: baseAmount(145000, 'MMK'),
  },
  {
    type: 'transfer',
    amount: 250000,
    currency: 'MMK',
    walletId: 'wallet_cash_mmk',
    toWalletId: 'wallet_cash_thb',
    toAmount: 2180,
    toCurrency: 'THB',
    categoryId: 'cat_exchange',
    date: dateDaysAgo(1),
    note: 'MMK to THB travel cash',
    exchangeRate: defaultRatesToBase.USD.MMK,
    baseCurrency,
    baseAmount: baseAmount(250000, 'MMK'),
  },
  {
    type: 'expense',
    amount: 850,
    currency: 'THB',
    walletId: 'wallet_cash_thb',
    categoryId: 'cat_transport',
    date: dateDaysAgo(0),
    note: 'Transport and mobile top-up',
    exchangeRate: defaultRatesToBase.USD.THB,
    baseCurrency,
    baseAmount: baseAmount(850, 'THB'),
  },
];

async function insertSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)',
    key,
    value,
    nowIso()
  );
}

async function applyWalletMovement(db: SQLiteDatabase, input: CreateTransactionInput) {
  if (input.type === 'income') {
    await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
      input.amount,
      nowIso(),
      input.walletId,
    ]);
  }

  if (input.type === 'expense') {
    await db.runAsync('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?', [
      input.amount,
      nowIso(),
      input.walletId,
    ]);
  }

  if (input.type === 'transfer') {
    await db.runAsync('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?', [
      input.amount,
      nowIso(),
      input.walletId,
    ]);

    if (input.toWalletId) {
      await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
        input.toAmount ?? input.baseAmount,
        nowIso(),
        input.toWalletId,
      ]);
    }
  }
}

async function insertSeedTransaction(db: SQLiteDatabase, input: CreateTransactionInput) {
  const timestamp = nowIso();
  await db.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
      category_id, date, note, exchange_rate, base_currency, base_amount, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      createId('tx'),
      input.type,
      input.amount,
      input.currency,
      input.walletId,
      input.toWalletId ?? null,
      input.toAmount ?? null,
      input.toCurrency ?? null,
      input.categoryId ?? null,
      input.date,
      input.note ?? null,
      input.exchangeRate,
      input.baseCurrency,
      input.baseAmount,
      timestamp,
      timestamp,
    ]
  );
  await applyWalletMovement(db, input);
}

export async function seedDatabase(db: SQLiteDatabase) {
  const seeded = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    'seeded_v1'
  );
  if (seeded?.value === 'true') {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const wallet of wallets) {
      await db.runAsync(
        `INSERT INTO wallets (
          id, name, currency, balance, color, icon, sort_order, is_archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet.id,
          wallet.name,
          wallet.currency,
          wallet.balance,
          wallet.color,
          wallet.icon,
          wallet.sortOrder,
          wallet.isArchived ? 1 : 0,
          wallet.createdAt,
          wallet.updatedAt,
        ]
      );
    }

    for (const category of categories) {
      await db.runAsync(
        `INSERT INTO categories (
          id, name, type, icon, color, sort_order, is_default, is_archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.type,
          category.icon,
          category.color,
          category.sortOrder,
          category.isDefault ? 1 : 0,
          category.isArchived ? 1 : 0,
          category.createdAt,
          category.updatedAt,
        ]
      );
    }

    for (const transaction of transactions) {
      await insertSeedTransaction(db, transaction);
    }

    await insertSetting(db, 'seeded_v1', 'true');
  });
}
