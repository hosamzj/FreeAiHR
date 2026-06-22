'use client';

import { useState } from 'react';
import { mockOffers } from '@/lib/mock-data';
import {
  FileCheck,
  Sparkles,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Send,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: '草稿', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  pending: { label: '待审批', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  approved: { label: '已审批', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  sent: { label: '已发送', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  accepted: { label: '已接受', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  declined: { label: '已拒绝', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export default function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSalaryRef, setShowSalaryRef] = useState(false);

  const handleGenerateOffer = (offerId: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Offer总数', value: mockOffers.length, icon: FileCheck, color: 'sky' },
          { label: '待审批', value: mockOffers.filter(o => o.status === 'pending').length, icon: Clock, color: 'amber' },
          { label: '已接受', value: mockOffers.filter(o => o.status === 'accepted').length, icon: CheckCircle2, color: 'emerald' },
          { label: '平均薪酬', value: '¥40K', icon: DollarSign, color: 'orange' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 card-hover">
              <div className="flex items-center justify-between">
                <Icon className={cn(
                  'h-5 w-5',
                  stat.color === 'sky' ? 'text-sky-400' :
                  stat.color === 'amber' ? 'text-amber-400' :
                  stat.color === 'emerald' ? 'text-emerald-400' : 'text-orange-400'
                )} />
              </div>
              <p className="mt-2 text-2xl font-bold text-white font-mono">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Offer Pipeline */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Offer 审批流</h3>
        <div className="flex items-center gap-2">
          {['草稿', '待审批', '已审批', '已发送', '已接受'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex-1 rounded-lg border p-3 text-center transition-all',
                i === 0 ? 'border-slate-500/30 bg-slate-500/5' :
                i === 1 ? 'border-amber-500/30 bg-amber-500/5' :
                i === 2 ? 'border-sky-500/30 bg-sky-500/5' :
                'border-[#1e293b] bg-[#0a0e1a]'
              )}>
                <p className={cn(
                  'text-xs font-medium',
                  i === 0 ? 'text-slate-400' :
                  i === 1 ? 'text-amber-400' :
                  i === 2 ? 'text-sky-400' : 'text-slate-600'
                )}>
                  {step}
                </p>
                <p className="mt-1 text-lg font-bold font-mono text-white">
                  {i === 0 ? 1 : i === 1 ? 1 : i === 2 ? 1 : i === 3 ? 0 : 0}
                </p>
              </div>
              {i < 4 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Offer List */}
      <div className="space-y-4">
        {mockOffers.map((offer) => {
          const status = statusConfig[offer.status];
          const isExpanded = selectedOffer === offer.id;
          return (
            <div
              key={offer.id}
              className={cn(
                'rounded-xl border bg-[#111827] transition-all',
                isExpanded ? 'border-sky-500/30 glow-blue' : 'border-[#1e293b]'
              )}
            >
              {/* Header */}
              <div
                onClick={() => setSelectedOffer(isExpanded ? null : offer.id)}
                className="flex items-center gap-4 p-4 cursor-pointer"
              >
                <div className={cn('rounded-lg p-2.5', status.bg)}>
                  <FileCheck className={cn('h-5 w-5', status.text)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{offer.candidateName}</span>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', status.bg, status.text, status.border)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {offer.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {offer.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {offer.createdAt}
                    </span>
                    <span>审批人: {offer.approver}</span>
                  </div>
                </div>
                <div className="text-right">
                  {offer.salary.offered > 0 ? (
                    <>
                      <p className="text-lg font-bold text-white font-mono">
                        ¥{offer.salary.offered.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        区间 ¥{offer.salary.min.toLocaleString()} - ¥{offer.salary.max.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-amber-400">待确定薪酬</p>
                  )}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#1e293b] p-4 space-y-4">
                  {/* AI Recommendation */}
                  <div className="rounded-lg border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-sky-400" />
                      <span className="text-sm font-medium text-sky-400">AI 录用建议</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{offer.aiRecommendation}</p>
                  </div>

                  {/* Salary Reference */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3">
                      <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> 薪酬参考
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">市场P25</span>
                          <span className="text-xs font-mono text-slate-300">¥{offer.salary.min.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">市场P50</span>
                          <span className="text-xs font-mono text-white">¥{Math.round((offer.salary.min + offer.salary.max) / 2 / 1000).toLocaleString()}K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">市场P75</span>
                          <span className="text-xs font-mono text-slate-300">¥{offer.salary.max.toLocaleString()}</span>
                        </div>
                        {offer.salary.offered > 0 && (
                          <div className="flex items-center justify-between border-t border-[#1e293b] pt-2 mt-2">
                            <span className="text-xs text-orange-400">Offer薪酬</span>
                            <span className="text-sm font-bold font-mono text-orange-400">¥{offer.salary.offered.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {/* Salary bar */}
                      <div className="mt-3 relative h-2 rounded-full bg-[#1e293b]">
                        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-sky-500/30 via-sky-500/50 to-sky-500/30"></div>
                        {offer.salary.offered > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-orange-500 border-2 border-orange-300 shadow-lg shadow-orange-500/30"
                            style={{
                              left: `${((offer.salary.offered - offer.salary.min) / (offer.salary.max - offer.salary.min)) * 100}%`,
                            }}
                          ></div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3">
                      <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 福利待遇
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {offer.benefits.map((b) => (
                          <span key={b} className="rounded-md bg-sky-500/10 px-2 py-1 text-[11px] text-sky-400 border border-sky-500/20">
                            {b}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setShowSalaryRef(!showSalaryRef)}
                          className="flex h-7 items-center gap-1 rounded-md border border-[#1e293b] px-2.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="h-3 w-3" /> 薪酬报告
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {offer.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleGenerateOffer(offer.id)}
                          disabled={isGenerating}
                          className={cn(
                            'flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                            isGenerating
                              ? 'bg-orange-500/10 text-orange-400'
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
                              <Sparkles className="h-3.5 w-3.5" /> AI 生成Offer
                            </>
                          )}
                        </button>
                        <button className="flex h-9 items-center gap-2 rounded-lg border border-[#1e293b] px-4 text-sm text-slate-400 hover:text-white transition-colors">
                          <Edit3 className="h-3.5 w-3.5" /> 编辑
                        </button>
                      </>
                    )}
                    {offer.status === 'pending' && (
                      <>
                        <button className="flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 审批通过
                        </button>
                        <button className="flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-4 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <XCircle className="h-3.5 w-3.5" /> 驳回
                        </button>
                      </>
                    )}
                    {offer.status === 'approved' && (
                      <button className="flex h-9 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600 transition-colors">
                        <Send className="h-3.5 w-3.5" /> 发送Offer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
