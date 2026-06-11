import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  BackupPayload,
  Category,
  CategoryType,
  CreateTransactionInput,
  CurrencyCode,
  Transaction,
  TransactionType,
  TransactionWithMeta,
  Wallet,
} from '../types';
import { createId } from '../utils/ids';
import { initializeDatabase } from './client';

type WalletRow = {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  color: string;
  icon: string;
  sort_order: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sort_order: number;
  is_default: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  wallet_id: string;
  to_wallet_id: string | null;
  to_amount: number | null;
  to_currency: CurrencyCode | null;
  category_id: string | null;
  date: string;
  note: string | null;
  exchange_rate: number;
  base_currency: Transaction['baseCurrency'];
  base_amount: number;
  created_at: string;
  updated_at: string;
};

type TransactionMetaRow = TransactionRow & {
  wallet_name: string;
  wallet_color: string;
  to_wallet_name: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
};

export interface TransactionFilters {
  from?: string;
  to?: string;
  currency?: CurrencyCode | 'all';
  categoryId?: string | 'all';
  walletId?: string | 'all';
}

function mapWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    balance: row.balance,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: Boolean(row.is_default),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    walletId: row.wallet_id,
    toWalletId: row.to_wallet_id,
    toAmount: row.to_amount,
    toCurrency: row.to_currency,
    categoryId: row.category_id,
    date: row.date,
    note: row.note,
    exchangeRate: row.exchange_rate,
    baseCurrency: row.base_currency,
    baseAmount: row.base_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransactionWithMeta(row: TransactionMetaRow): TransactionWithMeta {
  return {
    ...mapTransaction(row),
    walletName: row.wallet_name,
    walletColor: row.wallet_color,
    toWalletName: row.to_wallet_name,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    categoryIcon: row.category_icon,
  };
}

function timestamp() {
  return new Date().toISOString();
}

async function getDb() {
  return initializeDatabase();
}

export async function fetchWallets(includeArchived = false) {
  const db = await getDb();
  const rows = await db.getAllAsync<WalletRow>(
    `SELECT * FROM wallets ${includeArchived ? '' : 'WHERE is_archived = 0'} ORDER BY sort_order, name`
  );
  return rows.map(mapWallet);
}

export async function fetchCategories(includeArchived = false) {
  const db = await getDb();
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories ${includeArchived ? '' : 'WHERE is_archived = 0'} ORDER BY sort_order, name`
  );
  return rows.map(mapCategory);
}

export async function fetchTransactions(filters: TransactionFilters = {}) {
  const db = await getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.from) {
    where.push('t.date >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('t.date <= ?');
    params.push(filters.to);
  }

  if (filters.currency && filters.currency !== 'all') {
    where.push('t.currency = ?');
    params.push(filters.currency);
  }

  if (filters.categoryId && filters.categoryId !== 'all') {
    where.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.walletId && filters.walletId !== 'all') {
    where.push('(t.wallet_id = ? OR t.to_wallet_id = ?)');
    params.push(filters.walletId, filters.walletId);
  }

  const rows = await db.getAllAsync<TransactionMetaRow>(
    `SELECT
      t.*,
      w.name AS wallet_name,
      w.color AS wallet_color,
      tw.name AS to_wallet_name,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon
    FROM transactions t
    JOIN wallets w ON w.id = t.wallet_id
    LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
    LEFT JOIN categories c ON c.id = t.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY t.date DESC, t.created_at DESC`,
    params
  );

  return rows.map(mapTransactionWithMeta);
}

export async function fetchRawTransactions() {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
  );
  return rows.map(mapTransaction);
}

async function applyWalletMovement(db: SQLiteDatabase, input: CreateTransactionInput) {
  const updatedAt = timestamp();

  if (input.type === 'income') {
    await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
      input.amount,
      updatedAt,
      input.walletId,
    ]);
  }

  if (input.type === 'expense') {
    await db.runAsync('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?', [
      input.amount,
      updatedAt,
      input.walletId,
    ]);
  }

  if (input.type === 'transfer') {
    await db.runAsync('UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?', [
      input.amount,
      updatedAt,
      input.walletId,
    ]);

    if (input.toWalletId) {
      await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
        input.toAmount ?? input.baseAmount,
        updatedAt,
        input.toWalletId,
      ]);
    }
  }
}

export async function createTransaction(input: CreateTransactionInput) {
  const db = await getDb();
  const id = createId('tx');
  const createdAt = timestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
        category_id, date, note, exchange_rate, base_currency, base_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.type,
        input.amount,
        input.currency,
        input.walletId,
        input.toWalletId ?? null,
        input.toAmount ?? null,
        input.toCurrency ?? null,
        input.categoryId ?? null,
        input.date,
        input.note?.trim() || null,
        input.exchangeRate,
        input.baseCurrency,
        input.baseAmount,
        createdAt,
        createdAt,
      ]
    );

    await applyWalletMovement(db, input);
  });

  return id;
}

export async function createWallet(input: Pick<Wallet, 'name' | 'currency' | 'balance' | 'color' | 'icon'>) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO wallets (
      id, name, currency, balance, color, icon, sort_order, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      createId('wallet'),
      input.name,
      input.currency,
      input.balance,
      input.color,
      input.icon,
      Date.now(),
      createdAt,
      createdAt,
    ]
  );
}

export async function createCategory(input: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO categories (
      id, name, type, icon, color, sort_order, is_default, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      createId('cat'),
      input.name,
      input.type,
      input.icon,
      input.color,
      Date.now(),
      createdAt,
      createdAt,
    ]
  );
}

export async function exportBackupPayload(settings: BackupPayload['settings']): Promise<BackupPayload> {
  const [wallets, categories, transactions] = await Promise.all([
    fetchWallets(true),
    fetchCategories(true),
    fetchRawTransactions(),
  ]);

  return {
    version: 1,
    exportedAt: timestamp(),
    settings,
    wallets,
    categories,
    transactions,
  };
}

export async function importBackupPayload(payload: BackupPayload) {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM wallets');

    for (const wallet of payload.wallets) {
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

    for (const category of payload.categories) {
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

    for (const transaction of payload.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
          category_id, date, note, exchange_rate, base_currency, base_amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.currency,
          transaction.walletId,
          transaction.toWalletId ?? null,
          transaction.toAmount ?? null,
          transaction.toCurrency ?? null,
          transaction.categoryId ?? null,
          transaction.date,
          transaction.note ?? null,
          transaction.exchangeRate,
          transaction.baseCurrency,
          transaction.baseAmount,
          transaction.createdAt,
          transaction.updatedAt,
        ]
      );
    }
  });

  return payload.settings;
}

export function buildTransactionsCsv(transactions: TransactionWithMeta[]) {
  const headers = [
    'id',
    'type',
    'date',
    'wallet',
    'to_wallet',
    'category',
    'amount',
    'currency',
    'to_amount',
    'to_currency',
    'exchange_rate',
    'base_amount',
    'base_currency',
    'note',
  ];

  const escape = (value: unknown) => {
    const raw = value == null ? '' : String(value);
    return `"${raw.replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((transaction) =>
    [
      transaction.id,
      transaction.type,
      transaction.date,
      transaction.walletName,
      transaction.toWalletName,
      transaction.categoryName,
      transaction.amount,
      transaction.currency,
      transaction.toAmount,
      transaction.toCurrency,
      transaction.exchangeRate,
      transaction.baseAmount,
      transaction.baseCurrency,
      transaction.note,
    ].map(escape)
  );

  return [headers.map(escape), ...rows].map((row) => row.join(',')).join('\n');
}
