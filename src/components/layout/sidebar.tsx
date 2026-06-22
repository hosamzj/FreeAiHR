'use client';

import { useAppContext } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Brain,
  FileCheck,
  Sparkles,
  ChevronRight,
  X,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { id: 'dashboard', label: '招聘看板', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'hr_manager'] },
  { id: 'resumes', label: '简历管理', icon: FileText, href: '/resumes', roles: ['admin', 'hr_manager'] },
  { id: 'interviews', label: '面试排期', icon: Calendar, href: '/interviews', roles: ['admin', 'hr_manager', 'interviewer'] },
  { id: 'analysis', label: '面试分析', icon: Brain, href: '/analysis', roles: ['admin', 'hr_manager'] },
  { id: 'offers', label: 'Offer管理', icon: FileCheck, href: '/offers', roles: ['admin', 'hr_manager'] },
  { id: 'users', label: '用户管理', icon: Users, href: '/users', roles: ['admin'] },
  { id: 'settings', label: '系统设置', icon: Settings, href: '/settings', roles: ['admin'] },
];

export function Sidebar() {
  const { setMobileDrawerOpen } = useAppContext();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    return allNavItems.filter((item) => item.roles.includes(user.role));
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const handleNav = (href: string) => {
    router.push(href);
    setMobileDrawerOpen(false);
  };

  const roleLabels: Record<string, string> = {
    admin: '超级管理员',
    hr_manager: '招聘经理',
    interviewer: '面试官',
    candidate: '候选人',
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[#1e293b] bg-[#0d1321]">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[#1e293b] px-4 md:h-16 md:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20 md:h-9 md:w-9">
            <Sparkles className="h-4 w-4 text-white md:h-5 md:w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AI 招聘系统</h1>
            <p className="hidden text-[10px] text-slate-500 md:block">Intelligent Recruitment</p>
          </div>
        </div>
        <button
          onClick={() => setMobileDrawerOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1a2236] hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2.5 md:space-y-1 md:p-3 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.href)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                active
                  ? 'bg-sky-500/10 text-sky-400 shadow-sm shadow-sky-500/5'
                  : 'text-slate-400 hover:bg-[#1a2236] hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 text-sky-400/60" />}
            </button>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t border-[#1e293b] p-4">
        {user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-medium text-sky-400">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500">{roleLabels[user.role] || user.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="退出登录"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="hidden rounded-lg bg-gradient-to-r from-sky-500/5 to-orange-500/5 p-3 md:block">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-sky-400"></div>
              <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-sky-400/50"></div>
            </div>
            <span className="text-xs text-slate-400">AI 引擎运行中</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
