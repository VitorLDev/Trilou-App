import * as SQLite from 'expo-sqlite';
import { seedOfficialFortalezaData } from '@/infrastructure/database/seed';
import { migrateDbIfNeeded } from '@/infrastructure/database/migrations';

export const trilouDatabaseName = 'trilou.db';

let initialization: Promise<void> | null = null;

export async function ensureTrilouDatabase(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const db = await SQLite.openDatabaseAsync(trilouDatabaseName);
      await migrateDbIfNeeded(db);
      await seedOfficialFortalezaData(db);
      await db.closeAsync();
    })();
  }

  return initialization;
}