'use client';

import { useState, type ReactNode } from 'react';
import { AppContext } from '@/lib/app-context';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <AuthGuard>
      <AppContext.Provider value={{ activeModule, setActiveModule, mobileDrawerOpen, setMobileDrawerOpen }}>
        <div className="flex h-[100dvh] overflow-hidden bg-[#0a0e1a]">
          {/* Desktop sidebar */}
          <div className="hidden md:flex">
            <Sidebar />
          </div>

          {/* Mobile drawer overlay */}
          {mobileDrawerOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
          )}

          {/* Mobile drawer sidebar */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out md:hidden ${
              mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-3 pb-20 md:p-6 md:pb-6">
              {children}
            </main>
            {/* Mobile bottom nav */}
            <MobileBottomNav />
          </div>
        </div>
      </AppContext.Provider>
    </AuthGuard>
  );
}
