'use client';

import { useState, useCallback } from 'react';
import { mockCandidates, type Candidate } from '@/lib/mock-data';
import {
  Upload,
  Search,
  Filter,
  Sparkles,
  FileText,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Star,
  Zap,
  Eye,
  Tag,
  GraduationCap,
  Building2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'new' | 'screening' | 'interview' | 'offer' | 'hired';

const tabs: { id: TabType; label: string; count: number }[] = [
  { id: 'all', label: '全部', count: 8 },
  { id: 'new', label: '新简历', count: 2 },
  { id: 'screening', label: '筛选中', count: 2 },
  { id: 'interview', label: '面试中', count: 2 },
  { id: 'offer', label: '待Offer', count: 1 },
  { id: 'hired', label: '已入职', count: 0 },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  screening: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  interview: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  offer: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  new: '新简历',
  screening: '筛选中',
  interview: '面试中',
  offer: '待Offer',
  hired: '已入职',
  rejected: '已淘汰',
};

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedResult, setParsedResult] = useState<Candidate | null>(null);

  const filteredCandidates = mockCandidates.filter((c) => {
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    if (searchQuery && !c.name.includes(searchQuery) && !c.position.includes(searchQuery)) return false;
    return true;
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsUploading(false);
    setIsParsing(true);
    // Simulate AI parsing
    setTimeout(() => {
      setIsParsing(false);
      setParsedResult({
        id: 'new-1',
        name: '林子墨',
        avatar: 'LZ',
        email: 'linzm@email.com',
        phone: '139****5566',
        position: '高级前端工程师',
        department: '技术部',
        education: '硕士',
        school: '上海交通大学',
        major: '软件工程',
        experience: 4,
        skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Docker', 'AWS'],
        matchScore: 86,
        status: 'new',
        tags: ['AI解析', '新导入'],
        appliedAt: new Date().toISOString().split('T')[0],
        source: '简历上传',
        workHistory: [
          { company: '拼多多', position: '前端工程师', duration: '2021-2024', description: '负责商家后台前端架构升级' },
          { company: '携程', position: '前端开发', duration: '2020-2021', description: '参与机票预订页面优化' },
        ],
        aiSummary: '候选人具有扎实的前端工程化能力，在大规模B端系统开发方面经验丰富。React/TypeScript技术栈与岗位高度匹配，GraphQL和容器化经验是加分项。建议进入筛选环节。',
        matchedSkills: ['React', 'TypeScript', 'Next.js'],
        unmatchedSkills: ['Node.js', 'Tailwind CSS', 'Webpack'],
      });
    }, 2500);
  }, []);

  return (
    <div className="space-y-5">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索候选人姓名、岗位..."
              className="h-9 w-72 rounded-lg border border-[#1e293b] bg-[#111827] pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-3 text-sm text-slate-400 hover:text-white transition-colors">
            <Filter className="h-3.5 w-3.5" />
            筛选
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-3 text-sm text-slate-400 hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5" />
            批量导入
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
        <div className="flex flex-col items-center py-8">
          {isParsing ? (
            <>
              <div className="relative mb-3">
                <div className="h-12 w-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-orange-400 ai-pulse" />
              </div>
              <p className="text-sm font-medium text-orange-400">AI 正在解析简历...</p>
              <p className="mt-1 text-xs text-slate-500">正在提取结构化信息并评估匹配度</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 w-32 overflow-hidden rounded-full bg-[#1e293b]">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse"></div>
                </div>
                <span className="text-xs text-slate-500 font-mono">67%</span>
              </div>
            </>
          ) : (
            <>
              <Upload className={cn('h-8 w-8 mb-3 transition-colors', isUploading ? 'text-sky-400' : 'text-slate-600')} />
              <p className="text-sm text-slate-400">
                拖拽简历文件到此处，或 <span className="text-sky-400 cursor-pointer hover:text-sky-300">点击上传</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">支持 PDF、Word、图片格式，AI 自动解析提取关键信息</p>
            </>
          )}
        </div>
      </div>

      {/* AI Parsed Result */}
      {parsedResult && (
        <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-semibold text-sky-400">AI 解析结果</span>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400 border border-sky-500/20">自动提取</span>
            </div>
            <button onClick={() => setParsedResult(null)} className="text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sm font-bold text-sky-400 border border-sky-500/20">
                  {parsedResult.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{parsedResult.name}</p>
                  <p className="text-xs text-slate-500">{parsedResult.position}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                  {parsedResult.education} · {parsedResult.school} · {parsedResult.major}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {parsedResult.experience}年工作经验
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  {parsedResult.workHistory.map(w => w.company).join(' → ')}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg font-mono text-lg font-bold',
                  parsedResult.matchScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                  parsedResult.matchScore >= 80 ? 'bg-sky-500/10 text-sky-400' :
                  'bg-amber-500/10 text-amber-400'
                )}>
                  {parsedResult.matchScore}
                </div>
                <div>
                  <p className="text-xs text-slate-400">AI 匹配评分</p>
                  <p className="text-[10px] text-slate-600">基于岗位JD智能评估</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">AI 摘要</p>
                <p className="text-xs leading-relaxed text-slate-300 bg-[#0a0e1a] rounded-lg p-3 border border-[#1e293b]">
                  {parsedResult.aiSummary}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" /> 匹配技能
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {parsedResult.matchedSkills.map((s) => (
                      <span key={s} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> 待确认
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {parsedResult.unmatchedSkills.map((s) => (
                      <span key={s} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400 border border-amber-500/20">
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm transition-colors',
              activeTab === tab.id
                ? 'text-sky-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono',
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

      {/* Candidate List */}
      <div className="grid gap-3">
        {filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            onClick={() => setSelectedCandidate(selectedCandidate?.id === candidate.id ? null : candidate)}
            className={cn(
              'card-hover cursor-pointer rounded-xl border bg-[#111827] p-4',
              selectedCandidate?.id === candidate.id
                ? 'border-sky-500/30 glow-blue'
                : 'border-[#1e293b]'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sm font-bold text-sky-400 border border-sky-500/20">
                  {candidate.avatar}
                </div>
                {candidate.matchScore >= 90 && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/30">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{candidate.name}</span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', statusColors[candidate.status])}>
                    {statusLabels[candidate.status]}
                  </span>
                  {candidate.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px]',
                        tag.includes('AI') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        tag.includes('高匹配') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      )}
                    >
                      {tag === 'AI推荐' && <Sparkles className="inline h-2.5 w-2.5 mr-0.5" />}
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{candidate.position}</span>
                  <span>{candidate.education} · {candidate.school}</span>
                  <span>{candidate.experience}年经验</span>
                  <span>{candidate.source}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px]',
                        candidate.matchedSkills.includes(skill)
                          ? 'bg-emerald-500/10 text-emerald-400/80'
                          : 'bg-[#1e293b] text-slate-500'
                      )}
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 5 && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] text-slate-600">
                      +{candidate.skills.length - 5}
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-center shrink-0">
                <div className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl font-mono text-xl font-bold border',
                  candidate.matchScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  candidate.matchScore >= 80 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  candidate.matchScore >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-[#1e293b] text-slate-400 border-[#1e293b]'
                )}>
                  {candidate.matchScore}
                </div>
                <p className="mt-1 text-[10px] text-slate-600">匹配度</p>
              </div>
            </div>

            {/* Expanded Detail */}
            {selectedCandidate?.id === candidate.id && (
              <div className="mt-4 border-t border-[#1e293b] pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-sky-400" /> AI 分析摘要
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300 bg-[#0a0e1a] rounded-lg p-3 border border-[#1e293b]">
                      {candidate.aiSummary}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">工作经历</p>
                    <div className="space-y-2">
                      {candidate.workHistory.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500/50 shrink-0"></div>
                          <div>
                            <span className="text-white">{w.company}</span>
                            <span className="text-slate-500"> · {w.position} · {w.duration}</span>
                            <p className="text-slate-500 mt-0.5">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                    <Zap className="h-3.5 w-3.5" /> 安排面试
                  </button>
                  <button className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    <Check className="h-3.5 w-3.5" /> 通过筛选
                  </button>
                  <button className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="h-3.5 w-3.5" /> 淘汰
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
