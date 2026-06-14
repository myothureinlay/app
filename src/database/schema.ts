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
    CREATE INDEX IF NOT EXISTS idx_transactions_parent_category ON transactions(parent_category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_subcategory ON transactions(subcategory_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(is_archived);
    CREATE INDEX IF NOT EXISTS idx_wallets_archived ON wallets(is_archived);
    CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
    CREATE INDEX IF NOT EXISTS idx_budgets_removed ON budgets(is_removed);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
    CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goal_id);
    CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date);
    CREATE INDEX IF NOT EXISTS idx_investments_asset_type ON investments(asset_type);
    CREATE INDEX IF NOT EXISTS idx_investments_deleted_at ON investments(deleted_at);
  `);
}

async function addColumnIfMissing(db: SQLiteDatabase, tableName: string, columnName: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
  }
}

async function createFeatureTables(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      decimal_places INTEGER NOT NULL DEFAULT 2,
      type TEXT NOT NULL CHECK (type IN ('fiat', 'crypto', 'custom')),
      is_active INTEGER NOT NULL DEFAULT 1,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT,
      currency TEXT NOT NULL,
      amount_limit REAL NOT NULL CHECK (amount_limit >= 0),
      period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly', 'custom')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT,
      alert_threshold REAL NOT NULL DEFAULT 80,
      is_removed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('target_amount', 'monthly_saving', 'emergency_fund', 'debt_payoff', 'custom')),
      target_amount REAL NOT NULL CHECK (target_amount >= 0),
      currency TEXT NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
      monthly_target_amount REAL,
      deadline TEXT,
      linked_wallet_id TEXT,
      notes TEXT,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'removed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (linked_wallet_id) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS goal_contributions (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      transaction_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE TABLE IF NOT EXISTS backup_metadata (
      id TEXT PRIMARY KEY NOT NULL,
      provider TEXT NOT NULL CHECK (provider IN ('local', 'google')),
      mode TEXT NOT NULL CHECK (mode IN ('replace', 'append')),
      last_backup_at TEXT,
      auto_backup TEXT NOT NULL CHECK (auto_backup IN ('off', 'daily', 'weekly', 'monthly')),
      status TEXT NOT NULL CHECK (status IN ('ready', 'needs_setup', 'failed')),
      details TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_theme_settings (
      id TEXT PRIMARY KEY NOT NULL,
      primary_color TEXT NOT NULL,
      secondary_color TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      background_color TEXT NOT NULL,
      surface_color TEXT NOT NULL,
      text_color TEXT NOT NULL,
      success_color TEXT NOT NULL,
      warning_color TEXT NOT NULL,
      danger_color TEXT NOT NULL,
      border_color TEXT NOT NULL,
      border_radius INTEGER NOT NULL,
      card_style TEXT NOT NULL CHECK (card_style IN ('flat', 'soft', 'elevated')),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'income', 'fee', 'valuation')),
      asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'gold', 'fund', 'bond', 'cash_savings', 'real_estate', 'collectible', 'other')),
      asset_name TEXT NOT NULL,
      quantity REAL,
      unit_price REAL,
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL,
      wallet_id TEXT,
      transaction_id TEXT,
      current_value REAL,
      realized_profit_loss REAL,
      unrealized_profit_loss REAL,
      date TEXT NOT NULL,
      note TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
  `);
}

async function createSchemaV3(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      removed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (${categoryTypeCheck}),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      removed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (${transactionTypeCheck}),
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      to_amount REAL,
      to_currency TEXT,
      category_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      exchange_rate REAL NOT NULL CHECK (exchange_rate > 0),
      base_currency TEXT NOT NULL,
      base_amount REAL NOT NULL CHECK (base_amount >= 0),
      counterparty TEXT,
      related_transaction_id TEXT,
      fee_amount REAL NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
      fee_currency TEXT,
      metadata TEXT,
      parent_category_id TEXT,
      subcategory_id TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (parent_category_id) REFERENCES categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES categories(id)
    );
  `);

  await createFeatureTables(db);
  await createIndexes(db);
  await db.execAsync('PRAGMA user_version = 4;');
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
    SELECT id, name, CASE WHEN type IN ('income', 'expense', 'transfer') THEN type ELSE 'other' END,
      icon, color, sort_order, is_default, is_archived, created_at, updated_at
    FROM categories;

    DROP TABLE categories;
    ALTER TABLE categories_v2 RENAME TO categories;

    CREATE TABLE IF NOT EXISTS transactions_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (${transactionTypeCheck}),
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      to_amount REAL,
      to_currency TEXT,
      category_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      exchange_rate REAL NOT NULL CHECK (exchange_rate > 0),
      base_currency TEXT NOT NULL,
      base_amount REAL NOT NULL CHECK (base_amount >= 0),
      counterparty TEXT,
      related_transaction_id TEXT,
      fee_amount REAL NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
      fee_currency TEXT,
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
    SELECT id, CASE WHEN type = 'transfer' THEN 'transfer' ELSE type END, amount, currency, wallet_id,
      to_wallet_id, to_amount, to_currency, category_id, date, note, exchange_rate, base_currency,
      base_amount, NULL, NULL, 0, NULL, NULL, NULL, created_at, updated_at
    FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_v2 RENAME TO transactions;
  `);

  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA user_version = 2;');
}

async function migrateV2ToV3(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets_v3 (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      removed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR REPLACE INTO wallets_v3 (
      id, name, currency, balance, color, icon, sort_order, is_default, is_archived, removed_at, created_at, updated_at
    )
    SELECT id, name, currency, balance, color, icon, sort_order,
      CASE WHEN id LIKE 'wallet_%' THEN 1 ELSE 0 END,
      is_archived,
      CASE WHEN is_archived = 1 THEN updated_at ELSE NULL END,
      created_at, updated_at
    FROM wallets;

    DROP TABLE wallets;
    ALTER TABLE wallets_v3 RENAME TO wallets;

    CREATE TABLE IF NOT EXISTS categories_v3 (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (${categoryTypeCheck}),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      removed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR REPLACE INTO categories_v3 (
      id, name, type, icon, color, sort_order, is_default, is_archived, removed_at, created_at, updated_at
    )
    SELECT id, name, type, icon, color, sort_order, is_default, is_archived,
      CASE WHEN is_archived = 1 THEN updated_at ELSE NULL END,
      created_at, updated_at
    FROM categories;

    DROP TABLE categories;
    ALTER TABLE categories_v3 RENAME TO categories;

    CREATE TABLE IF NOT EXISTS transactions_v3 (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (${transactionTypeCheck}),
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      to_amount REAL,
      to_currency TEXT,
      category_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      exchange_rate REAL NOT NULL CHECK (exchange_rate > 0),
      base_currency TEXT NOT NULL,
      base_amount REAL NOT NULL CHECK (base_amount >= 0),
      counterparty TEXT,
      related_transaction_id TEXT,
      fee_amount REAL NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
      fee_currency TEXT,
      metadata TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    INSERT OR REPLACE INTO transactions_v3 (
      id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
      category_id, date, note, exchange_rate, base_currency, base_amount,
      counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
      created_at, updated_at
    )
    SELECT id, type, amount, currency, wallet_id, to_wallet_id, to_amount, to_currency,
      category_id, date, note, exchange_rate, base_currency, base_amount,
      counterparty, related_transaction_id, fee_amount, fee_currency, metadata, deleted_at,
      created_at, updated_at
    FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_v3 RENAME TO transactions;
  `);

  await createFeatureTables(db);
  await createIndexes(db);
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA user_version = 3;');
}

async function migrateV3ToV4(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  await addColumnIfMissing(db, 'categories', 'parent_id', 'parent_id TEXT');
  await addColumnIfMissing(db, 'transactions', 'parent_category_id', 'parent_category_id TEXT');
  await addColumnIfMissing(db, 'transactions', 'subcategory_id', 'subcategory_id TEXT');
  await db.runAsync('UPDATE transactions SET parent_category_id = category_id WHERE parent_category_id IS NULL AND category_id IS NOT NULL');

  await createFeatureTables(db);
  await createIndexes(db);
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA user_version = 4;');
}

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = version?.user_version ?? 0;

  if (currentVersion < 1) {
    await createSchemaV3(db);
    return;
  }

  if (currentVersion < 2) {
    await migrateV1ToV2(db);
  }

  const afterV2 = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((afterV2?.user_version ?? currentVersion) < 3) {
    await migrateV2ToV3(db);
  }

  const afterV3 = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((afterV3?.user_version ?? currentVersion) < 4) {
    await migrateV3ToV4(db);
  }
}
