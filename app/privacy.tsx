import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

const HOSTED_URL = 'https://armand-98.github.io/rallyzone';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LOCAL-FIRST · NO DATA SOLD · EVER</Text>
        </View>

        <Text style={styles.title}>Your data stays with you.</Text>
        <Text style={styles.lead}>
          RallyZone was built for people who have earned the right to keep things private.
          This policy is written plainly — no legal fog, no fine print.
        </Text>

        <View style={styles.divider} />

        <Section title="What we collect">
          Nothing leaves your device unless you explicitly turn on cloud sync.{'\n\n'}
          Everything you enter — your call sign, role, mood check-ins, trigger logs,
          grounding sessions — is stored in a local database on your phone only.
          RallyZone has no servers that receive or store your personal wellness data.
        </Section>

        <Section title="What we do NOT do">
          {'· We do not sell your data. Not now, not ever.\n'}
          {'· We do not run analytics on your entries.\n'}
          {'· We do not require an account to use the app.\n'}
          {'· We do not share your information with third parties.\n'}
          {'· We do not use your data to train AI models.'}
        </Section>

        <Section title="Local storage">
          Your data is stored using SQLite directly on your device. It is subject to
          your device's own security (screen lock, biometrics). If you delete the app,
          your data is deleted with it. There is no backup unless you enable optional
          cloud sync.
        </Section>

        <Section title="Optional cloud sync">
          Cloud sync is off by default. If you choose to enable it, your data is
          encrypted end-to-end before it leaves your device using your personal
          encryption key. The sync server receives only encrypted data — it cannot
          read your entries. You can disable sync and delete your cloud data at any time.
        </Section>

        <Section title="Crisis line integration">
          When you tap the crisis rail, RallyZone opens the phone dialer or a browser
          link directly. We do not log, record, or transmit the fact that you accessed
          a crisis resource.
        </Section>

        <Section title="Payments">
          If you subscribe to RallyZone Premium, payments are processed by Apple
          (App Store) or Google (Play Store) through their standard billing systems.
          We never see or store your payment card details. Subscription management
          is handled via RevenueCat, which operates under its own privacy policy.
        </Section>

        <Section title="Children">
          RallyZone is designed for adults aged 18 and over. We do not knowingly
          collect data from anyone under 18.
        </Section>

        <Section title="Changes to this policy">
          If this policy changes in a material way, we will notify you inside the app
          before the change takes effect. We will never retroactively change how
          previously collected data is used.
        </Section>

        <Section title="Contact">
          Questions? You can reach us at:{'\n'}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:privacy@lyfieldcreationsos.com')}
          >
            privacy@lyfieldcreationsos.com
          </Text>
        </Section>

        <View style={styles.divider} />

        <Text style={styles.meta}>
          LyfieldCreationsOS · RallyZone{'\n'}
          Effective date: April 2026{'\n'}
          Version 1.0
        </Text>

        <Pressable
          style={styles.hostedBtn}
          onPress={() => Linking.openURL(HOSTED_URL)}
        >
          <Text style={styles.hostedBtnText}>View hosted version ↗</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  backArrow: {
    fontSize: 18,
    color: Colors.primary,
  },
  backLabel: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  headerTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  scroll: {
    padding: Spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  badgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  lead: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sectionBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  hostedBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hostedBtnText: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
});