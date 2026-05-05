import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_GOOGLE_API_KEY, REVENUECAT_APPLE_API_KEY } from '../constants/keys';

export const ENTITLEMENT_ID = 'premium';

export function initRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_APPLE_API_KEY : REVENUECAT_GOOGLE_API_KEY;
  Purchases.configure({ apiKey });
}

export function useRevenueCat() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setIsPremium(
          typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
        );
      } catch (e) {
        console.log('RevenueCat load error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();

    // addCustomerInfoUpdateListener returns a cleanup function directly
    // in react-native-purchases v6+, not an object with .remove()
    const removeListener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPremium(
        typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
      );
    });

    return () => {
      if (typeof removeListener === 'function') {
        removeListener();
      } else if (removeListener && typeof (removeListener as any).remove === 'function') {
        (removeListener as any).remove();
      }
    };
  }, []);

  return { customerInfo, isPremium, loading };
}