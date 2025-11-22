import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface MyWine {
  id: string;
  name: string;
  type: string;
  country: string;
  grape: string;
  vintage: string;
  purchasePrice: string;
  marketPrice: string;
  purchaseLocation: string;
  purchaseDate: string;
  importer: string;
  condition: string;
  imageUri: string | null;
  createdAt: string;
}

interface WineContextType {
  wines: MyWine[];
  addWine: (wine: Omit<MyWine, 'id' | 'createdAt'>) => void;
  removeWine: (id: string) => void;
}

const WineContext = createContext<WineContextType | undefined>(undefined);

export const WineProvider = ({ children }: { children: ReactNode }) => {
  const [wines, setWines] = useState<MyWine[]>([]);

  const addWine = (wineData: Omit<MyWine, 'id' | 'createdAt'>) => {
    const newWine: MyWine = {
      ...wineData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setWines((prev) => [newWine, ...prev]);
  };

  const removeWine = (id: string) => {
    setWines((prev) => prev.filter((wine) => wine.id !== id));
  };

  return (
    <WineContext.Provider value={{ wines, addWine, removeWine }}>
      {children}
    </WineContext.Provider>
  );
};

export const useWine = () => {
  const context = useContext(WineContext);
  if (!context) {
    throw new Error('useWine must be used within a WineProvider');
  }
  return context;
};

