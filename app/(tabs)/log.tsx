import { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoachMark from '../../components/CoachMark';
import { getDB } from '../../db/index';
import { useTutorial } from '../../hooks/useTutorial';

type TriggerEntry = {
  id: string;
  created_at: number;
  event: string;
  reaction: string;
  intensity: number;
  reflection: string;
};

function IntensityBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={ib.wrap}>
      <Text style={ib.label}>INTENSITY</Text>
      <View style={ib.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const on = value >= n;
          const color = n <= 3 ? '#5B8A5F' : n <= 6 ? '#C8922A' : '#A32D2D';
          return (
            <TouchableOpacity
              key={n}
              style={[ib.pip, on && { backgroundColor: color, borderColor: color }]}
              onPress={() => onChange(n)}
              activeOpacity={0.7}
            >
              <Text style={[ib.num, on && { color: '#fff' }]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={ib.hint}>
        {value === 0 ? 'Tap to rate' : value <= 3 ? 'Manageable' : value <= 6 ? 'Significant' : 'High — consider using Calm tools'}
      </Text>
    </View>
  );
}

function EntryCard({ item }: { item: TriggerEntry }) {
  const intensity = item.intensity;
  const color = intensity <= 3 ? '#5B8A5F' : intensity <= 6 ? '#C8922A' : '#A32D2D';
  const bg    = intensity <= 3 ? '#141E15' : intensity <= 6 ? '#1E1608' : '#1E0808';
  return (
    <View style={ec.card}>
      <View style={ec.top}>
        <Text style={ec.time}>
          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '}
          {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <View style={[ec.badge, { backgroundColor: bg, borderColor: color }]}>
          <Text style={[ec.badgeText, { color }]}>INTENSITY {item.intensity}</Text>
        </View>
      </View>
      <Text style={ec.event}>{item.event}</Text>
      <Text style={ec.reaction}>{item.reaction}</Text>
      {item.reflection ? (
        <View style={ec.reflectionWrap}>
          <Text style={ec.reflectionLabel}>NEXT TIME</Text>
          <Text style={ec.reflection}>{item.reflection}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function LogScreen() {
  const { show: showTutorial, dismiss: dismissTutorial } = useTutorial('tutorial_log_seen');
  const [entries,    setEntries]    = useState<TriggerEntry[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [event,      setEvent]      = useState('');
  const [reaction,   setReaction]   = useState('');
  const [intensity,  setIntensity]  = useState(0);
  const [reflection, setReflection] = useState('');

  const canSubmit = event.trim().length > 0 && reaction.trim().length > 0 && intensity > 0;

  const loadEntries = useCallback(async () => {
    const db = await getDB();
    const rows = await db.getAllAsync<TriggerEntry>(
      `SELECT id, created_at, event, reaction, intensity, note as reflection FROM trigger_logs ORDER BY created_at DESC LIMIT 50;`
    );
    setEntries(rows);
  }, []);

  useEffect(() => { loadEntries(); }, []);

  async function submit() {
    if (!canSubmit) return;
    const db = await getDB();
    const id = `tl_${Date.now()}`;
    await db.runAsync(
      `INSERT INTO trigger_logs (id, created_at, event, reaction, intensity, note) VALUES (?, ?, ?, ?, ?, ?);`,
      [id, Date.now(), event.trim(), reaction.trim(), intensity, reflection.trim()]
    );
    setEvent(''); setReaction(''); setIntensity(0); setReflection(''); setShowForm(false);
    loadEntries();
  }

  function cancel() {
    setEvent(''); setReaction(''); setIntensity(0); setReflection(''); setShowForm(false);
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <Text style={s.label}>TRIGGER LOG</Text>
            <Text style={s.title}>Log an event</Text>
          </View>

          {!showForm ? (
            <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
              <Text style={s.addBtnText}>+ NEW ENTRY</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.form}>
              <Text style={s.formLabel}>WHAT HAPPENED</Text>
              <TextInput
                style={s.input}
                value={event}
                onChangeText={setEvent}
                placeholder="Briefly describe the trigger event"
                placeholderTextColor="#2E2E2B"
                multiline
                maxLength={200}
              />

              <Text style={s.formLabel}>HOW DID YOU REACT</Text>
              <TextInput
                style={s.input}
                value={reaction}
                onChangeText={setReaction}
                placeholder="What was your response or reaction?"
                placeholderTextColor="#2E2E2B"
                multiline
                maxLength={200}
              />

              <IntensityBar value={intensity} onChange={setIntensity} />

              <View style={s.divider} />

              <Text style={s.formLabel}>WHAT WOULD YOU DO DIFFERENTLY</Text>
              <TextInput
                style={s.input}
                value={reflection}
                onChangeText={setReflection}
                placeholder="Optional — how would you handle it next time?"
                placeholderTextColor="#2E2E2B"
                multiline
                maxLength={300}
              />

              <View style={s.formBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={cancel} activeOpacity={0.8}>
                  <Text style={s.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.submitBtn, !canSubmit && s.submitOff]}
                  onPress={submit}
                  disabled={!canSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={s.submitText}>LOG IT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {entries.length > 0 && (
            <View style={s.history}>
              <Text style={s.historyLabel}>RECENT ENTRIES</Text>
              {entries.map(item => <EntryCard key={item.id} item={item} />)}
            </View>
          )}

          {entries.length === 0 && !showForm && (
            <View style={s.empty}>
              <Text style={s.emptyText}>No entries yet. Tap NEW ENTRY to log your first trigger.</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {showTutorial && (
        <CoachMark
          title="TRIGGER LOG"
          body="When something sets you off, log it here — what happened, how you reacted, and how intense it was on a scale of 1 to 10. Patterns in your triggers become visible over time."
          step={2}
          total={4}
          onDismiss={dismissTutorial}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#111110' },
  scroll:       { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  header:       { marginBottom: 20 },
  label:        { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  title:        { fontSize: 28, fontWeight: '800', color: '#F0EFE8' },
  addBtn:       { backgroundColor: '#1C1C1A', borderRadius: 12, borderWidth: 1.5, borderColor: '#5B8A5F', borderStyle: 'dashed', paddingVertical: 18, alignItems: 'center', marginBottom: 24 },
  addBtnText:   { color: '#5B8A5F', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  form:         { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', padding: 20, marginBottom: 24 },
  formLabel:    { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.7, marginBottom: 8 },
  input:        { backgroundColor: '#151514', borderRadius: 8, padding: 14, color: '#F0EFE8', fontSize: 14, lineHeight: 22, marginBottom: 20, minHeight: 72 },
  divider:      { height: 1, backgroundColor: '#252523', marginBottom: 20 },
  formBtns:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, backgroundColor: '#151514', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { color: '#5A5A54', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  submitBtn:    { flex: 2, backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitOff:    { backgroundColor: '#1A2A1C' },
  submitText:   { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  history:      { marginTop: 8 },
  historyLabel: { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.7, marginBottom: 12 },
  empty:        { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  emptyText:    { color: '#2E2E2B', fontSize: 13, textAlign: 'center', lineHeight: 22 },
});

const ib = StyleSheet.create({
  wrap:  { marginBottom: 8 },
  label: { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.7, marginBottom: 10 },
  row:   { flexDirection: 'row', gap: 5 },
  pip:   { flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: '#151514', borderWidth: 1, borderColor: '#1C1C1A', justifyContent: 'center', alignItems: 'center' },
  num:   { fontSize: 11, color: '#2E2E2B', fontWeight: '700' },
  hint:  { fontSize: 11, color: '#3A3A36', marginTop: 8 },
});

const ec = StyleSheet.create({
  card:           { backgroundColor: '#1C1C1A', borderRadius: 12, borderWidth: 1, borderColor: '#252523', padding: 16, marginBottom: 10 },
  top:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  time:           { fontSize: 11, color: '#3A3A36' },
  badge:          { borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  event:          { fontSize: 14, color: '#F0EFE8', fontWeight: '600', marginBottom: 6 },
  reaction:       { fontSize: 13, color: '#5A5A54', lineHeight: 20 },
  reflectionWrap: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#252523', paddingTop: 12 },
  reflectionLabel:{ fontSize: 9, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.6, marginBottom: 4 },
  reflection:     { fontSize: 13, color: '#4A7A4E', lineHeight: 20 },
});