import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { getSubscriptionStatus, SubscriptionFeatures } from '../api/subscription';
import { useUser } from './UserContext';

export type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'GRACE_PERIOD';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  platform: 'APPLE' | 'PROMO' | null;
  isPremium: boolean;
  features: SubscriptionFeatures;
}

interface SubscriptionContextType extends SubscriptionState {
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  checkFeature: (feature: keyof SubscriptionFeatures) => boolean;
}

const DEV_FORCE_PREMIUM = false;

const defaultFeatures: SubscriptionFeatures = {
  unlimitedScan: DEV_FORCE_PREMIUM,
  wineCompatibility: DEV_FORCE_PREMIUM,
  foodPairing: DEV_FORCE_PREMIUM,
  tasteReset: DEV_FORCE_PREMIUM,
};

const defaultState: SubscriptionState = {
  plan: DEV_FORCE_PREMIUM ? 'MONTHLY' : 'FREE',
  status: 'ACTIVE',
  expiresAt: null,
  platform: null,
  isPremium: DEV_FORCE_PREMIUM,
  features: defaultFeatures,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useUser();
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    // Skip API call when forcing premium in dev
    if (DEV_FORCE_PREMIUM) return;

    if (!isLoggedIn) {
      setState(defaultState);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getSubscriptionStatus();
      if (response.isSuccess) {
        setState({
          plan: response.result.plan,
          status: response.result.status,
          expiresAt: response.result.expiresAt,
          platform: response.result.platform,
          isPremium: response.result.isPremium,
          features: response.result.features,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  const checkFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    return state.features[feature];
  }, [state.features]);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        isLoading,
        refreshSubscription,
        checkFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
