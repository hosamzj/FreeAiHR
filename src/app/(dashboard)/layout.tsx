'use client';

import { useState, type ReactNode } from 'react';
import { AppContext } from '@/lib/app-context';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState('dashboard');

  return (
    <AppContext.Provider value={{ activeModule, setActiveModule }}>
      <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
