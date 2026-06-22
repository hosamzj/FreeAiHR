'use client';

import { useState } from 'react';
import { mockInterviews, mockInterviewers, type Interview } from '@/lib/mock-data';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  AlertTriangle,
  Check,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  technical: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  first: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  second: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  final: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
};

const typeLabels: Record<string, string> = {
  technical: '技术面',
  first: '初面',
  second: '复面',
  final: '终面',
};

export default function InterviewsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showAIQuestions, setShowAIQuestions] = useState(false);
  const [currentWeek] = useState('2024年1月22日 - 1月28日');

  // Simulate calendar interview positions
  const calendarInterviews: Record<string, Interview[]> = {
    '1-09': [mockInterviews[1]], // Mon 10:00 -> show at 10 slot
    '1-10': [mockInterviews[0]], // Mon 14:00 -> show at 14 slot
    '2-11': [mockInterviews[2]], // Tue 15:00 -> show at 15 slot
  };

  return (
    <div className="space-y-5">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#111827] p-0.5">
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs transition-colors',
                view === 'calendar' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white'
              )}
            >
              <Calendar className="inline h-3.5 w-3.5 mr-1" />
              日历视图
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs transition-colors',
                view === 'list' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white'
              )}
            >
              列表视图
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-1.5 text-slate-500 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-white font-medium">{currentWeek}</span>
            <button className="rounded-lg p-1.5 text-slate-500 hover:text-white transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-3 text-sm text-slate-400 hover:text-white transition-colors">
            <UserPlus className="h-3.5 w-3.5" />
            面试官管理
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-sky-500 px-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            新建面试
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        /* Calendar View */
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden">
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
                        const colors = typeColors[interview.type];
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
                              {typeLabels[interview.type]} · {interview.interviewerName}
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
      ) : (
        /* List View */
        <div className="space-y-3">
          {mockInterviews.map((interview) => {
            const colors = typeColors[interview.type];
            return (
              <div
                key={interview.id}
                onClick={() => setSelectedInterview(interview)}
                className={cn(
                  'card-hover cursor-pointer rounded-xl border bg-[#111827] p-4',
                  selectedInterview?.id === interview.id ? 'border-sky-500/30' : 'border-[#1e293b]'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('rounded-lg p-2.5', colors.bg)}>
                    <Calendar className={cn('h-5 w-5', colors.text)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{interview.candidateName}</span>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', colors.bg, colors.text, colors.border)}>
                        {typeLabels[interview.type]}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px]',
                        interview.status === 'scheduled' ? 'bg-sky-500/10 text-sky-400' :
                        interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-slate-500/10 text-slate-400'
                      )}>
                        {interview.status === 'scheduled' ? '待面试' : interview.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {interview.scheduledAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {interview.room}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {interview.interviewerName}
                      </span>
                      <span>{interview.duration}分钟</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{interview.position}</p>
                  </div>
                </div>

                {/* AI Questions Preview */}
                {selectedInterview?.id === interview.id && interview.aiQuestions && (
                  <div className="mt-4 border-t border-[#1e293b] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-xs font-medium text-sky-400">AI 推荐面试问题</span>
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
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-[#0a0e1a] p-2.5 border border-[#1e293b]">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[10px] font-mono text-sky-400">
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-300">{q}</p>
                        </div>
                      ))}
                    </div>
                    {interview.rating && (
                      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-xs font-medium text-emerald-400 mb-1">面试评价</p>
                        <p className="text-xs text-slate-400">{interview.rating.comment}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-sky-400" />
                          <p className="text-xs text-sky-400">AI建议：{interview.rating.aiComment}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                        <Mail className="h-3.5 w-3.5" /> 发送面试邀约
                      </button>
                      <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors">
                        <Video className="h-3.5 w-3.5" /> 生成会议链接
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
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">面试官技能匹配</h3>
            <p className="text-xs text-slate-500">AI 根据候选人岗位自动推荐最佳面试官</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-sky-400" />
            <span className="text-[11px] text-sky-400">智能推荐</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {mockInterviewers.map((interviewer) => (
            <div key={interviewer.id} className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs font-bold text-sky-400 border border-sky-500/20">
                  {interviewer.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{interviewer.name}</p>
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
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">冲突检测提醒</p>
            <p className="mt-1 text-xs text-slate-400">
              检测到本周三 15:00 陈技术面试官已有其他会议安排，建议将张明远的技术面调整至周四 14:00 或周三 16:00。
            </p>
            <div className="mt-2 flex gap-2">
              <button className="flex h-7 items-center gap-1 rounded-md bg-amber-500/10 px-2.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                <Check className="h-3 w-3" /> 接受建议
              </button>
              <button className="flex h-7 items-center gap-1 rounded-md border border-[#1e293b] px-2.5 text-xs text-slate-400 hover:text-white transition-colors">
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
