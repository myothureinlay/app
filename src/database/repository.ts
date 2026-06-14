import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultRatesToBase } from '../constants/currencies';
import { getWalletDeltas, type LedgerTransactionInput } from '../logic/ledger';
import {
  calculateReportSummary,
  groupExpensesByCurrency,
  groupTransactionsByCategory,
  groupTransactionsByParentCategory,
  groupTransactionsBySubcategory,
  monthlyIncomeExpense,
  topIndividualExpenses,
  walletDistribution,
} from '../logic/reports';
import type {
  AppSettings,
  BackupPayload,
  BackupMetadata,
  BaseCurrency,
  Budget,
  BudgetPeriod,
  BudgetWithUsage,
  Category,
  CategoryType,
  CreateTransactionInput,
  CurrencyDefinition,
  CurrencyKind,
  CurrencyCode,
  Goal,
  GoalContribution,
  GoalStatus,
  GoalType,
  GoalWithProgress,
  InvestmentRecord,
  InvestmentAssetType,
  Transaction,
  TransactionType,
  TransactionWithMeta,
  UpdateTransactionInput,
  Wallet,
} from '../types';
import { enrichBudgetWithUsage } from '../logic/budgets';
import { applyGoalContribution, calculateGoalProgress } from '../logic/goals';
import { getCategoryRemoveDecision, getWalletRemoveDecision } from '../logic/removal';
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
  is_default: number;
  is_archived: number;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sort_order: number;
  is_default: number;
  is_archived: number;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CurrencyRow = {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  type: CurrencyKind;
  is_active: number;
  is_favorite: number;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BudgetRow = {
  id: string;
  name: string;
  category_id: string | null;
  currency: string;
  amount_limit: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  alert_threshold: number;
  is_removed: number;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_color?: string | null;
};

type GoalRow = {
  id: string;
  name: string;
  type: GoalType;
  target_amount: number;
  currency: string;
  current_amount: number;
  monthly_target_amount: number | null;
  deadline: string | null;
  linked_wallet_id: string | null;
  notes: string | null;
  icon: string;
  color: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
};

type GoalContributionRow = {
  id: string;
  goal_id: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  transaction_id: string | null;
  created_at: string;
};

type BackupMetadataRow = {
  id: string;
  provider: 'local' | 'google';
  mode: 'replace' | 'append';
  last_backup_at: string | null;
  auto_backup: 'off' | 'daily' | 'weekly' | 'monthly';
  status: 'ready' | 'needs_setup' | 'failed';
  details: string | null;
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
  parent_category_id: string | null;
  subcategory_id: string | null;
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
  parent_category_name: string | null;
  parent_category_color: string | null;
  parent_category_icon: string | null;
  subcategory_name: string | null;
  subcategory_color: string | null;
  subcategory_icon: string | null;
};

type InvestmentRow = {
  id: string;
  type: InvestmentRecord['type'];
  asset_type: InvestmentAssetType;
  asset_name: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  currency: CurrencyCode;
  wallet_id: string | null;
  transaction_id: string | null;
  current_value: number | null;
  realized_profit_loss: number | null;
  unrealized_profit_loss: number | null;
  date: string;
  note: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface TransactionFilters {
  from?: string;
  to?: string;
  currency?: CurrencyCode | 'all';
  categoryId?: string | 'all';
  parentCategoryId?: string | 'all';
  subcategoryId?: string | 'all';
  walletId?: string | 'all';
  type?: TransactionType | 'all';
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';
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
    isDefault: Boolean(row.is_default),
    isArchived: Boolean(row.is_archived),
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: Boolean(row.is_default),
    isArchived: Boolean(row.is_archived),
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCurrency(row: CurrencyRow): CurrencyDefinition {
  return {
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    decimalPlaces: row.decimal_places,
    type: row.type,
    isActive: Boolean(row.is_active),
    isFavorite: Boolean(row.is_favorite),
    isDefault: Boolean(row.is_default),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    currency: row.currency,
    amountLimit: row.amount_limit,
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    alertThreshold: row.alert_threshold,
    isRemoved: Boolean(row.is_removed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    targetAmount: row.target_amount,
    currency: row.currency,
    currentAmount: row.current_amount,
    monthlyTargetAmount: row.monthly_target_amount,
    deadline: row.deadline,
    linkedWalletId: row.linked_wallet_id,
    notes: row.notes,
    icon: row.icon,
    color: row.color,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGoalContribution(row: GoalContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: row.amount,
    currency: row.currency,
    date: row.date,
    note: row.note,
    transactionId: row.transaction_id,
    createdAt: row.created_at,
  };
}

function mapBackupMetadata(row: BackupMetadataRow): BackupMetadata {
  return {
    id: row.id,
    provider: row.provider,
    mode: row.mode,
    lastBackupAt: row.last_backup_at,
    autoBackup: row.auto_backup,
    status: row.status,
    details: row.details,
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
    parentCategoryId: row.parent_category_id ?? row.category_id,
    subcategoryId: row.subcategory_id,
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
    parentCategoryName: row.parent_category_name,
    parentCategoryColor: row.parent_category_color,
    parentCategoryIcon: row.parent_category_icon,
    subcategoryName: row.subcategory_name,
    subcategoryColor: row.subcategory_color,
    subcategoryIcon: row.subcategory_icon,
  };
}

function mapInvestment(row: InvestmentRow): InvestmentRecord {
  return {
    id: row.id,
    type: row.type,
    assetType: row.asset_type,
    assetName: row.asset_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    amount: row.amount,
    currency: row.currency,
    walletId: row.wallet_id,
    transactionId: row.transaction_id,
    currentValue: row.current_value,
    realizedProfitLoss: row.realized_profit_loss,
    unrealizedProfitLoss: row.unrealized_profit_loss,
    date: row.date,
    note: row.note,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    parentCategoryId: input.parentCategoryId ?? input.categoryId ?? null,
    subcategoryId: input.subcategoryId ?? null,
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

export async function fetchCurrencies(includeInactive = false) {
  const db = await getDb();
  const rows = await db.getAllAsync<CurrencyRow>(
    `SELECT * FROM currencies ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY is_favorite DESC, sort_order, code`
  );
  return rows.map(mapCurrency);
}

export async function createCurrency(input: Pick<CurrencyDefinition, 'code' | 'name' | 'symbol' | 'decimalPlaces' | 'type' | 'isFavorite'>) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT OR REPLACE INTO currencies (
      code, name, symbol, decimal_places, type, is_active, is_favorite, is_default, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, 0, ?, ?, ?)`,
    [
      input.code.trim().toUpperCase(),
      input.name.trim(),
      input.symbol.trim(),
      input.decimalPlaces,
      input.type,
      input.isFavorite ? 1 : 0,
      Date.now(),
      createdAt,
      createdAt,
    ]
  );
}

export async function updateCurrency(input: Pick<CurrencyDefinition, 'code' | 'name' | 'symbol' | 'decimalPlaces' | 'type' | 'isFavorite' | 'isActive'>) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE currencies SET name = ?, symbol = ?, decimal_places = ?, type = ?, is_favorite = ?, is_active = ?, updated_at = ? WHERE code = ?`,
    [
      input.name.trim(),
      input.symbol.trim(),
      input.decimalPlaces,
      input.type,
      input.isFavorite ? 1 : 0,
      input.isActive ? 1 : 0,
      timestamp(),
      input.code,
    ]
  );
}

export async function removeCurrency(code: string) {
  const db = await getDb();
  const usage = await db.getFirstAsync<{ count: number }>(
    `SELECT
      (SELECT COUNT(*) FROM wallets WHERE currency = ?) +
      (SELECT COUNT(*) FROM transactions WHERE currency = ? OR to_currency = ? OR fee_currency = ?) AS count`,
    [code, code, code, code]
  );

  if ((usage?.count ?? 0) === 0) {
    await db.runAsync('DELETE FROM currencies WHERE code = ? AND is_default = 0', code);
    return;
  }

  await db.runAsync('UPDATE currencies SET is_active = 0, updated_at = ? WHERE code = ?', [timestamp(), code]);
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

  if (filters.parentCategoryId && filters.parentCategoryId !== 'all') {
    where.push('COALESCE(t.parent_category_id, t.category_id) = ?');
    params.push(filters.parentCategoryId);
  }

  if (filters.subcategoryId && filters.subcategoryId !== 'all') {
    if (filters.subcategoryId === 'none') {
      where.push('t.subcategory_id IS NULL');
    } else {
      where.push('t.subcategory_id = ?');
      params.push(filters.subcategoryId);
    }
  }

  if (filters.type && filters.type !== 'all') {
    where.push('t.type = ?');
    params.push(filters.type);
  }

  if (filters.walletId && filters.walletId !== 'all') {
    where.push('(t.wallet_id = ? OR t.to_wallet_id = ?)');
    params.push(filters.walletId, filters.walletId);
  }

  if (filters.search?.trim()) {
    const query = `%${filters.search.trim().toLowerCase()}%`;
    where.push(`(
      LOWER(COALESCE(t.note, '')) LIKE ? OR
      LOWER(COALESCE(t.counterparty, '')) LIKE ? OR
      LOWER(COALESCE(c.name, '')) LIKE ? OR
      LOWER(COALESCE(pc.name, '')) LIKE ? OR
      LOWER(COALESCE(sc.name, '')) LIKE ? OR
      LOWER(w.name) LIKE ?
    )`);
    params.push(query, query, query, query, query, query);
  }

  if (typeof filters.minAmount === 'number') {
    where.push('t.amount >= ?');
    params.push(filters.minAmount);
  }

  if (typeof filters.maxAmount === 'number') {
    where.push('t.amount <= ?');
    params.push(filters.maxAmount);
  }

  return { where, params };
}

function transactionOrderBy(sort: TransactionFilters['sort']) {
  if (sort === 'oldest') return 't.date ASC, t.created_at ASC';
  if (sort === 'amount_desc') return 't.amount DESC, t.date DESC';
  if (sort === 'amount_asc') return 't.amount ASC, t.date DESC';
  return 't.date DESC, t.created_at DESC';
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
      c.icon AS category_icon,
      pc.name AS parent_category_name,
      pc.color AS parent_category_color,
      pc.icon AS parent_category_icon,
      sc.name AS subcategory_name,
      sc.color AS subcategory_color,
      sc.icon AS subcategory_icon
    FROM transactions t
    JOIN wallets w ON w.id = t.wallet_id
    LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN categories pc ON pc.id = COALESCE(t.parent_category_id, t.category_id)
    LEFT JOIN categories sc ON sc.id = t.subcategory_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${transactionOrderBy(filters.sort)}`,
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

export async function fetchInvestments(includeDeleted = false) {
  const db = await getDb();
  const rows = await db.getAllAsync<InvestmentRow>(
    `SELECT * FROM investments ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY date DESC, created_at DESC`
  );
  return rows.map(mapInvestment);
}

export async function createInvestment(
  input: Omit<InvestmentRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO investments (
      id, type, asset_type, asset_name, quantity, unit_price, amount, currency, wallet_id, transaction_id,
      current_value, realized_profit_loss, unrealized_profit_loss, date, note, deleted_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      createId('inv'),
      input.type,
      input.assetType,
      input.assetName.trim(),
      input.quantity ?? null,
      input.unitPrice ?? null,
      input.amount,
      input.currency,
      input.walletId ?? null,
      input.transactionId ?? null,
      input.currentValue ?? null,
      input.realizedProfitLoss ?? null,
      input.unrealizedProfitLoss ?? null,
      input.date,
      input.note?.trim() || null,
      createdAt,
      createdAt,
    ]
  );
}

export async function updateInvestment(input: InvestmentRecord) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE investments SET
      type = ?, asset_type = ?, asset_name = ?, quantity = ?, unit_price = ?, amount = ?, currency = ?,
      wallet_id = ?, transaction_id = ?, current_value = ?, realized_profit_loss = ?, unrealized_profit_loss = ?,
      date = ?, note = ?, updated_at = ?
    WHERE id = ?`,
    [
      input.type,
      input.assetType,
      input.assetName.trim(),
      input.quantity ?? null,
      input.unitPrice ?? null,
      input.amount,
      input.currency,
      input.walletId ?? null,
      input.transactionId ?? null,
      input.currentValue ?? null,
      input.realizedProfitLoss ?? null,
      input.unrealizedProfitLoss ?? null,
      input.date,
      input.note?.trim() || null,
      timestamp(),
      input.id,
    ]
  );
}

export async function deleteInvestment(id: string) {
  const db = await getDb();
  const deletedAt = timestamp();
  await db.runAsync('UPDATE investments SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    deletedAt,
    deletedAt,
    id,
  ]);
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
        counterparty, related_transaction_id, fee_amount, fee_currency, metadata, parent_category_id, subcategory_id, deleted_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        normalized.parentCategoryId,
        normalized.subcategoryId,
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
        parent_category_id = ?,
        subcategory_id = ?,
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
        normalized.parentCategoryId,
        normalized.subcategoryId,
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
      id, name, currency, balance, color, icon, sort_order, is_default, is_archived, removed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)`,
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

export async function removeWallet(id: string) {
  const db = await getDb();
  const wallet = await db.getFirstAsync<WalletRow>('SELECT * FROM wallets WHERE id = ?', id);
  if (!wallet) return getWalletRemoveDecision({ transactionCount: 0, balance: 0, isDefault: false });

  const usage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM transactions WHERE wallet_id = ? OR to_wallet_id = ?',
    [id, id]
  );
  const decision = getWalletRemoveDecision({
    transactionCount: usage?.count ?? 0,
    balance: wallet.balance,
    isDefault: Boolean(wallet.is_default),
  });

  if (decision.action === 'hard_delete') {
    await db.runAsync('DELETE FROM wallets WHERE id = ?', id);
    return decision;
  }

  await db.runAsync('UPDATE wallets SET is_archived = 1, removed_at = ?, updated_at = ? WHERE id = ?', [
    timestamp(),
    timestamp(),
    id,
  ]);
  return decision;
}

export async function createCategory(input: Pick<Category, 'name' | 'type' | 'color' | 'icon'> & { parentId?: string | null }) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO categories (
      id, parent_id, name, type, icon, color, sort_order, is_default, is_archived, removed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)`,
    [
      createId('cat'),
      input.parentId ?? null,
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

export async function updateCategory(input: Pick<Category, 'id' | 'name' | 'type' | 'color' | 'icon'> & { parentId?: string | null }) {
  const db = await getDb();
  const updatedAt = timestamp();
  await db.runAsync(
    `UPDATE categories SET parent_id = ?, name = ?, type = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?`,
    [input.parentId ?? null, input.name, input.type, input.color, input.icon, updatedAt, input.id]
  );
}

export async function archiveCategory(id: string) {
  return removeCategory(id);
}

export async function removeCategory(id: string) {
  const db = await getDb();
  const usage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? OR parent_category_id = ? OR subcategory_id = ?',
    [id, id, id]
  );
  const childUsage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM categories WHERE parent_id = ? AND is_archived = 0',
    id
  );
  const decision = getCategoryRemoveDecision(usage?.count ?? 0);

  if (decision.action === 'hard_delete' && (childUsage?.count ?? 0) === 0) {
    await db.runAsync('DELETE FROM categories WHERE id = ?', id);
    return decision;
  }

  const updatedAt = timestamp();
  await db.runAsync('UPDATE categories SET is_archived = 1, removed_at = ?, updated_at = ? WHERE id = ?', [
    updatedAt,
    updatedAt,
    id,
  ]);
  return decision;
}

export async function fetchBudgets(includeRemoved = false, transactions?: TransactionWithMeta[]): Promise<BudgetWithUsage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BudgetRow>(
    `SELECT b.*, c.name AS category_name, c.color AS category_color
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     ${includeRemoved ? '' : 'WHERE b.is_removed = 0'}
     ORDER BY b.created_at DESC`
  );
  const tx = transactions ?? (await fetchTransactions());
  return rows.map((row) => enrichBudgetWithUsage(mapBudget(row), tx, row.category_name, row.category_color));
}

export async function createBudget(input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isRemoved'>) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO budgets (
      id, name, category_id, currency, amount_limit, period, start_date, end_date, notes,
      alert_threshold, is_removed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      createId('budget'),
      input.name,
      input.categoryId ?? null,
      input.currency,
      input.amountLimit,
      input.period,
      input.startDate,
      input.endDate ?? null,
      input.notes ?? null,
      input.alertThreshold,
      createdAt,
      createdAt,
    ]
  );
}

export async function updateBudget(input: Budget) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE budgets SET name = ?, category_id = ?, currency = ?, amount_limit = ?, period = ?,
      start_date = ?, end_date = ?, notes = ?, alert_threshold = ?, is_removed = ?, updated_at = ? WHERE id = ?`,
    [
      input.name,
      input.categoryId ?? null,
      input.currency,
      input.amountLimit,
      input.period,
      input.startDate,
      input.endDate ?? null,
      input.notes ?? null,
      input.alertThreshold,
      input.isRemoved ? 1 : 0,
      timestamp(),
      input.id,
    ]
  );
}

export async function removeBudget(id: string) {
  const db = await getDb();
  await db.runAsync('UPDATE budgets SET is_removed = 1, updated_at = ? WHERE id = ?', [timestamp(), id]);
}

export async function fetchGoals(includeRemoved = false): Promise<GoalWithProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT * FROM goals ${includeRemoved ? '' : "WHERE status != 'removed'"} ORDER BY created_at DESC`
  );
  return rows.map((row) => calculateGoalProgress(mapGoal(row)));
}

export async function createGoal(input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  const createdAt = timestamp();
  await db.runAsync(
    `INSERT INTO goals (
      id, name, type, target_amount, currency, current_amount, monthly_target_amount, deadline,
      linked_wallet_id, notes, icon, color, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      createId('goal'),
      input.name,
      input.type,
      input.targetAmount,
      input.currency,
      input.currentAmount,
      input.monthlyTargetAmount ?? null,
      input.deadline ?? null,
      input.linkedWalletId ?? null,
      input.notes ?? null,
      input.icon,
      input.color,
      input.status,
      createdAt,
      createdAt,
    ]
  );
}

export async function updateGoal(input: Goal) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE goals SET name = ?, type = ?, target_amount = ?, currency = ?, current_amount = ?,
      monthly_target_amount = ?, deadline = ?, linked_wallet_id = ?, notes = ?, icon = ?, color = ?,
      status = ?, updated_at = ? WHERE id = ?`,
    [
      input.name,
      input.type,
      input.targetAmount,
      input.currency,
      input.currentAmount,
      input.monthlyTargetAmount ?? null,
      input.deadline ?? null,
      input.linkedWalletId ?? null,
      input.notes ?? null,
      input.icon,
      input.color,
      input.status,
      timestamp(),
      input.id,
    ]
  );
}

export async function removeGoal(id: string) {
  const db = await getDb();
  await db.runAsync("UPDATE goals SET status = 'removed', updated_at = ? WHERE id = ?", [timestamp(), id]);
}

export async function addGoalContribution(input: Omit<GoalContribution, 'id' | 'createdAt'>) {
  const db = await getDb();
  const goal = await db.getFirstAsync<GoalRow>('SELECT * FROM goals WHERE id = ?', input.goalId);
  if (!goal) throw new Error('Goal not found');
  const nextGoal = applyGoalContribution(mapGoal(goal), input);
  const createdAt = timestamp();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO goal_contributions (
        id, goal_id, amount, currency, date, note, transaction_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createId('goalcontrib'),
        input.goalId,
        input.amount,
        input.currency,
        input.date,
        input.note ?? null,
        input.transactionId ?? null,
        createdAt,
      ]
    );
    await db.runAsync(
      `UPDATE goals SET current_amount = ?, status = ?, updated_at = ? WHERE id = ?`,
      [nextGoal.currentAmount, nextGoal.status, timestamp(), nextGoal.id]
    );
  });
}

export async function fetchGoalContributions(goalId?: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalContributionRow>(
    `SELECT * FROM goal_contributions ${goalId ? 'WHERE goal_id = ?' : ''} ORDER BY date DESC`,
    goalId ? [goalId] : []
  );
  return rows.map(mapGoalContribution);
}

export async function fetchBackupMetadata() {
  const db = await getDb();
  const rows = await db.getAllAsync<BackupMetadataRow>('SELECT * FROM backup_metadata ORDER BY provider');
  return rows.map(mapBackupMetadata);
}

export async function clearFinanceData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM goal_contributions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM budgets');
    await db.runAsync('DELETE FROM investments');
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM wallets');
    await db.runAsync("DELETE FROM app_settings WHERE key IN ('seeded_v1', 'seeded_v2', 'seeded_v3', 'seeded_v4')");
  });
  await seedDatabase(db);
}

export async function exportBackupPayload(settings: AppSettings): Promise<BackupPayload> {
  const [wallets, categories, transactions, currencies, budgets, goals, goalContributions, backupMetadata, investments] = await Promise.all([
    fetchWallets(true),
    fetchCategories(true),
    fetchRawTransactions(true),
    fetchCurrencies(true),
    fetchBudgets(true),
    fetchGoals(true),
    fetchGoalContributions(),
    fetchBackupMetadata(),
    fetchInvestments(true),
  ]);

  return {
    version: 4,
    exportedAt: timestamp(),
    settings,
    wallets,
    categories,
    transactions,
    currencies,
    budgets,
    goals,
    goalContributions,
    backupMetadata,
    investments,
    exchangeRates: defaultRatesToBase,
    reportMetadata: {
      includesSoftDeletedTransactions: true,
      includesRemovedCategoriesAndWallets: true,
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isObject(payload)) throw new Error('Backup must be an object');
  if (payload.version !== 1 && payload.version !== 2 && payload.version !== 3 && payload.version !== 4) throw new Error('Unsupported backup version');
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
    await db.runAsync('DELETE FROM goal_contributions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM budgets');
    await db.runAsync('DELETE FROM investments');
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM wallets');
    await db.runAsync('DELETE FROM currencies');
    if (payload.backupMetadata) {
      await db.runAsync('DELETE FROM backup_metadata');
    }

    for (const currency of payload.currencies ?? []) {
      await db.runAsync(
        `INSERT INTO currencies (
          code, name, symbol, decimal_places, type, is_active, is_favorite, is_default, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          currency.code,
          currency.name,
          currency.symbol,
          currency.decimalPlaces,
          currency.type,
          currency.isActive ? 1 : 0,
          currency.isFavorite ? 1 : 0,
          currency.isDefault ? 1 : 0,
          currency.sortOrder,
          currency.createdAt,
          currency.updatedAt,
        ]
      );
    }

    for (const wallet of payload.wallets) {
      await db.runAsync(
        `INSERT INTO wallets (
          id, name, currency, balance, color, icon, sort_order, is_default, is_archived, removed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet.id,
          wallet.name,
          wallet.currency,
          wallet.balance,
          wallet.color,
          wallet.icon,
          wallet.sortOrder,
          wallet.isDefault ? 1 : 0,
          wallet.isArchived ? 1 : 0,
          wallet.removedAt ?? null,
          wallet.createdAt,
          wallet.updatedAt,
        ]
      );
    }

    for (const category of payload.categories) {
      await db.runAsync(
        `INSERT INTO categories (
          id, parent_id, name, type, icon, color, sort_order, is_default, is_archived, removed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.parentId ?? null,
          category.name,
          category.type,
          category.icon,
          category.color,
          category.sortOrder,
          category.isDefault ? 1 : 0,
          category.isArchived ? 1 : 0,
          category.removedAt ?? null,
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
          counterparty, related_transaction_id, fee_amount, fee_currency, metadata, parent_category_id, subcategory_id, deleted_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          transaction.parentCategoryId ?? transaction.categoryId ?? null,
          transaction.subcategoryId ?? null,
          transaction.deletedAt ?? null,
          transaction.createdAt,
          transaction.updatedAt,
        ]
      );
    }

    for (const investment of payload.investments ?? []) {
      await db.runAsync(
        `INSERT INTO investments (
          id, type, asset_type, asset_name, quantity, unit_price, amount, currency, wallet_id, transaction_id,
          current_value, realized_profit_loss, unrealized_profit_loss, date, note, deleted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          investment.id,
          investment.type,
          investment.assetType,
          investment.assetName,
          investment.quantity ?? null,
          investment.unitPrice ?? null,
          investment.amount,
          investment.currency,
          investment.walletId ?? null,
          investment.transactionId ?? null,
          investment.currentValue ?? null,
          investment.realizedProfitLoss ?? null,
          investment.unrealizedProfitLoss ?? null,
          investment.date,
          investment.note ?? null,
          investment.deletedAt ?? null,
          investment.createdAt,
          investment.updatedAt,
        ]
      );
    }

    for (const budget of payload.budgets ?? []) {
      await db.runAsync(
        `INSERT INTO budgets (
          id, name, category_id, currency, amount_limit, period, start_date, end_date, notes,
          alert_threshold, is_removed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          budget.id,
          budget.name,
          budget.categoryId ?? null,
          budget.currency,
          budget.amountLimit,
          budget.period,
          budget.startDate,
          budget.endDate ?? null,
          budget.notes ?? null,
          budget.alertThreshold,
          budget.isRemoved ? 1 : 0,
          budget.createdAt,
          budget.updatedAt,
        ]
      );
    }

    for (const goal of payload.goals ?? []) {
      await db.runAsync(
        `INSERT INTO goals (
          id, name, type, target_amount, currency, current_amount, monthly_target_amount, deadline,
          linked_wallet_id, notes, icon, color, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goal.id,
          goal.name,
          goal.type,
          goal.targetAmount,
          goal.currency,
          goal.currentAmount,
          goal.monthlyTargetAmount ?? null,
          goal.deadline ?? null,
          goal.linkedWalletId ?? null,
          goal.notes ?? null,
          goal.icon,
          goal.color,
          goal.status,
          goal.createdAt,
          goal.updatedAt,
        ]
      );
    }

    for (const contribution of payload.goalContributions ?? []) {
      await db.runAsync(
        `INSERT INTO goal_contributions (
          id, goal_id, amount, currency, date, note, transaction_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contribution.id,
          contribution.goalId,
          contribution.amount,
          contribution.currency,
          contribution.date,
          contribution.note ?? null,
          contribution.transactionId ?? null,
          contribution.createdAt,
        ]
      );
    }

    for (const metadata of payload.backupMetadata ?? []) {
      await db.runAsync(
        `INSERT INTO backup_metadata (
          id, provider, mode, last_backup_at, auto_backup, status, details, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metadata.id,
          metadata.provider,
          metadata.mode,
          metadata.lastBackupAt ?? null,
          metadata.autoBackup,
          metadata.status,
          metadata.details ?? null,
          timestamp(),
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
    'parent_category',
    'subcategory',
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
      transaction.parentCategoryName,
      transaction.subcategoryName,
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
  const parentExpenses = groupTransactionsByParentCategory(transactions, baseCurrency, 'expense');
  const subcategoryExpenses = groupTransactionsBySubcategory(transactions, baseCurrency, 'expense');
  const parentIncome = groupTransactionsByParentCategory(transactions, baseCurrency, 'income');
  const subcategoryIncome = groupTransactionsBySubcategory(transactions, baseCurrency, 'income');
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
    [['expense_parent_category', 'total'], ...parentExpenses.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['expense_subcategory', 'total'], ...subcategoryExpenses.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['income_category', 'total'], ...income.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['income_parent_category', 'total'], ...parentIncome.map((row) => [row.label, row.total])].map((row) =>
      row.map(escapeCsv)
    ),
    [['income_subcategory', 'total'], ...subcategoryIncome.map((row) => [row.label, row.total])].map((row) =>
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
