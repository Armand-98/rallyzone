import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: '🔒', label: 'Secure Vault',     desc: 'Biometric-locked private journal' },
  { icon: '📊', label: 'Pattern Insights', desc: 'On-device mood & trigger analysis' },
  { icon: '📄', label: 'PDF Export',       desc: 'VA-ready reports, fully offline' },
  { icon: '🛡️', label: 'Privacy First',    desc: 'Zero data sold. Ever.' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        Alert.alert('Not available', 'Subscriptions are not available right now. Please try again later.');
        return;
      }
      const pkg = selected === 'annual' ? current.annual : current.monthly;
      if (!pkg) {
        Alert.alert('Not available', 'That plan is not available right now.');
        return;
      }
      await Purchases.purchasePackage(pkg);
      Alert.alert('Welcome to Premium', 'Your subscription is active. Thank you for supporting RallyZone.');
      router.back();
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', e.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      const active = info.entitlements.active['premium'];
      if (active) {
        Alert.alert('Restored', 'Your premium subscription has been restored.');
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Explicit header with close button */}
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={styles.headerTitle} numberOfLines={1}>RallyZone Premium</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText} maxFontSizeMultiplier={1.3}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.headline}>Gear up for the long haul.</Text>
        <Text style={styles.sub}>
          Everything in RallyZone, unlocked. Built for those who've carried more than most.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <TouchableOpacity
            style={[styles.plan, selected === 'annual' && styles.planSelected]}
            onPress={() => setSelected('annual')}
          >
            <View style={styles.planTop}>
              <Text style={[styles.planName, selected === 'annual' && styles.planNameSelected]}>Annual</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>SAVE 37%</Text>
              </View>
            </View>
            <Text style={[styles.planPrice, selected === 'annual' && styles.planPriceSelected]}>$59.99 / year</Text>
            <Text style={[styles.planSub, selected === 'annual' && styles.planSubSelected]}>$5.00 / month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.plan, selected === 'monthly' && styles.planSelected]}
            onPress={() => setSelected('monthly')}
          >
            <View style={styles.planTop}>
              <Text style={[styles.planName, selected === 'monthly' && styles.planNameSelected]}>Monthly</Text>
            </View>
            <Text style={[styles.planPrice, selected === 'monthly' && styles.planPriceSelected]}>$7.99 / month</Text>
            <Text style={[styles.planSub, selected === 'monthly' && styles.planSubSelected]}>Cancel anytime</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              {selected === 'annual' ? 'Start Annual — $59.99' : 'Start Monthly — $7.99'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
          Manage or cancel anytime in your device's subscription settings. No refunds for partial periods.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#111110' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  headerTitle:       { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#888780' },
  closeBtn:          { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A18', borderRadius: 22 },
  closeText:         { color: '#F0EFE8', fontSize: 16, fontWeight: '600' },
  scroll:            { padding: 20, paddingBottom: 64 },
  badge:             { alignSelf: 'flex-start', backgroundColor: '#1D9E75', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeText:         { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headline:          { fontSize: 28, fontWeight: '700', color: '#F0EFE8', marginBottom: 8, lineHeight: 34 },
  sub:               { fontSize: 14, color: '#888780', lineHeight: 22, marginBottom: 28 },
  features:          { marginBottom: 28, gap: 16 },
  featureRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon:       { fontSize: 22, width: 32, textAlign: 'center' },
  featureText:       { flex: 1 },
  featureLabel:      { fontSize: 14, fontWeight: '600', color: '#F0EFE8', marginBottom: 2 },
  featureDesc:       { fontSize: 12, color: '#888780', lineHeight: 18 },
  plans:             { flexDirection: 'row', gap: 10, marginBottom: 20 },
  plan:              { flex: 1, backgroundColor: '#1A1A18', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#2D2D2B' },
  planSelected:      { borderColor: '#1D9E75', backgroundColor: '#0F2A20' },
  planTop:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  planName:          { fontSize: 13, fontWeight: '600', color: '#888780' },
  planNameSelected:  { color: '#9FE1CB' },
  saveBadge:         { backgroundColor: '#1D9E75', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 },
  saveText:          { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  planPrice:         { fontSize: 15, fontWeight: '700', color: '#F0EFE8', marginBottom: 2 },
  planPriceSelected: { color: '#fff' },
  planSub:           { fontSize: 11, color: '#5F5E5A' },
  planSubSelected:   { color: '#9FE1CB' },
  cta:               { backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  ctaDisabled:       { opacity: 0.6 },
  ctaText:           { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreBtn:        { alignItems: 'center', paddingVertical: 10, marginBottom: 20 },
  restoreText:       { color: '#888780', fontSize: 13 },
  legal:             { fontSize: 10, color: '#3A3A36', lineHeight: 16, textAlign: 'center' },
});