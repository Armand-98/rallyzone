import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInsights, InsightsSummary } from '../hooks/useInsights';

const MOOD_LABELS = ['Rough', 'Low', 'Okay', 'Good', 'Solid'];
const MOOD_COLORS = ['#A32D2D', '#C4722A', '#888780', '#1D9E75', '#2ECC8A'];

function moodColor(val: number | null): string {
  if (val === null) return '#3A3A36';
  return MOOD_COLORS[Math.round(Math.clamp ? Math.clamp(val, 0, 4) : Math.min(4, Math.max(0, val)))];
}

function moodLabel(val: number | null): string {
  if (val === null) return '—';
  return MOOD_LABELS[Math.round(Math.min(4, Math.max(0, val)))];
}

function fmt(val: number | null, decimals = 1): string {
  if (val === null) return '—';
  return val.toFixed(decimals);
}

function trendIcon(trend: InsightsSummary['moodTrend']): string {
  switch (trend) {
    case 'improving':    return '↑';
    case 'declining':    return '↓';
    case 'stable':       return '→';
    case 'insufficient': return '—';
  }
}

function trendColor(trend: InsightsSummary['moodTrend']): string {
  switch (trend) {
    case 'improving':    return '#1D9E75';
    case 'declining':    return '#A32D2D';
    case 'stable':       return '#888780';
    case 'insufficient': return '#3A3A36';
  }
}

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInsights().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pattern Insights</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#1D9E75" />
        </View>
      ) : !data || data.totalEntries < 3 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyText}>
            Log at least 3 mission briefs to start seeing your patterns.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Mood Overview */}
          <Text style={styles.sectionLabel}>MOOD OVERVIEW</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>7-DAY AVG</Text>
                <Text style={[styles.statValue, { color: moodColor(data.avgMood7) }]}>
                  {moodLabel(data.avgMood7)}
                </Text>
                <Text style={styles.statSub}>{fmt(data.avgMood7)} / 4</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>30-DAY AVG</Text>
                <Text style={[styles.statValue, { color: moodColor(data.avgMood30) }]}>
                  {moodLabel(data.avgMood30)}
                </Text>
                <Text style={styles.statSub}>{fmt(data.avgMood30)} / 4</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>TREND</Text>
                <Text style={[styles.statValue, { color: trendColor(data.moodTrend) }]}>
                  {trendIcon(data.moodTrend)}
                </Text>
                <Text style={styles.statSub}>{data.moodTrend}</Text>
              </View>
            </View>
          </View>

          {/* Best / Worst Days */}
          {(data.bestDayOfWeek || data.worstDayOfWeek) && (
            <>
              <Text style={styles.sectionLabel}>DAY OF WEEK PATTERNS</Text>
              <View style={styles.card}>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>BEST DAY</Text>
                    <Text style={[styles.statValue, { color: '#1D9E75', fontSize: 16 }]}>
                      {data.bestDayOfWeek ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>HARDEST DAY</Text>
                    <Text style={[styles.statValue, { color: '#A32D2D', fontSize: 16 }]}>
                      {data.worstDayOfWeek ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Energy & Sleep */}
          <Text style={styles.sectionLabel}>ENERGY & SLEEP (7-DAY)</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>ENERGY</Text>
                <Text style={styles.statValue}>{fmt(data.avgEnergy7)}</Text>
                <Text style={styles.statSub}>out of 4</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>SLEEP</Text>
                <Text style={styles.statValue}>{fmt(data.avgSleep7)}</Text>
                <Text style={styles.statSub}>out of 4</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CHECK-INS</Text>
                <Text style={styles.statValue}>{data.amEntries + data.pmEntries}</Text>
                <Text style={styles.statSub}>{data.amEntries}AM · {data.pmEntries}PM</Text>
              </View>
            </View>
          </View>

          {/* Triggers */}
          {data.avgIntensity30 !== null && (
            <>
              <Text style={styles.sectionLabel}>TRIGGER PATTERNS (30-DAY)</Text>
              <View style={styles.card}>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>AVG INTENSITY</Text>
                    <Text style={[
                      styles.statValue,
                      { color: data.avgIntensity30 >= 7 ? '#A32D2D' : data.avgIntensity30 >= 4 ? '#C4722A' : '#1D9E75' }
                    ]}>
                      {fmt(data.avgIntensity30)}
                    </Text>
                    <Text style={styles.statSub}>out of 10</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>HIGH-INTENSITY</Text>
                    <Text style={[styles.statValue, { color: data.highIntensityDays > 0 ? '#C4722A' : '#1D9E75' }]}>
                      {data.highIntensityDays}
                    </Text>
                    <Text style={styles.statSub}>days (7+)</Text>
                  </View>
                </View>
                {data.topTriggerWords.length > 0 && (
                  <View style={styles.tagSection}>
                    <Text style={styles.tagLabel}>RECURRING THEMES</Text>
                    <View style={styles.tags}>
                      {data.topTriggerWords.map(word => (
                        <View key={word} style={styles.tag}>
                          <Text style={styles.tagText}>{word}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Grounding */}
          <Text style={styles.sectionLabel}>CALM TOOLKIT (30-DAY)</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>SESSIONS</Text>
                <Text style={[styles.statValue, { color: data.groundingSessions30 > 0 ? '#1D9E75' : '#888780' }]}>
                  {data.groundingSessions30}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>AVG DURATION</Text>
                <Text style={styles.statValue}>
                  {data.avgGroundingDuration !== null
                    ? `${Math.round(data.avgGroundingDuration)}s`
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            All analysis runs on your device. Nothing is transmitted or stored externally.
          </Text>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#111110' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  backBtn:      { width: 60 },
  backText:     { color: '#1D9E75', fontSize: 14 },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: '#F0EFE8' },
  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon:    { fontSize: 48 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#F0EFE8', textAlign: 'center' },
  emptyText:    { fontSize: 13, color: '#5F5E5A', textAlign: 'center', lineHeight: 20 },
  scroll:       { padding: 20, paddingBottom: 48 },
  sectionLabel: { fontSize: 10, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },
  card:         { backgroundColor: '#1C1C1A', borderRadius: 14, borderWidth: 1, borderColor: '#252523', overflow: 'hidden', marginBottom: 16 },
  statRow:      { flexDirection: 'row', padding: 16 },
  stat:         { flex: 1, alignItems: 'center', gap: 4 },
  statDivider:  { width: 1, backgroundColor: '#252523', marginVertical: 4 },
  statLabel:    { fontSize: 9, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.6, textAlign: 'center' },
  statValue:    { fontSize: 20, fontWeight: '700', color: '#F0EFE8', textAlign: 'center' },
  statSub:      { fontSize: 10, color: '#5F5E5A', textAlign: 'center' },
  tagSection:   { borderTopWidth: 1, borderTopColor: '#252523', padding: 14 },
  tagLabel:     { fontSize: 9, color: '#3A3A36', fontWeight: '600', letterSpacing: 0.6, marginBottom: 10 },
  tags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:          { backgroundColor: '#252523', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  tagText:      { fontSize: 12, color: '#888780' },
  footer:       { fontSize: 10, color: '#2E2E2B', textAlign: 'center', marginTop: 8, lineHeight: 16 },
});