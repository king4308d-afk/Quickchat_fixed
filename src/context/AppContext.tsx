import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState(100);
  const [userCoins, setUserCoins] = useState(100);

  return (
    <AppContext.Provider value={{ coins, setCoins, userCoins, setUserCoins }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {
      coins: 100,
      setCoins: () => {},
      userCoins: 100,
      setUserCoins: () => {}
    };
  }
  return context;
};