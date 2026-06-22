'use client';

import { useState } from 'react';
import {
  Brain,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Target,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Users,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockInterviews } from '@/lib/mock-data';

const radarDimensions = [
  { key: 'technical', label: '专业技能' },
  { key: 'communication', label: '沟通能力' },
  { key: 'teamwork', label: '团队协作' },
  { key: 'learning', label: '学习能力' },
  { key: 'culture', label: '文化匹配' },
];

const dimensionLabels: Record<string, string> = {
  technical: '专业技能',
  communication: '沟通能力',
  teamwork: '团队协作',
  learning: '学习能力',
  culture: '文化匹配',
};

const typeLabel = (type: string) => {
  switch (type) {
    case 'technical': return '技术面';
    case 'hr': return 'HR面';
    case 'final': return '终面';
    default: return type;
  }
};

const typeColor = (type: string) => {
  switch (type) {
    case 'technical': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'hr': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'final': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const completedInterviews = mockInterviews.filter(i => i.rating);
const avgScore = Math.round(completedInterviews.reduce((sum, i) => sum + (i.rating?.overall ?? 0), 0) / completedInterviews.length);

export default function AnalysisPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'compare' | 'questions'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedQuestions([
        '请描述一个你在项目中遇到的最复杂的技术挑战，以及你是如何解决的？',
        '在团队协作中，你如何处理与同事意见不一致的情况？',
        '你如何看待持续学习？最近学习了什么新技术？',
        '描述一次你主动承担额外责任的经历',
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const tabs = [
    { id: 'overview' as const, label: '评价总览', icon: BarChart3 },
    { id: 'compare' as const, label: '多维对比', icon: Users },
    { id: 'questions' as const, label: '问题推荐', icon: Lightbulb },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-sky-500/10 p-1.5 md:p-2">
              <Brain className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
            </div>
          </div>
          <p className="font-mono text-xl md:text-2xl font-bold text-white">{completedInterviews.length}</p>
          <p className="text-[11px] md:text-xs text-slate-500">已完成面试</p>
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-500/10 p-1.5 md:p-2">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
            </div>
          </div>
          <p className="font-mono text-xl md:text-2xl font-bold text-white">{avgScore}</p>
          <p className="text-[11px] md:text-xs text-slate-500">平均评分</p>
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-violet-500/10 p-1.5 md:p-2">
              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-400" />
            </div>
          </div>
          <p className="font-mono text-xl md:text-2xl font-bold text-white">85%</p>
          <p className="text-[11px] md:text-xs text-slate-500">面试通过率</p>
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-orange-500/10 p-1.5 md:p-2">
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-400" />
            </div>
          </div>
          <p className="font-mono text-xl md:text-2xl font-bold text-white">4.2天</p>
          <p className="text-[11px] md:text-xs text-slate-500">平均面试周期</p>
        </div>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs md:text-sm transition-colors whitespace-nowrap',
                selectedTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {tab.label}
              {selectedTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-4 md:space-y-5">
          {/* Score Cards */}
          <div className="grid gap-2.5 md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedInterviews.map((interview) => {
              if (!interview.rating) return null;
              return (
                <div key={interview.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-[10px] md:text-xs font-bold text-sky-400 border border-sky-500/20">
                        {interview.candidateName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-semibold text-white">{interview.candidateName}</p>
                        <p className="text-[10px] md:text-[11px] text-slate-500">{interview.position}</p>
                      </div>
                    </div>
                    <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', typeColor(interview.type))}>
                      {typeLabel(interview.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-xl font-mono text-lg md:text-2xl font-bold border shrink-0',
                      interview.rating.overall >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      interview.rating.overall >= 70 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {interview.rating.overall}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      {Object.entries(interview.rating).filter(([k]) => k !== 'overall' && k !== 'comment' && k !== 'aiComment').map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1.5 md:gap-2">
                          <span className="text-[9px] md:text-[10px] text-slate-500 w-10 md:w-14 shrink-0">{dimensionLabels[key]}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[#0a0e1a] overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                (value as number) >= 9 ? 'bg-emerald-500' :
                                (value as number) >= 7 ? 'bg-sky-500' :
                                'bg-amber-500'
                              )}
                              style={{ width: `${(value as number) * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] md:text-[10px] font-mono text-slate-400 w-4 text-right">{value as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Evaluation Summary */}
          {completedInterviews.map((interview) => {
            if (!interview.rating) return null;
            return (
              <div key={`eval-${interview.id}`} className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Brain className="h-4 w-4 text-sky-400" />
                  <h3 className="text-xs md:text-sm font-semibold text-white">{interview.candidateName} - AI 综合评价</h3>
                  <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', typeColor(interview.type))}>
                    {typeLabel(interview.type)}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Radar Chart Simulation */}
                  <div className="flex items-center justify-center">
                    <div className="relative h-36 w-36 md:h-48 md:w-48">
                      {[1, 2, 3, 4].map((ring) => (
                        <div
                          key={ring}
                          className="absolute rounded-full border border-[#1e293b]"
                          style={{ inset: `${ring * 12}%` }}
                        ></div>
                      ))}
                      {radarDimensions.map((dim, i) => {
                        const angle = (i * 72 - 90) * (Math.PI / 180);
                        const x = 50 + 48 * Math.cos(angle);
                        const y = 50 + 48 * Math.sin(angle);
                        return (
                          <div
                            key={dim.key}
                            className="absolute text-[9px] md:text-[10px] text-slate-500 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          >
                            {dim.label}
                          </div>
                        );
                      })}
                      {radarDimensions.map((dim, i) => {
                        const value = interview.rating?.[dim.key as keyof typeof interview.rating] as number;
                        const angle = (i * 72 - 90) * (Math.PI / 180);
                        const r = (value / 10) * 42;
                        const x = 50 + r * Math.cos(angle);
                        const y = 50 + r * Math.sin(angle);
                        return (
                          <div
                            key={`dot-${dim.key}`}
                            className="absolute h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-sky-400 border-2 border-sky-300 shadow-lg shadow-sky-400/30 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          ></div>
                        );
                      })}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl md:text-2xl font-bold font-mono text-sky-400">{interview.rating.overall}</p>
                          <p className="text-[9px] md:text-[10px] text-slate-500">综合评分</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Comment */}
                  <div className="space-y-2.5 md:space-y-3">
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3">
                      <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> 面试官评价
                      </p>
                      <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">{interview.rating.comment}</p>
                    </div>
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-2.5 md:p-3">
                      <p className="text-[11px] md:text-xs font-medium text-sky-400 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI 分析建议
                      </p>
                      <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">{interview.rating.aiComment}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">建议推进至Offer环节</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTab === 'compare' && (
        <div className="space-y-4 md:space-y-5">
          {/* Mobile: Card-based comparison */}
          <div className="space-y-3 md:hidden">
            <h3 className="text-sm font-semibold text-white">候选人多维对比</h3>
            {completedInterviews.map((interview) => (
              <div key={`mobile-cmp-${interview.id}`} className="rounded-xl border border-[#1e293b] bg-[#111827] p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs font-bold text-sky-400 border border-sky-500/20">
                      {interview.candidateName.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-white">{interview.candidateName}</span>
                  </div>
                  <span className={cn(
                    'font-mono text-lg font-bold',
                    (interview.rating?.overall ?? 0) >= 85 ? 'text-emerald-400' :
                    (interview.rating?.overall ?? 0) >= 70 ? 'text-sky-400' : 'text-amber-400'
                  )}>
                    {interview.rating?.overall}
                  </span>
                </div>
                <div className="space-y-2">
                  {radarDimensions.map((dim) => {
                    const val = interview.rating?.[dim.key as keyof typeof interview.rating] as number;
                    return (
                      <div key={dim.key} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 w-14">{dim.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[#0a0e1a] overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              val >= 9 ? 'bg-emerald-500' : val >= 7 ? 'bg-sky-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${val * 10}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs text-white w-4 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table comparison */}
          <div className="hidden md:block rounded-xl border border-[#1e293b] bg-[#111827] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">候选人多维对比</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b]">
                    <th className="pb-3 text-left text-slate-500 font-medium">评估维度</th>
                    {completedInterviews.map((i) => (
                      <th key={i.id} className="pb-3 text-center text-white font-medium">{i.candidateName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {radarDimensions.map((dim) => (
                    <tr key={dim.key} className="border-b border-[#1e293b]/50">
                      <td className="py-3 text-slate-400">{dim.label}</td>
                      {completedInterviews.map((i) => {
                        const val = i.rating?.[dim.key as keyof typeof i.rating] as number;
                        return (
                          <td key={i.id} className="py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-[#0a0e1a] overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    val >= 9 ? 'bg-emerald-500' : val >= 7 ? 'bg-sky-500' : 'bg-amber-500'
                                  )}
                                  style={{ width: `${val * 10}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-white w-4">{val}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 text-slate-400 font-medium">综合评分</td>
                    {completedInterviews.map((i) => (
                      <td key={i.id} className="pt-3 text-center">
                        <span className={cn(
                          'font-mono text-lg font-bold',
                          (i.rating?.overall ?? 0) >= 85 ? 'text-emerald-400' :
                          (i.rating?.overall ?? 0) >= 70 ? 'text-sky-400' : 'text-amber-400'
                        )}>
                          {i.rating?.overall}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Comparison Insight */}
          <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-3 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
              <h3 className="text-xs md:text-sm font-semibold text-sky-400">AI 对比分析</h3>
            </div>
            <div className="space-y-2.5 md:space-y-3 text-[11px] md:text-xs text-slate-300 leading-relaxed">
              <p>
                <span className="text-white font-medium">张明远</span>在专业技能和团队协作方面表现突出，综合评分88分，
                特别是在系统设计能力上展现了资深工程师的水准。建议重点跟进，尽快推进至Offer环节。
              </p>
              <p>
                <span className="text-white font-medium">李思涵</span>沟通能力和学习能力评分最高(9.2/9.0)，
                展现出很强的成长潜力。技术深度虽然略逊于张明远，但综合素质均衡，值得培养。
              </p>
              <p>
                <span className="text-white font-medium">王浩然</span>在文化匹配度上得分最高(9.0)，
                与团队价值观高度契合。技术面表现稳定，建议安排一轮补充面试以确认技术深度。
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'questions' && (
        <div className="space-y-4 md:space-y-5">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-white">AI 面试问题推荐</h3>
                <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">基于岗位JD和候选人背景智能生成</p>
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 md:px-4 text-xs md:text-sm font-medium transition-colors self-start',
                  isGenerating
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'bg-sky-500 text-white hover:bg-sky-600'
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> 生成问题
                  </>
                )}
              </button>
            </div>

            {generatedQuestions.length > 0 && (
              <div className="space-y-2.5 md:space-y-3">
                {generatedQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5 md:gap-3 rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 md:p-4">
                    <span className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[10px] md:text-xs font-mono text-sky-400 border border-sky-500/20">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs md:text-sm text-slate-200">{q}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
                        <span className="rounded-full bg-sky-500/10 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] text-sky-400">技术深度</span>
                        <span className="rounded-full bg-violet-500/10 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] text-violet-400">行为面试</span>
                        <span className="rounded-full bg-orange-500/10 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] text-orange-400">文化匹配</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isGenerating && generatedQuestions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center px-4">
                <div className="rounded-full bg-sky-500/10 p-3 md:p-4 mb-3 md:mb-4">
                  <Lightbulb className="h-6 w-6 md:h-8 md:w-8 text-sky-400" />
                </div>
                <p className="text-xs md:text-sm text-slate-400">点击「生成问题」按钮，AI 将根据岗位和候选人信息智能推荐面试问题</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
