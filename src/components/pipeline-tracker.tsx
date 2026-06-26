'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  FileCheck,
  UserCheck,
  FileSignature,
  CheckCircle2,
  ChevronRight,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PipelineStage = 'new' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected';

const STAGES: { key: PipelineStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'new', label: '新简历', icon: FileText },
  { key: 'screening', label: '筛选中', icon: Search },
  { key: 'interviewing', label: '面试中', icon: Calendar },
  { key: 'offered', label: 'Offer', icon: FileCheck },
  { key: 'hired', label: '已入职', icon: UserCheck },
];

const STATUS_ORDER: Record<string, number> = {
  new: 0,
  screening: 1,
  interviewing: 2,
  offered: 3,
  hired: 4,
  rejected: -1,
};

interface PipelineTrackerProps {
  candidateId: string;
  candidateName: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  className?: string;
}

export function PipelineTracker({
  candidateId,
  candidateName,
  currentStatus,
  onStatusChange,
  className,
}: PipelineTrackerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const currentIdx = STATUS_ORDER[currentStatus] ?? -1;
  const isRejected = currentStatus === 'rejected';

  const handleAction = async (action: string, extraParams?: Record<string, unknown>) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraParams }),
      });
      const data = await res.json();
      if (data.code === 0) {
        onStatusChange?.(data.data.candidate?.status || currentStatus);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Pipeline Progress Bar */}
      {!isRejected && (
        <div className="flex items-center gap-0">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                      isCompleted && 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
                      isCurrent && 'bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/20',
                      isFuture && 'bg-slate-800 text-slate-500 ring-1 ring-slate-700/50',
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] leading-tight text-center',
                      isCompleted && 'text-emerald-400',
                      isCurrent && 'text-sky-400 font-medium',
                      isFuture && 'text-slate-500',
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 shrink-0 -mt-3',
                      idx < currentIdx ? 'text-emerald-500/50' : 'text-slate-700',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejected State */}
      {isRejected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-400">已淘汰</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isRejected && (
        <div className="flex items-center gap-2 flex-wrap">
          {currentStatus === 'new' && (
            <button
              onClick={() => handleAction('screen')}
              disabled={loading === 'screen'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all disabled:opacity-50"
            >
              {loading === 'screen' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              通过筛选
            </button>
          )}

          {currentStatus === 'screening' && (
            <button
              onClick={() => {
                // This will trigger the schedule interview modal in parent
                onStatusChange?.('__schedule_interview__');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all"
            >
              <Calendar className="w-3 h-3" />
              安排面试
            </button>
          )}

          {currentStatus === 'interviewing' && (
            <button
              onClick={() => {
                onStatusChange?.('__complete_interview__');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <FileCheck className="w-3 h-3" />
              面试通过
            </button>
          )}

          {currentStatus === 'offered' && (
            <>
              <button
                onClick={() => {
                  onStatusChange?.('__generate_offer__');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <FileCheck className="w-3 h-3" />
                生成Offer
              </button>
              <button
                onClick={() => handleAction('accept_offer')}
                disabled={loading === 'accept_offer'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all disabled:opacity-50"
              >
                {loading === 'accept_offer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                接受Offer
              </button>
            </>
          )}

          {currentStatus === 'hired' && (
            <button
              onClick={() => {
                onStatusChange?.('__start_onboarding__');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <FileSignature className="w-3 h-3" />
              发起入职
            </button>
          )}

          {/* Reject button — always available */}
          {!showRejectConfirm ? (
            <button
              onClick={() => setShowRejectConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
            >
              <XCircle className="w-3 h-3" />
              淘汰
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-400">确认淘汰？</span>
              <button
                onClick={() => {
                  handleAction('reject');
                  setShowRejectConfirm(false);
                }}
                disabled={loading === 'reject'}
                className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : '确认'}
              </button>
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
