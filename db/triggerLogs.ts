import * as Crypto from 'expo-crypto';
import { InsertTriggerLog, TriggerLog } from '../types/db';
import { getDb } from './index';

export function insertTriggerLog(payload: InsertTriggerLog): TriggerLog {
  const db  = getDb();
  const id  = Crypto.randomUUID();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO trigger_logs
       (id, created_at, event_description, reaction, intensity, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, now, payload.event_description, payload.reaction, payload.intensity, payload.notes ?? null]
  );

  return { id, created_at: now, ...payload };
}

export function getAllTriggerLogs(): TriggerLog[] {
  return getDb().getAllSync<TriggerLog>(
    `SELECT * FROM trigger_logs ORDER BY created_at DESC`
  );
}

export function getRecentTriggerLogs(days = 30): TriggerLog[] {
  const db    = getDb();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return db.getAllSync<TriggerLog>(
    `SELECT * FROM trigger_logs
     WHERE created_at >= ?
     ORDER BY created_at DESC`,
    [since]
  );
}

export function getTriggerLogById(id: string): TriggerLog | null {
  return getDb().getFirstSync<TriggerLog>(
    `SELECT * FROM trigger_logs WHERE id = ?`,
    [id]
  ) ?? null;
}

export function deleteTriggerLog(id: string): void {
  getDb().runSync(`DELETE FROM trigger_logs WHERE id = ?`, [id]);
}

export function getTriggerLogCount(): number {
  const result = getDb().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM trigger_logs`
  );
  return result?.count ?? 0;
}