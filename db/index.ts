import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('rallyzone.db');
  }
  return db;
}

export async function initDB(): Promise<void> {
  const database = await getDB();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    DROP TABLE IF EXISTS mood_entries;
    DROP TABLE IF EXISTS trigger_logs;
    DROP TABLE IF EXISTS grounding_sessions;

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
  `);
}