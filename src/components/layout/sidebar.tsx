'use client';

import { useAppContext } from '@/lib/app-context';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Brain,
  FileCheck,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: '招聘看板', icon: LayoutDashboard },
  { id: 'resumes', label: '简历管理', icon: FileText },
  { id: 'interviews', label: '面试排期', icon: Calendar },
  { id: 'analysis', label: '面试分析', icon: Brain },
  { id: 'offers', label: 'Offer管理', icon: FileCheck },
];

export function Sidebar() {
  const { activeModule, setActiveModule } = useAppContext();

  return (
    <aside className="flex w-60 flex-col border-r border-[#1e293b] bg-[#0d1321]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#1e293b] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">AI 招聘系统</h1>
          <p className="text-[10px] text-slate-500">Intelligent Recruitment</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-sky-500/10 text-sky-400 shadow-sm shadow-sky-500/5'
                  : 'text-slate-400 hover:bg-[#1a2236] hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-sky-400/60" />}
            </button>
          );
        })}
      </nav>

      {/* AI Status */}
      <div className="border-t border-[#1e293b] p-4">
        <div className="rounded-lg bg-gradient-to-r from-sky-500/5 to-orange-500/5 p-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-sky-400"></div>
              <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-sky-400/50"></div>
            </div>
            <span className="text-xs text-slate-400">AI 引擎运行中</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            已解析 <span className="text-sky-400 font-mono">256</span> 份简历
          </p>
        </div>
      </div>
    </aside>
  );
}
