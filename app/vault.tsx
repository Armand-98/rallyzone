import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumGate } from '../components/PremiumGate';
import {
  addVaultEntry,
  authenticateVault,
  deleteVaultEntry,
  getVaultEntries,
  VaultEntry,
} from '../hooks/useVault';

export default function VaultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const authenticate = async () => {
    const ok = await authenticateVault();
    if (ok) {
      const data = await getVaultEntries();
      setEntries(data);
      setUnlocked(true);
    } else {
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      setUnlocked(false);
      authenticate();
    }, [])
  );

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addVaultEntry(text.trim());
      const updated = await getVaultEntries();
      setEntries(updated);
      setText('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete entry',
      'This entry will be permanently deleted from your vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVaultEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <PremiumGate fallbackLabel="Secure Vault is a premium feature. Your private entries are locked behind biometric auth and never leave your device.">
      {!unlocked ? (
        <View style={[styles.lockScreen, { paddingTop: insets.top }]}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Secure Vault</Text>
          <Text style={styles.lockSub}>Authenticating…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={[styles.container, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Secure Vault</Text>
            <View style={{ width: 60 }} />
          </View>

          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Your vault is empty. Write something only you will see.
                </Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Write something private…"
                  placeholderTextColor="#5F5E5A"
                  multiline
                  value={text}
                  onChangeText={setText}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.saveBtn, (!text.trim() || saving) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!text.trim() || saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save to Vault'}</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.entryCard}>
                <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
                <Text style={styles.entryContent}>{item.content}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </KeyboardAvoidingView>
      )}
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#111110' },
  lockScreen:      { flex: 1, backgroundColor: '#111110', alignItems: 'center', justifyContent: 'center', gap: 12 },
  lockIcon:        { fontSize: 48 },
  lockTitle:       { fontSize: 22, fontWeight: '700', color: '#F0EFE8' },
  lockSub:         { fontSize: 14, color: '#5F5E5A' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  backBtn:         { width: 60 },
  backText:        { color: '#1D9E75', fontSize: 14 },
  headerTitle:     { fontSize: 16, fontWeight: '600', color: '#F0EFE8' },
  list:            { padding: 20, gap: 12 },
  inputCard:       { backgroundColor: '#1A1A18', borderRadius: 14, padding: 14, marginBottom: 12, gap: 10 },
  input:           { color: '#F0EFE8', fontSize: 14, lineHeight: 22, minHeight: 100 },
  saveBtn:         { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty:           { paddingVertical: 40, alignItems: 'center' },
  emptyText:       { color: '#5F5E5A', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  entryCard:       { backgroundColor: '#1A1A18', borderRadius: 14, padding: 14, gap: 10 },
  entryDate:       { fontSize: 11, color: '#5F5E5A' },
  entryContent:    { fontSize: 14, color: '#F0EFE8', lineHeight: 22 },
  deleteBtn:       { alignSelf: 'flex-end' },
  deleteText:      { fontSize: 12, color: '#E24B4A' },
});