'use client';

import { dashboardStats, mockCandidates, mockInterviews, mockOffers } from '@/lib/mock-data';
import {
  Users,
  Briefcase,
  Calendar,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useAppContext } from '@/lib/app-context';

export default function DashboardPage() {
  const { setActiveModule } = useAppContext();
  const stats = dashboardStats;

  const statCards = [
    { label: '在招岗位', value: stats.openPositions, total: stats.totalPositions, icon: Briefcase, color: 'sky', change: '+2', up: true },
    { label: '候选人总数', value: stats.totalCandidates, icon: Users, color: 'blue', change: '+18', up: true, sub: '本周新增' },
    { label: '本周面试', value: stats.interviewsThisWeek, icon: Calendar, color: 'orange', change: '+3', up: true },
    { label: '待审批Offer', value: stats.offersPending, icon: FileCheck, color: 'amber', change: '-1', up: false },
    { label: '本月入职', value: stats.hiredThisMonth, icon: UserCheck, color: 'green', change: '+2', up: true },
    { label: '平均招聘周期', value: `${stats.avgTimeToHire}天`, icon: Clock, color: 'purple', change: '-3天', up: true },
  ];

  const colorMap: Record<string, { bg: string; text: string; shadow: string; border: string }> = {
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', shadow: 'shadow-sky-500/10', border: 'border-sky-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', shadow: 'shadow-blue-500/10', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', shadow: 'shadow-orange-500/10', border: 'border-orange-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', shadow: 'shadow-amber-500/10', border: 'border-amber-500/20' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', shadow: 'shadow-emerald-500/10', border: 'border-emerald-500/20' },
    purple: { bg: 'bg-violet-500/10', text: 'text-violet-400', shadow: 'shadow-violet-500/10', border: 'border-violet-500/20' },
  };

  // Funnel data
  const funnelSteps = [
    { label: '简历收集', value: stats.funnel.resume, color: '#38bdf8' },
    { label: 'AI筛选', value: stats.funnel.screening, color: '#0ea5e9' },
    { label: '面试', value: stats.funnel.interview, color: '#f97316' },
    { label: 'Offer', value: stats.funnel.offer, color: '#eab308' },
    { label: '入职', value: stats.funnel.hired, color: '#22c55e' },
  ];
  const maxFunnel = stats.funnel.resume;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];
          return (
            <div
              key={card.label}
              className="card-hover rounded-xl border border-[#1e293b] bg-[#111827] p-4"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${colors.bg}`}>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{card.label}</p>
                {card.sub && <p className="text-[10px] text-slate-600">{card.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recruitment Funnel */}
        <div className="lg:col-span-2 rounded-xl border border-[#1e293b] bg-[#111827] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">招聘漏斗</h3>
              <p className="text-xs text-slate-500">各环节转化率一览</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span className="text-[11px] text-sky-400">AI 分析</span>
            </div>
          </div>

          <div className="space-y-3">
            {funnelSteps.map((step, i) => {
              const width = (step.value / maxFunnel) * 100;
              const conversionRate = i > 0
                ? ((step.value / funnelSteps[i - 1].value) * 100).toFixed(1)
                : '100';
              return (
                <div key={step.label} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{step.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white">{step.value}</span>
                      {i > 0 && (
                        <span className="text-slate-600 font-mono text-[10px]">
                          转化 {conversionRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 rounded-lg bg-[#0a0e1a] overflow-hidden">
                    <div
                      className="funnel-bar h-full rounded-lg flex items-center px-3"
                      style={{
                        width: `${Math.max(width, 8)}%`,
                        background: `linear-gradient(90deg, ${step.color}20, ${step.color}40)`,
                        borderLeft: `3px solid ${step.color}`,
                      }}
                    >
                      <span className="text-xs font-mono" style={{ color: step.color }}>
                        {step.value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Insight */}
          <div className="mt-5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="text-sky-400 font-medium">AI 洞察：</span>
                简历→面试转化率（37.8%）低于行业均值（45%），建议优化JD描述以提升简历质量。
                面试→Offer转化率为32.4%，处于健康水平。整体招聘效率较上月提升12%。
              </p>
            </div>
          </div>
        </div>

        {/* Department Stats */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">部门招聘概况</h3>
          <div className="space-y-4">
            {stats.departmentStats.map((dept) => (
              <div key={dept.department} className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{dept.department}</span>
                  <span className="text-xs text-slate-500">{dept.positions} 个岗位</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-sky-400 font-mono">{dept.candidates}</p>
                    <p className="text-[10px] text-slate-500">候选人</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-400 font-mono">{dept.interviews}</p>
                    <p className="text-[10px] text-slate-500">面试</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400 font-mono">{dept.hired}</p>
                    <p className="text-[10px] text-slate-500">入职</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Candidates */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">最新候选人</h3>
            <button
              onClick={() => setActiveModule('resumes')}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-2">
            {mockCandidates.slice(0, 5).map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-all hover:border-[#1e293b] hover:bg-[#0a0e1a]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs font-medium text-sky-400 border border-sky-500/20">
                  {candidate.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{candidate.name}</span>
                    {candidate.tags.includes('AI推荐') && (
                      <span className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-400 border border-orange-500/20">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI推荐
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{candidate.position} · {candidate.department}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold font-mono ${
                    candidate.matchScore >= 90 ? 'text-emerald-400' :
                    candidate.matchScore >= 80 ? 'text-sky-400' :
                    candidate.matchScore >= 70 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {candidate.matchScore}
                  </p>
                  <p className="text-[10px] text-slate-600">匹配度</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">近期面试</h3>
            <button
              onClick={() => setActiveModule('interviews')}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-2">
            {mockInterviews.filter(i => i.status === 'scheduled').map((interview) => (
              <div
                key={interview.id}
                className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 transition-all hover:border-sky-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-xs text-sky-400 font-mono">{interview.scheduledAt}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    interview.type === 'technical' ? 'bg-sky-500/10 text-sky-400' :
                    interview.type === 'final' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {interview.type === 'technical' ? '技术面' :
                     interview.type === 'first' ? '初面' :
                     interview.type === 'second' ? '复面' : '终面'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{interview.candidateName}</p>
                    <p className="text-xs text-slate-500">{interview.position} · {interview.interviewerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{interview.room}</p>
                    <p className="text-[10px] text-slate-600">{interview.duration}分钟</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">周度趋势</h3>
        <div className="flex items-end gap-6 h-40">
          {stats.weeklyTrend.map((week) => (
            <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-end gap-1 w-full justify-center h-28">
                <div
                  className="w-6 rounded-t bg-sky-500/60 transition-all hover:bg-sky-500/80"
                  style={{ height: `${(week.resumes / 60) * 100}%` }}
                  title={`简历: ${week.resumes}`}
                ></div>
                <div
                  className="w-6 rounded-t bg-orange-500/60 transition-all hover:bg-orange-500/80"
                  style={{ height: `${(week.interviews / 60) * 100}%` }}
                  title={`面试: ${week.interviews}`}
                ></div>
                <div
                  className="w-6 rounded-t bg-emerald-500/60 transition-all hover:bg-emerald-500/80"
                  style={{ height: `${(week.offers / 60) * 100}%` }}
                  title={`Offer: ${week.offers}`}
                ></div>
              </div>
              <span className="text-xs text-slate-500">{week.week}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-sky-500/60"></div>
            <span className="text-xs text-slate-500">简历</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-orange-500/60"></div>
            <span className="text-xs text-slate-500">面试</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60"></div>
            <span className="text-xs text-slate-500">Offer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
