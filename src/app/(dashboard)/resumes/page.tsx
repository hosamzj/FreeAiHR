'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  Upload,
  FileText,
  Sparkles,
  Check,
  Eye,
  X,
  Clock,
  GraduationCap,
  Building2,
  AlertCircle,
  ChevronDown,
  Star,
  MapPin,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCandidates, mockParsedResume } from '@/lib/mock-data';

type TabType = 'all' | 'new' | 'screening' | 'interview' | 'offer' | 'hired';

const tabs: { id: TabType; label: string; count: number }[] = [
  { id: 'all', label: '全部', count: 48 },
  { id: 'new', label: '新简历', count: 12 },
  { id: 'screening', label: '筛选中', count: 18 },
  { id: 'interview', label: '面试中', count: 10 },
  { id: 'offer', label: '待Offer', count: 5 },
  { id: 'hired', label: '已入职', count: 3 },
];

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<typeof mockParsedResume | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsUploading(false);
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setParsedResult(mockParsedResume);
    }, 2500);
  }, []);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索候选人..."
              className="h-9 w-full rounded-lg border border-[#1e293b] bg-[#111827] pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none sm:w-56"
            />
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#111827] px-2.5 text-sm text-slate-400 hover:text-white transition-colors sm:px-3">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">筛选</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#111827] px-2.5 text-sm text-slate-400 hover:text-white transition-colors sm:px-3">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">批量导入</span>
            <span className="sm:hidden">导入</span>
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsUploading(true); }}
        onDragLeave={() => setIsUploading(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300',
          isUploading
            ? 'border-sky-500/50 bg-sky-500/5'
            : isParsing
            ? 'border-orange-500/30 bg-orange-500/5'
            : 'border-[#1e293b] bg-[#111827]/50 hover:border-slate-600'
        )}
      >
        <div className="flex flex-col items-center py-6 md:py-8 px-4">
          {isParsing ? (
            <>
              <div className="relative mb-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-4 w-4 md:h-5 md:w-5 text-orange-400 ai-pulse" />
              </div>
              <p className="text-sm font-medium text-orange-400">AI 正在解析简历...</p>
              <p className="mt-1 text-xs text-slate-500">正在提取结构化信息并评估匹配度</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 w-28 md:w-32 overflow-hidden rounded-full bg-[#1e293b]">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse"></div>
                </div>
                <span className="text-xs text-slate-500 font-mono">67%</span>
              </div>
            </>
          ) : (
            <>
              <Upload className={cn('h-7 w-7 md:h-8 md:w-8 mb-2 md:mb-3 transition-colors', isUploading ? 'text-sky-400' : 'text-slate-600')} />
              <p className="text-xs md:text-sm text-slate-400 text-center">
                拖拽简历到此处，或 <span className="text-sky-400 cursor-pointer hover:text-sky-300">点击上传</span>
              </p>
              <p className="mt-1 text-[11px] md:text-xs text-slate-600">支持 PDF、Word、图片格式</p>
            </>
          )}
        </div>
      </div>

      {/* AI Parsed Result */}
      {parsedResult && (
        <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-3 md:p-5">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" />
              <span className="text-xs md:text-sm font-semibold text-sky-400">AI 解析结果</span>
              <span className="hidden sm:inline rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400 border border-sky-500/20">自动提取</span>
            </div>
            <button onClick={() => setParsedResult(null)} className="text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs md:text-sm font-bold text-sky-400 border border-sky-500/20">
                  {parsedResult.avatar}
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-white">{parsedResult.name}</p>
                  <p className="text-[11px] md:text-xs text-slate-500">{parsedResult.position}</p>
                </div>
              </div>
              <div className="space-y-2 text-[11px] md:text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{parsedResult.education} · {parsedResult.school}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  {parsedResult.experience}年工作经验
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{parsedResult.workHistory.map(w => w.company).join(' → ')}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className={cn(
                  'flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg font-mono text-base md:text-lg font-bold',
                  parsedResult.matchScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                  parsedResult.matchScore >= 80 ? 'bg-sky-500/10 text-sky-400' :
                  'bg-amber-500/10 text-amber-400'
                )}>
                  {parsedResult.matchScore}
                </div>
                <div>
                  <p className="text-[11px] md:text-xs text-slate-400">AI 匹配评分</p>
                  <p className="text-[10px] text-slate-600">基于岗位JD评估</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1.5">AI 摘要</p>
                <p className="text-[11px] md:text-xs leading-relaxed text-slate-300 bg-[#0a0e1a] rounded-lg p-2.5 md:p-3 border border-[#1e293b]">
                  {parsedResult.aiSummary}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex-1">
                  <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" /> 匹配技能
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {parsedResult.matchedSkills.map((s) => (
                      <span key={s} className="rounded-md bg-emerald-500/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-emerald-400 border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] md:text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> 待确认
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {parsedResult.unmatchedSkills.map((s) => (
                      <span key={s} className="rounded-md bg-amber-500/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-amber-400 border border-amber-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                  <Check className="h-3.5 w-3.5" /> 加入候选人池
                </button>
                <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors">
                  <Eye className="h-3.5 w-3.5" /> 查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - scrollable on mobile */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative shrink-0 px-3 md:px-4 py-2.5 text-xs md:text-sm transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'text-sky-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono',
              activeTab === tab.id ? 'bg-sky-500/10 text-sky-400' : 'bg-[#1e293b] text-slate-500'
            )}>
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Candidates Grid */}
      <div className="grid gap-2.5 md:gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mockCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="card-hover rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden"
          >
            <div className="p-3 md:p-4">
              <div className="flex items-start gap-2.5 md:gap-3">
                <div className={cn(
                  'flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full text-xs md:text-sm font-bold',
                  candidate.avatarColor
                )}>
                  {candidate.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs md:text-sm font-semibold text-white truncate">{candidate.name}</h4>
                    {candidate.isAIRecommended && (
                      <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400 border border-orange-500/20">
                        <Sparkles className="h-2.5 w-2.5" /> AI推荐
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] md:text-xs text-slate-500 truncate">{candidate.position}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                    <span className={cn(
                      'rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]',
                      candidate.status === 'new' ? 'bg-sky-500/10 text-sky-400' :
                      candidate.status === 'screening' ? 'bg-amber-500/10 text-amber-400' :
                      candidate.status === 'interview' ? 'bg-violet-500/10 text-violet-400' :
                      candidate.status === 'offer' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-slate-500/10 text-slate-400'
                    )}>
                      {candidate.status === 'new' ? '新投递' : candidate.status === 'screening' ? '筛选中' :
                       candidate.status === 'interview' ? '面试中' : candidate.status === 'offer' ? '待Offer' : '已入职'}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] md:text-[11px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" /> {candidate.appliedAt}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  'flex h-9 w-9 md:h-11 md:w-11 shrink-0 flex-col items-center justify-center rounded-lg',
                  candidate.matchScore >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                )}>
                  <span className={cn(
                    'font-mono text-sm md:text-base font-bold',
                    candidate.matchScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {candidate.matchScore}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-2.5 md:mt-3 flex flex-wrap gap-1 md:gap-1.5">
                {candidate.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded-md bg-[#0a0e1a] px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-slate-400 border border-[#1e293b]">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 4 && (
                  <span className="rounded-md bg-[#0a0e1a] px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-slate-500">
                    +{candidate.skills.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedCandidate === candidate.id && (
              <div className="border-t border-[#1e293b] bg-[#0a0e1a]/50 p-3 md:p-4 space-y-3">
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1">AI 评估摘要</p>
                  <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">{candidate.aiSummary}</p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1.5">工作经历</p>
                  <div className="space-y-2">
                    {candidate.workHistory.map((work, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/50" />
                        <div>
                          <p className="text-[11px] md:text-xs text-slate-300">{work.company} · {work.position}</p>
                          <p className="text-[10px] md:text-[11px] text-slate-500">{work.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="flex h-7 md:h-8 items-center gap-1 rounded-lg bg-sky-500 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                    <Check className="h-3 w-3" /> 通过筛选
                  </button>
                  <button className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-[#1e293b] px-2.5 md:px-3 text-[11px] md:text-xs text-slate-400 hover:text-white transition-colors">
                    <Calendar className="h-3 w-3" /> 安排面试
                  </button>
                  <button className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="h-3 w-3" /> 淘汰
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#0a0e1a]/30 px-3 md:px-4 py-2">
              <button
                onClick={() => setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)}
                className="text-[11px] md:text-xs text-slate-500 hover:text-sky-400 transition-colors"
              >
                {expandedCandidate === candidate.id ? '收起详情' : '展开详情'}
              </button>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3 w-3',
                      star <= Math.round(candidate.matchScore / 20)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
