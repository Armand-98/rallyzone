import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setPref } from '../../db/prefs';

function Dots({ step }: { step: number }) {
  return (
    <View style={s.dots}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[s.dot, i <= step && s.dotOn]} />
      ))}
    </View>
  );
}

export default function ReadyScreen() {
  const { callSign, role } = useLocalSearchParams<{ callSign: string; role: string }>();

  async function enter() {
    await setPref('onboarding_complete', 'true');
    await setPref('call_sign', callSign);
    await setPref('role', role);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111110" />
      <View style={s.wrap}>
        <Dots step={5} />

        <View style={s.body}>
          <View style={s.clearBadge}>
            <Text style={s.clearText}>ALL CLEAR</Text>
          </View>

          <Text style={s.heading}>
            GOOD TO{'\n'}GO, {callSign?.toUpperCase()}.
          </Text>

          <Text style={s.sub}>
            RallyZone is ready. Your history is private. Your progress is yours.
          </Text>

          <View style={s.divider} />

          <Text style={s.hint}>
            Your daily debrief, trigger log, calm tools, and profile are ready — offline, local, and locked down.
          </Text>
        </View>

        <TouchableOpacity style={s.btn} onPress={enter} activeOpacity={0.8}>
          <Text style={s.btnText}>ENTER RALLYZONE  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#111110' },
  wrap:       { flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  dots:       { flexDirection: 'row', gap: 6, marginBottom: 44 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#252523' },
  dotOn:      { backgroundColor: '#5B8A5F', width: 22, borderRadius: 3 },
  body:       { flex: 1, justifyContent: 'center' },
  clearBadge: { borderWidth: 1, borderColor: '#2E4A30', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', backgroundColor: '#141E15', marginBottom: 24 },
  clearText:  { color: '#5B8A5F', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heading:    { fontSize: 48, fontWeight: '800', color: '#F0EFE8', letterSpacing: -1, lineHeight: 50, marginBottom: 20 },
  sub:        { fontSize: 16, color: '#B8B6AF', lineHeight: 25, marginBottom: 28 },
  divider:    { height: 1, backgroundColor: '#1C1C1A', marginBottom: 24 },
  hint:       { fontSize: 13, color: '#3A3A36', lineHeight: 21 },
  btn:        { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
});