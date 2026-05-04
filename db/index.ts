import * as SQLite from 'expo-sqlite';

// Store the promise — not the resolved value.
// Any concurrent caller awaits the same promise instead of racing to open a second connection.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('rallyzone.db');
  }
  return dbPromise;
}

export async function wipeAllData(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    DELETE FROM mood_entries;
    DELETE FROM trigger_logs;
    DELETE FROM grounding_sessions;
    DELETE FROM prefs;
  `);
}

// ─── Migrations ───────────────────────────────────────────────────────────────
// Each migration runs ONCE when the DB version is below its index.
// To add a new migration: append to this array and bump nothing else.
// The version is tracked automatically via PRAGMA user_version.
// NEVER edit or remove existing migrations — only append new ones.

const MIGRATIONS: string[] = [

  // v1 — initial schema
  `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS mood_entries (
    id          TEXT PRIMARY KEY NOT NULL,
    created_at  INTEGER NOT NULL,
    mood        INTEGER NOT NULL,
    energy      INTEGER NOT NULL,
    sleep       INTEGER NOT NULL,
    slot        TEXT NOT NULL DEFAULT 'am',
    note        TEXT
  );

  CREATE TABLE IF NOT EXISTS trigger_logs (
    id          TEXT PRIMARY KEY NOT NULL,
    created_at  INTEGER NOT NULL,
    event       TEXT NOT NULL,
    reaction    TEXT NOT NULL,
    intensity   INTEGER NOT NULL,
    note        TEXT
  );

  CREATE TABLE IF NOT EXISTS grounding_sessions (
    id          TEXT PRIMARY KEY NOT NULL,
    created_at  INTEGER NOT NULL,
    type        TEXT NOT NULL,
    duration_s  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prefs (
    key         TEXT PRIMARY KEY NOT NULL,
    value       TEXT NOT NULL
  );
  `,

  // v2 — example of how to add a column in a future update:
  // `ALTER TABLE mood_entries ADD COLUMN tags TEXT;`

  // Add future migrations here — one string per version bump.
];

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function initDB(): Promise<void> {
  const database = await getDB();

  // Read current schema version
  const result = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version ?? 0;
  const targetVersion  = MIGRATIONS.length;

  if (currentVersion >= targetVersion) return; // nothing to do

  // Run only the migrations that haven't been applied yet
  for (let i = currentVersion; i < targetVersion; i++) {
    await database.execAsync(MIGRATIONS[i]);
  }

  // Stamp the new version — must use string interpolation, PRAGMA doesn't accept ?
  await database.execAsync(`PRAGMA user_version = ${targetVersion};`);
}