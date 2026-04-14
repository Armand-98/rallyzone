import { getDB } from './index';

export async function initPrefsTable(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS prefs (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export async function setPref(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO prefs (key, value) VALUES (?, ?);`,
    [key, value]
  );
}

export async function getPref(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM prefs WHERE key = ?;`,
    [key]
  );
  return row?.value ?? null;
}