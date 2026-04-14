import { router } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Dots({ step }: { step: number }) {
  return (
    <View style={s.dots}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[s.dot, i <= step && s.dotOn]} />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111110" />
      <View style={s.wrap}>
        <Dots step={1} />

        <View style={s.body}>
          <View style={s.badge}>
            <Text style={s.badgeText}>PRIVATE · LOCAL-FIRST · OFFLINE-READY</Text>
          </View>

          <Text style={s.wordmark}>RALLY{'\n'}ZONE</Text>

          <Text style={s.tagline}>
            A private space to decompress, track patterns, and stay ready.
          </Text>

          <Text style={s.detail}>
            Built for veterans and first responders. No account required. No data sold. Everything stays on your device.
          </Text>
        </View>

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.push('/onboarding/callsign')}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>LET'S GO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#111110' },
  wrap:      { flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  dots:      { flexDirection: 'row', gap: 6, marginBottom: 44 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#252523' },
  dotOn:     { backgroundColor: '#5B8A5F', width: 22, borderRadius: 3 },
  body:      { flex: 1, justifyContent: 'center' },
  badge:     { borderWidth: 1, borderColor: '#2A2A28', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 32 },
  badgeText: { color: '#5B8A5F', fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  wordmark:  { fontSize: 64, fontWeight: '800', color: '#F0EFE8', lineHeight: 62, letterSpacing: -1, marginBottom: 28 },
  tagline:   { fontSize: 18, color: '#B8B6AF', fontWeight: '500', lineHeight: 27, marginBottom: 16 },
  detail:    { fontSize: 14, color: '#5A5A54', lineHeight: 22 },
  btn:       { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
});