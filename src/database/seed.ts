import type { SQLiteDatabase } from 'expo-sqlite';

import { defaultCurrencyDefinitions } from '../constants/currencies';
import type { Category, CategoryType, Wallet } from '../types';

function nowIso() {
  return new Date().toISOString();
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
    isDefault: true,
    isArchived: false,
    removedAt: null,
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
    isDefault: true,
    isArchived: false,
    removedAt: null,
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
    isDefault: true,
    isArchived: false,
    removedAt: null,
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
    isDefault: true,
    isArchived: false,
    removedAt: null,
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
    isDefault: true,
    isArchived: false,
    removedAt: null,
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

type TaxonomyGroup = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  subcategories: string[];
};

const categoryTaxonomy: TaxonomyGroup[] = [
  { name: 'Food & Drinks', type: 'expense', icon: 'restaurant-outline', color: '#EF4444', subcategories: ['Restaurant', 'Cafe', 'Bar', 'Groceries', 'Snacks', 'Delivery', 'Street food', 'Drinking water', 'Tea & coffee', 'Food subscriptions'] },
  { name: 'Housing & Rent', type: 'expense', icon: 'home-outline', color: '#8B5CF6', subcategories: ['Rent', 'Mortgage', 'Maintenance', 'Common fees', 'Cleaning', 'Furniture', 'Home supplies', 'Repairs', 'Property management'] },
  { name: 'Bills & Utilities', type: 'expense', icon: 'flash-outline', color: '#0EA5E9', subcategories: ['Electricity bill', 'Water bill', 'Internet bill', 'Mobile phone bill', 'Gas bill', 'TV/Streaming bill', 'Waste/garbage fee', 'Utility deposit', 'Late payment fee', 'Service charges'] },
  { name: 'Transportation', type: 'expense', icon: 'car-outline', color: '#F97316', subcategories: ['Fuel', 'Taxi', 'Ride-hailing', 'Public transport', 'Parking', 'Toll fees', 'Car maintenance', 'Motorbike maintenance', 'Vehicle insurance', 'Vehicle tax', 'Fines'] },
  { name: 'Shopping', type: 'expense', icon: 'bag-outline', color: '#EC4899', subcategories: ['Clothes & shoes', 'Bags & accessories', 'Jewelry', 'Electronics', 'Stationery', 'Gifts', 'Drugstore & pharmacy', 'Household items', 'Online shopping', 'Personal care products'] },
  { name: 'Health & Medical', type: 'expense', icon: 'medical-outline', color: '#DC2626', subcategories: ['Doctor', 'Hospital', 'Medicine', 'Pharmacy', 'Dental', 'Eye care', 'Health insurance', 'Medical tests', 'Supplements', 'Emergency medical'] },
  { name: 'Education', type: 'expense', icon: 'school-outline', color: '#6366F1', subcategories: ['School fees', 'Tuition', 'Books', 'Online courses', 'Exam fees', 'Stationery', 'School supplies', 'Training', 'Certification', 'Student expenses'] },
  { name: 'Entertainment', type: 'expense', icon: 'game-controller-outline', color: '#A855F7', subcategories: ['Movies', 'Games', 'Music', 'Subscriptions', 'Events', 'Sports', 'Hobbies', 'Streaming', 'Night out', 'Recreation'] },
  { name: 'Travel', type: 'expense', icon: 'airplane-outline', color: '#0EA5E9', subcategories: ['Flights', 'Hotel', 'Visa', 'Travel insurance', 'Food while traveling', 'Transport while traveling', 'Attractions', 'Souvenirs', 'Luggage', 'Travel fees'] },
  { name: 'Finance Charges', type: 'expense', icon: 'receipt-outline', color: '#F97316', subcategories: ['Bank fees', 'Transfer fees', 'Card fees', 'Exchange fees', 'Interest expense', 'Penalty charges', 'Platform fees', 'Service fees', 'Loan fees', 'ATM fees'] },
  { name: 'Taxes & Government', type: 'expense', icon: 'document-text-outline', color: '#B45309', subcategories: ['Income tax', 'Property tax', 'Vehicle tax', 'Business tax', 'Visa fees', 'Fines', 'Government fees', 'License fees', 'Stamp duty', 'Other taxes'] },
  { name: 'Family & Personal', type: 'expense', icon: 'people-outline', color: '#14B8A6', subcategories: ['Parents', 'Children', 'Partner', 'Family support', 'Donations', 'Religious giving', 'Personal allowance', 'Pet expenses', 'Beauty', 'Laundry'] },
  { name: 'Business Expenses', type: 'expense', icon: 'briefcase-outline', color: '#64748B', subcategories: ['Supplies', 'Software', 'Hosting', 'Marketing', 'Ads', 'Freelance costs', 'Office rent', 'Shipping', 'Business travel', 'Professional services'] },
  { name: 'Losses & Accidents', type: 'expense', icon: 'alert-circle-outline', color: '#DC2626', subcategories: ['Lost money', 'Damaged item', 'Theft', 'Scam', 'Compensation paid', 'Emergency loss', 'Bad debt', 'Accident cost', 'Write-off', 'Other loss'] },
  { name: 'Salary', type: 'income', icon: 'briefcase-outline', color: '#16A34A', subcategories: ['Monthly salary', 'Bonus', 'Overtime', 'Commission', 'Allowance', 'Severance', 'Payroll adjustment'] },
  { name: 'Freelance', type: 'income', icon: 'laptop-outline', color: '#14B8A6', subcategories: ['Project payment', 'Design work', 'Development work', 'Consulting', 'Content work', 'Teaching', 'Translation', 'Service income'] },
  { name: 'Business Income', type: 'income', icon: 'storefront-outline', color: '#0EA5E9', subcategories: ['Product sales', 'Service sales', 'Online sales', 'Shop income', 'Commission income', 'Affiliate income', 'Platform payout', 'Cash sales'] },
  { name: 'Investment Income', type: 'income', icon: 'trending-up-outline', color: '#10B981', subcategories: ['Dividends', 'Interest income', 'Capital gain', 'Crypto gain', 'Stock gain', 'Fund return', 'Rental income', 'Staking reward', 'Cashback reward'] },
  { name: 'Gifts & Support', type: 'income', icon: 'gift-outline', color: '#EC4899', subcategories: ['Gift received', 'Family support', 'Friend support', 'Donation received', 'Lucky money', 'Wedding gift', 'Birthday gift'] },
  { name: 'Refunds', type: 'income', icon: 'refresh-circle-outline', color: '#16A34A', subcategories: ['Shopping refund', 'Tax refund', 'Deposit refund', 'Insurance refund', 'Travel refund', 'Service refund', 'Overpayment refund'] },
  { name: 'Sales', type: 'income', icon: 'cart-outline', color: '#22C55E', subcategories: ['Used item sale', 'Electronics sale', 'Vehicle sale', 'Property sale', 'Online marketplace sale', 'Collectible sale', 'Other sale'] },
  { name: 'Prize & Lottery', type: 'income', icon: 'trophy-outline', color: '#F59E0B', subcategories: ['Lottery', 'Prize', 'Giveaway', 'Competition reward', 'Promotion reward'] },
  { name: 'Compensation', type: 'income', icon: 'medkit-outline', color: '#06B6D4', subcategories: ['Compensation received', 'Insurance claim', 'Damage claim', 'Reimbursement', 'Employer reimbursement', 'Travel reimbursement'] },
  { name: 'Other Income', type: 'income', icon: 'add-circle-outline', color: '#64748B', subcategories: ['Adjustment income', 'Cash found', 'Miscellaneous income', 'Manual correction'] },
  { name: 'Investment Buy', type: 'adjustment', icon: 'bar-chart-outline', color: '#6366F1', subcategories: ['Stock buy', 'Crypto buy', 'Gold buy', 'Fund buy', 'Bond buy', 'Savings product', 'Other asset buy'] },
  { name: 'Investment Sell', type: 'adjustment', icon: 'trending-up-outline', color: '#5E6AD2', subcategories: ['Stock sell', 'Crypto sell', 'Gold sell', 'Fund sell', 'Bond sell', 'Other asset sell'] },
  { name: 'Investment Fees', type: 'expense', icon: 'receipt-outline', color: '#F97316', subcategories: ['Trading fee', 'Platform fee', 'Withdrawal fee', 'Network fee', 'Management fee', 'Tax on investment'] },
  { name: 'Investment Returns', type: 'income', icon: 'sparkles-outline', color: '#14B8A6', subcategories: ['Dividend', 'Interest', 'Staking reward', 'Capital gain', 'Realized profit', 'Cashback'] },
  { name: 'Transfers & Exchange', type: 'transfer', icon: 'swap-horizontal-outline', color: '#6366F1', subcategories: ['Wallet transfer', 'Currency exchange', 'Cash withdrawal', 'Cash deposit', 'Opening balance correction'] },
  { name: 'Loans & Debt', type: 'loan', icon: 'arrow-up-circle-outline', color: '#F97316', subcategories: ['Loan given', 'Loan received', 'Repayment paid', 'Repayment received', 'Interest payment', 'Debt adjustment'] },
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function insertSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)',
    key,
    value,
    nowIso()
  );
}

async function insertDefaultCategories(db: SQLiteDatabase) {
  let groupIndex = 0;
  for (const group of categoryTaxonomy) {
    const createdAt = nowIso();
    const parentId = `cat_v7_${slug(group.name)}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (
        id, parent_id, name, type, icon, color, sort_order, is_default, is_archived, removed_at, created_at, updated_at
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, 1, 0, NULL, ?, ?)`,
      [
        parentId,
        group.name,
        group.type,
        group.icon,
        group.color,
        groupIndex * 100,
        createdAt,
        createdAt,
      ]
    );

    for (let index = 0; index < group.subcategories.length; index += 1) {
      const name = group.subcategories[index];
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (
          id, parent_id, name, type, icon, color, sort_order, is_default, is_archived, removed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, NULL, ?, ?)`,
        [
          `cat_v7_${slug(group.name)}_${slug(name)}`,
          parentId,
          name,
          group.type,
          group.icon,
          group.color,
          groupIndex * 100 + index + 1,
          nowIso(),
          nowIso(),
        ]
      );
    }
    groupIndex += 1;
  }
}

async function insertDefaultCurrencies(db: SQLiteDatabase) {
  for (const currency of defaultCurrencyDefinitions) {
    const createdAt = nowIso();
    await db.runAsync(
      `INSERT OR IGNORE INTO currencies (
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
        createdAt,
        createdAt,
      ]
    );
  }
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
  const seededV3 = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    'seeded_v3'
  );
  const seededV4 = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    'seeded_v4'
  );

  await db.withTransactionAsync(async () => {
    if (seededV3?.value !== 'true') {
      await insertDefaultCurrencies(db);
      await db.runAsync(
        `INSERT OR IGNORE INTO backup_metadata (
          id, provider, mode, last_backup_at, auto_backup, status, details, updated_at
        ) VALUES ('google_backup', 'google', 'replace', NULL, 'off', 'needs_setup', ?, ?)`,
        [
          'Google backup is scaffolded. Configure OAuth client IDs before enabling sign-in.',
          nowIso(),
        ]
      );
    }

    if (seededV1?.value !== 'true') {
      for (const wallet of wallets) {
        await db.runAsync(
          `INSERT OR IGNORE INTO wallets (
            id, name, currency, balance, color, icon, sort_order, is_default, is_archived, removed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
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
            wallet.createdAt,
            wallet.updatedAt,
          ]
        );
      }
    }

    if (seededV2?.value !== 'true' || seededV4?.value !== 'true') {
      await insertDefaultCategories(db);
    }

    if (seededV1?.value !== 'true') {
      await insertSetting(db, 'seeded_v1', 'true');
    }

    await insertSetting(db, 'seeded_v2', 'true');
    await insertSetting(db, 'seeded_v3', 'true');
    await insertSetting(db, 'seeded_v4', 'true');
  });
}
