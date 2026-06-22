'use client';

import { createContext, useContext } from 'react';

interface AppContextType {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const AppContext = createContext<AppContextType>({
  activeModule: 'dashboard',
  setActiveModule: () => {},
});

export const useAppContext = () => useContext(AppContext);
