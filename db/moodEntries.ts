import * as Crypto from 'expo-crypto';
import { InsertMoodEntry, MoodEntry } from '../types/db';
import { getDb } from './index';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function upsertMoodEntry(payload: InsertMoodEntry): MoodEntry {
  const db = getDb();
  const id = Crypto.randomUUID();

  db.runSync(
    `INSERT INTO mood_entries
       (id, date, anxiety_level, sleep_quality, mood_score, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       anxiety_level = excluded.anxiety_level,
       sleep_quality = excluded.sleep_quality,
       mood_score    = excluded.mood_score,
       notes         = excluded.notes`,
    [id, payload.date, payload.anxiety_level, payload.sleep_quality, payload.mood_score, payload.notes ?? null]
  );

  return getMoodEntryByDate(payload.date)!;
}

export function getMoodEntryByDate(date: string): MoodEntry | null {
  return getDb().getFirstSync<MoodEntry>(
    `SELECT * FROM mood_entries WHERE date = ?`,
    [date]
  ) ?? null;
}

export function getTodayMoodEntry(): MoodEntry | null {
  return getMoodEntryByDate(todayKey());
}

export function getRecentMoodEntries(days = 30): MoodEntry[] {
  return getDb().getAllSync<MoodEntry>(
    `SELECT * FROM mood_entries ORDER BY date DESC LIMIT ?`,
    [days]
  );
}

export function getAllMoodEntries(): MoodEntry[] {
  return getDb().getAllSync<MoodEntry>(
    `SELECT * FROM mood_entries ORDER BY date DESC`
  );
}

export function deleteMoodEntry(id: string): void {
  getDb().runSync(`DELETE FROM mood_entries WHERE id = ?`, [id]);
}

export function getMoodAverages(days = 30): {
  avgAnxiety:  number;
  avgSleep:    number;
  avgMood:     number;
  sampleCount: number;
} {
  const result = getDb().getFirstSync<{
    avgAnxiety:  number;
    avgSleep:    number;
    avgMood:     number;
    sampleCount: number;
  }>(
    `SELECT
       ROUND(AVG(anxiety_level), 1) as avgAnxiety,
       ROUND(AVG(sleep_quality), 1) as avgSleep,
       ROUND(AVG(mood_score),    1) as avgMood,
       COUNT(*)                     as sampleCount
     FROM mood_entries
     ORDER BY date DESC
     LIMIT ?`,
    [days]
  );
  return result ?? { avgAnxiety: 0, avgSleep: 0, avgMood: 0, sampleCount: 0 };
}