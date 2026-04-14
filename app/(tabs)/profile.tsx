import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPref, setPref } from '../../db/prefs';

type Role = 'veteran' | 'first_responder';

export default function ProfileScreen() {
  const [callSign,      setCallSign]      = useState('');
  const [role,          setRole]          = useState<Role>('veteran');
  const [editingName,   setEditingName]   = useState(false);
  const [nameInput,     setNameInput]     = useState('');
  const [saved,         setSaved]         = useState(false);

  useEffect(() => {
    getPref('call_sign').then(v => { setCallSign(v ?? ''); setNameInput(v ?? ''); });
    getPref('role').then(v => setRole((v as Role) ?? 'veteran'));
  }, []);

  async function saveName() {
    if (!nameInput.trim()) return;
    await setPref('call_sign', nameInput.trim());
    setCallSign(nameInput.trim());
    setEditingName(false);
    flash();
  }

  async function saveRole(r: Role) {
    await setPref('role', r);
    setRole(r);
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function confirmReset() {
    Alert.alert(
      'Reset RallyZone',
      'This will clear your call sign, role, and all settings. Your logged entries will not be deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await setPref('onboarding_complete', 'false');
            router.replace('/onboarding');
          },
        },
      ]
    );
  }

  const roleLabel = role === 'veteran' ? 'Veteran' : 'First Responder';

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.label}>PROFILE</Text>
          <Text style={s.callSign}>{callSign.toUpperCase()}</Text>
          <Text style={s.roleText}>{roleLabel}</Text>
          {saved && <Text style={s.savedBadge}>SAVED ✓</Text>}
        </View>

        {/* Call Sign */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>CALL SIGN</Text>
          <View style={s.card}>
            {!editingName ? (
              <View style={s.row}>
                <Text style={s.value}>{callSign}</Text>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => { setNameInput(callSign); setEditingName(true); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.editBtnText}>EDIT</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TextInput
                  style={s.input}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  maxLength={32}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <View style={s.editBtns}>
                  <TouchableOpacity
                    style={s.cancelBtn}
                    onPress={() => setEditingName(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.cancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.saveBtn}
                    onPress={saveName}
                    activeOpacity={0.7}
                  >
                    <Text style={s.saveBtnText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Role */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>BACKGROUND</Text>
          <View style={s.card}>
            {([
              { key: 'veteran',         label: 'Veteran',         desc: 'Military service, past or present' },
              { key: 'first_responder', label: 'First Responder', desc: 'Law enforcement, fire, EMS, dispatch' },
            ] as { key: Role; label: string; desc: string }[]).map((opt, i, arr) => (
              <TouchableOpacity
                key={opt.key}
                style={[s.roleRow, i < arr.length - 1 && s.roleRowBorder]}
                onPress={() => saveRole(opt.key)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.roleLabel, role === opt.key && s.roleLabelOn]}>{opt.label}</Text>
                  <Text style={s.roleDesc}>{opt.desc}</Text>
                </View>
                <View style={[s.radio, role === opt.key && s.radioOn]}>
                  {role === opt.key && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ABOUT</Text>
          <View style={s.card}>
            {[
              { label: 'App',      value: 'RallyZone' },
              { label: 'Version',  value: '0.1.0 · Beta' },
              { label: 'Made by',  value: 'LyfieldCreationsOS' },
              { label: 'Storage',  value: 'Local only — nothing leaves your device' },
            ].map((item, i, arr) => (
              <View key={item.label} style={[s.aboutRow, i < arr.length - 1 && s.aboutRowBorder]}>
                <Text style={s.aboutLabel}>{item.label}</Text>
                <Text style={s.aboutValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reset */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={s.resetBtn} onPress={confirmReset} activeOpacity={0.8}>
            <Text style={s.resetText}>RESET ONBOARDING</Text>
          </TouchableOpacity>
          <Text style={s.resetNote}>Clears your call sign and role. Logged data is kept.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#111110' },
  scroll:         { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header:         { marginBottom: 32 },
  label:          { fontSize: 11, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  callSign:       { fontSize: 40, fontWeight: '800', color: '#F0EFE8', letterSpacing: -0.5, marginBottom: 4 },
  roleText:       { fontSize: 14, color: '#5B8A5F', fontWeight: '600' },
  savedBadge:     { marginTop: 8, fontSize: 11, color: '#5B8A5F', fontWeight: '700', letterSpacing: 0.5 },
  section:        { marginBottom: 24 },
  sectionLabel:   { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10 },
  card:           { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', overflow: 'hidden' },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  value:          { fontSize: 16, color: '#F0EFE8', fontWeight: '600' },
  editBtn:        { backgroundColor: '#252523', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText:    { fontSize: 11, color: '#5B8A5F', fontWeight: '700', letterSpacing: 0.5 },
  input:          { backgroundColor: '#151514', borderRadius: 8, padding: 14, color: '#F0EFE8', fontSize: 18, fontWeight: '700', margin: 12, marginBottom: 0 },
  editBtns:       { flexDirection: 'row', gap: 8, padding: 12 },
  cancelBtn:      { flex: 1, backgroundColor: '#151514', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText:     { color: '#5A5A54', fontSize: 12, fontWeight: '600' },
  saveBtn:        { flex: 2, backgroundColor: '#5B8A5F', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  roleRow:        { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  roleRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#252523' },
  roleLabel:      { fontSize: 14, fontWeight: '600', color: '#5A5A54', marginBottom: 2 },
  roleLabelOn:    { color: '#F0EFE8' },
  roleDesc:       { fontSize: 12, color: '#3A3A36' },
  radio:          { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#3A3A36', justifyContent: 'center', alignItems: 'center' },
  radioOn:        { borderColor: '#5B8A5F' },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B8A5F' },
  aboutRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  aboutRowBorder: { borderBottomWidth: 1, borderBottomColor: '#252523' },
  aboutLabel:     { fontSize: 13, color: '#3A3A36' },
  aboutValue:     { fontSize: 12, color: '#5A5A54', textAlign: 'right', flex: 1, marginLeft: 16 },
  resetBtn:       { backgroundColor: '#1E0808', borderRadius: 12, borderWidth: 1, borderColor: '#4A1010', paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  resetText:      { color: '#A32D2D', fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  resetNote:      { fontSize: 11, color: '#2E2E2B', textAlign: 'center' },
});