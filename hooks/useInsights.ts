import { getDB } from '../db';

export interface InsightsSummary {
  avgMood7:             number | null;
  avgMood30:            number | null;
  moodTrend:            'improving' | 'declining' | 'stable' | 'insufficient';
  bestDayOfWeek:        string | null;
  worstDayOfWeek:       string | null;
  avgEnergy7:           number | null;
  avgSleep7:            number | null;
  avgIntensity30:       number | null;
  highIntensityDays:    number;
  topTriggerWords:      string[];
  groundingSessions30:  number;
  avgGroundingDuration: number | null;
  amEntries:            number;
  pmEntries:            number;
  totalEntries:         number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export async function getInsights(): Promise<InsightsSummary> {
  const db = await getDB();

  const t7  = daysAgo(7);
  const t30 = daysAgo(30);

  // Mood entries last 30 days
  const moodRows = await db.getAllAsync<{
    created_at: number;
    mood: number;
    energy: number;
    sleep: number;
    slot: string;
  }>(
    `SELECT created_at, mood, energy, sleep, slot FROM mood_entries WHERE created_at >= ? ORDER BY created_at ASC`,
    [t30]
  );

  const mood7   = moodRows.filter(r => r.created_at >= t7).map(r => r.mood);
  const mood30  = moodRows.map(r => r.mood);
  const energy7 = moodRows.filter(r => r.created_at >= t7).map(r => r.energy);
  const sleep7  = moodRows.filter(r => r.created_at >= t7).map(r => r.sleep);

  // Mood trend — compare first half vs second half of last 30 days
  let moodTrend: InsightsSummary['moodTrend'] = 'insufficient';
  if (mood30.length >= 6) {
    const mid    = Math.floor(mood30.length / 2);
    const first  = avg(mood30.slice(0, mid))!;
    const second = avg(mood30.slice(mid))!;
    const diff   = second - first;
    if (diff > 0.3)       moodTrend = 'improving';
    else if (diff < -0.3) moodTrend = 'declining';
    else                  moodTrend = 'stable';
  }

  // Best/worst day of week
  const dayBuckets: Record<number, number[]> = {};
  for (const r of moodRows) {
    const dow = new Date(r.created_at).getDay();
    if (!dayBuckets[dow]) dayBuckets[dow] = [];
    dayBuckets[dow].push(r.mood);
  }
  let bestDay:  string | null = null;
  let worstDay: string | null = null;
  if (Object.keys(dayBuckets).length >= 3) {
    const avgs = Object.entries(dayBuckets).map(([dow, vals]) => ({
      dow: parseInt(dow),
      avg: avg(vals)!,
    }));
    avgs.sort((a, b) => b.avg - a.avg);
    bestDay  = DAYS[avgs[0].dow];
    worstDay = DAYS[avgs[avgs.length - 1].dow];
  }

  const amEntries = moodRows.filter(r => r.slot === 'am').length;
  const pmEntries = moodRows.filter(r => r.slot === 'pm').length;

  // Trigger logs last 30 days
  const triggerRows = await db.getAllAsync<{
    created_at: number;
    event: string;
    intensity: number;
  }>(
    `SELECT created_at, event, intensity FROM trigger_logs WHERE created_at >= ? ORDER BY created_at ASC`,
    [t30]
  );

  const intensities = triggerRows.map(r => r.intensity);
  const highIntensityDays = new Set(
    triggerRows
      .filter(r => r.intensity >= 7)
      .map(r => new Date(r.created_at).toDateString())
  ).size;

  const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','my','i','was','it','is','that','this','got','felt','had','when','just','so','me','he','she','they','we','you','did','do','be','as','up','out','not','by','have','from','get','been']);
  const wordCount: Record<string, number> = {};
  for (const r of triggerRows) {
    const words = r.event.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
  }
  const topTriggerWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Grounding sessions last 30 days
  const groundingRows = await db.getAllAsync<{ duration_s: number }>(
    `SELECT duration_s FROM grounding_sessions WHERE created_at >= ?`,
    [t30]
  );

  return {
    avgMood7:             avg(mood7),
    avgMood30:            avg(mood30),
    moodTrend,
    bestDayOfWeek:        bestDay,
    worstDayOfWeek:       worstDay,
    avgEnergy7:           avg(energy7),
    avgSleep7:            avg(sleep7),
    avgIntensity30:       avg(intensities),
    highIntensityDays,
    topTriggerWords,
    groundingSessions30:  groundingRows.length,
    avgGroundingDuration: avg(groundingRows.map(r => r.duration_s)),
    amEntries,
    pmEntries,
    totalEntries:         moodRows.length,
  };
}