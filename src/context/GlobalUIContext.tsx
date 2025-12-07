import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// 알럿 설정 타입 정의
export interface AlertConfig {
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  singleButton?: boolean;
}

interface GlobalUIContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  
  alertConfig: AlertConfig | null;
  showAlert: (config: AlertConfig) => void;
  closeAlert: () => void;
}

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(undefined);

export const GlobalUIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showLoading = useCallback(() => setIsLoading(true), []);
  const hideLoading = useCallback(() => setIsLoading(false), []);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return (
    <GlobalUIContext.Provider 
      value={{ 
        isLoading, 
        showLoading, 
        hideLoading, 
        alertConfig, 
        showAlert, 
        closeAlert 
      }}
    >
      {children}
    </GlobalUIContext.Provider>
  );
};

export const useGlobalUI = () => {
  const context = useContext(GlobalUIContext);
  if (!context) {
    throw new Error('useGlobalUI must be used within a GlobalUIProvider');
  }
  return context;
};

