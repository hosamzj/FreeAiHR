'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  rate: number;
}

interface PositionProgress {
  positionId: string;
  title: string;
  department: string;
  status: string;
  headcount: number;
  totalCandidates: number;
  interviewing: number;
  offered: number;
  hired: number;
  avgProcessingDays: number;
  progress: number;
}

interface Bottleneck {
  positionId: string;
  title: string;
  department: string;
  isStalled: boolean;
  daysStalled: number;
  totalCandidates: number;
  suggestions: string[];
}

export default function ReportsPage() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [positions, setPositions] = useState<PositionProgress[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [funnelRes, posRes, bnRes] = await Promise.all([
        fetch('/api/reports/funnel'),
        fetch('/api/reports/position-progress'),
        fetch('/api/reports/bottleneck'),
      ]);
      const [funnelData, posData, bnData] = await Promise.all([
        funnelRes.json(),
        posRes.json(),
        bnRes.json(),
      ]);
      setFunnel(funnelData.data?.funnel || []);
      setPositions(posData.data || []);
      setBottlenecks(bnData.data || []);
    } catch (e) {
      console.error('Load reports error:', e);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
      </div>
    );
  }

  const maxCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">招聘报表</h1>
          <p className="mt-1 text-sm text-slate-400">招聘漏斗分析与进展追踪</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-4 py-2 text-sm text-slate-300 hover:bg-[#1a2236]">
          <Download className="h-4 w-4" />
          导出报表
        </button>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-white">招聘漏斗</h2>
        </div>
        <div className="space-y-3">
          {funnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-20 text-right text-sm text-slate-400">{stage.label}</div>
              <div className="flex-1">
                <div className="relative h-8 overflow-hidden rounded-lg bg-[#0a0e1a]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${(stage.count / maxCount) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm font-medium text-white">{stage.count}</span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                {i === 0 ? (
                  <span className="text-sm text-slate-400">100%</span>
                ) : (
                  <span className={`text-sm ${stage.rate >= 50 ? 'text-green-400' : stage.rate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {stage.rate}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">卡点分析</h2>
          </div>
          <div className="space-y-3">
            {bottlenecks.map(bn => (
              <div key={bn.positionId} className="rounded-lg border border-red-500/20 bg-[#111827] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{bn.title}</p>
                    <p className="text-xs text-slate-400">{bn.department}</p>
                  </div>
                  <div className="text-right">
                    {bn.isStalled && (
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-400">
                        停滞 {bn.daysStalled} 天
                      </span>
                    )}
                    {bn.totalCandidates === 0 && (
                      <span className="ml-2 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400">
                        无候选人
                      </span>
                    )}
                  </div>
                </div>
                {bn.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bn.suggestions.map((s, i) => (
                      <p key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <TrendingUp className="h-3 w-3 text-sky-400" />
                        {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position Progress */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
        <div className="border-b border-[#1e293b] p-4">
          <h2 className="text-lg font-semibold text-white">岗位进展</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b] text-left text-xs text-slate-400">
                <th className="px-4 py-3">岗位</th>
                <th className="px-4 py-3">部门</th>
                <th className="px-4 py-3">HC</th>
                <th className="px-4 py-3">候选人</th>
                <th className="px-4 py-3">面试中</th>
                <th className="px-4 py-3">已Offer</th>
                <th className="px-4 py-3">已入职</th>
                <th className="px-4 py-3">进度</th>
                <th className="px-4 py-3">平均处理天数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">暂无岗位数据</td>
                </tr>
              ) : (
                positions.map(p => (
                  <tr key={p.positionId} className="hover:bg-[#1a2236]">
                    <td className="px-4 py-3 text-sm text-white">{p.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{p.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{p.headcount}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{p.totalCandidates}</td>
                    <td className="px-4 py-3 text-sm text-sky-400">{p.interviewing}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400">{p.offered}</td>
                    <td className="px-4 py-3 text-sm text-green-400">{p.hired}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-[#1e293b]">
                          <div className="h-full bg-sky-500" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{p.avgProcessingDays}天</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
