import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMemberInfo, logout as apiLogout } from '../api/member';
import { getOnboardingRecommendation } from '../api/wine';
import client from '../api/client';
import auth from '@react-native-firebase/auth';
import { getAccessToken, saveTokens, clearTokens } from '../utils/tokenStorage';


import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';


export interface User {
  nickname: string;
  profileImage: string | null;
  email?: string;
  authType?: string;
}

export interface RecommendedWine {
  sort: string;
  country: string;
  region: string;
  variety: string;
}


interface UserContextType {
  user: User | null;
  recommendations: RecommendedWine[];
  flavorProfile: FlavorProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (accessToken: string, refreshToken?: string, isFirst?: boolean) => Promise<void>;
  loginGuest: () => void;
  logout: (skipServerLogout?: boolean) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setRecommendations: (recs: RecommendedWine[]) => void;
  setFlavorProfile: (profile: FlavorProfile) => void;
  refreshUserInfo: () => Promise<void>;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendationsState] = useState<RecommendedWine[]>([]);
  const [flavorProfile, setFlavorProfileState] = useState<FlavorProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);



  // ...

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          await refreshUserInfo();

          const savedRecs = await AsyncStorage.getItem('recommendations');
          if (savedRecs) {
            setRecommendationsState(JSON.parse(savedRecs));
          } else {
            try {
              const recResponse = await getOnboardingRecommendation();
              if (recResponse.isSuccess) {
                setRecommendations(recResponse.result);
              }
            } catch (recError) {
              console.warn('Failed to restore recommendations from server', recError);
            }
          }
        } catch (e: any) {
          console.error('UserContext: Failed to refresh user info with token', e);

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
          console.error('UserContext: Failed to fetch user profile', e);
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
        throw new Error(response.message || 'Failed to fetch user info');
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw error; // initAuth에서 잡아서 로그아웃 처리할 수 있도록 에러 전파
    }
  };

  const login = async (accessToken: string, refreshToken?: string, isFirst: boolean = false) => {
    if (accessToken && refreshToken) {
      await saveTokens(accessToken, refreshToken);
    }

    setIsLoggedIn(true);

    if (isFirst) {
      setIsNewUser(true);
      await AsyncStorage.setItem('isNewUser', 'true');
    }

    await refreshUserInfo();

    try {
      const recResponse = await getOnboardingRecommendation();
      if (recResponse.isSuccess) {
        setRecommendations(recResponse.result);
      }
    } catch (recError) {
      console.warn('Failed to fetch recommendations on login', recError);
    }
  };

  const loginGuest = () => {
    setIsLoggedIn(true);
    setUser({
      nickname: 'Guest',
      profileImage: null,
    });
  };

  const logout = async (skipServerLogout: boolean = false) => {
    try {
      if (!skipServerLogout) {
        try {
          await apiLogout();
        } catch (e) {
          console.warn('Server logout failed:', e);
        }
      }

      try {
        await auth().signOut();
      } catch (e) {
        console.warn('Firebase signOut failed (probably no user):', e);
      }

      await clearTokens();

      await AsyncStorage.removeItem('recommendations');
      await AsyncStorage.removeItem('flavorProfile');

      setUser(null);
      setRecommendationsState([]);
      setFlavorProfileState(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Ensure we clean up locally even if everything explodes
      await clearTokens();
      setIsLoggedIn(false);
    }
  };

  const completeOnboarding = async () => {
    setIsNewUser(false);
    await AsyncStorage.removeItem('isNewUser');

    refreshUserInfo();
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const setRecommendations = async (recs: RecommendedWine[]) => {
    setRecommendationsState(recs);
    await AsyncStorage.setItem('recommendations', JSON.stringify(recs));
  };

  const setFlavorProfile = async (profile: FlavorProfile) => {
    setFlavorProfileState(profile);
    await AsyncStorage.setItem('flavorProfile', JSON.stringify(profile));
  };

  return (
    <UserContext.Provider value={{ user, recommendations, flavorProfile, isLoggedIn, isLoading, isNewUser, login, loginGuest, logout, updateUser, setRecommendations, setFlavorProfile, refreshUserInfo, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
