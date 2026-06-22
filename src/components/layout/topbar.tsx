'use client';

import { useAppContext } from '@/lib/app-context';
import { Bell, Search, User, Sparkles } from 'lucide-react';

const moduleTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: '招聘看板', subtitle: '实时数据概览与招聘漏斗分析' },
  resumes: { title: '简历管理', subtitle: 'AI 智能解析与候选人筛选' },
  interviews: { title: '面试排期', subtitle: '智能分配与日历管理' },
  analysis: { title: '面试分析', subtitle: 'AI 辅助评价与多维对比' },
  offers: { title: 'Offer管理', subtitle: '智能生成与审批追踪' },
};

export function TopBar() {
  const { activeModule } = useAppContext();
  const current = moduleTitles[activeModule] || moduleTitles.dashboard;

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1e293b] bg-[#0d1321]/80 px-6 backdrop-blur-sm">
      <div>
        <h2 className="text-lg font-semibold text-white">{current.title}</h2>
        <p className="text-xs text-slate-500">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索候选人、岗位..."
            className="h-9 w-64 rounded-lg border border-[#1e293b] bg-[#111827] pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        {/* AI Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500/10 to-orange-500/10 px-3 py-1.5 border border-sky-500/20">
          <Sparkles className="h-3.5 w-3.5 text-sky-400 ai-pulse" />
          <span className="text-xs font-medium text-sky-400">AI 助手</span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#1a2236] hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#1a2236] cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-200">HR 管理员</p>
            <p className="text-[10px] text-slate-500">招聘经理</p>
          </div>
        </div>
      </div>
    </header>
  );
}
