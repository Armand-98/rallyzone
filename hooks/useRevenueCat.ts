import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_GOOGLE_API_KEY } from '../constants/keys';

export const ENTITLEMENT_ID = 'premium';

export function initRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
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

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPremium(
        typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
      );
    });

    return () => listener.remove();
  }, []);

  return { customerInfo, isPremium, loading };
}