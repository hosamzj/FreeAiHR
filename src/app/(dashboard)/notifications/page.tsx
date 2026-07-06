'use client';

import { useState } from 'react';
import { Bell, Check, Trash2, Filter, MailOpen, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'resume' | 'interview' | 'offer' | 'system';
}

const initialNotifications: Notification[] = [
  { id: 1, title: '新简历投递', content: '候选人刘强投递了后端工程师职位', time: '5分钟前', read: false, type: 'resume' },
  { id: 2, title: '面试提醒', content: '今天下午2点有陈静的产品设计师面试', time: '1小时前', read: false, type: 'interview' },
  { id: 3, title: 'Offer待审批', content: '赵六的Offer申请等待您的审批', time: '2小时前', read: false, type: 'offer' },
  { id: 4, title: '系统通知', content: '本周招聘数据报告已生成', time: '昨天', read: true, type: 'system' },
  { id: 5, title: 'Excel 同步完成', content: '已同步 16 条数据：6 个岗位、7 份简历、1 份面试分析、2 份对比分析', time: '昨天', read: true, type: 'system' },
];

const typeLabels: Record<string, string> = {
  resume: '简历',
  interview: '面试',
  offer: 'Offer',
  system: '系统',
};

const typeColors: Record<string, string> = {
  resume: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  interview: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  system: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const markRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markUnread = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const remove = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">消息通知中心</h1>
          <p className="text-xs text-slate-500 mt-1">查看并管理所有系统消息与招聘动态</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex h-9 items-center gap-1.5 self-start rounded-lg border border-[#1e293b] bg-[#111827] px-3 text-sm text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
        >
          <MailOpen className="h-3.5 w-3.5" /> 全部已读
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-xl border p-3 text-center transition-colors',
            filter === 'all' ? 'border-sky-500/30 bg-sky-500/5' : 'border-[#1e293b] bg-[#111827] hover:border-slate-600'
          )}
        >
          <p className="text-xl font-bold text-white">{notifications.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">全部</p>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-xl border p-3 text-center transition-colors',
            filter === 'unread' ? 'border-orange-500/30 bg-orange-500/5' : 'border-[#1e293b] bg-[#111827] hover:border-slate-600'
          )}
        >
          <p className="text-xl font-bold text-white">{unreadCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">未读</p>
        </button>
        <button
          onClick={() => setFilter('read')}
          className={cn(
            'rounded-xl border p-3 text-center transition-colors',
            filter === 'read' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#1e293b] bg-[#111827] hover:border-slate-600'
          )}
        >
          <p className="text-xl font-bold text-white">{readCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">已读</p>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Filter className="h-3.5 w-3.5" />
        <span>当前显示：{filter === 'all' ? '全部消息' : filter === 'unread' ? '未读消息' : '已读消息'}</span>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#1e293b] bg-[#111827] py-12">
            <Bell className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">暂无消息</p>
          </div>
        ) : (
          filtered.map(n => (
            <div
              key={n.id}
              className={cn(
                'group flex items-start gap-3 rounded-xl border p-4 transition-colors',
                n.read ? 'border-[#1e293b] bg-[#111827]' : 'border-sky-500/20 bg-sky-500/5'
              )}
            >
              <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', typeColors[n.type])}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', n.read ? 'text-slate-300' : 'text-white')}>
                    {n.title}
                  </p>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] border', typeColors[n.type])}>
                    {typeLabels[n.type]}
                  </span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-sky-400" />}
                </div>
                <p className="mt-1 text-xs text-slate-400">{n.content}</p>
                <p className="mt-2 text-[11px] text-slate-500">{n.time}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                {n.read ? (
                  <button
                    onClick={() => markUnread(n.id)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-[#1e293b] px-2 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <Mail className="h-3 w-3" /> 未读
                  </button>
                ) : (
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-[#1e293b] px-2 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <Check className="h-3 w-3" /> 已读
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  className="flex h-7 items-center gap-1 rounded-lg border border-red-500/20 px-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> 删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
