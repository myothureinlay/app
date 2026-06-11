import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultRatesToBase } from '../constants/currencies';
import { getWalletDeltas } from '../logic/ledger';
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
    icon: 'wallet-outline',
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
    icon: 'cash-outline',
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
    icon: 'card-outline',
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
    icon: 'business-outline',
    sortOrder: 5,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const defaultCategoryGroups: Array<Pick<Category, 'id' | 'name' | 'type' | 'icon' | 'color' | 'sortOrder'>> = [
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'briefcase-outline', color: '#16A34A', sortOrder: 1 },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: 'laptop-outline', color: '#14B8A6', sortOrder: 2 },
  { id: 'cat_business', name: 'Business', type: 'income', icon: 'storefront-outline', color: '#0EA5E9', sortOrder: 3 },
  { id: 'cat_crypto', name: 'Crypto', type: 'income', icon: 'logo-bitcoin', color: '#F59E0B', sortOrder: 4 },
  { id: 'cat_gift', name: 'Gift', type: 'income', icon: 'gift-outline', color: '#EC4899', sortOrder: 5 },
  { id: 'cat_bonus', name: 'Bonus', type: 'income', icon: 'sparkles-outline', color: '#22C55E', sortOrder: 6 },
  { id: 'cat_refund', name: 'Refund', type: 'income', icon: 'refresh-circle-outline', color: '#16A34A', sortOrder: 7 },
  { id: 'cat_interest_income', name: 'Interest Income', type: 'income', icon: 'trending-up-outline', color: '#10B981', sortOrder: 8 },
  { id: 'cat_compensation_received', name: 'Compensation Received', type: 'income', icon: 'medkit-outline', color: '#06B6D4', sortOrder: 9 },
  { id: 'cat_other_income', name: 'Other Income', type: 'income', icon: 'add-circle-outline', color: '#64748B', sortOrder: 10 },

  { id: 'cat_rent', name: 'Rent', type: 'expense', icon: 'home-outline', color: '#8B5CF6', sortOrder: 101 },
  { id: 'cat_food', name: 'Food', type: 'expense', icon: 'restaurant-outline', color: '#EF4444', sortOrder: 102 },
  { id: 'cat_transport', name: 'Transport', type: 'expense', icon: 'car-outline', color: '#F97316', sortOrder: 103 },
  { id: 'cat_bills', name: 'Bills', type: 'expense', icon: 'flash-outline', color: '#0EA5E9', sortOrder: 104 },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'bag-outline', color: '#EC4899', sortOrder: 105 },
  { id: 'cat_family_support', name: 'Family Support', type: 'expense', icon: 'people-outline', color: '#14B8A6', sortOrder: 106 },
  { id: 'cat_health', name: 'Health', type: 'expense', icon: 'heart-outline', color: '#EF4444', sortOrder: 107 },
  { id: 'cat_education', name: 'Education', type: 'expense', icon: 'school-outline', color: '#6366F1', sortOrder: 108 },
  { id: 'cat_travel', name: 'Travel', type: 'expense', icon: 'airplane-outline', color: '#0EA5E9', sortOrder: 109 },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'game-controller-outline', color: '#A855F7', sortOrder: 110 },
  { id: 'cat_subscriptions', name: 'Subscriptions', type: 'expense', icon: 'repeat-outline', color: '#64748B', sortOrder: 111 },
  { id: 'cat_tax', name: 'Tax', type: 'expense', icon: 'document-text-outline', color: '#B45309', sortOrder: 112 },
  { id: 'cat_bank_fee', name: 'Bank Fee', type: 'expense', icon: 'receipt-outline', color: '#F97316', sortOrder: 113 },
  { id: 'cat_service_fee', name: 'Service Fee', type: 'expense', icon: 'pricetag-outline', color: '#F97316', sortOrder: 114 },
  { id: 'cat_interest_expense', name: 'Interest Expense', type: 'expense', icon: 'time-outline', color: '#F59E0B', sortOrder: 115 },
  { id: 'cat_compensation_paid', name: 'Compensation Paid', type: 'expense', icon: 'shield-outline', color: '#A855F7', sortOrder: 116 },
  { id: 'cat_loss', name: 'Loss', type: 'expense', icon: 'alert-circle-outline', color: '#DC2626', sortOrder: 117 },
  { id: 'cat_donation', name: 'Donation', type: 'expense', icon: 'hand-left-outline', color: '#14B8A6', sortOrder: 118 },
  { id: 'cat_emergency', name: 'Emergency', type: 'expense', icon: 'medical-outline', color: '#E11D48', sortOrder: 119 },
  { id: 'cat_other_expense', name: 'Other Expense', type: 'expense', icon: 'remove-circle-outline', color: '#64748B', sortOrder: 120 },

  { id: 'cat_exchange', name: 'Exchange', type: 'transfer', icon: 'swap-horizontal-outline', color: '#6366F1', sortOrder: 201 },
  { id: 'cat_transfer', name: 'Transfer', type: 'transfer', icon: 'repeat-outline', color: '#64748B', sortOrder: 202 },
  { id: 'cat_adjustment', name: 'Adjustment', type: 'adjustment', icon: 'options-outline', color: '#64748B', sortOrder: 203 },
  { id: 'cat_investment', name: 'Investment', type: 'adjustment', icon: 'bar-chart-outline', color: '#6366F1', sortOrder: 204 },

  { id: 'cat_loan_given', name: 'Loan Given', type: 'loan', icon: 'arrow-up-circle-outline', color: '#F97316', sortOrder: 301 },
  { id: 'cat_loan_received', name: 'Loan Received', type: 'debt', icon: 'arrow-down-circle-outline', color: '#0EA5E9', sortOrder: 302 },
  { id: 'cat_loan_repayment_paid', name: 'Loan Repayment Paid', type: 'debt', icon: 'return-up-forward-outline', color: '#FB7185', sortOrder: 303 },
  { id: 'cat_loan_repayment_received', name: 'Loan Repayment Received', type: 'loan', icon: 'return-down-back-outline', color: '#22C55E', sortOrder: 304 },
  { id: 'cat_personal_debt', name: 'Personal Debt', type: 'debt', icon: 'person-outline', color: '#0EA5E9', sortOrder: 305 },
  { id: 'cat_family_loan', name: 'Family Loan', type: 'loan', icon: 'people-outline', color: '#14B8A6', sortOrder: 306 },
  { id: 'cat_business_loan', name: 'Business Loan', type: 'loan', icon: 'briefcase-outline', color: '#6366F1', sortOrder: 307 },
  { id: 'cat_bank_loan', name: 'Bank Loan', type: 'debt', icon: 'business-outline', color: '#64748B', sortOrder: 308 },
  { id: 'cat_credit_card', name: 'Credit Card', type: 'debt', icon: 'card-outline', color: '#EF4444', sortOrder: 309 },
  { id: 'cat_other_loan', name: 'Other Loan', type: 'loan', icon: 'help-circle-outline', color: '#64748B', sortOrder: 310 },
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
    type: 'exchange',
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
    feeAmount: 2,
    feeCurrency: 'USDT',
  },
  {
    type: 'transfer',
    amount: 200,
    currency: 'USDT',
    walletId: 'wallet_binance_usdt',
    toWalletId: 'wallet_usd_cash',
    toAmount: 200,
    toCurrency: 'USD',
    categoryId: 'cat_transfer',
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
    type: 'loan_received',
    amount: 300000,
    currency: 'MMK',
    walletId: 'wallet_cash_mmk',
    categoryId: 'cat_loan_received',
    date: dateDaysAgo(1),
    counterparty: 'Family',
    note: 'Short-term family loan',
    exchangeRate: defaultRatesToBase.USD.MMK,
    baseCurrency,
    baseAmount: baseAmount(300000, 'MMK'),
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

async function insertDefaultCategories(db: SQLiteDatabase) {
  for (const category of defaultCategoryGroups) {
    const createdAt = nowIso();
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (
        id, name, type, icon, color, sort_order, is_default, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [
        category.id,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.sortOrder,
        createdAt,
        createdAt,
      ]
    );
  }
}

async function applyWalletMovement(db: SQLiteDatabase, input: CreateTransactionInput) {
  const updatedAt = nowIso();
  for (const delta of getWalletDeltas({ ...input, feeAmount: input.feeAmount ?? 0 })) {
    await db.runAsync('UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?', [
      delta.amount,
      updatedAt,
      delta.walletId,
    ]);
  }
}

async function insertSeedTransaction(db: SQLiteDatabase, input: CreateTransactionInput) {
  const timestamp = nowIso();
  await db.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
      category_id, date, note, exchange_rate, base_currency, base_amount,
      counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      input.counterparty?.trim() || null,
      input.relatedTransactionId ?? null,
      input.feeAmount ?? 0,
      input.feeCurrency ?? null,
      input.metadata ?? null,
      null,
      timestamp,
      timestamp,
    ]
  );
  await applyWalletMovement(db, input);
}

export async function seedDatabase(db: SQLiteDatabase) {
  const seededV1 = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    'seeded_v1'
  );
  const seededV2 = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    'seeded_v2'
  );

  await db.withTransactionAsync(async () => {
    if (seededV1?.value !== 'true') {
      for (const wallet of wallets) {
        await db.runAsync(
          `INSERT OR IGNORE INTO wallets (
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
    }

    if (seededV2?.value !== 'true') {
      await insertDefaultCategories(db);
    }

    if (seededV1?.value !== 'true') {
      for (const transaction of transactions) {
        await insertSeedTransaction(db, transaction);
      }

      await insertSetting(db, 'seeded_v1', 'true');
    }

    await insertSetting(db, 'seeded_v2', 'true');
  });
}
