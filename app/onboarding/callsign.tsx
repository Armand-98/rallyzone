import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function CallSignScreen() {
  const [callSign, setCallSign] = useState('');
  const canGo = callSign.trim().length > 0;

  function next() {
    if (!canGo) return;
    router.push({ pathname: '/onboarding/role', params: { callSign: callSign.trim() } });
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111110" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.wrap}>
          <Dots step={2} />

          <View style={s.body}>
            <Text style={s.step}>STEP 2 OF 5</Text>
            <Text style={s.heading}>CALL SIGN</Text>
            <Text style={s.sub}>
              What do we call you? First name is fine — or whatever you go by.
            </Text>

            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={callSign}
                onChangeText={setCallSign}
                placeholder="Enter your call sign"
                placeholderTextColor="#333330"
                autoFocus
                maxLength={32}
                returnKeyType="done"
                onSubmitEditing={next}
              />
              {callSign.length > 0 && (
                <Text style={s.count}>{callSign.length}/32</Text>
              )}
            </View>

            <View style={s.note}>
              <Text style={s.notePip}>●</Text>
              <Text style={s.noteText}>Stored only on this device. Never transmitted.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, !canGo && s.btnOff]}
            onPress={next}
            disabled={!canGo}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>CONFIRMED</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  step:      { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10 },
  heading:   { fontSize: 36, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.5, marginBottom: 12 },
  sub:       { fontSize: 15, color: '#7A7975', lineHeight: 23, marginBottom: 40 },
  inputWrap: { borderBottomWidth: 2, borderBottomColor: '#252523', marginBottom: 20, paddingBottom: 10, position: 'relative' },
  input:     { fontSize: 30, fontWeight: '700', color: '#F0EFE8', paddingRight: 52 },
  count:     { position: 'absolute', right: 0, bottom: 12, fontSize: 11, color: '#3A3A36' },
  note:      { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  notePip:   { color: '#5B8A5F', fontSize: 7, marginTop: 6 },
  noteText:  { fontSize: 12, color: '#3A3A36', flex: 1 },
  btn:       { backgroundColor: '#5B8A5F', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  btnOff:    { backgroundColor: '#1A2A1C' },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
});