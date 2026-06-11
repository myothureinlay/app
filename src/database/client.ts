import * as SQLite from 'expo-sqlite';

import { migrateDatabase } from './schema';
import { seedDatabase } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('personal_finance.db');
  }
  return dbPromise;
}

export async function initializeDatabase() {
  if (!initializePromise) {
    initializePromise = (async () => {
      const db = await getDatabase();
      await migrateDatabase(db);
      await seedDatabase(db);
      return db;
    })().catch((error) => {
      initializePromise = null;
      throw error;
    });
  }

  return initializePromise;
}
