import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tool = null | 'breathing' | 'grounding';

const PHASES = [
  { label: 'INHALE',  duration: 4, color: '#5B8A5F', hint: 'Breathe in slowly through your nose' },
  { label: 'HOLD',    duration: 7, color: '#C8922A', hint: 'Hold — relax your shoulders' },
  { label: 'EXHALE',  duration: 8, color: '#185fa5', hint: 'Breathe out fully through your mouth' },
];

function BreathingTool({ onClose }: { onClose: () => void }) {
  const [running,    setRunning]    = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count,      setCount]      = useState(PHASES[0].duration);
  const [cycles,     setCycles]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phase = PHASES[phaseIndex];

  function clear() { if (intervalRef.current) clearInterval(intervalRef.current); }
  function start() { setRunning(true); setPhaseIndex(0); setCount(PHASES[0].duration); setCycles(0); }
  function stop()  { clear(); setRunning(false); setPhaseIndex(0); setCount(PHASES[0].duration); }

  useEffect(() => {
    if (!running) return;
    clear();
    intervalRef.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhaseIndex(pi => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles(c => c + 1);
            setCount(PHASES[next].duration);
            return next;
          });
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return clear;
  }, [running, phaseIndex]);

  useEffect(() => { return clear; }, []);

  return (
    <View style={bt.wrap}>
      <TouchableOpacity style={bt.back} onPress={() => { stop(); onClose(); }} activeOpacity={0.7}>
        <Text style={bt.backText}>← BACK</Text>
      </TouchableOpacity>
      <Text style={bt.title}>4-7-8 BREATHING</Text>
      <Text style={bt.sub}>A proven technique to reduce acute stress and anxiety.</Text>
      <View style={[bt.circle, { borderColor: running ? phase.color : '#252523' }]}>
        {running ? (
          <>
            <Text style={[bt.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
            <Text style={[bt.countdown, { color: phase.color }]}>{count}</Text>
          </>
        ) : (
          <Text style={bt.ready}>READY</Text>
        )}
      </View>
      {running && <Text style={bt.hint}>{phase.hint}</Text>}
      {cycles > 0 && <Text style={bt.cycles}>Cycles complete: {cycles}</Text>}
      <TouchableOpacity style={[bt.btn, running && bt.btnStop]} onPress={running ? stop : start} activeOpacity={0.8}>
        <Text style={bt.btnText}>{running ? 'STOP' : 'BEGIN'}</Text>
      </TouchableOpacity>
      <View style={bt.legend}>
        {PHASES.map(p => (
          <View key={p.label} style={bt.legendRow}>
            <View style={[bt.legendDot, { backgroundColor: p.color }]} />
            <Text style={bt.legendText}>{p.label} · {p.duration}s</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SENSES = [
  { n: 5, sense: 'SEE',   prompt: 'Name 5 things you can see right now.' },
  { n: 4, sense: 'TOUCH', prompt: 'Name 4 things you can physically feel.' },
  { n: 3, sense: 'HEAR',  prompt: 'Name 3 things you can hear right now.' },
  { n: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell.' },
  { n: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste.' },
];

function GroundingTool({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const done = step >= SENSES.length;

  return (
    <View style={gt.wrap}>
      <TouchableOpacity style={gt.back} onPress={onClose} activeOpacity={0.7}>
        <Text style={gt.backText}>← BACK</Text>
      </TouchableOpacity>
      <Text style={gt.title}>5-4-3-2-1 GROUNDING</Text>
      <Text style={gt.sub}>Reconnect with your environment. Take your time with each step.</Text>
      <View style={gt.steps}>
        {SENSES.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'pending';
          return (
            <View key={s.sense} style={[gt.step, state === 'active' && gt.stepActive, state === 'done' && gt.stepDone]}>
              <View style={[gt.num, (state === 'done' || state === 'active') && gt.numOn]}>
                <Text style={[gt.numText, (state === 'done' || state === 'active') && gt.numTextOn]}>
                  {state === 'done' ? '✓' : s.n}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gt.sense, state === 'active' && gt.senseActive]}>{s.sense}</Text>
                {state === 'active' && <Text style={gt.prompt}>{s.prompt}</Text>}
              </View>
            </View>
          );
        })}
      </View>
      {!done ? (
        <TouchableOpacity style={gt.btn} onPress={() => setStep(s => s + 1)} activeOpacity={0.8}>
          <Text style={gt.btnText}>DONE · NEXT →</Text>
        </TouchableOpacity>
      ) : (
        <View style={gt.complete}>
          <Text style={gt.completeTitle}>GROUNDED.</Text>
          <Text style={gt.completeSub}>You're present. Take a breath. You've got this.</Text>
          <TouchableOpacity style={gt.btn} onPress={() => { setStep(0); onClose(); }} activeOpacity={0.8}>
            <Text style={gt.btnText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function CalmScreen() {
  const [tool, setTool] = useState<Tool>(null);

  if (tool === 'breathing') return <BreathingTool onClose={() => setTool(null)} />;
  if (tool === 'grounding') return <GroundingTool onClose={() => setTool(null)} />;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.label}>CALM TOOLKIT</Text>
        <Text style={s.title}>Choose a tool</Text>
        <Text style={s.sub}>Offline. No account. Works anywhere.</Text>

        <TouchableOpacity style={s.card} onPress={() => setTool('breathing')} activeOpacity={0.85}>
          <View style={s.cardTop}>
            <Text style={s.cardTitle}>4-7-8 BREATHING</Text>
            <Text style={s.cardTime}>~5 min</Text>
          </View>
          <Text style={s.cardDesc}>
            Inhale 4s · Hold 7s · Exhale 8s. Activates the parasympathetic nervous system and lowers heart rate fast.
          </Text>
          <Text style={s.cardCta}>START →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => setTool('grounding')} activeOpacity={0.85}>
          <View style={s.cardTop}>
            <Text style={s.cardTitle}>5-4-3-2-1 GROUNDING</Text>
            <Text style={s.cardTime}>~3 min</Text>
          </View>
          <Text style={s.cardDesc}>
            Use your senses to anchor yourself to the present moment. Effective for anxiety, hypervigilance, and dissociation.
          </Text>
          <Text style={s.cardCta}>START →</Text>
        </TouchableOpacity>

        <View style={s.coming}>
          <Text style={s.comingTitle}>MORE TOOLS COMING</Text>
          <Text style={s.comingSub}>
            Additional evidence-based tools and techniques will be available in future updates, all designed to help you manage stress and anxiety wherever you are.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#111110' },
  scroll:      { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  label:       { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  title:       { fontSize: 28, fontWeight: '800', color: '#F0EFE8', marginBottom: 6 },
  sub:         { fontSize: 13, color: '#3A3A36', marginBottom: 28 },
  card:        { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', padding: 20, marginBottom: 16 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: '#F0EFE8', letterSpacing: 0.3 },
  cardTime:    { fontSize: 11, color: '#3A3A36' },
  cardDesc:    { fontSize: 13, color: '#5A5A54', lineHeight: 21, marginBottom: 14 },
  cardCta:     { fontSize: 12, color: '#5B8A5F', fontWeight: '700', letterSpacing: 0.5 },
  coming:      { marginTop: 8, borderTopWidth: 1, borderTopColor: '#1C1C1A', paddingTop: 24, paddingBottom: 8 },
  comingTitle: { fontSize: 10, color: '#2E2E2B', fontWeight: '600', letterSpacing: 0.8, marginBottom: 8 },
  comingSub:   { fontSize: 13, color: '#2E2E2B', lineHeight: 22 },
});

const bt = StyleSheet.create({
  wrap:      { flex: 1, backgroundColor: '#111110', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  back:      { marginBottom: 24 },
  backText:  { color: '#3A3A36', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  title:     { fontSize: 18, fontWeight: '800', color: '#F0EFE8', marginBottom: 6 },
  sub:       { fontSize: 13, color: '#3A3A36', lineHeight: 20, marginBottom: 40 },
  circle:    { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  phaseLabel:{ fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  countdown: { fontSize: 56, fontWeight: '800' },
  ready:     { fontSize: 18, color: '#3A3A36', fontWeight: '600' },
  hint:      { textAlign: 'center', fontSize: 13, color: '#5A5A54', marginBottom: 16, lineHeight: 20 },
  cycles:    { textAlign: 'center', fontSize: 12, color: '#5B8A5F', marginBottom: 8 },
  btn:       { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
  btnStop:   { backgroundColor: '#2A1414' },
  btnText:   { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  legend:    { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText:{ fontSize: 12, color: '#3A3A36' },
});

const gt = StyleSheet.create({
  wrap:          { flex: 1, backgroundColor: '#111110', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  back:          { marginBottom: 24 },
  backText:      { color: '#3A3A36', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  title:         { fontSize: 18, fontWeight: '800', color: '#F0EFE8', marginBottom: 6 },
  sub:           { fontSize: 13, color: '#3A3A36', lineHeight: 20, marginBottom: 32 },
  steps:         { gap: 10, marginBottom: 32 },
  step:          { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: '#151514', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#1C1C1A' },
  stepActive:    { backgroundColor: '#141E15', borderColor: '#5B8A5F' },
  stepDone:      { opacity: 0.4 },
  num:           { width: 28, height: 28, borderRadius: 6, backgroundColor: '#1C1C1A', justifyContent: 'center', alignItems: 'center' },
  numOn:         { backgroundColor: '#1A2E1B' },
  numText:       { fontSize: 13, fontWeight: '800', color: '#2E2E2B' },
  numTextOn:     { color: '#5B8A5F' },
  sense:         { fontSize: 12, fontWeight: '700', color: '#3A3A36', letterSpacing: 0.5, marginBottom: 2 },
  senseActive:   { color: '#F0EFE8' },
  prompt:        { fontSize: 13, color: '#7A7975', lineHeight: 20 },
  btn:           { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  complete:      { alignItems: 'center', marginBottom: 8 },
  completeTitle: { fontSize: 32, fontWeight: '800', color: '#F0EFE8', marginBottom: 8 },
  completeSub:   { fontSize: 14, color: '#5A5A54', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
});