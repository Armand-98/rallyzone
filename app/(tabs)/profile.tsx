import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wipeAllData } from '../../db';
import { getPref, setPref } from '../../db/prefs';
import { wipeVault } from '../../hooks/useVault';

type Role = 'veteran' | 'active_military';

const PRIVACY_URL   = 'https://armand-98.github.io/rallyzone';
const PENDING_MS    = 48 * 60 * 60 * 1000; // 48 hours

export default function ProfileScreen() {
  const [callSign,    setCallSign]    = useState('');
  const [role,        setRole]        = useState<Role>('veteran');
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState('');
  const [saved,       setSaved]       = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [pendingAt,   setPendingAt]   = useState<number | null>(null);

  useEffect(() => {
    getPref('call_sign').then(v => { setCallSign(v ?? ''); setNameInput(v ?? ''); });
    getPref('role').then(v => setRole((v as Role) ?? 'veteran'));
    getPref('transition_pending_role').then(v => setPendingRole((v as Role) ?? null));
    getPref('transition_pending_at').then(v => setPendingAt(v ? parseInt(v, 10) : null));
  }, []);

  // Check on every focus whether 48 hours have elapsed on a pending transition
  useFocusEffect(useCallback(() => {
    if (!pendingRole || !pendingAt) return;
    const elapsed = Date.now() - pendingAt;
    if (elapsed < PENDING_MS) return;

    const targetLabel = pendingRole === 'veteran' ? 'Veteran' : 'Currently Serving — U.S. Military';
    const attestText  = pendingRole === 'veteran'
      ? 'I confirm I am a U.S. Veteran and that I have separated from active military service.'
      : 'I confirm I am an Active Member of the U.S. Military currently serving.';

    Alert.alert(
      '48 Hours Have Passed',
      `You requested a status change to ${targetLabel}.\n\nTo complete this change, confirm the following:\n\n"${attestText}"\n\nYour data is not affected.`,
      [
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: clearPendingTransition,
        },
        {
          text: 'I Confirm — Apply Change',
          onPress: () => applyTransition(pendingRole),
        },
      ]
    );
  }, [pendingRole, pendingAt]));

  async function clearPendingTransition() {
    await setPref('transition_pending_role', '');
    await setPref('transition_pending_at', '');
    setPendingRole(null);
    setPendingAt(null);
  }

  async function saveName() {
    if (!nameInput.trim()) return;
    await setPref('call_sign', nameInput.trim());
    setCallSign(nameInput.trim());
    setEditingName(false);
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function confirmReset() {
    // Step 1 — warn about data export first
    Alert.alert(
      '⚠️ Save Your Data First',
      'Before resetting, export your data using Health Export. Once you reset, every mood log, trigger entry, vault note, and setting is permanently deleted.\n\nThere is no recovery. There is no undo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I've saved my data — continue",
          style: 'destructive',
          onPress: confirmResetFinal,
        },
      ]
    );
  }

  function confirmResetFinal() {
    // Step 2 — final absolute confirmation
    Alert.alert(
      'DELETE EVERYTHING?',
      'This will permanently erase:\n\n• All mood logs\n• All trigger entries\n• All vault notes\n• All settings and preferences\n\nYou will be returned to onboarding. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything & Reset',
          style: 'destructive',
          onPress: executeReset,
        },
      ]
    );
  }

  async function executeReset() {
    try {
      await wipeAllData();
      await wipeVault();
      router.replace('/onboarding');
    } catch {
      Alert.alert('Reset failed', 'Something went wrong. Please try again.');
    }
  }

  const roleLabel = role === 'veteran' ? 'Veteran' : 'Currently Serving — U.S. Military';

  function confirmStatusTransition() {
    if (pendingRole) {
      const hrs = Math.ceil((PENDING_MS - (Date.now() - (pendingAt ?? 0))) / (60 * 60 * 1000));
      Alert.alert(
        'Transition Already Pending',
        `A status change is already pending. You can confirm it in approximately ${hrs} hour${hrs !== 1 ? 's' : ''}.\n\nWant to cancel this request instead?`,
        [
          { text: 'Keep Waiting', style: 'cancel' },
          { text: 'Cancel Request', style: 'destructive', onPress: clearPendingTransition },
        ]
      );
      return;
    }

    const targetRole  = role === 'active_military' ? 'veteran' : 'active_military';
    const targetLabel = targetRole === 'veteran' ? 'Veteran' : 'Currently Serving — U.S. Military';
    const title       = role === 'active_military' ? 'Transitioning Out of Service?' : 'Returning to Service?';

    Alert.alert(
      title,
      `This will start a 48-hour confirmation period before your status changes to ${targetLabel}.\n\nThis delay is in place to confirm your intent. Your status will not change until you re-confirm after 48 hours.\n\nYour data is not affected either way.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start 48-Hour Period', onPress: () => requestTransition(targetRole) },
      ]
    );
  }

  async function requestTransition(targetRole: Role) {
    const now = Date.now();
    await setPref('transition_pending_role', targetRole);
    await setPref('transition_pending_at', String(now));
    setPendingRole(targetRole);
    setPendingAt(now);
  }

  async function applyTransition(newRole: Role) {
    await setPref('role', newRole);
    setRole(newRole);
    await clearPendingTransition();
    flash();
  }

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

        {/* Background */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>BACKGROUND</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.value}>{roleLabel}</Text>
            </View>
          </View>

          {pendingRole ? (
            // Pending state — show countdown and cancel option
            <View style={s.pendingCard}>
              <View style={s.pendingHeader}>
                <Text style={s.pendingIcon}>⏳</Text>
                <View style={s.pendingText}>
                  <Text style={s.pendingTitle}>Status change pending</Text>
                  <Text style={s.pendingDesc}>
                    Requested change to{' '}
                    <Text style={s.pendingBold}>
                      {pendingRole === 'veteran' ? 'Veteran' : 'Currently Serving'}
                    </Text>
                    {'. Return in 48 hours to confirm.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={s.pendingCancel} onPress={clearPendingTransition}>
                <Text style={s.pendingCancelText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Idle state — show transition option
            <TouchableOpacity
              style={s.transitionBtn}
              onPress={confirmStatusTransition}
              activeOpacity={0.8}
            >
              <View style={s.transitionBtnInner}>
                <Text style={s.transitionIcon}>
                  {role === 'active_military' ? '🎖️' : '⚔️'}
                </Text>
                <View style={s.transitionText}>
                  <Text style={s.transitionTitle}>
                    {role === 'active_military' ? 'Transitioning out of service?' : 'Returning to service?'}
                  </Text>
                  <Text style={s.transitionDesc}>
                    {role === 'active_military'
                      ? 'Switch to Veteran status — your data is preserved.'
                      : 'Switch to Currently Serving — your data is preserved.'}
                  </Text>
                </View>
                <Text style={s.transitionArrow}>›</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={s.lockedNote}>
            Status changes require a 48-hour confirmation period. Your data is never affected. To fully reset the app, see Danger Zone below.
          </Text>
        </View>

        {/* Premium */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PREMIUM</Text>
          <View style={s.card}>
            <TouchableOpacity
              style={[s.aboutRow, s.aboutRowBorder]}
              onPress={() => router.push('/vault')}
              activeOpacity={0.7}
            >
              <View style={s.premiumRowLeft}>
                <Text style={s.premiumIcon}>🔒</Text>
                <View>
                  <Text style={s.premiumLabel}>Secure Vault</Text>
                  <Text style={s.premiumDesc}>Biometric-locked private journal</Text>
                </View>
              </View>
              <Text style={s.linkValue}>Open ↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.aboutRow, s.aboutRowBorder]}
              onPress={() => router.push('/insights')}
              activeOpacity={0.7}
            >
              <View style={s.premiumRowLeft}>
                <Text style={s.premiumIcon}>📊</Text>
                <View>
                  <Text style={s.premiumLabel}>Pattern Insights</Text>
                  <Text style={s.premiumDesc}>Your mood, trigger & sleep trends</Text>
                </View>
              </View>
              <Text style={s.linkValue}>View ↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.aboutRow, s.aboutRowBorder]}
              onPress={() => router.push('/export')}
              activeOpacity={0.7}
            >
              <View style={s.premiumRowLeft}>
                <Text style={s.premiumIcon}>📄</Text>
                <View>
                  <Text style={s.premiumLabel}>PDF Export</Text>
                  <Text style={s.premiumDesc}>VA-ready personal health report</Text>
                </View>
              </View>
              <Text style={s.linkValue}>Export ↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.aboutRow}
              onPress={() => router.push('/paywall')}
              activeOpacity={0.7}
            >
              <View style={s.premiumRowLeft}>
                <Text style={s.premiumIcon}>⭐</Text>
                <View>
                  <Text style={s.premiumLabel}>Upgrade to Premium</Text>
                  <Text style={s.premiumDesc}>$7.99/mo · $59.99/yr</Text>
                </View>
              </View>
              <Text style={s.linkValue}>View ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ABOUT</Text>
          <View style={s.card}>
            {[
              { label: 'App',     value: 'RallyZone' },
              { label: 'Version', value: '0.1.0 · Beta' },
              { label: 'Made by', value: 'LyfieldCreationsOS' },
              { label: 'Storage', value: 'Local only — nothing leaves your device' },
            ].map((item) => (
              <View key={item.label} style={[s.aboutRow, s.aboutRowBorder]}>
                <Text style={s.aboutLabel}>{item.label}</Text>
                <Text style={s.aboutValue}>{item.value}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={s.aboutRow}
              onPress={() => router.push('/privacy')}
              activeOpacity={0.7}
            >
              <Text style={s.aboutLabel}>Privacy Policy</Text>
              <Text style={s.linkValue}>View ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>LEGAL</Text>
          <View style={s.card}>
            <TouchableOpacity
              style={s.aboutRow}
              onPress={() => Linking.openURL(PRIVACY_URL)}
              activeOpacity={0.7}
            >
              <Text style={s.aboutLabel}>View hosted privacy policy</Text>
              <Text style={s.linkValue}>Open ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DANGER ZONE</Text>

          <View style={s.resetInstructions}>
            <Text style={s.resetInstructionsTitle}>To change your background:</Text>
            {[
              'Open Health Export and save your data to your device.',
              'Tap Reset Onboarding below.',
              'All data is permanently and immediately erased — mood logs, trigger entries, vault notes, and all settings.',
              'Redo onboarding to set a new background.',
            ].map((step, i) => (
              <View key={i} style={s.resetStep}>
                <Text style={s.resetStepNum}>{i + 1}</Text>
                <Text style={s.resetStepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.resetBtn} onPress={confirmReset} activeOpacity={0.8}>
            <Text style={s.resetText}>RESET ONBOARDING</Text>
          </TouchableOpacity>
          <Text style={s.resetNote}>Permanently erases all data. This cannot be undone.</Text>
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
  lockedNote:         { fontSize: 11, color: '#2E2E2B', marginTop: 8, paddingHorizontal: 4 },

  transitionBtn:      { marginTop: 8, backgroundColor: '#161614', borderRadius: 12, borderWidth: 1, borderColor: '#252523', overflow: 'hidden' },
  transitionBtnInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  transitionIcon:     { fontSize: 20 },
  transitionText:     { flex: 1 },
  transitionTitle:    { fontSize: 13, fontWeight: '600', color: '#F0EFE8', marginBottom: 2 },
  transitionDesc:     { fontSize: 11, color: '#3A3A36' },
  transitionArrow:    { fontSize: 20, color: '#3A3A36', fontWeight: '300' },

  pendingCard:        { marginTop: 8, backgroundColor: '#1A1A10', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A10', overflow: 'hidden' },
  pendingHeader:      { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  pendingIcon:        { fontSize: 20 },
  pendingText:        { flex: 1 },
  pendingTitle:       { fontSize: 13, fontWeight: '600', color: '#C8922A', marginBottom: 2 },
  pendingDesc:        { fontSize: 11, color: '#5A5A36', lineHeight: 16 },
  pendingBold:        { fontWeight: '700', color: '#888760' },
  pendingCancel:      { borderTopWidth: 1, borderTopColor: '#3A3A10', padding: 12, alignItems: 'center' },
  pendingCancelText:  { fontSize: 12, color: '#A32D2D', fontWeight: '600' },

  resetInstructions:     { backgroundColor: '#161614', borderRadius: 12, borderWidth: 1, borderColor: '#2A1A1A', padding: 16, marginBottom: 14 },
  resetInstructionsTitle:{ fontSize: 10, fontWeight: '700', color: '#5A3A3A', letterSpacing: 0.6, marginBottom: 12 },
  resetStep:             { flexDirection: 'row', gap: 10, marginBottom: 10 },
  resetStepNum:          { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2A1A1A', textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700', color: '#A32D2D', flexShrink: 0 },
  resetStepText:         { flex: 1, fontSize: 12, color: '#5A4A4A', lineHeight: 18 },
  premiumRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  premiumIcon:    { fontSize: 20 },
  premiumLabel:   { fontSize: 13, color: '#F0EFE8', fontWeight: '600', marginBottom: 2 },
  premiumDesc:    { fontSize: 11, color: '#3A3A36' },
  aboutRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  aboutRowBorder: { borderBottomWidth: 1, borderBottomColor: '#252523' },
  aboutLabel:     { fontSize: 13, color: '#3A3A36' },
  aboutValue:     { fontSize: 12, color: '#5A5A54', textAlign: 'right', flex: 1, marginLeft: 16 },
  linkValue:      { fontSize: 12, color: '#5B8A5F', fontWeight: '600' },
  resetBtn:       { backgroundColor: '#1E0808', borderRadius: 12, borderWidth: 1, borderColor: '#4A1010', paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  resetText:      { color: '#A32D2D', fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  resetNote:      { fontSize: 11, color: '#2E2E2B', textAlign: 'center' },
});