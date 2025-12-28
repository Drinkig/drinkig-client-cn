import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMemberInfo, logout as apiLogout } from '../api/member';
import client from '../api/client';

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


  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const persistedIsNewUser = await AsyncStorage.getItem('isNewUser');
        const savedRecs = await AsyncStorage.getItem('recommendations');
        const savedFlavor = await AsyncStorage.getItem('flavorProfile');

        if (savedRecs) {
          setRecommendationsState(JSON.parse(savedRecs));
        }

        if (savedFlavor) {
          setFlavorProfileState(JSON.parse(savedFlavor));
        }

        if (accessToken) {

          client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;


          if (persistedIsNewUser === 'true') {
            setIsNewUser(true);
          }

          setIsLoggedIn(true);


          if (persistedIsNewUser !== 'true') {
            await refreshUserInfo();
          }
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error);
        // [FIX] 모든 에러에서 로그아웃하지 않고, 인증 관련 에러(401)일 때만 로그아웃
        // 인터셉터에서 이미 재발급 시도를 했을 것이므로 여기서 401이 오면 재발급도 실패한 것임
        if (error.response?.status === 401) {
          await logout();
        } else {
          // 네트워크 에러 등일 때는 로그린 상태 유지 (이미 isLoggedIn=true 상태일 수 있음)
          // 다만 user 정보가 없을 수 있으므로 필요시 재시도 로직이 UI에 있어야 함
          console.warn('Network or Server error during initAuth, keeping session.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
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
    try {
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }

      client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // 신규 유저 여부 설정 (순서 중요: 로그인 상태 변경 전에 설정)
      // 서버에서 isFirst가 오면 그 값을 최우선으로 사용
      if (isFirst) {
        setIsNewUser(true);
        await AsyncStorage.setItem('isNewUser', 'true');
      } else {
        // 서버에서 기존 유저라고 하면 로컬 상태도 해제 (중요: 재로그인 시 온보딩 안 뜨게)
        setIsNewUser(false);
        await AsyncStorage.removeItem('isNewUser');
      }

      setIsLoggedIn(true);

      // 신규 유저가 아닐 때만 유저 정보 가져오기
      if (!isFirst) {
        try {
          await refreshUserInfo();
        } catch (e) {
          console.warn('Initial user info fetch failed, but login continues:', e);
          // 로그인 직후에는 정보를 못 가져와도 로그아웃시키지 않음 (일시적 오류일 수 있음)
          // 단, 401 등 치명적 오류라면 로그아웃 시키는 게 맞을 수도 있음
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
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
      // 서버 로그아웃 요청 (실패해도 로컬 로그아웃 진행)
      if (!skipServerLogout) {
        try {
          await apiLogout();
        } catch (e) {
          console.warn('Server logout failed:', e);
        }
      }

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('recommendations');
      await AsyncStorage.removeItem('flavorProfile');
      delete client.defaults.headers.common['Authorization'];

      setUser(null);
      setRecommendationsState([]);
      setFlavorProfileState(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
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
