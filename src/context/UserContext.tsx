import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMemberInfo, logout as apiLogout } from '../api/member';
import client from '../api/client';

// 사용자 정보 타입
export interface User {
  nickname: string;
  profileImage: string | null;
  email?: string;
  authType?: string;
}

// Context 타입
interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken?: string) => Promise<void>;
  loginGuest: () => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUserInfo: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider 컴포넌트
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 토큰 확인 및 유저 정보 로드
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          // 토큰이 있으면 Axios 헤더 설정
          client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          setIsLoggedIn(true);
          
          // 유저 정보 가져오기
          await refreshUserInfo();
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

  const login = async (accessToken: string, refreshToken?: string) => {
    try {
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      
      client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setIsLoggedIn(true);
      await refreshUserInfo();
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
      delete client.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, isLoading, login, loginGuest, logout, updateUser, refreshUserInfo }}>
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
