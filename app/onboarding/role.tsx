import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Role = 'veteran' | 'first_responder' | null;

function Dots({ step }: { step: number }) {
  return (
    <View style={s.dots}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[s.dot, i <= step && s.dotOn]} />
      ))}
    </View>
  );
}

export default function RoleScreen() {
  const { callSign } = useLocalSearchParams<{ callSign: string }>();
  const [role, setRole] = useState<Role>(null);

  function next() {
    if (!role) return;
    router.push({ pathname: '/onboarding/privacy', params: { callSign, role } });
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111110" />
      <View style={s.wrap}>
        <Dots step={3} />

        <View style={s.body}>
          <Text style={s.step}>STEP 3 OF 5</Text>
          <Text style={s.heading}>YOUR{'\n'}BACKGROUND</Text>
          <Text style={s.sub}>
            Helps us frame things the right way for you.
          </Text>

          <View style={s.cards}>
            {([
              { key: 'veteran',         label: 'VETERAN',         desc: 'Military service, past or present' },
              { key: 'first_responder', label: 'FIRST RESPONDER', desc: 'Law enforcement, fire, EMS, dispatch' },
            ] as { key: Role; label: string; desc: string }[]).map(opt => {
              const selected = role === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key!}
                  style={[s.card, selected && s.cardOn]}
                  onPress={() => setRole(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cardLabel, selected && s.cardLabelOn]}>{opt.label}</Text>
                  <Text style={s.cardDesc}>{opt.desc}</Text>
                  {selected && <View style={s.pip} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.footnote}>You can update this anytime in your profile.</Text>
        </View>

        <TouchableOpacity
          style={[s.btn, !role && s.btnOff]}
          onPress={next}
          disabled={!role}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>CONFIRMED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#111110' },
  wrap:        { flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  dots:        { flexDirection: 'row', gap: 6, marginBottom: 44 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#252523' },
  dotOn:       { backgroundColor: '#5B8A5F', width: 22, borderRadius: 3 },
  body:        { flex: 1, justifyContent: 'center' },
  step:        { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10 },
  heading:     { fontSize: 36, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.5, lineHeight: 40, marginBottom: 12 },
  sub:         { fontSize: 15, color: '#7A7975', lineHeight: 23, marginBottom: 32 },
  cards:       { gap: 12, marginBottom: 20 },
  card:        { backgroundColor: '#1C1C1A', borderRadius: 12, borderWidth: 1.5, borderColor: '#252523', padding: 20, position: 'relative' },
  cardOn:      { borderColor: '#5B8A5F', backgroundColor: '#141E15' },
  cardLabel:   { fontSize: 15, fontWeight: '700', color: '#4A4A46', letterSpacing: 0.5, marginBottom: 5 },
  cardLabelOn: { color: '#F0EFE8' },
  cardDesc:    { fontSize: 13, color: '#3A3A36' },
  pip:         { position: 'absolute', top: 18, right: 18, width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B8A5F' },
  footnote:    { fontSize: 12, color: '#2E2E2B', textAlign: 'center' },
  btn:         { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  btnOff:      { backgroundColor: '#1A2A1C' },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
});