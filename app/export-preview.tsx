import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { htmlCache } from '../hooks/usePDFExport';

export default function ExportPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  const [html,     setHtml]     = useState('');
  const [sharing,  setSharing]  = useState(false);
  const [webReady, setWebReady] = useState(false);

  useEffect(() => {
    const cached = htmlCache.get();
    if (!cached) {
      // Guard against navigating here without a cached document
      Alert.alert('Nothing to preview', 'Go back and configure your document first.');
      router.back();
      return;
    }
    setHtml(cached);
  }, []);

  const handleShare = async () => {
    if (!html) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType:    'application/pdf',
          dialogTitle: 'Share Wellness Document',
          UTI:         'com.adobe.pdf',
        });
      }
    } catch (e: any) {
      Alert.alert('Share failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          disabled={sharing}
        >
          <Text style={styles.backText} maxFontSizeMultiplier={1.3}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Document Preview</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Loading overlay shown until WebView finishes rendering */}
      {(!webReady || !html) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#1D9E75" size="large" />
          <Text style={styles.loadingText}>Building document…</Text>
        </View>
      )}

      {html ? (
        <WebView
          ref={webRef}
          // Render from the HTML string directly — no network request, works offline
          source={{ html }}
          originWhitelist={['*']}
          javaScriptEnabled={false}
          scrollEnabled
          showsVerticalScrollIndicator
          style={styles.webview}
          onLoad={() => setWebReady(true)}
        />
      ) : null}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.footerNote}>
          Review your document above, then share it as a PDF.
        </Text>
        <TouchableOpacity
          style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={sharing || !html}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>Generate &amp; Share PDF</Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#111110' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A18' },
  backBtn:         { width: 60 },
  backText:        { color: '#1D9E75', fontSize: 14 },
  headerTitle:     { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#F0EFE8' },

  webview:         { flex: 1 },

  loadingOverlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111110', zIndex: 10 },
  loadingText:     { marginTop: 12, color: '#5F5E5A', fontSize: 13 },

  footer:          { backgroundColor: '#111110', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1A1A18' },
  footerNote:      { fontSize: 11, color: '#3A3A36', textAlign: 'center', marginBottom: 12 },
  shareBtn:        { backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  shareBtnDisabled:{ opacity: 0.5 },
  shareBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
