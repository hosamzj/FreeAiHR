'use client';

import { useState } from 'react';
import {
  FileCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  Edit3,
  Eye,
  DollarSign,
  TrendingUp,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Clock,
  AlertCircle,
  Copy,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockOffers } from '@/lib/mock-data';

const statusConfig = {
  draft: { label: '草稿', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  pending: { label: '待审批', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  approved: { label: '已审批', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  sent: { label: '已发送', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  accepted: { label: '已接受', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: '已拒绝', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const pipeline = [
  { status: 'draft', label: '草稿', count: 2 },
  { status: 'pending', label: '待审批', count: 3 },
  { status: 'approved', label: '已审批', count: 1 },
  { status: 'sent', label: '已发送', count: 1 },
  { status: 'accepted', label: '已接受', count: 1 },
];

export default function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSalaryRef, setShowSalaryRef] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleGenerateOffer = (offerId: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2500);
  };

  const handleApprove = (offerId: string) => {
    alert(`Offer ${offerId} 审批通过！`);
  };

  const handleReject = (offerId: string) => {
    alert(`Offer ${offerId} 已驳回！`);
  };

  const handleSend = (offerId: string) => {
    alert(`Offer ${offerId} 已发送给候选人！`);
  };

  const stats = [
    { label: '本月Offer', value: mockOffers.length, icon: FileCheck, color: 'bg-sky-500/10', iconColor: 'text-sky-400' },
    { label: '待审批', value: mockOffers.filter(o => o.status === 'pending').length, icon: Clock, color: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { label: '已接受', value: mockOffers.filter(o => o.status === 'accepted').length, icon: CheckCircle2, color: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { label: '接受率', value: '85%', icon: TrendingUp, color: 'bg-violet-500/10', iconColor: 'text-violet-400' },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-hover rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <div className={cn('rounded-lg p-1.5 md:p-2', stat.color)}>
                  <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', stat.iconColor)} />
                </div>
              </div>
              <p className="font-mono text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] md:text-xs text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Offer Pipeline - horizontal scroll on mobile */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-white">Offer 审批流水线</h3>
            <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">实时追踪每个 Offer 的审批状态</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 md:px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] md:text-[11px] text-sky-400">智能追踪</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 md:mx-0 md:px-0 md:justify-between">
          {pipeline.map((stage, i) => (
            <div key={stage.status} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 transition-all',
                  stage.count > 0
                    ? i <= 2 ? 'border-sky-500 bg-sky-500/10' : 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#1e293b] bg-[#0a0e1a]'
                )}>
                  <span className={cn(
                    'font-mono text-xs md:text-sm font-bold',
                    stage.count > 0 ? (i <= 2 ? 'text-sky-400' : 'text-emerald-400') : 'text-slate-600'
                  )}>
                    {stage.count}
                  </span>
                </div>
                <span className="mt-1.5 text-[9px] md:text-xs text-slate-500 whitespace-nowrap">{stage.label}</span>
              </div>
              {i < pipeline.length - 1 && (
                <div className="mx-1.5 md:mx-3 h-0.5 w-6 md:w-12 rounded-full bg-[#1e293b] mb-4 md:mb-5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Offer List */}
      <div className="space-y-3 md:space-y-4">
        {mockOffers.map((offer) => {
          const status = statusConfig[offer.status as keyof typeof statusConfig];
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
                className="flex items-center gap-2.5 md:gap-4 p-3 md:p-4 cursor-pointer"
              >
                <div className={cn('rounded-lg p-2 md:p-2.5 shrink-0', status.bg)}>
                  <FileCheck className={cn('h-4 w-4 md:h-5 md:w-5', status.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 md:mb-1 flex-wrap">
                    <span className="text-xs md:text-sm font-semibold text-white">{offer.candidateName}</span>
                    <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', status.bg, status.text, status.border)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> <span className="hidden sm:inline">{offer.department}</span><span className="sm:hidden">{offer.department.slice(0, 2)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {offer.position}
                    </span>
                    <span className="hidden md:flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {offer.createdAt}
                    </span>
                    <span className="hidden lg:inline">审批人: {offer.approver}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {offer.salary.offered > 0 ? (
                    <>
                      <p className="text-sm md:text-lg font-bold text-white font-mono">
                        ¥{offer.salary.offered.toLocaleString()}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 hidden sm:block">
                        ¥{offer.salary.min.toLocaleString()} - ¥{offer.salary.max.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs md:text-sm text-amber-400">待确定</p>
                  )}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform shrink-0 hidden sm:block', isExpanded && 'rotate-180')} />
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#1e293b] p-3 md:p-4 space-y-3 md:space-y-4">
                  {/* AI Recommendation */}
                  <div className="rounded-lg border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
                      <span className="text-xs md:text-sm font-medium text-sky-400">AI 录用建议</span>
                    </div>
                    <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">{offer.aiRecommendation}</p>
                  </div>

                  {/* Salary Reference */}
                  <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3">
                      <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-2 md:mb-3 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> 薪酬参考
                      </p>
                      <div className="space-y-1.5 md:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] md:text-xs text-slate-500">市场P25</span>
                          <span className="text-[11px] md:text-xs font-mono text-slate-300">¥{offer.salary.min.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] md:text-xs text-slate-500">市场P50</span>
                          <span className="text-[11px] md:text-xs font-mono text-white">¥{Math.round((offer.salary.min + offer.salary.max) / 2 / 1000).toLocaleString()}K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] md:text-xs text-slate-500">市场P75</span>
                          <span className="text-[11px] md:text-xs font-mono text-slate-300">¥{offer.salary.max.toLocaleString()}</span>
                        </div>
                        {offer.salary.offered > 0 && (
                          <div className="flex items-center justify-between border-t border-[#1e293b] pt-1.5 md:pt-2 mt-1.5 md:mt-2">
                            <span className="text-[11px] md:text-xs text-orange-400">Offer薪酬</span>
                            <span className="text-sm md:text-sm font-bold font-mono text-orange-400">¥{offer.salary.offered.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {offer.salary.offered > 0 && (
                        <div className="mt-2.5 md:mt-3 relative h-2 rounded-full bg-[#1e293b]">
                          <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-sky-500/30 via-sky-500/50 to-sky-500/30"></div>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-orange-500 border-2 border-orange-300 shadow-lg shadow-orange-500/30"
                            style={{
                              left: `${((offer.salary.offered - offer.salary.min) / (offer.salary.max - offer.salary.min)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3">
                      <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-2 md:mb-3 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 福利待遇
                      </p>
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        {offer.benefits.map((b) => (
                          <span key={b} className="rounded-md bg-sky-500/10 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] text-sky-400 border border-sky-500/20">
                            {b}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2.5 md:mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setShowSalaryRef(!showSalaryRef)}
                          className="flex h-7 items-center gap-1 rounded-md border border-[#1e293b] px-2 md:px-2.5 text-[10px] md:text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="h-3 w-3" /> 薪酬报告
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-2">
                    {offer.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleGenerateOffer(offer.id)}
                          disabled={isGenerating}
                          className={cn(
                            'flex h-8 md:h-9 items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 text-[11px] md:text-sm font-medium transition-colors',
                            isGenerating
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-sky-500 text-white hover:bg-sky-600'
                          )}
                        >
                          {isGenerating ? (
                            <>
                              <div className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" /> AI 生成Offer
                            </>
                          )}
                        </button>
                        <button className="flex h-8 md:h-9 items-center gap-1.5 md:gap-2 rounded-lg border border-[#1e293b] px-3 md:px-4 text-[11px] md:text-sm text-slate-400 hover:text-white transition-colors">
                          <Edit3 className="h-3 w-3 md:h-3.5 md:w-3.5" /> 编辑
                        </button>
                      </>
                    )}
                    {offer.status === 'pending' && (
                      <>
                        <button className="flex h-8 md:h-9 items-center gap-1.5 md:gap-2 rounded-lg bg-emerald-500 px-3 md:px-4 text-[11px] md:text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
                          <CheckCircle2 className="h-3 w-3 md:h-3.5 md:w-3.5" /> 审批通过
                        </button>
                        <button className="flex h-8 md:h-9 items-center gap-1.5 md:gap-2 rounded-lg border border-red-500/30 px-3 md:px-4 text-[11px] md:text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <XCircle className="h-3 w-3 md:h-3.5 md:w-3.5" /> 驳回
                        </button>
                      </>
                    )}
                    {offer.status === 'approved' && (
                      <button className="flex h-8 md:h-9 items-center gap-1.5 md:gap-2 rounded-lg bg-sky-500 px-3 md:px-4 text-[11px] md:text-sm font-medium text-white hover:bg-sky-600 transition-colors">
                        <Send className="h-3 w-3 md:h-3.5 md:w-3.5" /> 发送Offer
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
