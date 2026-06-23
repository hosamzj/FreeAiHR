'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Mail,
  Sparkles,
  AlertTriangle,
  Check,
  List,
  LayoutGrid,
  Plus,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockInterviews, mockInterviewers } from '@/lib/mock-data';

type ViewMode = 'calendar' | 'list';

const typeColors = {
  first: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  second: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  technical: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  hr: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  final: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

const typeLabels = {
  first: '初面',
  second: '复面',
  technical: '技术面',
  hr: 'HR面',
  final: '终面',
};

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const calendarInterviews: Record<string, typeof mockInterviews> = {
  '0-1': [mockInterviews[0]],
  '1-3': [mockInterviews[1]],
  '2-2': [mockInterviews[2]],
  '3-4': [mockInterviews[3]],
  '4-1': mockInterviews[0] ? [mockInterviews[0]] : [], // 复用第一个面试数据
};

export default function InterviewsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInterview, setSelectedInterview] = useState<typeof mockInterviews[0] | null>(null);
  const [showAIQuestions, setShowAIQuestions] = useState(false);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* View toggle - hidden on mobile, force list */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#111827] p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors',
                viewMode === 'calendar' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> 日历
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors',
                viewMode === 'list' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white'
              )}
            >
              <List className="h-3.5 w-3.5" /> 列表
            </button>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 sm:hidden">
            <List className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] text-sky-400">列表视图</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('新建面试安排功能开发中...')}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs md:text-sm font-medium text-white hover:bg-sky-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">新建面试安排</span>
            <span className="sm:hidden">新建</span>
          </button>
        </div>
      </div>

      {/* Calendar View - desktop only */}
      {viewMode === 'calendar' && (
        <div className="hidden sm:block rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-8 border-b border-[#1e293b]">
            <div className="p-3 text-xs text-slate-600 border-r border-[#1e293b]">时间</div>
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'p-3 text-center border-r border-[#1e293b] last:border-r-0',
                  i === 0 ? 'bg-sky-500/5' : ''
                )}
              >
                <p className="text-xs text-slate-500">{day}</p>
                <p className={cn(
                  'mt-1 text-lg font-semibold',
                  i === 0 ? 'text-sky-400' : 'text-white'
                )}>
                  {22 + i}
                </p>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="border-r border-[#1e293b]">
              {timeSlots.map((time) => (
                <div key={time} className="h-20 border-b border-[#1e293b] p-2">
                  <span className="text-xs text-slate-600 font-mono">{time}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((_, dayIndex) => (
              <div key={dayIndex} className="border-r border-[#1e293b] last:border-r-0">
                {timeSlots.map((time, timeIndex) => {
                  const key = `${dayIndex}-${timeIndex}`;
                  const interviews = calendarInterviews[key];
                  return (
                    <div
                      key={key}
                      className={cn(
                        'h-20 border-b border-[#1e293b] p-1 transition-colors hover:bg-[#1a2236]/50',
                        dayIndex === 0 ? 'bg-sky-500/[0.02]' : ''
                      )}
                    >
                      {interviews?.map((interview) => {
                        const colors = typeColors[interview.type as keyof typeof typeColors];
                        return (
                          <div
                            key={interview.id}
                            onClick={() => setSelectedInterview(interview)}
                            className={cn(
                              'h-full rounded-lg border p-2 cursor-pointer transition-all hover:scale-[1.02]',
                              colors.bg, colors.border
                            )}
                          >
                            <p className={cn('text-xs font-medium truncate', colors.text)}>
                              {interview.candidateName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {typeLabels[interview.type as keyof typeof typeLabels]} · {interview.interviewerName}
                            </p>
                            <p className="text-[10px] text-slate-600 truncate mt-0.5">
                              {interview.room}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {(viewMode === 'list' || typeof window !== 'undefined') && (
        <div className={cn('space-y-2.5 md:space-y-3', viewMode === 'calendar' && 'hidden sm:hidden')}>
          {mockInterviews.map((interview) => {
            const colors = typeColors[interview.type as keyof typeof typeColors];
            return (
              <div
                key={interview.id}
                onClick={() => setSelectedInterview(interview)}
                className={cn(
                  'card-hover cursor-pointer rounded-xl border bg-[#111827] p-3 md:p-4',
                  selectedInterview?.id === interview.id ? 'border-sky-500/30' : 'border-[#1e293b]'
                )}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={cn('rounded-lg p-2 md:p-2.5 shrink-0', colors.bg)}>
                    <Calendar className={cn('h-4 w-4 md:h-5 md:w-5', colors.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs md:text-sm font-semibold text-white">{interview.candidateName}</span>
                      <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', colors.bg, colors.text, colors.border)}>
                        {typeLabels[interview.type as keyof typeof typeLabels]}
                      </span>
                      <span className={cn(
                        'rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]',
                        interview.status === 'scheduled' ? 'bg-sky-500/10 text-sky-400' :
                        interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-slate-500/10 text-slate-400'
                      )}>
                        {interview.status === 'scheduled' ? '待面试' : interview.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 text-[11px] md:text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {interview.scheduledAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {interview.room}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Users className="h-3 w-3" /> {interview.interviewerName}
                      </span>
                      <span className="hidden md:inline">{interview.duration}分钟</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-slate-500">{interview.position}</p>
                  </div>
                </div>

                {/* AI Questions Preview */}
                {selectedInterview?.id === interview.id && interview.aiQuestions && (
                  <div className="mt-3 md:mt-4 border-t border-[#1e293b] pt-3 md:pt-4">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-[11px] md:text-xs font-medium text-sky-400">AI 推荐面试问题</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAIQuestions(!showAIQuestions); }}
                        className="text-xs text-slate-500 hover:text-white"
                      >
                        {showAIQuestions ? '收起' : '展开'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {interview.aiQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-[#0a0e1a] p-2 md:p-2.5 border border-[#1e293b]">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[10px] font-mono text-sky-400">
                            {i + 1}
                          </span>
                          <p className="text-[11px] md:text-xs text-slate-300">{q}</p>
                        </div>
                      ))}
                    </div>
                    {interview.rating && (
                      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 md:p-3">
                        <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-1">面试评价</p>
                        <p className="text-[11px] md:text-xs text-slate-400">{interview.rating.comment}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-sky-400" />
                          <p className="text-[11px] md:text-xs text-sky-400">AI建议：{interview.rating.aiComment}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                        <Mail className="h-3.5 w-3.5" /> 发送邀约
                      </button>
                      <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors">
                        <Video className="h-3.5 w-3.5" /> 会议链接
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interviewer Matching Panel */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-white">面试官技能匹配</h3>
            <p className="text-[11px] md:text-xs text-slate-500">AI 根据候选人岗位自动推荐最佳面试官</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 self-start">
            <Sparkles className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] md:text-[11px] text-sky-400">智能推荐</span>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {mockInterviewers.map((interviewer) => (
            <div key={interviewer.id} className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-[10px] md:text-xs font-bold text-sky-400 border border-sky-500/20">
                  {interviewer.avatar}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-white">{interviewer.name}</p>
                  <p className="text-[10px] text-slate-500">{interviewer.title} · {interviewer.department}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {interviewer.skills.map((skill) => (
                  <span key={skill} className="rounded bg-[#1e293b] px-1.5 py-0.5 text-[10px] text-slate-400">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Detection */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 md:p-4">
        <div className="flex items-start gap-2.5 md:gap-3">
          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs md:text-sm font-medium text-amber-400">冲突检测提醒</p>
            <p className="mt-1 text-[11px] md:text-xs text-slate-400">
              检测到本周三 15:00 陈技术面试官已有其他会议安排，建议将张明远的技术面调整至周四 14:00 或周三 16:00。
            </p>
            <div className="mt-2 flex gap-2">
              <button className="flex h-7 items-center gap-1 rounded-md bg-amber-500/10 px-2 md:px-2.5 text-[11px] md:text-xs text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                <Check className="h-3 w-3" /> 接受建议
              </button>
              <button className="flex h-7 items-center gap-1 rounded-md border border-[#1e293b] px-2 md:px-2.5 text-[11px] md:text-xs text-slate-400 hover:text-white transition-colors">
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
