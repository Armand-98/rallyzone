import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRevenueCat } from '../hooks/useRevenueCat';

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

export function PremiumGate({ children, fallbackLabel = 'This is a premium feature.' }: Props) {
  const { isPremium, loading } = useRevenueCat();
  const router = useRouter();

  if (loading) return null;

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText} maxFontSizeMultiplier={1.3}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.body}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.label}>{fallbackLabel}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/paywall')}>
            <Text style={styles.btnText}>Unlock Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111110',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backText: {
    color: '#1D9E75',
    fontSize: 14,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  lock: {
    fontSize: 40,
  },
  label: {
    fontSize: 14,
    lineHeight: 22,
    color: '#888780',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#1D9E75',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});