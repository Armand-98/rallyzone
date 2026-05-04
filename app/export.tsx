import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumGate } from '../components/PremiumGate';
import { getPref } from '../db/prefs';
import { ExportOptions, generateAndSharePDF, htmlCache, prepareHTML } from '../hooks/usePDFExport';

const DAY_OPTIONS: { label: string; value: 30 | 60 | 90 }[] = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

export default function ExportScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [role,     setRole]     = useState('veteran');
  const [fullName, setFullName] = useState('');
  const [docType,  setDocType]  = useState<'summary' | 'statement'>('summary');
  const [days,     setDays]     = useState<30 | 60 | 90>(30);

  // Summary-mode options
  const [includeMood,      setIncludeMood]      = useState(true);
  const [includeTriggers,  setIncludeTriggers]  = useState(true);
  const [includeGrounding, setIncludeGrounding] = useState(true);
  const [includeNotes,     setIncludeNotes]     = useState(false);
  const [userNotes,        setUserNotes]        = useState('');

  // Statement-mode personal narrative
  const [statement, setStatement] = useState('');

  const [previewing,  setPreviewing]  = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [showNote,    setShowNote]    = useState(true);

  useEffect(() => {
    getPref('role').then(v => setRole(v ?? 'veteran'));
  }, []);

  function buildOpts(): ExportOptions {
    return {
      docType,
      includeMood,
      includeTriggers,
      includeGrounding,
      includeNotes: docType === 'summary' ? includeNotes : true,
      userNotes:    docType === 'summary' ? userNotes : statement,
      name:         fullName.trim(),
      role,
      days,
    };
  }

  function requireName(): boolean {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Enter your full name before continuing.');
      return false;
    }
    return true;
  }

  const handlePreview = async () => {
    if (!requireName()) return;
    setPreviewing(true);
    try {
      await prepareHTML(buildOpts());
      router.push('/export-preview' as any);
    } catch (e: any) {
      Alert.alert('Preview failed', e.message || 'Something went wrong.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!requireName()) return;
    setGenerating(true);
    try {
      await generateAndSharePDF(buildOpts());
    } catch (e: any) {
      Alert.alert('Export failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const busy = previewing || generating;

  return (
    <PremiumGate fallbackLabel="PDF Export is a premium feature. Generate a personal wellness summary you can share with your VA provider or care team.">

      <Modal
        visible={showNote}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Built by a Veteran,{'\n'}for Veterans.</Text>
            <Text style={styles.modalBody}>
              RallyZone is a solo-built app — I'm a veteran too, and I built this because tools like this should exist.{'\n\n'}
              Your subscription is what keeps this app running, updated, and free of ads. It means more than you know.{'\n\n'}
              Thank you for your support. 🇺🇸
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowNote(false)}>
              <Text style={styles.modalBtnText}>Got it — let's go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.container, { paddingTop: insets.top }]}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={busy}>
            <Text style={styles.backText} maxFontSizeMultiplier={1.3}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Health Export</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Document type */}
          <Text style={styles.sectionLabel}>DOCUMENT TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeCard, docType === 'summary' && styles.typeCardActive]}
              onPress={() => setDocType('summary')}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>📊</Text>
              <Text style={[styles.typeTitle, docType === 'summary' && styles.typeTitleActive]}>Wellness Summary</Text>
              <Text style={styles.typeDesc}>Metrics, stats, and data tables</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, docType === 'statement' && styles.typeCardActive]}
              onPress={() => setDocType('statement')}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>📋</Text>
              <Text style={[styles.typeTitle, docType === 'statement' && styles.typeTitleActive]}>Personal Statement</Text>
              <Text style={styles.typeDesc}>Narrative document — print &amp; sign</Text>
            </TouchableOpacity>
          </View>

          {docType === 'statement' && (
            <View style={styles.statementNote}>
              <Text style={styles.statementNoteText}>
                Your tracked data is woven into a first-person narrative in your voice — covering mood, stressors, and self-management efforts. Add your own words below to strengthen it.
              </Text>
            </View>
          )}

          {/* Full name */}
          <Text style={styles.sectionLabel}>YOUR FULL NAME</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. John Smith"
              placeholderTextColor="#3A3A36"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.fieldNote}>Appears on the document only. Your in-app call sign is not affected.</Text>

          {/* Date range */}
          <Text style={styles.sectionLabel}>DATE RANGE</Text>
          <View style={styles.card}>
            <View style={styles.segmented}>
              {DAY_OPTIONS.map(opt => (
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

          {/* Summary-specific: section toggles */}
          {docType === 'summary' && (
            <>
              <Text style={styles.sectionLabel}>INCLUDE IN REPORT</Text>
              <View style={styles.card}>
                {[
                  { label: 'Mood, Energy & Sleep',  desc: 'Daily check-in averages and trends',       value: includeMood,      set: setIncludeMood },
                  { label: 'Trigger Log',            desc: 'Events, reactions, and intensity scores',  value: includeTriggers,  set: setIncludeTriggers },
                  { label: 'Calm Toolkit Usage',     desc: 'Breathing and grounding sessions',         value: includeGrounding, set: setIncludeGrounding },
                  { label: 'Personal Statement',     desc: 'Add your own words to this report',        value: includeNotes,     set: setIncludeNotes },
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

              {includeNotes && (
                <>
                  <Text style={styles.sectionLabel}>PERSONAL STATEMENT</Text>
                  <View style={styles.card}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Describe what's been going on, how it's affecting you, or anything you want your provider to know…"
                      placeholderTextColor="#3A3A36"
                      multiline
                      value={userNotes}
                      onChangeText={setUserNotes}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {/* Statement-specific: personal narrative input */}
          {docType === 'statement' && (
            <>
              <Text style={styles.sectionLabel}>IN YOUR OWN WORDS  <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Describe how your service-connected conditions affect your daily life, work, relationships, or sleep. This section appears verbatim in your statement…"
                  placeholderTextColor="#3A3A36"
                  multiline
                  value={statement}
                  onChangeText={setStatement}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Compliance disclosure */}
          <View style={styles.disclosure}>
            <Text style={styles.disclosureTitle}>DISCLOSURE</Text>
            <Text style={styles.disclosureText}>
              RallyZone is a personal wellness application. It is not affiliated with, endorsed by, or approved by the Department of Veterans Affairs (VA).{'\n\n'}
              This document is not a VA form and does not constitute a medical or legal record. It is intended as personal supporting documentation only. You are solely responsible for any decision to submit it to the VA or any other entity.{'\n\n'}
              All data is stored locally on your device. Nothing is transmitted to any server — ever.
            </Text>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.previewBtn, busy && styles.btnDisabled]}
            onPress={handlePreview}
            disabled={busy}
          >
            {previewing ? (
              <ActivityIndicator color="#1D9E75" />
            ) : (
              <Text style={styles.previewBtnText}>Preview Document</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.generateBtn, busy && styles.btnDisabled]}
            onPress={handleGenerate}
            disabled={busy}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>Generate &amp; Share PDF</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#111110' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  backBtn:          { width: 60 },
  backText:         { color: '#1D9E75', fontSize: 14 },
  headerTitle:      { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#F0EFE8' },
  scroll:           { padding: 20, paddingBottom: 48 },

  sectionLabel:     { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  optional:         { fontSize: 10, color: '#2E2E2B', fontWeight: '400' },

  typeRow:          { flexDirection: 'row', gap: 12, marginBottom: 6 },
  typeCard:         { flex: 1, backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1.5, borderColor: '#252523', padding: 16, alignItems: 'center', gap: 6 },
  typeCardActive:   { borderColor: '#1D9E75', backgroundColor: '#111F15' },
  typeIcon:         { fontSize: 22 },
  typeTitle:        { fontSize: 12, fontWeight: '700', color: '#5F5E5A', textAlign: 'center' },
  typeTitleActive:  { color: '#1D9E75' },
  typeDesc:         { fontSize: 10, color: '#3A3A36', textAlign: 'center', lineHeight: 14 },

  statementNote:    { backgroundColor: '#131A14', borderRadius: 10, borderWidth: 1, borderColor: '#1D3A20', padding: 12, marginBottom: 20, marginTop: 6 },
  statementNoteText:{ fontSize: 12, color: '#4A7A52', lineHeight: 18 },

  card:             { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', overflow: 'hidden', marginBottom: 6 },
  nameInput:        { color: '#F0EFE8', fontSize: 15, fontWeight: '600', padding: 16 },
  fieldNote:        { fontSize: 11, color: '#3A3A36', marginBottom: 20, marginTop: 6, paddingHorizontal: 4 },

  segmented:        { flexDirection: 'row' },
  segment:          { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#252523' },
  segmentActive:    { backgroundColor: '#1D9E75' },
  segmentText:      { fontSize: 13, color: '#5F5E5A', fontWeight: '600' },
  segmentTextActive:{ color: '#fff' },

  toggleRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 12 },
  toggleRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#252523' },
  toggleLeft:       { flex: 1 },
  toggleLabel:      { fontSize: 13, color: '#F0EFE8', fontWeight: '600', marginBottom: 2 },
  toggleDesc:       { fontSize: 11, color: '#3A3A36' },

  notesInput:       { color: '#F0EFE8', fontSize: 13, lineHeight: 22, minHeight: 140, padding: 16 },

  disclosure:       { backgroundColor: '#161614', borderRadius: 12, borderWidth: 1, borderColor: '#252523', padding: 16, marginBottom: 20, marginTop: 12 },
  disclosureTitle:  { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#3A3A36', marginBottom: 10 },
  disclosureText:   { fontSize: 11, color: '#4A4A46', lineHeight: 18 },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard:        { backgroundColor: '#1C1C1A', borderRadius: 20, padding: 28, width: '100%', borderWidth: 1, borderColor: '#2A2A28' },
  modalTitle:       { fontSize: 22, fontWeight: '800', color: '#F0EFE8', marginBottom: 16, lineHeight: 30 },
  modalBody:        { fontSize: 14, color: '#888780', lineHeight: 22, marginBottom: 28 },
  modalBtn:         { backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  modalBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  previewBtn:       { borderWidth: 1.5, borderColor: '#1D9E75', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  previewBtnText:   { color: '#1D9E75', fontSize: 15, fontWeight: '700' },
  generateBtn:      { backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  generateBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:      { opacity: 0.5 },
});
