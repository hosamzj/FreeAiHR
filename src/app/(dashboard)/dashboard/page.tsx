'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  FileCheck,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockRecruitmentStats, mockRecruitmentFunnel, mockDepartmentStats, mockWeeklyTrend, mockRecentCandidates, mockUpcomingInterviews } from '@/lib/mock-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  users: Users,
  calendar: Calendar,
  filecheck: FileCheck,
  trendingup: TrendingUp,
  clock: Clock,
};

interface DashboardStats {
  totalCandidates: number;
  interviewing: number;
  pendingOffer: number;
  hired: number;
  scheduledInterviews: number;
}

interface WorkflowOverview {
  recruiting: number;
  pendingContract: number;
  onboarding: number;
  completedThisMonth: number;
}

export default function DashboardPage() {
  const { setActiveModule } = useAppContext();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    interviewing: 0,
    pendingOffer: 0,
    hired: 0,
    scheduledInterviews: 0,
  });
  const [workflowOverview, setWorkflowOverview] = useState<WorkflowOverview>({
    recruiting: 0,
    pendingContract: 0,
    onboarding: 0,
    completedThisMonth: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [candidatesRes, interviewsRes] = await Promise.all([
          fetch('/api/candidates?pageSize=1000'),
          fetch('/api/interviews'),
        ]);
        
        if (candidatesRes.ok) {
          const candidatesData = await candidatesRes.json();
          const candidates = candidatesData.data?.candidates || [];
          
          setStats(prev => ({
            ...prev,
            totalCandidates: candidates.length,
            interviewing: candidates.filter((c: { status: string }) => c.status === 'interview').length,
            pendingOffer: candidates.filter((c: { status: string }) => c.status === 'offer').length,
            hired: candidates.filter((c: { status: string }) => c.status === 'hired').length,
          }));
        }
        
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          const interviews = interviewsData.data || [];
          
          setStats(prev => ({
            ...prev,
            scheduledInterviews: interviews.filter((i: { status: string }) => i.status === 'scheduled').length,
          }));
        }

        // Fetch workflow overview
        try {
          const workflowRes = await fetch('/api/dashboard/workflow-overview');
          if (workflowRes.ok) {
            const workflowData = await workflowRes.json();
            setWorkflowOverview(workflowData.data || { recruiting: 0, pendingContract: 0, onboarding: 0, completedThisMonth: 0 });
          }
        } catch (err) {
          console.error('Failed to fetch workflow overview:', err);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  // Dynamic stats based on real data
  const dashboardStats = [
    { label: '总候选人', value: stats.totalCandidates, iconKey: 'users', color: 'bg-sky-500/10', change: 0 },
    { label: '面试中', value: stats.interviewing, iconKey: 'calendar', color: 'bg-orange-500/10', change: 0 },
    { label: '待Offer', value: stats.pendingOffer, iconKey: 'filecheck', color: 'bg-emerald-500/10', change: 0 },
    { label: '已入职', value: stats.hired, iconKey: 'trendingup', color: 'bg-violet-500/10', change: 0 },
    { label: '待面试', value: stats.scheduledInterviews, iconKey: 'clock', color: 'bg-amber-500/10', change: 0 },
    { label: '职位数', value: mockRecruitmentStats[5]?.value || 12, iconKey: 'briefcase', color: 'bg-pink-500/10', change: 0 },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Workflow Overview */}
      <div className="rounded-xl border border-[#1e293b] bg-gradient-to-r from-[#111827] to-[#1a2236] p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white md:text-base">全链路概览</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">招聘 → 合同 → 入职 全流程追踪</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-1 md:px-2.5">
            <TrendingUp className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] md:text-[11px] text-sky-400">实时</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div 
            className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 cursor-pointer hover:bg-sky-500/10 transition-colors"
            onClick={() => router.push('/resumes')}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-500/10 p-1.5">
                <Users className="h-4 w-4 text-sky-400" />
              </div>
              <span className="text-xs text-slate-400">招聘中</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{workflowOverview.recruiting}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">人</p>
          </div>
          <div 
            className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 cursor-pointer hover:bg-amber-500/10 transition-colors"
            onClick={() => router.push('/contracts')}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-1.5">
                <FileCheck className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xs text-slate-400">待签合同</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{workflowOverview.pendingContract}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">人</p>
          </div>
          <div 
            className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 cursor-pointer hover:bg-purple-500/10 transition-colors"
            onClick={() => router.push('/onboarding')}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-1.5">
                <UserCheck className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400">入职办理中</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{workflowOverview.onboarding}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">人</p>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-500/10 p-1.5">
                <Calendar className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-xs text-slate-400">本月已完成</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{workflowOverview.completedThisMonth}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">人</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {dashboardStats.map((stat) => {
          const Icon = iconMap[stat.iconKey] || Briefcase;
          return (
            <div 
              key={stat.label} 
              className="card-hover cursor-pointer rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4"
              onClick={() => {
                if (stat.label === '面试中' || stat.label === '待面试') {
                  router.push('/interviews');
                } else if (stat.label === '总候选人') {
                  router.push('/resumes');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className={cn('rounded-lg p-1.5 md:p-2', stat.color)}>
                  <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', stat.color.replace('/10', '').replace('bg-', 'text-'))} />
                </div>
              </div>
              <div className="mt-2.5 md:mt-3">
                <p className="font-mono text-xl font-bold text-white md:text-2xl">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruitment Funnel + Department Stats */}
      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        {/* Funnel */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white md:text-base">招聘漏斗</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">各环节转化率分析</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-1 md:px-2.5">
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span className="text-[10px] md:text-[11px] text-sky-400">AI 分析</span>
            </div>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {mockRecruitmentFunnel.map((stage, i) => {
              const widthPercent = (stage.value / mockRecruitmentFunnel[0].value) * 100;
              const conversionRate = i > 0
                ? ((stage.value / mockRecruitmentFunnel[i - 1].value) * 100).toFixed(1)
                : '100';
              return (
                <div key={stage.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-md bg-[#1a2236] text-[10px] md:text-xs font-mono text-slate-400">
                        {i + 1}
                      </span>
                      <span className="text-xs md:text-sm text-slate-300">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="font-mono text-sm md:text-base font-semibold text-white">{stage.value}</span>
                      {i > 0 && (
                        <span className="hidden rounded-full bg-[#1a2236] px-2 py-0.5 text-[10px] text-slate-400 sm:inline-block">
                          {conversionRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-7 md:h-8 overflow-hidden rounded-lg bg-[#0a0e1a]">
                    <div
                      className={cn('h-full rounded-lg transition-all duration-700 ease-out flex items-center', stage.color)}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="ml-2 text-[10px] md:text-xs font-medium text-white/80">
                        {widthPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 md:mt-5 flex flex-col gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-sky-400 ai-pulse shrink-0" />
              <span className="text-xs font-medium text-sky-400">AI 洞察</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 md:text-xs">
              简历→筛选转化率偏低(38%)，建议优化 JD 描述以吸引更精准的候选人。面试→Offer 转化率达80%，面试质量较高。
            </p>
          </div>
        </div>

        {/* Department Stats */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white md:text-base">部门统计</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">各部门招聘进度</p>
            </div>
            <Building2 className="h-4 w-4 text-slate-500 md:h-5 md:w-5" />
          </div>
          <div className="space-y-3 md:space-y-4">
            {mockDepartmentStats.map((dept) => (
              <div key={dept.name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm text-slate-300">{dept.name}</span>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="font-mono text-xs md:text-sm font-semibold text-white">{dept.active}</span>
                    <span className="text-[10px] md:text-xs text-slate-500">在招</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 md:h-2 flex-1 overflow-hidden rounded-full bg-[#0a0e1a]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${(dept.hired / dept.target) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] md:text-xs text-slate-500 w-10 text-right">
                    {dept.hired}/{dept.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        {/* Recent Candidates */}
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white md:text-base">最新候选人</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">最近7天新增</p>
            </div>
            <button
              onClick={() => router.push('/resumes')}
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              查看全部 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {mockRecentCandidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3 card-hover">
                <div className={cn('flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full text-xs md:text-sm font-bold', candidate.avatarColor)}>
                  {candidate.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-medium text-white truncate">{candidate.name}</span>
                    <span className={cn(
                      'shrink-0 rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]',
                      candidate.status === 'new' ? 'bg-sky-500/10 text-sky-400' :
                      candidate.status === 'screening' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    )}>
                      {candidate.status === 'new' ? '新投递' : candidate.status === 'screening' ? '筛选中' : '面试中'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">{candidate.position}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    'font-mono text-sm md:text-base font-bold',
                    candidate.matchScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {candidate.matchScore}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-slate-600">匹配度</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews + Weekly Trend */}
        <div className="space-y-4 md:space-y-5">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white md:text-base">近期面试</h3>
                <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">本周安排</p>
              </div>
              <button
                onClick={() => router.push('/interviews')}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                排期管理 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {mockUpcomingInterviews.slice(0, 4).map((interview) => (
                <div key={interview.id} className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3 card-hover">
                  <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-sky-500/10">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-white truncate">{interview.candidateName}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                      {interview.scheduledAt} · {interview.interviewerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn(
                      'rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]',
                      interview.type === 'technical' ? 'bg-sky-500/10 text-sky-400' :
                      interview.type === 'first' ? 'bg-violet-500/10 text-violet-400' :
                      'bg-orange-500/10 text-orange-400'
                    )}>
                      {interview.type === 'technical' ? '技术面' : interview.type === 'first' ? '初面' : '终面'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white md:text-base">周度趋势</h3>
                <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">近8周数据变化</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] md:text-[11px] text-emerald-400">+12.5%</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 md:gap-2 h-28 md:h-32">
              {mockWeeklyTrend.map((week) => (
                <div key={week.week} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-sky-500/40 to-sky-400/20 transition-all duration-500 hover:from-sky-500/60 hover:to-sky-400/40"
                      style={{ height: `${(week.interviews / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] md:text-[10px] text-slate-600">{week.week}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
