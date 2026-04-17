import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDB } from '../../db/index';
import { getPref } from '../../db/prefs';

const MOODS  = ['ROUGH', 'LOW', 'OKAY', 'GOOD', 'SOLID'];
const ENERGY = ['DRAINED', 'TIRED', 'NEUTRAL', 'CHARGED', 'LOCKED IN'];
const SLEEP  = ['<3 HRS', '3–5 HRS', '5–6 HRS', '6–8 HRS', '8+ HRS'];

const MOOD_COLORS  = ['#4A1515', '#4A3010', '#2A2A20', '#1A3020', '#2D5C32'];
const MOOD_LABELS  = ['ROUGH',   'LOW',     'OKAY',    'GOOD',    'SOLID'];

type Slot = 'am' | 'pm';
type Entry = { mood: number; energy: number; sleep: number; created_at: number; slot: Slot };

function currentSlot(): Slot {
  return new Date().getHours() < 12 ? 'am' : 'pm';
}

function todayBounds() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function thirtyDayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 29);
  return d.getTime();
}

// ─── Scale Row ────────────────────────────────────────────────────────────────
function ScaleRow({ label, options, value, onChange }: {
  label: string; options: string[]; value: number; onChange: (v: number) => void;
}) {
  return (
    <View style={sc.wrap}>
      <Text style={sc.label}>{label}</Text>
      <View style={sc.row}>
        {options.map((opt, i) => {
          const selected = value === i;
          return (
            <TouchableOpacity
              key={i}
              style={[sc.pip, selected && sc.pipOn]}
              onPress={() => onChange(i)}
              activeOpacity={0.7}
            >
              <Text style={[sc.pipText, selected && sc.pipTextOn]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Logged Card ──────────────────────────────────────────────────────────────
function LoggedCard({ entry, slot }: { entry: Entry; slot: Slot }) {
  return (
    <View style={[s.card, s.cardDone]}>
      <View style={s.doneRow}>
        <View style={s.doneBadge}>
          <Text style={s.doneBadgeText}>{slot === 'am' ? 'MORNING' : 'EVENING'} · LOGGED</Text>
        </View>
        <Text style={s.doneTime}>
          {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={s.cardTitle}>Brief complete.</Text>
      <View style={s.divider} />
      <View style={s.statRow}>
        <View style={s.stat}><Text style={s.statLabel}>MOOD</Text><Text style={s.statVal}>{MOODS[entry.mood]}</Text></View>
        <View style={s.stat}><Text style={s.statLabel}>ENERGY</Text><Text style={s.statVal}>{ENERGY[entry.energy]}</Text></View>
        <View style={s.stat}><Text style={s.statLabel}>SLEEP</Text><Text style={s.statVal}>{SLEEP[entry.sleep]}</Text></View>
      </View>
    </View>
  );
}

// ─── Check-In Card ────────────────────────────────────────────────────────────
function CheckInCard({ slot, onSubmit }: { slot: Slot; onSubmit: (mood: number, energy: number, sleep: number) => void }) {
  const [mood,   setMood]   = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep,  setSleep]  = useState<number | null>(null);
  const canSubmit = mood !== null && energy !== null && sleep !== null;

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{slot === 'am' ? 'MORNING BRIEF' : 'EVENING BRIEF'}</Text>
      <Text style={s.cardTitle}>How are you doing?</Text>
      <View style={s.divider} />
      <ScaleRow label="MOOD"   options={MOODS}  value={mood   ?? -1} onChange={setMood}   />
      <ScaleRow label="ENERGY" options={ENERGY} value={energy ?? -1} onChange={setEnergy} />
      <ScaleRow label="SLEEP"  options={SLEEP}  value={sleep  ?? -1} onChange={setSleep}  />
      <TouchableOpacity
        style={[s.btn, !canSubmit && s.btnOff]}
        onPress={() => canSubmit && onSubmit(mood!, energy!, sleep!)}
        disabled={!canSubmit}
        activeOpacity={0.8}
      >
        <Text style={s.btnText}>LOG BRIEF</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 30-Day Heatmap ───────────────────────────────────────────────────────────
function MoodHeatmap({ entries }: { entries: Entry[] }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  // Build map: dateString → latest mood value for that day
  const byDay: Record<string, number> = {};
  for (const e of entries) {
    const key = new Date(e.created_at).toDateString();
    byDay[key] = e.mood; // entries sorted ASC so last write wins = most recent
  }

  const today = new Date().toDateString();

  // Stats: days logged, avg mood
  const logged = Object.keys(byDay).length;
  const moodValues = Object.values(byDay);
  const avgMood = moodValues.length
    ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length)
    : null;

  return (
    <View style={hm.wrapper}>
      <View style={hm.headerRow}>
        <Text style={hm.title}>30-DAY INTEL</Text>
        <View style={hm.statsRow}>
          <Text style={hm.stat}>{logged} days logged</Text>
          {avgMood !== null && (
            <View style={[hm.avgBadge, { backgroundColor: MOOD_COLORS[avgMood] }]}>
              <Text style={hm.avgText}>AVG · {MOOD_LABELS[avgMood]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Grid: 6 columns × 5 rows = 30 cells */}
      <View style={hm.grid}>
        {days.map((day, i) => {
          const key    = day.toDateString();
          const mood   = byDay[key];
          const filled = mood !== undefined;
          const isToday = key === today;
          return (
            <View
              key={i}
              style={[
                hm.cell,
                { backgroundColor: filled ? MOOD_COLORS[mood] : '#161614' },
                isToday && hm.cellToday,
              ]}
            >
              <Text style={[hm.cellDay, filled && hm.cellDayFilled]}>
                {day.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={hm.legend}>
        {MOOD_COLORS.map((color, i) => (
          <View key={i} style={hm.legendItem}>
            <View style={[hm.legendDot, { backgroundColor: color }]} />
            <Text style={hm.legendLabel}>{MOOD_LABELS[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BriefScreen() {
  const [callSign,       setCallSign]       = useState('');
  const [amEntry,        setAmEntry]        = useState<Entry | null>(null);
  const [pmEntry,        setPmEntry]        = useState<Entry | null>(null);
  const [heatmapEntries, setHeatmapEntries] = useState<Entry[]>([]);

  const slot = currentSlot();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'MORNING BRIEF' : hour < 17 ? 'AFTERNOON BRIEF' : 'EVENING BRIEF';

  const loadAll = useCallback(async () => {
    const cs = await getPref('call_sign');
    setCallSign(cs ?? '');

    const db = await getDB();
    const { start, end } = todayBounds();

    // Today's entries
    const rows = await db.getAllAsync<Entry>(
      `SELECT mood, energy, sleep, created_at, slot FROM mood_entries
       WHERE created_at >= ? AND created_at <= ?
       ORDER BY created_at ASC;`,
      [start, end]
    );
    setAmEntry(null); setPmEntry(null);
    for (const row of rows) {
      if (row.slot === 'am') setAmEntry(row);
      if (row.slot === 'pm') setPmEntry(row);
    }

    // 30-day heatmap entries
    const hRows = await db.getAllAsync<Entry>(
      `SELECT mood, energy, sleep, created_at, slot FROM mood_entries
       WHERE created_at >= ?
       ORDER BY created_at ASC;`,
      [thirtyDayStart()]
    );
    setHeatmapEntries(hRows);
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  async function handleSubmit(sl: Slot, mood: number, energy: number, sleep: number) {
    const db = await getDB();
    const id = `me_${Date.now()}`;
    await db.runAsync(
      `INSERT INTO mood_entries (id, created_at, mood, energy, sleep, slot) VALUES (?, ?, ?, ?, ?, ?);`,
      [id, Date.now(), mood, energy, sleep, sl]
    );
    const entry: Entry = { mood, energy, sleep, created_at: Date.now(), slot: sl };
    if (sl === 'am') setAmEntry(entry);
    else setPmEntry(entry);
    // Refresh heatmap
    const hRows = await db.getAllAsync<Entry>(
      `SELECT mood, energy, sleep, created_at, slot FROM mood_entries WHERE created_at >= ? ORDER BY created_at ASC;`,
      [thirtyDayStart()]
    );
    setHeatmapEntries(hRows);
  }

  const otherSlot: Slot = slot === 'am' ? 'pm' : 'am';
  const otherEntry      = slot === 'am' ? pmEntry  : amEntry;
  const currentEntry    = slot === 'am' ? amEntry  : pmEntry;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.label}>{greeting}</Text>
          {callSign ? <Text style={s.callSign}>{callSign.toUpperCase()}</Text> : null}
          <Text style={s.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {currentEntry
          ? <LoggedCard entry={currentEntry} slot={slot} />
          : <CheckInCard slot={slot} onSubmit={(m, e, sl) => handleSubmit(slot, m, e, sl)} />
        }

        {otherEntry && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{otherSlot === 'am' ? 'THIS MORNING' : 'THIS EVENING'}</Text>
            <LoggedCard entry={otherEntry} slot={otherSlot} />
          </View>
        )}

        {!otherEntry && currentEntry && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{otherSlot === 'am' ? 'MORNING BRIEF' : 'EVENING BRIEF'}</Text>
            <View style={s.card}>
              <Text style={{ color: '#3A3A36', fontSize: 14 }}>
                {otherSlot === 'am' ? 'Available tomorrow morning.' : 'Check back this evening.'}
              </Text>
            </View>
          </View>
        )}

        <MoodHeatmap entries={heatmapEntries} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#111110' },
  scroll:        { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  header:        { marginBottom: 24 },
  label:         { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  callSign:      { fontSize: 36, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.5, marginBottom: 4 },
  date:          { fontSize: 13, color: '#5A5A54' },
  card:          { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', padding: 20, marginBottom: 16 },
  cardDone:      { borderColor: '#2E4A30' },
  cardLabel:     { fontSize: 10, fontWeight: '600', color: '#3A3A36', letterSpacing: 0.7, marginBottom: 8 },
  cardTitle:     { fontSize: 18, fontWeight: '700', color: '#B8B6AF', marginBottom: 4 },
  divider:       { height: 1, backgroundColor: '#252523', marginVertical: 16 },
  btn:           { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnOff:        { backgroundColor: '#1A2A1C' },
  btnText:       { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  doneRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  doneBadge:     { backgroundColor: '#1A2E1B', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  doneBadgeText: { color: '#5B8A5F', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  doneTime:      { fontSize: 12, color: '#3A3A36' },
  statRow:       { flexDirection: 'row', gap: 8 },
  stat:          { flex: 1, backgroundColor: '#151514', borderRadius: 8, padding: 12, alignItems: 'center' },
  statLabel:     { fontSize: 9, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.6, marginBottom: 6 },
  statVal:       { fontSize: 11, color: '#B8B6AF', fontWeight: '700', textAlign: 'center' },
  section:       { marginTop: 8 },
  sectionLabel:  { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.7, marginBottom: 10 },
});

const sc = StyleSheet.create({
  wrap:      { marginBottom: 20 },
  label:     { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.7, marginBottom: 10 },
  row:       { flexDirection: 'row', gap: 6 },
  pip:       { flex: 1, backgroundColor: '#151514', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C1A' },
  pipOn:     { backgroundColor: '#141E15', borderColor: '#5B8A5F' },
  pipText:   { fontSize: 9, color: '#2E2E2B', fontWeight: '700', textAlign: 'center' },
  pipTextOn: { color: '#7FBF85' },
});

const hm = StyleSheet.create({
  wrapper:    { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', padding: 20, marginTop: 8 },
  headerRow:  { marginBottom: 16 },
  title:      { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 8 },
  statsRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stat:       { fontSize: 12, color: '#5A5A54' },
  avgBadge:   { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  avgText:    { fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 0.6 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 16 },
  cell:       { width: '14.8%', aspectRatio: 1, borderRadius: 6, justifyContent: 'flex-end', padding: 4 },
  cellToday:  { borderWidth: 1.5, borderColor: '#5B8A5F' },
  cellDay:    { fontSize: 9, color: '#2A2A28', fontWeight: '600' },
  cellDayFilled: { color: '#ffffff60' },
  legend:     { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 2 },
  legendLabel:{ fontSize: 8, color: '#3A3A36', fontWeight: '600' },
});