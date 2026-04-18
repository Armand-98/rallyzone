import { randomUUID } from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface VaultEntry {
  id: string;
  created_at: string;
  content: string;
}

const INDEX_KEY = 'vault_index';

async function getIndex(): Promise<VaultEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveIndex(entries: VaultEntry[]) {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(entries));
}

export async function authenticateVault(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  // If device has biometrics enrolled, use them with PIN fallback
  // If no biometrics but device has a PIN/pattern, force device credentials
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access Secure Vault',
    fallbackLabel: 'Use PIN',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  return result.success;
}

export async function getVaultEntries(): Promise<VaultEntry[]> {
  const entries = await getIndex();
  return entries.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function addVaultEntry(content: string): Promise<VaultEntry> {
  const entry: VaultEntry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    content,
  };
  const existing = await getIndex();
  await saveIndex([...existing, entry]);
  return entry;
}

export async function deleteVaultEntry(id: string): Promise<void> {
  const existing = await getIndex();
  await saveIndex(existing.filter((e) => e.id !== id));
}