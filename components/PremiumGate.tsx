import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
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
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.label}>{fallbackLabel}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/paywall')}>
          <Text style={styles.btnText}>Unlock Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  lock: {
    fontSize: 40,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 10,
    marginTop: SPACING.sm,
  },
  btnText: {
    ...TYPOGRAPHY.label,
    color: '#fff',
    fontWeight: '600',
  },
});