'use client';

import { createContext, useContext } from 'react';

interface AppContextType {
  activeModule: string;
  setActiveModule: (module: string) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

export const AppContext = createContext<AppContextType>({
  activeModule: 'dashboard',
  setActiveModule: () => {},
  mobileDrawerOpen: false,
  setMobileDrawerOpen: () => {},
});

export const useAppContext = () => useContext(AppContext);
