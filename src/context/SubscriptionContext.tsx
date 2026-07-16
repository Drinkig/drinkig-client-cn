import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSubscriptionStatus,
  setDevPremium,
  SubscriptionFeatures,
} from "../api/subscription";
import { isDevAccessEnabled } from "../utils/devAccess";
import { initIap } from "../utils/iapManager";
import { useUser } from "./UserContext";

export type SubscriptionPlan = "FREE" | "MONTHLY" | "YEARLY";
export type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "GRACE_PERIOD";
export type DevSubscriptionOverride = "none" | "premium" | "free";

const DEV_OVERRIDE_STORAGE_KEY = "@dev_subscription_override";
const DEV_EXPIRY_OVERRIDE_KEY = "@dev_expiry_override";

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  platform: "APPLE" | "PROMO" | null;
  isPremium: boolean;
  features: SubscriptionFeatures;
}

interface SubscriptionContextType extends SubscriptionState {
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  checkFeature: (feature: keyof SubscriptionFeatures) => boolean;
  devOverride: DevSubscriptionOverride;
  setDevOverride: (override: DevSubscriptionOverride) => Promise<void>;
}

const freeFeatures: SubscriptionFeatures = {
  unlimitedScan: false,
  wineCompatibility: false,
  foodPairing: false,
  tasteReset: false,
};

const premiumFeatures: SubscriptionFeatures = {
  unlimitedScan: true,
  wineCompatibility: true,
  foodPairing: true,
  tasteReset: true,
};

const defaultState: SubscriptionState = {
  plan: "FREE",
  status: "ACTIVE",
  expiresAt: null,
  platform: null,
  isPremium: false,
  features: freeFeatures,
};

const premiumState: SubscriptionState = {
  plan: "MONTHLY",
  status: "ACTIVE",
  expiresAt: null,
  platform: "PROMO",
  isPremium: true,
  features: premiumFeatures,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useUser();
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const [devOverride, setDevOverrideState] =
    useState<DevSubscriptionOverride>("none");
  const [overrideHydrated, setOverrideHydrated] = useState(!isDevAccessEnabled);

  // Hydrate dev override from storage on mount (dev builds & TestFlight only)
  useEffect(() => {
    if (!isDevAccessEnabled) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DEV_OVERRIDE_STORAGE_KEY);
        if (stored === "premium" || stored === "free") {
          setDevOverrideState(stored);
        }
      } catch (e) {
        console.warn("Failed to load dev subscription override", e);
      } finally {
        setOverrideHydrated(true);
      }
    })();
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (isDevAccessEnabled && devOverride === "premium") {
      setState(premiumState);
      return;
    }
    if (isDevAccessEnabled && devOverride === "free") {
      setState(defaultState);
      return;
    }

    if (!isLoggedIn) {
      setState(defaultState);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getSubscriptionStatus();
      if (response.isSuccess) {
        let { expiresAt: expiry } = response.result;

        // Dev expiry override for testing the expiry banner
        if (isDevAccessEnabled) {
          const devExpiry = await AsyncStorage.getItem(DEV_EXPIRY_OVERRIDE_KEY);
          if (devExpiry) {
            expiry = devExpiry;
          }
        }

        setState({
          plan: response.result.plan,
          status: response.result.status,
          expiresAt: expiry,
          platform: response.result.platform,
          isPremium: response.result.isPremium,
          features: response.result.features,
        });
      }
    } catch (error) {
      console.warn("Failed to fetch subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, devOverride]);

  // Re-apply state whenever the dev override changes (after hydration)
  useEffect(() => {
    if (!overrideHydrated) return;
    refreshSubscription();
  }, [devOverride, overrideHydrated, refreshSubscription]);

  // IAP 연결·구매 리스너를 전역 1회 등록.
  // Paywall이 닫힌 뒤 재전송되는 거래(강제종료/Ask to Buy 등)도
  // 여기서 검증·finish·구독 갱신까지 처리된다.
  useEffect(() => {
    if (!isLoggedIn) return;
    initIap(refreshSubscription);
  }, [isLoggedIn, refreshSubscription]);

  const setDevOverride = useCallback(
    async (override: DevSubscriptionOverride) => {
      if (override === "none") {
        await AsyncStorage.removeItem(DEV_OVERRIDE_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(DEV_OVERRIDE_STORAGE_KEY, override);
      }
      setDevOverrideState(override);
      // 서버에도 반영해 스캔 등 서버 측 제한이 프리미엄 여부와 일치하게 한다.
      // "premium"만 부여, "free"/"none"은 dev로 부여한 프리미엄 해제(실구독은 서버가 보존).
      // 서버가 dev 플래그로 가드하므로 prod에선 403 → 조용히 무시.
      try {
        await setDevPremium(override === "premium");
      } catch (e) {
        console.warn("dev premium 서버 동기화 실패", e);
      }
    },
    []
  );

  const checkFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      return state.features[feature];
    },
    [state.features]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        isLoading,
        refreshSubscription,
        checkFeature,
        devOverride,
        setDevOverride,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
