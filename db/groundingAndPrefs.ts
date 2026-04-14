import * as Crypto from 'expo-crypto';
import {
  GroundingSession, InsertGroundingSession,
  PrefKey,
  UserPref,
} from '../types/db';
import { getDb } from './index';

// ── Grounding sessions ────────────────────────────────────────────

export function insertGroundingSession(
  payload: InsertGroundingSession
): GroundingSession {
  const db  = getDb();
  const id  = Crypto.randomUUID();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO grounding_sessions
       (id, created_at, session_type, duration_seconds, completed)
     VALUES (?, ?, ?, ?, ?)`,
    [id, now, payload.session_type, payload.duration_seconds, payload.completed ? 1 : 0]
  );

  return { id, created_at: now, ...payload };
}

export function getRecentGroundingSessions(days = 30): GroundingSession[] {
  const db    = getDb();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows  = db.getAllSync<Omit<GroundingSession,'completed'> & { completed: number }>(
    `SELECT * FROM grounding_sessions
     WHERE created_at >= ?
     ORDER BY created_at DESC`,
    [since]
  );
  return rows.map(r => ({ ...r, completed: r.completed === 1 }));
}

export function getGroundingSessionCount(onlyCompleted = false): number {
  const where  = onlyCompleted ? 'WHERE completed = 1' : '';
  const result = getDb().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM grounding_sessions ${where}`
  );
  return result?.count ?? 0;
}

// ── User prefs ────────────────────────────────────────────────────

export function setPref(key: PrefKey, value: string): void {
  getDb().runSync(
    `INSERT INTO user_prefs (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export function getPref(key: PrefKey): string | null {
  const result = getDb().getFirstSync<UserPref>(
    `SELECT * FROM user_prefs WHERE key = ?`,
    [key]
  );
  return result?.value ?? null;
}

export function getPrefOrDefault(key: PrefKey, defaultValue: string): string {
  return getPref(key) ?? defaultValue;
}

export function deletePref(key: PrefKey): void {
  getDb().runSync(`DELETE FROM user_prefs WHERE key = ?`, [key]);
}

export function setBoolPref(key: PrefKey, value: boolean): void {
  setPref(key, value ? 'true' : 'false');
}

export function getBoolPref(key: PrefKey, defaultValue = false): boolean {
  const val = getPref(key);
  if (val === null) return defaultValue;
  return val === 'true';
}

export function isOnboardingComplete(): boolean {
  return getBoolPref(PrefKey.OnboardingComplete, false);
}