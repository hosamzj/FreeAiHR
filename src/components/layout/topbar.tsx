'use client';

import { useState } from 'react';
import { useAppContext } from '@/lib/app-context';
import { Bell, Search, User, Sparkles, Menu, X } from 'lucide-react';

const moduleTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: '招聘看板', subtitle: '实时数据概览与招聘漏斗分析' },
  resumes: { title: '简历管理', subtitle: 'AI 智能解析与候选人筛选' },
  interviews: { title: '面试排期', subtitle: '智能分配与日历管理' },
  analysis: { title: '面试分析', subtitle: 'AI 辅助评价与多维对比' },
  offers: { title: 'Offer管理', subtitle: '智能生成与审批追踪' },
};

// 模拟通知数据
const mockNotifications = [
  { id: 1, title: '新简历投递', content: '候选人刘强投递了后端工程师职位', time: '5分钟前', read: false },
  { id: 2, title: '面试提醒', content: '今天下午2点有陈静的产品设计师面试', time: '1小时前', read: false },
  { id: 3, title: 'Offer待审批', content: '赵六的Offer申请等待您的审批', time: '2小时前', read: false },
  { id: 4, title: '系统通知', content: '本周招聘数据报告已生成', time: '昨天', read: true },
];

export function TopBar() {
  const { activeModule, setMobileDrawerOpen } = useAppContext();
  const current = moduleTitles[activeModule] || moduleTitles.dashboard;
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1e293b] bg-[#0d1321]/80 px-3 backdrop-blur-sm md:h-16 md:px-6">
      <div className="flex items-center gap-2.5">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1a2236] hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-white md:text-lg">{current.title}</h2>
          <p className="hidden text-xs text-slate-500 md:block">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索候选人、岗位..."
            className="h-9 w-64 rounded-lg border border-[#1e293b] bg-[#111827] pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        {/* Mobile search icon */}
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1a2236] hover:text-white md:hidden">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* AI Badge - icon only on mobile */}
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500/10 to-orange-500/10 px-2 py-1.5 border border-sky-500/20 md:px-3">
          <Sparkles className="h-3.5 w-3.5 text-sky-400 ai-pulse" />
          <span className="hidden text-xs font-medium text-sky-400 md:inline">AI 助手</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#1a2236] hover:text-white md:p-2 cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5 md:h-5 md:w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500 md:right-1.5 md:top-1.5"></span>
            )}
          </button>
          
          {/* Notification Panel */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#1e293b] bg-[#111827] shadow-2xl md:w-96">
                <div className="flex items-center justify-between border-b border-[#1e293b] p-4">
                  <h3 className="text-sm font-semibold text-white">消息通知</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-[#1a2236] hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`border-b border-[#1e293b] p-4 last:border-b-0 hover:bg-[#1a2236] cursor-pointer ${!notification.read ? 'bg-sky-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-sky-400"></span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{notification.content}</p>
                          <p className="mt-1.5 text-xs text-slate-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#1e293b] p-3">
                  <button className="w-full rounded-lg py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/10 cursor-pointer">
                    查看全部通知
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User - avatar only on mobile */}
        <div className="flex items-center gap-2 rounded-lg py-1.5 transition-colors hover:bg-[#1a2236] cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 md:h-8 md:w-8">
            <User className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
          </div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium text-slate-200">HR 管理员</p>
            <p className="text-[10px] text-slate-500">招聘经理</p>
          </div>
        </div>
      </div>
    </header>
  );
}
