import { Slot, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initDB } from '../db';
import { getPref } from '../db/prefs';
import { initRevenueCat } from '../hooks/useRevenueCat';

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const initialized = useRef(false);

  // Slot must render first before we can navigate
  useEffect(() => {
    const timer = setTimeout(() => setRouteReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!routeReady) return;
    if (initialized.current) return;
    initialized.current = true;

    const boot = async () => {
      try {
        await initDB();
        initRevenueCat();
        const done = await getPref('onboarding_complete');
        if (done === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error('Boot error:', e);
        router.replace('/onboarding');
      } finally {
        setReady(true);
      }
    };
    boot();
  }, [routeReady]);

  return (
    <>
      <Slot />
      {!ready && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#111110',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ActivityIndicator color="#1D9E75" />
        </View>
      )}
    </>
  );
}