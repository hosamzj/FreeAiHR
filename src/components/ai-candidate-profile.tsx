'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, Brain, Target, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AICandidateProfileProps {
  candidateId: string;
  candidateName: string;
  position?: string;
  resumeParsed?: Record<string, unknown>;
  matchAnalysis?: string;
}

interface AbilityScores {
  technical: number;
  communication: number;
  leadership: number;
  innovation: number;
  execution: number;
  learning: number;
}

interface ProfileResult {
  abilities: AbilityScores;
  personality?: {
    primary: string;
    secondary: string;
    description: string;
  };
  evaluation: string;
  recommendationScore: number;
  positionMatch: {
    score: number;
    strengths: string[];
    gaps: string[];
  };
}

export function AICandidateProfile({ candidateId, candidateName, position, resumeParsed, matchAnalysis }: AICandidateProfileProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchProfile = async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/candidate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setProfile(data.data);
      } else {
        setError(data.message || '获取画像失败');
      }
    } catch {
      setError('请求失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const buildProfileFromExcel = useCallback((): ProfileResult | null => {
    if (!resumeParsed) return null;
    const scoring = (resumeParsed.scoring as Array<{ dimension: string; score: number; notes: string }>) || [];
    const strengths = (resumeParsed.strengths as string[]) || [];
    const gaps = (resumeParsed.gaps as string[]) || [];
    const recommendation = (resumeParsed.recommendation as string) || '';

    const avg = scoring.length > 0
      ? scoring.reduce((a, b) => a + (typeof b.score === 'number' ? b.score : 0), 0) / scoring.length
      : 0;
    const rawOverallScore = typeof resumeParsed.overallScore === 'number' ? resumeParsed.overallScore : Math.round(avg);
    const overallScore = Number.isNaN(rawOverallScore) ? 75 : rawOverallScore;

    const dimensionMap: Record<string, string[]> = {
      technical: ['技能 Skills', '专业 Major', '流程理解 Process'],
      communication: ['态度/配合 Attitude'],
      leadership: ['工作经历 Work Exp'],
      innovation: ['流程理解 Process', '技能 Skills'],
      execution: ['工作经历 Work Exp', '流程理解 Process'],
      learning: ['学历 Education', '专业 Major'],
    };

    const findScore = (keys: string[]) => {
      const items = scoring.filter(s => keys.includes(s.dimension));
      if (items.length === 0) return overallScore;
      return Math.round(items.reduce((a, b) => a + (typeof b.score === 'number' ? b.score : 0), 0) / items.length);
    };

    return {
      abilities: {
        technical: findScore(dimensionMap.technical),
        communication: findScore(dimensionMap.communication),
        leadership: findScore(dimensionMap.leadership),
        innovation: findScore(dimensionMap.innovation),
        execution: findScore(dimensionMap.execution),
        learning: findScore(dimensionMap.learning),
      },
      evaluation: matchAnalysis || recommendation || '暂无评价',
      recommendationScore: overallScore,
      positionMatch: {
        score: overallScore,
        strengths: strengths.slice(0, 5),
        gaps: gaps.slice(0, 5),
      },
    };
  }, [resumeParsed, matchAnalysis]);

  // Draw radar chart
  useEffect(() => {
    if (!profile || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = 90;
    const labels = ['技术', '沟通', '领导', '创新', '执行', '学习'];
    const abilities = profile.abilities || {};
    const values = [
      abilities.technical || 0,
      abilities.communication || 0,
      abilities.leadership || 0,
      abilities.innovation || 0,
      abilities.execution || 0,
      abilities.learning || 0,
    ];
    const n = labels.length;

    ctx.clearRect(0, 0, size, size);

    // Draw grid
    for (let level = 1; level <= 5; level++) {
      const r = (maxR / 5) * level;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = level === 5 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw data area
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = (Math.PI * 2 / n) * idx - Math.PI / 2;
      const r = (values[idx] / 100) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      const r = (values[i] / 100) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0a0e1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw labels
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      const labelR = maxR + 20;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(labels[i], x, y);
      // Draw value
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`${values[i]}`, x, y + 13);
      ctx.font = '11px Inter, sans-serif';
    }
  }, [profile]);

  // Safety check for required props - must be after all hooks
  if (!candidateId) {
    return <p className="text-sm text-slate-500 text-center py-4">候选人信息缺失</p>;
  }

  if (!profile && !loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <button
          onClick={fetchProfile}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          生成AI画像
        </button>
        <p className="mt-2 text-xs text-slate-500">基于候选人信息生成六维能力评估和人格分析</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          <Brain className="absolute inset-0 m-auto h-6 w-6 text-sky-400 ai-pulse" />
        </div>
        <p className="text-sm text-sky-400 font-medium">AI 正在分析候选人...</p>
        <p className="mt-1 text-xs text-slate-500">多维度评估能力与潜力</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchProfile} className="mt-2 text-xs text-sky-400 hover:text-sky-300">重试</button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5">
      {resumeParsed && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">基于 Excel 简历分析数据生成</span>
        </div>
      )}
      {/* Scores Overview */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard
          icon={<Target className="w-4 h-4" />}
          label="推荐指数"
          value={profile.recommendationScore}
          color="sky"
        />
        <ScoreCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="岗位匹配"
          value={profile.positionMatch?.score || 0}
          color="emerald"
        />
        <ScoreCard
          icon={<Star className="w-4 h-4" />}
          label="综合评分"
          value={Math.round((profile.recommendationScore + (profile.positionMatch?.score || 0)) / 2)}
          color="orange"
        />
      </div>

      {/* Radar Chart */}
      <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-3">六维能力雷达图</h4>
        <div className="flex justify-center">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Excel 原始维度评分 */}
      {resumeParsed && Array.isArray(resumeParsed.scoring) ? (
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-medium text-slate-400 mb-3">Excel 原始维度评分</h4>
          <div className="space-y-2">
            {(resumeParsed.scoring as Array<{ dimension: string; score: number; notes: string }>).map((item: { dimension: string; score: number; notes: string }, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 truncate flex-1">{item.dimension}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#1e293b]">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.score as number))}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-sky-400 w-6 text-right">{(item.score as number)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Personality */}
      {profile.personality && (
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-medium text-slate-400 mb-2">九型人格分析</h4>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile.personality.primary}</p>
              <p className="text-xs text-slate-400 mt-0.5">副型：{profile.personality.secondary}</p>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{profile.personality.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">综合评价</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{profile.evaluation || ''}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-medium text-emerald-400 mb-2">优势</h4>
          <ul className="space-y-1.5">
            {(profile.positionMatch?.strengths || []).map((s, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                <span className="text-emerald-400 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-medium text-amber-400 mb-2">待提升</h4>
          <ul className="space-y-1.5">
            {(profile.positionMatch?.gaps || []).map((w, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                <span className="text-amber-400 shrink-0">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={fetchProfile}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        重新生成
      </button>
    </div>
  );
}

function ScoreCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'sky' | 'emerald' | 'orange';
}) {
  const colorClasses = {
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className={cn('rounded-xl border p-3 text-center', colorClasses[color])}>
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-xl font-bold font-mono">{Number.isNaN(value) ? "-" : value}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{label}</p>
    </div>
  );
}
