import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROMISES = [
  'No account required — ever.',
  'Everything stored locally on your device.',
  'Nothing leaves your phone unless you choose to sync.',
  'Nothing sold. Nothing shared. Ever.',
  'Delete all your data anytime, completely.',
];

function Dots({ step }: { step: number }) {
  return (
    <View style={s.dots}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[s.dot, i <= step && s.dotOn]} />
      ))}
    </View>
  );
}

export default function PrivacyScreen() {
  const { callSign, role } = useLocalSearchParams<{ callSign: string; role: string }>();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111110" />
      <View style={s.wrap}>
        <Dots step={4} />

        <View style={s.body}>
          <Text style={s.step}>STEP 4 OF 5</Text>
          <Text style={s.heading}>YOUR{'\n'}PRIVACY</Text>
          <Text style={s.sub}>
            Built for people who've earned the right to be skeptical. Here's the deal:
          </Text>

          <View style={s.list}>
            {PROMISES.map((p, i) => (
              <View key={i} style={s.row}>
                <View style={s.checkBox}>
                  <Text style={s.check}>✓</Text>
                </View>
                <Text style={s.rowText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.push({ pathname: '/onboarding/ready', params: { callSign, role } })}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>UNDERSTOOD</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#111110' },
  wrap:     { flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  dots:     { flexDirection: 'row', gap: 6, marginBottom: 44 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#252523' },
  dotOn:    { backgroundColor: '#5B8A5F', width: 22, borderRadius: 3 },
  body:     { flex: 1, justifyContent: 'center' },
  step:     { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10 },
  heading:  { fontSize: 36, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.5, lineHeight: 40, marginBottom: 12 },
  sub:      { fontSize: 15, color: '#7A7975', lineHeight: 23, marginBottom: 32 },
  list:     { gap: 18 },
  row:      { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  checkBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#141E15', borderWidth: 1, borderColor: '#2E4A30', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  check:    { color: '#5B8A5F', fontSize: 13, fontWeight: '800' },
  rowText:  { flex: 1, fontSize: 14, color: '#B8B6AF', lineHeight: 22 },
  btn:      { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  btnText:  { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
});