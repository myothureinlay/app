import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultRatesToBase } from '../constants/currencies';
import { getWalletDeltas, type LedgerTransactionInput } from '../logic/ledger';
import {
  calculateReportSummary,
  groupExpensesByCurrency,
  groupTransactionsByCategory,
  monthlyIncomeExpense,
  topIndividualExpenses,
  walletDistribution,
} from '../logic/reports';
import type {
  AppSettings,
  BackupPayload,
  BaseCurrency,
  Category,
  CategoryType,
  CreateTransactionInput,
  CurrencyCode,
  Transaction,
  TransactionType,
  TransactionWithMeta,
  UpdateTransactionInput,
  Wallet,
} from '../types';
import { createId } from '../utils/ids';
import { initializeDatabase } from './client';
import { seedDatabase } from './seed';

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
  base_currency: BaseCurrency;
  base_amount: number;
  counterparty: string | null;
  related_transaction_id: string | null;
  fee_amount: number;
  fee_currency: CurrencyCode | null;
  metadata: string | null;
  deleted_at: string | null;
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
  includeDeleted?: boolean;
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
    counterparty: row.counterparty,
    relatedTransactionId: row.related_transaction_id,
    feeAmount: row.fee_amount ?? 0,
    feeCurrency: row.fee_currency,
    metadata: row.metadata,
    deletedAt: row.deleted_at,
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

function normalizeTransactionInput(input: CreateTransactionInput) {
  return {
    ...input,
    note: input.note?.trim() || null,
    counterparty: input.counterparty?.trim() || null,
    relatedTransactionId: input.relatedTransactionId ?? null,
    feeAmount: input.feeAmount ?? 0,
    feeCurrency: input.feeCurrency ?? null,
    metadata: input.metadata ?? null,
  };
}

async function applyWalletMovement(
  db: SQLiteDatabase,
  input: LedgerTransactionInput,
  multiplier = 1
) {
  const updatedAt = timestamp();
  for (const delta of getWalletDeltas({ ...input, feeAmount: input.feeAmount ?? 0 })) {
    await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
      delta.amount * multiplier,
      updatedAt,
      delta.walletId,
    ]);
  }
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

function buildTransactionWhere(filters: TransactionFilters) {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (!filters.includeDeleted) {
    where.push('t.deleted_at IS NULL');
  }

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

  return { where, params };
}

export async function fetchTransactions(filters: TransactionFilters = {}) {
  const db = await getDb();
  const { where, params } = buildTransactionWhere(filters);

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

export async function fetchTransactionById(id: string, includeDeleted = true) {
  const rows = await fetchTransactions({ includeDeleted, categoryId: 'all' });
  return rows.find((transaction) => transaction.id === id) ?? null;
}

export async function fetchRawTransactions(includeDeleted = true) {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY date DESC, created_at DESC`
  );
  return rows.map(mapTransaction);
}

export async function createTransaction(input: CreateTransactionInput) {
  const db = await getDb();
  const id = createId('tx');
  const createdAt = timestamp();
  const normalized = normalizeTransactionInput(input);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
        category_id, date, note, exchange_rate, base_currency, base_amount,
        counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        normalized.type,
        normalized.amount,
        normalized.currency,
        normalized.walletId,
        normalized.toWalletId ?? null,
        normalized.toAmount ?? null,
        normalized.toCurrency ?? null,
        normalized.categoryId ?? null,
        normalized.date,
        normalized.note,
        normalized.exchangeRate,
        normalized.baseCurrency,
        normalized.baseAmount,
        normalized.counterparty,
        normalized.relatedTransactionId,
        normalized.feeAmount,
        normalized.feeCurrency,
        normalized.metadata,
        null,
        createdAt,
        createdAt,
      ]
    );

    await applyWalletMovement(db, normalized);
  });

  return id;
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const db = await getDb();
  const current = await fetchTransactionById(input.id, true);
  if (!current) {
    throw new Error('Transaction not found');
  }

  const normalized = normalizeTransactionInput(input);
  const updatedAt = timestamp();

  await db.withTransactionAsync(async () => {
    if (!current.deletedAt) {
      await applyWalletMovement(db, current, -1);
    }

    await db.runAsync(
      `UPDATE transactions SET
        type = ?,
        amount = ?,
        currency = ?,
        wallet_id = ?,
        to_wallet_id = ?,
        to_amount = ?,
        to_currency = ?,
        category_id = ?,
        date = ?,
        note = ?,
        exchange_rate = ?,
        base_currency = ?,
        base_amount = ?,
        counterparty = ?,
        related_transaction_id = ?,
        fee_amount = ?,
        fee_currency = ?,
        metadata = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        normalized.type,
        normalized.amount,
        normalized.currency,
        normalized.walletId,
        normalized.toWalletId ?? null,
        normalized.toAmount ?? null,
        normalized.toCurrency ?? null,
        normalized.categoryId ?? null,
        normalized.date,
        normalized.note,
        normalized.exchangeRate,
        normalized.baseCurrency,
        normalized.baseAmount,
        normalized.counterparty,
        normalized.relatedTransactionId,
        normalized.feeAmount,
        normalized.feeCurrency,
        normalized.metadata,
        updatedAt,
        input.id,
      ]
    );

    if (!current.deletedAt) {
      await applyWalletMovement(db, normalized);
    }
  });
}

export async function deleteTransaction(id: string) {
  const db = await getDb();
  const current = await fetchTransactionById(id, true);
  if (!current || current.deletedAt) return;
  const deletedAt = timestamp();

  await db.withTransactionAsync(async () => {
    await applyWalletMovement(db, current, -1);
    await db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      deletedAt,
      deletedAt,
      id,
    ]);
  });
}

export async function restoreTransaction(id: string) {
  const db = await getDb();
  const current = await fetchTransactionById(id, true);
  if (!current || !current.deletedAt) return;
  const updatedAt = timestamp();

  await db.withTransactionAsync(async () => {
    await applyWalletMovement(db, current);
    await db.runAsync('UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?', [
      updatedAt,
      id,
    ]);
  });
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

export async function updateCategory(input: Pick<Category, 'id' | 'name' | 'type' | 'color' | 'icon'>) {
  const db = await getDb();
  const updatedAt = timestamp();
  await db.runAsync(
    `UPDATE categories SET name = ?, type = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?`,
    [input.name, input.type, input.color, input.icon, updatedAt, input.id]
  );
}

export async function archiveCategory(id: string) {
  const db = await getDb();
  const updatedAt = timestamp();
  await db.runAsync('UPDATE categories SET is_archived = 1, updated_at = ? WHERE id = ?', [updatedAt, id]);
}

export async function clearFinanceData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM wallets');
    await db.runAsync("DELETE FROM app_settings WHERE key IN ('seeded_v1', 'seeded_v2')");
  });
  await seedDatabase(db);
}

export async function exportBackupPayload(settings: AppSettings): Promise<BackupPayload> {
  const [wallets, categories, transactions] = await Promise.all([
    fetchWallets(true),
    fetchCategories(true),
    fetchRawTransactions(true),
  ]);

  return {
    version: 2,
    exportedAt: timestamp(),
    settings,
    wallets,
    categories,
    transactions,
    exchangeRates: defaultRatesToBase,
    reportMetadata: {
      includesSoftDeletedTransactions: true,
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isObject(payload)) throw new Error('Backup must be an object');
  if (payload.version !== 1 && payload.version !== 2) throw new Error('Unsupported backup version');
  if (!Array.isArray(payload.wallets)) throw new Error('Backup wallets are missing');
  if (!Array.isArray(payload.categories)) throw new Error('Backup categories are missing');
  if (!Array.isArray(payload.transactions)) throw new Error('Backup transactions are missing');
  if (!isObject(payload.settings)) throw new Error('Backup settings are missing');

  for (const wallet of payload.wallets) {
    if (!isObject(wallet) || typeof wallet.id !== 'string' || typeof wallet.name !== 'string') {
      throw new Error('Backup contains an invalid wallet');
    }
  }

  for (const category of payload.categories) {
    if (!isObject(category) || typeof category.id !== 'string' || typeof category.name !== 'string') {
      throw new Error('Backup contains an invalid category');
    }
  }

  for (const transaction of payload.transactions) {
    if (!isObject(transaction) || typeof transaction.id !== 'string' || typeof transaction.type !== 'string') {
      throw new Error('Backup contains an invalid transaction');
    }
  }
}

export async function importBackupPayload(payload: BackupPayload) {
  validateBackupPayload(payload);
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
          category_id, date, note, exchange_rate, base_currency, base_amount,
          counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          transaction.counterparty ?? null,
          transaction.relatedTransactionId ?? null,
          transaction.feeAmount ?? 0,
          transaction.feeCurrency ?? null,
          transaction.metadata ?? null,
          transaction.deletedAt ?? null,
          transaction.createdAt,
          transaction.updatedAt,
        ]
      );
    }
  });

  return payload.settings;
}

function escapeCsv(value: unknown) {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
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
    'fee_amount',
    'fee_currency',
    'exchange_rate',
    'base_amount',
    'base_currency',
    'counterparty',
    'deleted_at',
    'note',
  ];

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
      transaction.feeAmount,
      transaction.feeCurrency,
      transaction.exchangeRate,
      transaction.baseAmount,
      transaction.baseCurrency,
      transaction.counterparty,
      transaction.deletedAt,
      transaction.note,
    ].map(escapeCsv)
  );

  return [headers.map(escapeCsv), ...rows].map((row) => row.join(',')).join('\n');
}

export function buildReportsCsv(
  transactions: TransactionWithMeta[],
  wallets: Wallet[],
  baseCurrency: BaseCurrency
) {
  const summary = calculateReportSummary(transactions, baseCurrency);
  const monthly = monthlyIncomeExpense(transactions, baseCurrency, 12);
  const expenses = groupTransactionsByCategory(transactions, baseCurrency, 'expense');
  const income = groupTransactionsByCategory(transactions, baseCurrency, 'income');
  const expenseCurrencies = groupExpensesByCurrency(transactions);
  const distribution = walletDistribution(wallets, baseCurrency);
  const topExpenses = topIndividualExpenses(transactions, baseCurrency, 10);

  const sections: string[][][] = [
    [
      ['section', 'metric', 'value', 'currency'],
      ['summary', 'income', summary.income, baseCurrency],
      ['summary', 'expenses', summary.expenses, baseCurrency],
      ['summary', 'net_cashflow', summary.netCashflow, baseCurrency],
      ['summary', 'losses', summary.losses, baseCurrency],
      ['summary', 'fees', summary.fees, baseCurrency],
      ['summary', 'taxes', summary.taxes, baseCurrency],
      ['summary', 'liability_movement', summary.liabilityMovement, baseCurrency],
      ['summary', 'receivable_movement', summary.receivableMovement, baseCurrency],
    ].map((row) => row.map(escapeCsv)),
    [['month', 'income', 'expenses', 'cashflow'], ...monthly.map((row) => [row.key, row.income, row.expenses, row.cashflow])].map((row) =>
      row.map(escapeCsv)
    ),
    [['expense_category', 'total'], ...expenses.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['income_category', 'total'], ...income.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['expense_currency', 'total'], ...expenseCurrencies.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['wallet', 'estimated_value'], ...distribution.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['top_expense', 'date', 'amount', 'subtitle'], ...topExpenses.map((row) => [row.title, row.date, row.amount, row.subtitle])].map((row) =>
      row.map(escapeCsv)
    ),
  ];

  return sections.map((section) => section.map((row) => row.join(',')).join('\n')).join('\n\n');
}
