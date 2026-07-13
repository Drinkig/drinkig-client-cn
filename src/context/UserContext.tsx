import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMemberInfo, logout as apiLogout } from "../api/member";
import { getOnboardingRecommendation } from "../api/wine";
import client from "../api/client";
import auth from "@react-native-firebase/auth";
import { getAccessToken, saveTokens, clearTokens } from "../utils/tokenStorage";

import { FlavorProfile } from "../components/onboarding/FlavorProfileStep";

export interface User {
  nickname: string;
  profileImage: string | null;
  email?: string;
  authType?: string;
  // 서버가 기록한 마지막 취향 재설정 시각(ISO) — 쿨다운 검증의 1차 소스
  lastTasteResetAt?: string | null;
}

export interface RecommendedWine {
  sort: string;
  country: string;
  countryEng?: string;
  region: string;
  regionEng?: string;
  variety: string;
  varietyEng?: string;
}

interface UserContextType {
  user: User | null;
  recommendations: RecommendedWine[];
  flavorProfile: FlavorProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (
    accessToken: string,
    refreshToken?: string,
    isFirst?: boolean
  ) => Promise<void>;
  loginGuest: () => void;
  logout: (skipServerLogout?: boolean) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setRecommendations: (recs: RecommendedWine[]) => void;
  setFlavorProfile: (profile: FlavorProfile) => void;
  refreshUserInfo: () => Promise<void>;
  completeOnboarding: () => void;
  resetToOnboarding: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendationsState] = useState<
    RecommendedWine[]
  >([]);
  const [flavorProfile, setFlavorProfileState] = useState<FlavorProfile | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // ...

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await getAccessToken();
      const isNewUserStored = await AsyncStorage.getItem("isNewUser");
      let needsOnboarding = false;
      if (isNewUserStored === "true") {
        // 온보딩 API 제출까지 마쳤지만 결과 화면 도달 전에 종료된 경우 —
        // 온보딩을 다시 시키지 않고 완료 처리한다. (닉네임이 이미 서버에
        // 등록돼 있어 재온보딩 시 "중복"으로 진행이 막히는 문제 방지)
        const submitted = await AsyncStorage.getItem("onboardingSubmitted");
        if (submitted === "true") {
          await AsyncStorage.multiRemove([
            "isNewUser",
            "onboardingSubmitted",
            "onboardingDraft",
          ]);
        } else {
          setIsNewUser(true);
          needsOnboarding = true;
        }
      }

      if (token) {
        try {
          await refreshUserInfo();

          // 온보딩 미완료 유저는 취향이 없어 서버 추천이 무의미하므로 건너뛴다.
          if (!needsOnboarding) {
            // 추천은 서버를 source of truth로 — 다른 기기에서 재설정해도
            // 최신을 따라간다. 서버 실패 시에만 로컬 저장본으로 폴백.
            try {
              const recResponse = await getOnboardingRecommendation();
              if (recResponse.isSuccess && recResponse.result.length > 0) {
                setRecommendations(recResponse.result);
              } else {
                throw new Error("empty recommendations");
              }
            } catch (recError) {
              console.warn(
                "Failed to restore recommendations from server, using local cache",
                recError
              );
              try {
                const savedRecs = await AsyncStorage.getItem("recommendations");
                if (savedRecs) {
                  setRecommendationsState(JSON.parse(savedRecs));
                }
              } catch (parseError) {
                console.warn(
                  "Failed to parse local recommendations",
                  parseError
                );
              }
            }
          }
        } catch (e: any) {
          console.error(
            "UserContext: Failed to refresh user info with token",
            e
          );

          if (e.response && e.response.status === 401) {
            await logout(true);
          } else {
            setIsLoggedIn(true);
          }
        }
      }
      setIsLoading(false);
    };

    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        try {
          // We might still want to refresh info if firebase login happens (e.g. Kakao)
          // But if we have a backend token, we prefer that.
          // For now, let's just refresh.
          await refreshUserInfo();
        } catch (e) {
          console.error("UserContext: Failed to fetch user profile", e);
        }
      } else {
        // Check if we have a backend token before logging out
        const token = await getAccessToken();
        if (token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setFlavorProfileState(null);
        }
      }
      setIsLoading(false);
    });

    checkLoginStatus();

    return unsubscribe;
  }, []);

  const refreshUserInfo = async () => {
    try {
      const response = await getMemberInfo();
      if (response.isSuccess) {
        setUser({
          nickname: response.result.username,
          profileImage: response.result.imageUrl,
          email: response.result.email,
          authType: response.result.authType,
          lastTasteResetAt: response.result.lastTasteResetAt ?? null,
        });

        if (
          response.result.acidity !== undefined &&
          response.result.sweetness !== undefined &&
          response.result.tannin !== undefined &&
          response.result.body !== undefined &&
          response.result.alcohol !== undefined
        ) {
          setFlavorProfile({
            acidity: response.result.acidity,
            sweetness: response.result.sweetness,
            tannin: response.result.tannin,
            body: response.result.body,
            alcohol: response.result.alcohol,
          });
        }
      } else {
        // API 호출은 성공했지만 비즈니스 로직 실패 (예: 유저 없음)
        throw new Error(response.message || "Failed to fetch user info");
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      throw error; // initAuth에서 잡아서 로그아웃 처리할 수 있도록 에러 전파
    }
  };

  const login = async (
    accessToken: string,
    refreshToken?: string,
    isFirst: boolean = false
  ) => {
    if (accessToken && refreshToken) {
      await saveTokens(accessToken, refreshToken);
    }

    if (isFirst) {
      setIsNewUser(true);
      await AsyncStorage.setItem("isNewUser", "true");
    }

    setIsLoggedIn(true);

    await refreshUserInfo();

    // 온보딩 전(isFirst) 유저는 취향이 없어 서버가 기본값 기준의 무의미한
    // 추천을 반환하므로 저장하지 않는다 — 온보딩 결과 화면에서 채워진다.
    if (!isFirst) {
      try {
        const recResponse = await getOnboardingRecommendation();
        if (recResponse.isSuccess && recResponse.result.length > 0) {
          setRecommendations(recResponse.result);
        }
      } catch (recError) {
        console.warn("Failed to fetch recommendations on login", recError);
      }
    }
  };

  const loginGuest = () => {
    setIsLoggedIn(true);
    setUser({
      nickname: "Guest",
      profileImage: null,
    });
  };

  const logout = async (skipServerLogout: boolean = false) => {
    try {
      if (!skipServerLogout) {
        try {
          await apiLogout();
        } catch (e) {
          console.warn("Server logout failed:", e);
        }
      }

      try {
        await auth().signOut();
      } catch (e) {
        console.warn("Firebase signOut failed (probably no user):", e);
      }

      await clearTokens();

      await AsyncStorage.removeItem("recommendations");
      await AsyncStorage.removeItem("flavorProfile");

      setUser(null);
      setRecommendationsState([]);
      setFlavorProfileState(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
      // Ensure we clean up locally even if everything explodes
      await clearTokens();
      setIsLoggedIn(false);
    }
  };

  const completeOnboarding = async () => {
    setIsNewUser(false);
    await AsyncStorage.multiRemove([
      "isNewUser",
      "onboardingSubmitted",
      "onboardingDraft",
    ]);

    refreshUserInfo();
  };

  const resetToOnboarding = async () => {
    await AsyncStorage.setItem("isNewUser", "true");
    // 이전 온보딩의 완료 플래그/드래프트가 남아있으면 재온보딩이 건너뛰어지므로 제거
    await AsyncStorage.multiRemove(["onboardingSubmitted", "onboardingDraft"]);
    await AsyncStorage.removeItem("recommendations");
    await AsyncStorage.removeItem("flavorProfile");
    setRecommendationsState([]);
    setFlavorProfileState(null);
    setIsNewUser(true);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const setRecommendations = async (recs: RecommendedWine[]) => {
    setRecommendationsState(recs);
    await AsyncStorage.setItem("recommendations", JSON.stringify(recs));
  };

  const setFlavorProfile = async (profile: FlavorProfile) => {
    setFlavorProfileState(profile);
    await AsyncStorage.setItem("flavorProfile", JSON.stringify(profile));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        recommendations,
        flavorProfile,
        isLoggedIn,
        isLoading,
        isNewUser,
        login,
        loginGuest,
        logout,
        updateUser,
        setRecommendations,
        setFlavorProfile,
        refreshUserInfo,
        completeOnboarding,
        resetToOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
