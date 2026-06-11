import type { SQLiteDatabase } from 'expo-sqlite';

const transactionTypeCheck = `
  type IN (
    'income', 'expense', 'exchange', 'adjustment', 'loan_given', 'loan_received',
    'loan_repayment_paid', 'loan_repayment_received', 'interest_income', 'interest_expense',
    'fee', 'loss', 'compensation_received', 'compensation_paid', 'refund', 'tax',
    'investment', 'transfer'
  )
`;

const categoryTypeCheck = `
  type IN ('income', 'expense', 'loan', 'debt', 'transfer', 'adjustment', 'other')
`;

async function createIndexes(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(currency);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(is_archived);
  `);
}

async function createSchemaV2(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('USDT', 'USD', 'MMK', 'THB')),
      balance REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (${categoryTypeCheck}),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (${transactionTypeCheck}),
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL CHECK (currency IN ('USDT', 'USD', 'MMK', 'THB')),
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      to_amount REAL,
      to_currency TEXT CHECK (to_currency IN ('USDT', 'USD', 'MMK', 'THB')),
      category_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      exchange_rate REAL NOT NULL CHECK (exchange_rate > 0),
      base_currency TEXT NOT NULL CHECK (base_currency IN ('USD', 'MMK', 'THB')),
      base_amount REAL NOT NULL CHECK (base_amount >= 0),
      counterparty TEXT,
      related_transaction_id TEXT,
      fee_amount REAL NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
      fee_currency TEXT CHECK (fee_currency IN ('USDT', 'USD', 'MMK', 'THB')),
      metadata TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  await createIndexes(db);
  await db.execAsync('PRAGMA user_version = 2;');
}

async function migrateV1ToV2(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (${categoryTypeCheck}),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR REPLACE INTO categories_v2 (
      id, name, type, icon, color, sort_order, is_default, is_archived, created_at, updated_at
    )
    SELECT
      id,
      name,
      CASE
        WHEN type IN ('income', 'expense', 'transfer') THEN type
        ELSE 'other'
      END,
      icon,
      color,
      sort_order,
      is_default,
      is_archived,
      created_at,
      updated_at
    FROM categories;

    DROP TABLE categories;
    ALTER TABLE categories_v2 RENAME TO categories;

    CREATE TABLE IF NOT EXISTS transactions_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (${transactionTypeCheck}),
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL CHECK (currency IN ('USDT', 'USD', 'MMK', 'THB')),
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      to_amount REAL,
      to_currency TEXT CHECK (to_currency IN ('USDT', 'USD', 'MMK', 'THB')),
      category_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      exchange_rate REAL NOT NULL CHECK (exchange_rate > 0),
      base_currency TEXT NOT NULL CHECK (base_currency IN ('USD', 'MMK', 'THB')),
      base_amount REAL NOT NULL CHECK (base_amount >= 0),
      counterparty TEXT,
      related_transaction_id TEXT,
      fee_amount REAL NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
      fee_currency TEXT CHECK (fee_currency IN ('USDT', 'USD', 'MMK', 'THB')),
      metadata TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    INSERT OR REPLACE INTO transactions_v2 (
      id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
      category_id, date, note, exchange_rate, base_currency, base_amount,
      counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
      created_at, updated_at
    )
    SELECT
      id,
      CASE WHEN type = 'transfer' THEN 'transfer' ELSE type END,
      amount,
      currency,
      wallet_id,
      to_wallet_id,
      to_amount,
      to_currency,
      category_id,
      date,
      note,
      exchange_rate,
      base_currency,
      base_amount,
      NULL,
      NULL,
      0,
      NULL,
      NULL,
      NULL,
      created_at,
      updated_at
    FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_v2 RENAME TO transactions;
  `);

  await createIndexes(db);
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA user_version = 2;');
}

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = version?.user_version ?? 0;

  if (currentVersion < 1) {
    await createSchemaV2(db);
    return;
  }

  if (currentVersion < 2) {
    await migrateV1ToV2(db);
  }
}
