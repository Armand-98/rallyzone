import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPref } from '../db/prefs';
import { ExportOptions, generateAndSharePDF } from '../hooks/usePDFExport';

const DAY_OPTIONS: { label: string; value: 30 | 60 | 90 }[] = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [callSign, setCallSign] = useState('');
  const [role,     setRole]     = useState('veteran');
  const [realName, setRealName] = useState('');
  const [loading,  setLoading]  = useState(false);

  const [includeMood,      setIncludeMood]      = useState(true);
  const [includeTriggers,  setIncludeTriggers]  = useState(true);
  const [includeGrounding, setIncludeGrounding] = useState(true);
  const [includeNotes,     setIncludeNotes]     = useState(true);
  const [userNotes,        setUserNotes]        = useState('');
  const [days,             setDays]             = useState<30 | 60 | 90>(30);

  useEffect(() => {
    getPref('call_sign').then(v => setCallSign(v ?? ''));
    getPref('role').then(v => setRole(v ?? 'veteran'));
  }, []);

  const handleExport = async () => {
    if (!realName.trim()) {
      Alert.alert(
        'Name required',
        'Please enter your full name so your provider can identify this report.',
        [{ text: 'OK' }]
      );
      return;
    }
    setLoading(true);
    try {
      const opts: ExportOptions = {
        includeMood,
        includeTriggers,
        includeGrounding,
        includeNotes,
        userNotes,
        callSign: realName.trim(),
        role,
        days,
      };
      await generateAndSharePDF(opts);
    } catch (e: any) {
      Alert.alert('Export failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF Export</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>
          Generate a personal health summary you can share with your VA provider or VSO.
          Choose what to include below.
        </Text>

        {/* Real name for report */}
        <Text style={styles.sectionLabel}>YOUR NAME FOR THIS REPORT</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.nameInput}
            placeholder="Full name (e.g. John Smith)"
            placeholderTextColor="#3A3A36"
            value={realName}
            onChangeText={setRealName}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
        <Text style={styles.nameNote}>
          Used only on this report — your in-app call sign stays unchanged.
        </Text>

        {/* Date range */}
        <Text style={styles.sectionLabel}>DATE RANGE</Text>
        <View style={styles.card}>
          <View style={styles.segmented}>
            {DAY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.segment, days === opt.value && styles.segmentActive]}
                onPress={() => setDays(opt.value)}
              >
                <Text style={[styles.segmentText, days === opt.value && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sections to include */}
        <Text style={styles.sectionLabel}>INCLUDE IN REPORT</Text>
        <View style={styles.card}>
          {[
            { label: 'Mood, Energy & Sleep',  desc: 'Daily check-in averages and trends',   value: includeMood,      set: setIncludeMood },
            { label: 'Trigger Log',           desc: 'Events, reactions and intensity scores', value: includeTriggers,  set: setIncludeTriggers },
            { label: 'Calm Toolkit Usage',    desc: 'Breathing and grounding sessions',       value: includeGrounding, set: setIncludeGrounding },
            { label: 'Personal Notes',        desc: 'Add a note before exporting',            value: includeNotes,     set: setIncludeNotes },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.toggleRow, i < arr.length - 1 && styles.toggleRowBorder]}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Text style={styles.toggleDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: '#252523', true: '#1D9E75' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Notes field */}
        {includeNotes && (
          <>
            <Text style={styles.sectionLabel}>YOUR NOTES</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add context for your provider — what's been going on, what you want them to know…"
                placeholderTextColor="#3A3A36"
                multiline
                value={userNotes}
                onChangeText={setUserNotes}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This report is personal health data for supporting documentation only.
            It is not a VA form and does not constitute a medical or legal record.
            You control exactly what is included. Nothing is transmitted to any server.
          </Text>
        </View>

        {/* Export button */}
        <TouchableOpacity
          style={[styles.exportBtn, loading && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.exportBtnText}>Generate & Share PDF</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#111110' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  backBtn:           { width: 60 },
  backText:          { color: '#1D9E75', fontSize: 14 },
  headerTitle:       { fontSize: 16, fontWeight: '600', color: '#F0EFE8' },
  scroll:            { padding: 20, paddingBottom: 48 },
  intro:             { fontSize: 13, color: '#888780', lineHeight: 20, marginBottom: 24 },
  sectionLabel:      { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  card:              { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', overflow: 'hidden', marginBottom: 6 },
  nameInput:         { color: '#F0EFE8', fontSize: 15, fontWeight: '600', padding: 16 },
  nameNote:          { fontSize: 11, color: '#3A3A36', marginBottom: 20, marginTop: 6, paddingHorizontal: 4 },
  segmented:         { flexDirection: 'row' },
  segment:           { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#252523' },
  segmentActive:     { backgroundColor: '#1D9E75' },
  segmentText:       { fontSize: 13, color: '#5F5E5A', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  toggleRow:         { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 12 },
  toggleRowBorder:   { borderBottomWidth: 1, borderBottomColor: '#252523' },
  toggleLeft:        { flex: 1 },
  toggleLabel:       { fontSize: 13, color: '#F0EFE8', fontWeight: '600', marginBottom: 2 },
  toggleDesc:        { fontSize: 11, color: '#3A3A36' },
  notesInput:        { color: '#F0EFE8', fontSize: 13, lineHeight: 22, minHeight: 120, padding: 16 },
  disclaimer:        { backgroundColor: '#1A1A18', borderRadius: 10, padding: 14, marginBottom: 20, marginTop: 4 },
  disclaimerText:    { fontSize: 11, color: '#3A3A36', lineHeight: 18 },
  exportBtn:         { backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});