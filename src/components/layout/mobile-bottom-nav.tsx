'use client';

import { useAppContext } from '@/lib/app-context';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Brain,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: '看板', icon: LayoutDashboard },
  { id: 'resumes', label: '简历', icon: FileText },
  { id: 'interviews', label: '面试', icon: Calendar },
  { id: 'analysis', label: '分析', icon: Brain },
  { id: 'offers', label: 'Offer', icon: FileCheck },
];

export function MobileBottomNav() {
  const { activeModule, setActiveModule } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1e293b] bg-[#0d1321]/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors min-w-0',
                isActive
                  ? 'text-sky-400'
                  : 'text-slate-500'
              )}
            >
              <div className={cn(
                'rounded-md p-1 transition-colors',
                isActive ? 'bg-sky-500/10' : ''
              )}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
