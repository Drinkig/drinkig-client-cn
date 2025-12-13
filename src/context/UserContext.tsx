import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMemberInfo, logout as apiLogout } from '../api/member';
import client from '../api/client';

import { FlavorProfile } from '../components/onboarding/FlavorProfileStep';

// 사용자 정보 타입
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

// Context 타입
interface UserContextType {
  user: User | null;
  recommendations: RecommendedWine[];
  flavorProfile: FlavorProfile | null; // 추가
  isLoggedIn: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (accessToken: string, refreshToken?: string, isFirst?: boolean) => Promise<void>;
  loginGuest: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setRecommendations: (recs: RecommendedWine[]) => void;
  setFlavorProfile: (profile: FlavorProfile) => void; // 추가
  refreshUserInfo: () => Promise<void>;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider 컴포넌트
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendationsState] = useState<RecommendedWine[]>([]);
  const [flavorProfile, setFlavorProfileState] = useState<FlavorProfile | null>(null); // 추가
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // 앱 시작 시 토큰 확인 및 유저 정보 로드
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const persistedIsNewUser = await AsyncStorage.getItem('isNewUser');
        const savedRecs = await AsyncStorage.getItem('recommendations');
        const savedFlavor = await AsyncStorage.getItem('flavorProfile'); // 추가

        if (savedRecs) {
          setRecommendationsState(JSON.parse(savedRecs));
        }

        if (savedFlavor) {
          setFlavorProfileState(JSON.parse(savedFlavor));
        }

        if (accessToken) {
          // 토큰이 있으면 Axios 헤더 설정
          client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // 저장된 신규 유저 상태 복원
          if (persistedIsNewUser === 'true') {
            setIsNewUser(true);
          }
          
          setIsLoggedIn(true);
          
          // 유저 정보 가져오기 (신규 유저가 아닐 때만)
          if (persistedIsNewUser !== 'true') {
            await refreshUserInfo();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        await logout();
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
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
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

  const logout = async () => {
    try {
      // 서버 로그아웃 요청 (실패해도 로컬 로그아웃 진행)
      try {
        await apiLogout();
      } catch (e) {
        console.warn('Server logout failed:', e);
      }

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('recommendations');
      await AsyncStorage.removeItem('flavorProfile'); // 추가
      delete client.defaults.headers.common['Authorization'];
      
      setUser(null);
      setRecommendationsState([]);
      setFlavorProfileState(null); // 추가
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const completeOnboarding = async () => {
    setIsNewUser(false);
    await AsyncStorage.removeItem('isNewUser');
    // 온보딩 완료 후 유저 정보 갱신 (선택사항)
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

// 커스텀 훅
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
