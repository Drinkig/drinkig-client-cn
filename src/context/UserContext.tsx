import React, { createContext, useState, useContext, ReactNode } from 'react';

// 사용자 정보 타입
interface User {
  nickname: string;
  profileImage: string | null;
}

// Context 타입
interface UserContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

// 초기값
const defaultUser: User = {
  nickname: '스응주',
  profileImage: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider 컴포넌트
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
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

