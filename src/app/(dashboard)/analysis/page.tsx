'use client';

import { useState } from 'react';
import { mockInterviews } from '@/lib/mock-data';
import {
  Sparkles,
  Brain,
  BarChart3,
  Users,
  TrendingUp,
  MessageSquare,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const completedInterviews = mockInterviews.filter(i => i.rating);

const dimensionLabels: Record<string, string> = {
  professionalSkill: '专业技能',
  communication: '沟通能力',
  cultureFit: '文化匹配',
  problemSolving: '问题解决',
  teamwork: '团队协作',
};

const radarDimensions = [
  { key: 'professionalSkill', label: '专业技能' },
  { key: 'communication', label: '沟通能力' },
  { key: 'cultureFit', label: '文化匹配' },
  { key: 'problemSolving', label: '问题解决' },
  { key: 'teamwork', label: '团队协作' },
];

export default function AnalysisPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'compare' | 'questions'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedQuestions([
        '请描述一个你主导的复杂技术项目，遇到的最大挑战是什么？',
        '在团队协作中，你如何处理与同事的技术分歧？',
        '你如何保持技术敏感度？最近学习了什么新技术？',
        '如果项目deadline紧张，你会如何平衡质量与进度？',
        '请分享一个你通过技术创新提升业务效率的案例',
        '你理想中的团队文化是什么样的？',
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293b]">
        {[
          { id: 'overview' as const, label: '评价总览', icon: BarChart3 },
          { id: 'compare' as const, label: '多维对比', icon: Users },
          { id: 'questions' as const, label: 'AI问题推荐', icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors',
                selectedTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {selectedTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {selectedTab === 'overview' && (
        <div className="space-y-5">
          {/* Score Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {completedInterviews.map((interview) => {
              if (!interview.rating) return null;
              return (
                <div key={interview.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs font-bold text-sky-400 border border-sky-500/20">
                      {interview.candidateName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{interview.candidateName}</p>
                      <p className="text-[10px] text-slate-500">{interview.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-xl font-mono text-2xl font-bold border',
                      interview.rating.overall >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      interview.rating.overall >= 70 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {interview.rating.overall}
                    </div>
                    <div className="flex-1 space-y-1">
                      {Object.entries(interview.rating).filter(([k]) => k !== 'overall' && k !== 'comment' && k !== 'aiComment').map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-14">{dimensionLabels[key]}</span>
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
                          <span className="text-[10px] font-mono text-slate-400 w-4">{value as number}</span>
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
              <div key={`eval-${interview.id}`} className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">{interview.candidateName} - AI 综合评价</h3>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400 border border-sky-500/20">
                    {typeLabel(interview.type)}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Radar Chart Simulation */}
                  <div className="flex items-center justify-center">
                    <div className="relative h-48 w-48">
                      {/* Background circles */}
                      {[1, 2, 3, 4].map((ring) => (
                        <div
                          key={ring}
                          className="absolute rounded-full border border-[#1e293b]"
                          style={{
                            inset: `${ring * 12}%`,
                          }}
                        ></div>
                      ))}
                      {/* Dimension labels */}
                      {radarDimensions.map((dim, i) => {
                        const angle = (i * 72 - 90) * (Math.PI / 180);
                        const x = 50 + 48 * Math.cos(angle);
                        const y = 50 + 48 * Math.sin(angle);
                        return (
                          <div
                            key={dim.key}
                            className="absolute text-[10px] text-slate-500 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          >
                            {dim.label}
                          </div>
                        );
                      })}
                      {/* Score dots */}
                      {radarDimensions.map((dim, i) => {
                        const value = interview.rating?.[dim.key as keyof typeof interview.rating] as number;
                        const angle = (i * 72 - 90) * (Math.PI / 180);
                        const r = (value / 10) * 42;
                        const x = 50 + r * Math.cos(angle);
                        const y = 50 + r * Math.sin(angle);
                        return (
                          <div
                            key={`dot-${dim.key}`}
                            className="absolute h-2.5 w-2.5 rounded-full bg-sky-400 border-2 border-sky-300 shadow-lg shadow-sky-400/30 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          ></div>
                        );
                      })}
                      {/* Center score */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono text-sky-400">{interview.rating.overall}</p>
                          <p className="text-[10px] text-slate-500">综合评分</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Comment */}
                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3">
                      <p className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> 面试官评价
                      </p>
                      <p className="text-xs leading-relaxed text-slate-300">{interview.rating.comment}</p>
                    </div>
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                      <p className="text-xs font-medium text-sky-400 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI 分析建议
                      </p>
                      <p className="text-xs leading-relaxed text-slate-300">{interview.rating.aiComment}</p>
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
        <div className="space-y-5">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
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
          <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-sky-400">AI 对比分析</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <span className="text-white font-medium">张明远</span>在专业技能和团队协作方面表现突出，综合评分88分，
                适合需要深度技术能力的岗位。建议重点考察其在跨部门协作方面的经验。
              </p>
              <p>
                与其他候选人相比，张明远的<span className="text-emerald-400">问题解决能力</span>（9分）和<span className="text-emerald-400">专业技能</span>（9分）
                明显高于平均水平，但<span className="text-amber-400">沟通能力</span>（8分）仍有提升空间。
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Target className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-orange-400 font-medium">AI 建议：优先推进张明远至Offer环节</span>
                <ArrowRight className="h-3 w-3 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'questions' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">AI 面试问题推荐</h3>
                <p className="text-xs text-slate-500">基于岗位JD和候选人背景，智能生成面试问题</p>
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                  isGenerating
                    ? 'bg-orange-500/10 text-orange-400 cursor-wait'
                    : 'bg-sky-500 text-white hover:bg-sky-600'
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    生成问题
                  </>
                )}
              </button>
            </div>

            {/* Position Selector */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-slate-500">目标岗位：</span>
              <select className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-1.5 text-xs text-white focus:border-sky-500/50 focus:outline-none">
                <option>高级前端工程师</option>
                <option>产品经理</option>
                <option>后端工程师</option>
                <option>UI/UX设计师</option>
              </select>
              <span className="text-xs text-slate-500 ml-3">面试轮次：</span>
              <select className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-1.5 text-xs text-white focus:border-sky-500/50 focus:outline-none">
                <option>技术面</option>
                <option>初面</option>
                <option>复面</option>
                <option>终面</option>
              </select>
            </div>

            {/* Generated Questions */}
            {generatedQuestions.length > 0 && (
              <div className="space-y-2">
                {generatedQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 card-hover">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-mono text-sky-400 border border-sky-500/20">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{q}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">行为面试</span>
                        <span className="text-[10px] text-slate-600">预计回答时长 3-5 分钟</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedQuestions.length === 0 && !isGenerating && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="rounded-full bg-[#1e293b] p-4 mb-3">
                  <Lightbulb className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">点击"生成问题"按钮，AI 将根据岗位和面试轮次智能推荐面试问题</p>
              </div>
            )}
          </div>

          {/* Question Categories */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: '技术深度', desc: '考察候选人技术功底与架构能力', icon: Brain, count: 8, color: 'sky' },
              { title: '行为面试', desc: '了解候选人过往经历与处事方式', icon: MessageSquare, count: 6, color: 'orange' },
              { title: '文化匹配', desc: '评估候选人与团队文化的契合度', icon: Target, count: 5, color: 'emerald' },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn(
                      'h-4 w-4',
                      cat.color === 'sky' ? 'text-sky-400' :
                      cat.color === 'orange' ? 'text-orange-400' : 'text-emerald-400'
                    )} />
                    <span className="text-sm font-medium text-white">{cat.title}</span>
                    <span className="ml-auto rounded-full bg-[#1e293b] px-2 py-0.5 text-[10px] font-mono text-slate-400">{cat.count}题</span>
                  </div>
                  <p className="text-xs text-slate-500">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    technical: '技术面',
    first: '初面',
    second: '复面',
    final: '终面',
  };
  return labels[type] || type;
}
