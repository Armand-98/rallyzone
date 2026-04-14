// ─── Core entity types ────────────────────────────────────────────────────────
// All IDs are UUID strings generated client-side.
// All timestamps are ISO 8601 strings (new Date().toISOString()).

export interface TriggerLog {
  id:                string;
  created_at:        string;
  event_description: string;
  reaction:          string;
  intensity:         number; // 1–10
  notes:             string | null;
}

export interface MoodEntry {
  id:            string;
  date:          string; // YYYY-MM-DD — one row per day, enforced by UNIQUE
  anxiety_level: number; // 1–10
  sleep_quality: number; // 1–10
  mood_score:    number; // 1–10
  notes:         string | null;
}

export interface GroundingSession {
  id:               string;
  created_at:       string;
  session_type:     'breathing_478' | 'sensory_54321';
  duration_seconds: number;
  completed:        boolean;
}

export interface UserPref {
  key:   string;
  value: string;
}

// ─── Pref keys ────────────────────────────────────────────────────────────────
// Using an enum prevents typo bugs when reading/writing prefs.
export enum PrefKey {
  OnboardingComplete    = 'onboarding_complete',
  CallSign              = 'call_sign',          // e.g. "Sergeant", "Firefighter"
  Role                  = 'role',               // 'veteran' | 'first_responder'
  CrisisContactName     = 'crisis_contact_name',
  CrisisContactPhone    = 'crisis_contact_phone',
  PremiumEntitlement    = 'premium_entitlement', // 'true' | 'false'
  LastCheckIn           = 'last_check_in',       // ISO timestamp
}

// ─── Insert payloads ─────────────────────────────────────────────────────────
// Omit server-generated fields from insert shapes.
export type InsertTriggerLog     = Omit<TriggerLog,     'id' | 'created_at'>;
export type InsertMoodEntry      = Omit<MoodEntry,      'id'>;
export type InsertGroundingSession = Omit<GroundingSession, 'id' | 'created_at'>;
