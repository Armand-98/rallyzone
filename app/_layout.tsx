import { Slot, router, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from '../db/index';
import { getPref, initPrefsTable } from '../db/prefs';

export default function RootLayout() {
  const navState = useRootNavigationState();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        await initPrefsTable();
        const done = await getPref('onboarding_complete');
        setOnboardingDone(done === 'true');
      } catch (e) {
        console.error('Boot error:', e);
        setOnboardingDone(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!navState?.key || onboardingDone === null) return;
    router.replace(onboardingDone ? '/(tabs)' : '/onboarding');
  }, [navState?.key, onboardingDone]);

  const ready = navState?.key && onboardingDone !== null;

  return (
    <SafeAreaProvider>
      {!ready ? (
        <View style={{ flex: 1, backgroundColor: '#111110', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#5B8A5F" size="large" />
        </View>
      ) : (
        <Slot />
      )}
    </SafeAreaProvider>
  );
}