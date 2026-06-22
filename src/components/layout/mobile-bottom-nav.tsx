'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Brain,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  roles: string[];
}

const allNavItems: BottomNavItem[] = [
  { id: 'dashboard', label: '看板', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'hr_manager'] },
  { id: 'resumes', label: '简历', icon: FileText, href: '/resumes', roles: ['admin', 'hr_manager'] },
  { id: 'interviews', label: '面试', icon: Calendar, href: '/interviews', roles: ['admin', 'hr_manager', 'interviewer'] },
  { id: 'analysis', label: '分析', icon: Brain, href: '/analysis', roles: ['admin', 'hr_manager'] },
  { id: 'offers', label: 'Offer', icon: FileCheck, href: '/offers', roles: ['admin', 'hr_manager'] },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = allNavItems.filter((item) => user && item.roles.includes(user.role));

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1e293b] bg-[#0d1321]/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors min-w-0',
                active ? 'text-sky-400' : 'text-slate-500'
              )}
            >
              <div className={cn('rounded-md p-1 transition-colors', active ? 'bg-sky-500/10' : '')}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
