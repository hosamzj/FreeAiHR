'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Mail,
  Sparkles,
  AlertTriangle,
  Check,
  List,
  LayoutGrid,
  Plus,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  CheckCircle2,
  BarChart3,
  Brain,
  TrendingUp,
  Target,
  Star,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockInterviewers } from '@/lib/mock-data';
import { Modal } from '@/components/ui/modal';
import { InterviewCalendar, InterviewCalendarMobile } from '@/components/interview-calendar';
import { AIInterviewQuestionsModal } from '@/components/ai-interview-questions-modal';

type ViewMode = 'calendar' | 'list';
type AnalysisTab = 'overview' | 'compare' | 'questions';
type PageTab = 'schedule' | 'analysis';

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewerId: string;
  interviewerName: string;
  type: string;
  method?: string;
  scheduledAt: string;
  duration: number;
  location: string;
  room: string;
  position: string;
  status: string;
  aiQuestions?: string[];
  rating?: {
    overall?: number;
    technical?: number;
    communication?: number;
    teamwork?: number;
    learning?: number;
    culture?: number;
    comment: string;
    aiComment: string;
  };
}

interface CreateInterviewForm {
  candidateId: string;
  interviewerId: string;
  type: string;
  scheduledAt: string;
  duration: number;
  location: string;
  method: string;
  notes: string;
}

interface CandidateOption {
  id: string;
  name: string;
  appliedPosition: string;
}

interface InterviewerOption {
  id: string;
  name: string;
  department: string;
}

interface InterviewMethodOption {
  id: string;
  name: string;
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  first: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  second: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  technical: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  hr: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  final: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

const typeLabels: Record<string, string> = {
  first: '初面',
  second: '复面',
  technical: '技术面',
  hr: 'HR面',
  final: '终面',
};

const radarDimensions = [
  { key: 'technical', label: '专业技能' },
  { key: 'communication', label: '沟通能力' },
  { key: 'teamwork', label: '团队协作' },
  { key: 'learning', label: '学习能力' },
  { key: 'culture', label: '文化匹配' },
];

const dimensionLabels: Record<string, string> = {
  technical: '专业技能',
  communication: '沟通能力',
  teamwork: '团队协作',
  learning: '学习能力',
  culture: '文化匹配',
};

const typeLabel = (type: string) => typeLabels[type] || type;
const typeColor = (type: string) => typeColors[type] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };

export default function InterviewsPage() {
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [pageTab, setPageTab] = useState<PageTab>('schedule');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('overview');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showAIQuestions, setShowAIQuestions] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiGenerateTarget, setAiGenerateTarget] = useState<{ candidateId: string; candidateName: string; position?: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateInterviewForm>({
    candidateId: '',
    interviewerId: '',
    type: 'first',
    scheduledAt: '',
    duration: 60,
    location: '',
    method: '',
    notes: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('interviews_view_mode', mode);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('interviews_view_mode') as ViewMode;
    if (savedMode === 'calendar' || savedMode === 'list') setViewModeState(savedMode);
  }, []);

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
  const [interviewMethods, setInterviewMethods] = useState<InterviewMethodOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await fetch('/api/interviews');
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data && data.data.length > 0) {
          const transformed = data.data.map((item: any) => ({
            id: item.id,
            candidateId: item.candidateId,
            candidateName: item.candidate?.name || '未知候选人',
            interviewerId: item.interviewerId,
            interviewerName: item.interviewer?.name || '未分配',
            type: item.type || 'first',
            scheduledAt: new Date(item.scheduledAt).toLocaleString('zh-CN', {
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
            }),
            duration: item.duration || 60,
            location: item.location || '线上',
            room: item.location || '线上面试',
            position: item.candidate?.appliedPosition || '未知岗位',
            status: item.status || 'scheduled',
            aiQuestions: ['请介绍一下你的项目经验', '你遇到过最大的技术挑战是什么？', '你对这个岗位有什么期望？'],
            rating: item.rating || undefined,
          }));
          setInterviews(transformed);
        }
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const handleCreateInterview = async () => {
    if (!formData.candidateId || !formData.interviewerId || !formData.scheduledAt) {
      alert('请填写必要信息'); return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: formData.candidateId,
          interviewerId: formData.interviewerId,
          type: formData.type,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          duration: formData.duration,
          location: formData.location,
          method: formData.method,
          notes: formData.notes,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        alert('面试安排创建成功！');
        setShowCreateModal(false);
        setFormData({ candidateId: '', interviewerId: '', type: 'first', scheduledAt: '', duration: 60, location: '', method: '', notes: '' });
        fetchInterviews();
      } else {
        alert(data.message || '创建失败');
      }
    } catch (error) {
      alert('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const candidatesRes = await fetch('/api/candidates?status=screening,interview');
      const candidatesData = await candidatesRes.json();
      if (candidatesData.code === 0) {
        const candidatesList = Array.isArray(candidatesData.data?.candidates) ? candidatesData.data.candidates :
          Array.isArray(candidatesData.data) ? candidatesData.data : [];
        setCandidates(candidatesList.map((c: { id: string; name: string; appliedPosition?: string; position?: string }) => ({
          id: c.id, name: c.name, appliedPosition: c.appliedPosition || c.position || '未指定',
        })));
      }
      const interviewersRes = await fetch('/api/users?role=interviewer');
      const interviewersData = await interviewersRes.json();
      if (interviewersData.code === 0) {
        const usersList = Array.isArray(interviewersData.data?.users) ? interviewersData.data.users :
          Array.isArray(interviewersData.data) ? interviewersData.data : [];
        setInterviewers(usersList.map((u: { id: string; name: string; department?: string }) => ({
          id: u.id, name: u.name, department: u.department || '未分配',
        })));
      }
      const methodsRes = await fetch('/api/system/interview-methods');
      const methodsData = await methodsRes.json();
      if (methodsData.code === 0) {
        setInterviewMethods(Array.isArray(methodsData.data) ? methodsData.data : []);
      }
    } catch (err) {
      console.error('获取选项失败:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const openCreateModal = () => { setShowCreateModal(true); fetchOptions(); };

  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedQuestions([
        '请描述一个你在项目中遇到的最复杂的技术挑战，以及你是如何解决的？',
        '在团队协作中，你如何处理与同事意见不一致的情况？',
        '你如何看待持续学习？最近学习了什么新技术？',
        '描述一次你主动承担额外责任的经历',
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const completedInterviews = interviews.filter(i => i.rating);
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.rating?.overall ?? 0), 0) / completedInterviews.length)
    : 0;

  const pageTabs = [
    { id: 'schedule' as const, label: '面试排期', icon: Calendar },
    { id: 'analysis' as const, label: '面试分析', icon: BarChart3 },
  ];

  const analysisTabs = [
    { id: 'overview' as const, label: '评价总览', icon: BarChart3 },
    { id: 'compare' as const, label: '多维对比', icon: Users },
    { id: 'questions' as const, label: '问题推荐', icon: Lightbulb },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 md:h-7 md:w-7 text-sky-400" />
            面试管理
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500">智能排期、面试评价、多维分析</p>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto pb-0">
        {pageTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setPageTab(tab.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs md:text-sm transition-colors whitespace-nowrap',
                pageTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
              {pageTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"></div>}
            </button>
          );
        })}
      </div>

      {/* Interview Schedule Tab */}
      {pageTab === 'schedule' && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#111827] p-1">
                <button onClick={() => setViewMode('calendar')} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors', viewMode === 'calendar' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white')}>
                  <LayoutGrid className="h-3.5 w-3.5" /> 日历
                </button>
                <button onClick={() => setViewMode('list')} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors', viewMode === 'list' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:text-white')}>
                  <List className="h-3.5 w-3.5" /> 列表
                </button>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 sm:hidden">
                <List className="h-3 w-3 text-sky-400" /><span className="text-[10px] text-sky-400">列表视图</span>
              </div>
            </div>
            <button onClick={openCreateModal} className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs md:text-sm font-medium text-white hover:bg-sky-600 transition-colors">
              <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">新建面试安排</span><span className="sm:hidden">新建</span>
            </button>
          </div>

          {viewMode === 'calendar' && (
            <>
              <div className="hidden md:block">
                <InterviewCalendar interviews={interviews.map(i => ({
                  id: i.id, candidateId: i.candidateId, interviewerId: i.interviewerId, type: i.type, method: i.method || 'offline',
                  startTime: i.scheduledAt, endTime: new Date(new Date(i.scheduledAt).getTime() + (i.duration || 60) * 60000).toISOString(),
                  location: i.location || '', status: i.status, notes: '',
                  candidate: { name: i.candidateName, appliedPosition: i.position },
                  interviewer: { name: i.interviewerName },
                }))} onInterviewClick={(interview) => {
                  const pageInterview = interviews.find(i => i.id === interview.id);
                  if (pageInterview) setSelectedInterview(pageInterview);
                }} onDateClick={(date) => {
                  setFormData(prev => ({ ...prev, scheduledAt: date.toISOString().slice(0, 16) }));
                  setShowCreateModal(true);
                }} />
              </div>
              <div className="md:hidden">
                <InterviewCalendarMobile interviews={interviews.map(i => ({
                  id: i.id, candidateId: i.candidateId, interviewerId: i.interviewerId, type: i.type, method: i.method || 'offline',
                  startTime: i.scheduledAt, endTime: new Date(new Date(i.scheduledAt).getTime() + (i.duration || 60) * 60000).toISOString(),
                  location: i.location || '', status: i.status, notes: '',
                  candidate: { name: i.candidateName, appliedPosition: i.position },
                  interviewer: { name: i.interviewerName },
                }))} onInterviewClick={(interview) => {
                  const pageInterview = interviews.find(i => i.id === interview.id);
                  if (pageInterview) setSelectedInterview(pageInterview);
                }} onDateClick={(date) => {
                  setFormData(prev => ({ ...prev, scheduledAt: date.toISOString().slice(0, 16) }));
                  setShowCreateModal(true);
                }} />
              </div>
            </>
          )}

          {viewMode === 'list' && (
            <div className="space-y-2.5 md:space-y-3">
              {interviews.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无面试安排</p>
                  <p className="text-xs mt-1">点击"新建面试安排"或在简历管理中筛选候选人后创建面试</p>
                </div>
              ) : (
                interviews.map((interview) => {
                  const colors = typeColors[interview.type] || typeColors.first;
                  return (
                    <div key={interview.id} onClick={() => setSelectedInterview(interview)} className={cn('card-hover cursor-pointer rounded-xl border bg-[#111827] p-3 md:p-4', selectedInterview?.id === interview.id ? 'border-sky-500/30' : 'border-[#1e293b]')}>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn('rounded-lg p-2 md:p-2.5 shrink-0', colors.bg)}><Calendar className={cn('h-4 w-4 md:h-5 md:w-5', colors.text)} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs md:text-sm font-semibold text-white">{interview.candidateName}</span>
                            <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', colors.bg, colors.text, colors.border)}>{typeLabel(interview.type)}</span>
                            <span className={cn('rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', interview.status === 'scheduled' ? 'bg-sky-500/10 text-sky-400' : interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400')}>
                              {interview.status === 'scheduled' ? '待面试' : interview.status === 'completed' ? '已完成' : '已取消'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-4 text-[11px] md:text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {interview.scheduledAt}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {interview.room}</span>
                            <span className="hidden sm:flex items-center gap-1"><Users className="h-3 w-3" /> {interview.interviewerName}</span>
                            <span className="hidden md:inline">{interview.duration}分钟</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block"><p className="text-xs text-slate-500">{interview.position}</p></div>
                      </div>
                      {selectedInterview?.id === interview.id && interview.aiQuestions && (
                        <div className="mt-3 md:mt-4 border-t border-[#1e293b] pt-3 md:pt-4">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-sky-400" /><span className="text-[11px] md:text-xs font-medium text-sky-400">AI 推荐面试问题</span></div>
                            <button onClick={(e) => { e.stopPropagation(); setShowAIQuestions(!showAIQuestions); }} className="text-xs text-slate-500 hover:text-white">{showAIQuestions ? '收起' : '展开'}</button>
                          </div>
                          <div className="space-y-2">
                            {interview.aiQuestions.map((q, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-lg bg-[#0a0e1a] p-2 md:p-2.5 border border-[#1e293b]">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[10px] font-mono text-sky-400">{i + 1}</span>
                                <p className="text-[11px] md:text-xs text-slate-300">{q}</p>
                              </div>
                            ))}
                          </div>
                          {interview.rating && (
                            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 md:p-3">
                              <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-1">面试评价</p>
                              <p className="text-[11px] md:text-xs text-slate-400">{interview.rating.comment}</p>
                              <div className="mt-2 flex items-center gap-1"><Sparkles className="h-3 w-3 text-sky-400" /><p className="text-[11px] md:text-xs text-sky-400">AI建议：{interview.rating.aiComment}</p></div>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors"><Mail className="h-3.5 w-3.5" /> 发送邀约</button>
                            <button onClick={(e) => { e.stopPropagation(); setAiGenerateTarget({ candidateId: interview.candidateId, candidateName: interview.candidateName, position: interview.position }); setShowAIGenerateModal(true); }} className="flex h-8 items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"><Sparkles className="h-3.5 w-3.5" /> AI生成面试题</button>
                            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors"><Video className="h-3.5 w-3.5" /> 会议链接</button>
                            {interview.status === 'scheduled' && (
                              <>
                                <button onClick={async (e) => { e.stopPropagation(); const token = document.cookie.split('; ').find(r => r.startsWith('auth_token='))?.split('=')[1]; if (!token) return; const res = await fetch(`/api/interviews/${interview.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'completed' }) }); if (res.ok) fetchInterviews(); }} className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"><CheckCircle className="h-3.5 w-3.5" /> 标记完成</button>
                                <button onClick={async (e) => { e.stopPropagation(); if (!confirm('确定要取消这个面试安排吗？')) return; const token = document.cookie.split('; ').find(r => r.startsWith('auth_token='))?.split('=')[1]; if (!token) return; const res = await fetch(`/api/interviews/${interview.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'cancelled' }) }); if (res.ok) fetchInterviews(); }} className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"><XCircle className="h-3.5 w-3.5" /> 取消面试</button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <div><h3 className="text-xs md:text-sm font-semibold text-white">面试官技能匹配</h3><p className="text-[11px] md:text-xs text-slate-500">AI 根据候选人岗位自动推荐最佳面试官</p></div>
              <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 self-start"><Sparkles className="h-3 w-3 text-sky-400" /><span className="text-[10px] md:text-[11px] text-sky-400">智能推荐</span></div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {mockInterviewers.map((interviewer) => (
                <div key={interviewer.id} className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-2.5 md:p-3 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-[10px] md:text-xs font-bold text-sky-400 border border-sky-500/20">{interviewer.avatar}</div>
                    <div><p className="text-xs md:text-sm font-medium text-white">{interviewer.name}</p><p className="text-[10px] text-slate-500">{interviewer.title} · {interviewer.department}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-1">{interviewer.skills.map((skill) => (<span key={skill} className="rounded bg-[#1e293b] px-1.5 py-0.5 text-[10px] text-slate-400">{skill}</span>))}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 md:p-4">
            <div className="flex items-start gap-2.5 md:gap-3">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs md:text-sm font-medium text-amber-400">冲突检测提醒</p>
                <p className="mt-1 text-[11px] md:text-xs text-slate-400">检测到本周三 15:00 陈技术面试官已有其他会议安排，建议将张明远的技术面调整至周四 14:00 或周三 16:00。</p>
                <div className="mt-2 flex gap-2">
                  <button className="flex h-7 items-center gap-1 rounded-md bg-amber-500/10 px-2 md:px-2.5 text-[11px] md:text-xs text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"><Check className="h-3 w-3" /> 接受建议</button>
                  <button className="flex h-7 items-center gap-1 rounded-md border border-[#1e293b] px-2 md:px-2.5 text-[11px] md:text-xs text-slate-400 hover:text-white transition-colors">忽略</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Interview Analysis Tab */}
      {pageTab === 'analysis' && (
        <div className="space-y-4 md:space-y-5">
          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2"><div className="rounded-lg bg-sky-500/10 p-1.5 md:p-2"><Brain className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" /></div></div>
              <p className="font-mono text-xl md:text-2xl font-bold text-white">{completedInterviews.length}</p>
              <p className="text-[11px] md:text-xs text-slate-500">已完成面试</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2"><div className="rounded-lg bg-emerald-500/10 p-1.5 md:p-2"><Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" /></div></div>
              <p className="font-mono text-xl md:text-2xl font-bold text-white">{avgScore}</p>
              <p className="text-[11px] md:text-xs text-slate-500">平均评分</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2"><div className="rounded-lg bg-violet-500/10 p-1.5 md:p-2"><Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-400" /></div></div>
              <p className="font-mono text-xl md:text-2xl font-bold text-white">85%</p>
              <p className="text-[11px] md:text-xs text-slate-500">面试通过率</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2"><div className="rounded-lg bg-orange-500/10 p-1.5 md:p-2"><TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-400" /></div></div>
              <p className="font-mono text-xl md:text-2xl font-bold text-white">4.2天</p>
              <p className="text-[11px] md:text-xs text-slate-500">平均面试周期</p>
            </div>
          </div>

          {/* Analysis Sub-tabs */}
          <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto">
            {analysisTabs.map((tab) => { const Icon = tab.icon; return (
              <button key={tab.id} onClick={() => setAnalysisTab(tab.id)} className={cn('relative flex shrink-0 items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs md:text-sm transition-colors whitespace-nowrap', analysisTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300')}>
                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />{tab.label}
                {analysisTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"></div>}
              </button>
            );})}
          </div>

          {/* Overview Tab */}
          {analysisTab === 'overview' && (
            <div className="space-y-4 md:space-y-5">
              <div className="grid gap-2.5 md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completedInterviews.map((interview) => {
                  if (!interview.rating) return null;
                  return (
                    <div key={interview.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-[10px] md:text-xs font-bold text-sky-400 border border-sky-500/20">{interview.candidateName.charAt(0)}</div>
                          <div><p className="text-xs md:text-sm font-semibold text-white">{interview.candidateName}</p><p className="text-[10px] md:text-[11px] text-slate-500">{interview.position}</p></div>
                        </div>
                        <span className={cn('rounded-full border px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px]', typeColor(interview.type).bg, typeColor(interview.type).text, typeColor(interview.type).border)}>{typeLabel(interview.type)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-xl font-mono text-lg md:text-2xl font-bold border shrink-0', (interview.rating.overall ?? 0) >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (interview.rating.overall ?? 0) >= 70 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>{interview.rating.overall}</div>
                        <div className="flex-1 space-y-1 min-w-0">
                          {Object.entries(interview.rating).filter(([k]) => !['overall','comment','aiComment'].includes(k)).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1.5 md:gap-2">
                              <span className="text-[9px] md:text-[10px] text-slate-500 w-10 md:w-14 shrink-0">{dimensionLabels[key]}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-[#0a0e1a] overflow-hidden"><div className={cn('h-full rounded-full transition-all', (value as number) >= 9 ? 'bg-emerald-500' : (value as number) >= 7 ? 'bg-sky-500' : 'bg-amber-500')} style={{ width: `${(value as number) * 10}%` }}></div></div>
                              <span className="text-[9px] md:text-[10px] font-mono text-slate-400 w-4 text-right">{value as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {completedInterviews.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无面试评价数据</p>
                  <p className="text-xs mt-1">通过 Excel 上传面试分析数据后，评价结果将在此展示</p>
                </div>
              )}
            </div>
          )}

          {/* Compare Tab */}
          {analysisTab === 'compare' && (
            <div className="space-y-4 md:space-y-5">
              {completedInterviews.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无对比数据</p>
                  <p className="text-xs mt-1">需要至少2份面试评价才能进行多维对比</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-xl border border-[#1e293b] bg-[#111827] p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">候选人多维对比</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#1e293b]">
                            <th className="pb-3 text-left text-slate-500 font-medium">评估维度</th>
                            {completedInterviews.map((i) => (<th key={i.id} className="pb-3 text-center text-white font-medium">{i.candidateName}</th>))}
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
                                      <div className="h-1.5 w-16 rounded-full bg-[#0a0e1a] overflow-hidden"><div className={cn('h-full rounded-full', val >= 9 ? 'bg-emerald-500' : val >= 7 ? 'bg-sky-500' : 'bg-amber-500')} style={{ width: `${val * 10}%` }}></div></div>
                                      <span className="font-mono text-white w-4">{val}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr><td className="pt-3 text-slate-400 font-medium">综合评分</td>{completedInterviews.map((i) => (<td key={i.id} className="pt-3 text-center"><span className={cn('font-mono text-lg font-bold', (i.rating?.overall ?? 0) >= 85 ? 'text-emerald-400' : (i.rating?.overall ?? 0) >= 70 ? 'text-sky-400' : 'text-amber-400')}>{i.rating?.overall}</span></td>))}</tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent p-3 md:p-5">
                    <div className="flex items-center gap-2 mb-3"><Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-400" /><h3 className="text-xs md:text-sm font-semibold text-sky-400">AI 对比分析</h3></div>
                    <div className="space-y-2.5 md:space-y-3 text-[11px] md:text-xs text-slate-300 leading-relaxed">
                      {completedInterviews.length > 0 ? (
                        <>
                          <p><span className="text-white font-medium">{completedInterviews[0]?.candidateName}</span>在专业技能方面表现突出，综合评分{completedInterviews[0]?.rating?.overall}分，展现了资深工程师的水准。</p>
                          {completedInterviews.length > 1 && <p><span className="text-white font-medium">{completedInterviews[1]?.candidateName}</span>沟通能力和学习能力评分较高，展现出很强的成长潜力。</p>}
                        </>
                      ) : <p>暂无数据进行分析</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Questions Tab */}
          {analysisTab === 'questions' && (
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div><h3 className="text-xs md:text-sm font-semibold text-white">AI 面试问题推荐</h3><p className="mt-0.5 text-[11px] md:text-xs text-slate-500">基于岗位JD和候选人背景智能生成</p></div>
                <button onClick={handleGenerateQuestions} disabled={isGenerating} className={cn('flex h-9 items-center gap-2 rounded-lg px-3 md:px-4 text-xs md:text-sm font-medium transition-colors self-start', isGenerating ? 'bg-orange-500/10 text-orange-400' : 'bg-sky-500 text-white hover:bg-sky-600')}>
                  {isGenerating ? (<><div className="h-3.5 w-3.5 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin"></div>生成中...</>) : (<><Sparkles className="h-3.5 w-3.5" /> 生成问题</>)}
                </button>
              </div>
              {generatedQuestions.length > 0 ? (
                <div className="space-y-2.5 md:space-y-3">
                  {generatedQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5 md:gap-3 rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 md:p-4">
                      <span className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[10px] md:text-xs font-mono text-sky-400 border border-sky-500/20">{i + 1}</span>
                      <div className="flex-1"><p className="text-xs md:text-sm text-slate-200">{q}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center px-4">
                  <div className="rounded-full bg-sky-500/10 p-3 md:p-4 mb-3 md:mb-4"><Lightbulb className="h-6 w-6 md:h-8 md:w-8 text-sky-400" /></div>
                  <p className="text-xs md:text-sm text-slate-400">点击「生成问题」按钮，AI 将根据岗位和候选人信息智能推荐面试问题</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Interview Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建面试安排" size="md">
        <div className="space-y-4">
          {loadingOptions ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /><span className="ml-2 text-sm text-slate-400">加载选项...</span></div>
          ) : (
            <>
              <div><label className="block text-xs font-medium text-slate-400 mb-1.5">候选人 *</label>
                <select value={formData.candidateId} onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
                  <option value="">选择候选人</option>{candidates.length === 0 ? (<option value="" disabled>暂无已筛选的候选人，请先在简历管理中筛选候选人</option>) : candidates.map((c) => (<option key={c.id} value={c.id}>{c.name} - {c.appliedPosition}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试官 *</label>
                <select value={formData.interviewerId} onChange={(e) => setFormData({ ...formData, interviewerId: e.target.value })} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
                  <option value="">选择面试官</option>{interviewers.length === 0 ? (<option value="" disabled>暂无面试官，请先在用户管理中添加</option>) : interviewers.map((i) => (<option key={i.id} value={i.id}>{i.name} - {i.department}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试方式 *</label>
                <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
                  <option value="">选择面试方式</option>{interviewMethods.map((m) => (<option key={m.id} value={m.name}>{m.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试类型</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
                    <option value="first">初面</option><option value="technical">技术面</option><option value="hr">HR面</option><option value="final">终面</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-slate-400 mb-1.5">时长（分钟）</label>
                  <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试日期 *</label>
                  <input type="date" lang="zh-CN" value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''} onChange={(e) => { const date = e.target.value; const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1]?.slice(0, 5) || '10:00' : '10:00'; setFormData({ ...formData, scheduledAt: `${date}T${time}` }); }} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none [color-scheme:dark]" />
                </div>
                <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试时间 *</label>
                  <input type="time" lang="zh-CN" value={formData.scheduledAt ? formData.scheduledAt.split('T')[1]?.slice(0, 5) || '' : ''} onChange={(e) => { const time = e.target.value; const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0]; setFormData({ ...formData, scheduledAt: `${date}T${time}` }); }} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1.5">面试地点/链接</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="如：3楼会议室A / 腾讯会议链接" className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none" />
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1.5">备注</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="面试注意事项、特殊要求等" rows={3} className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none resize-none" />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4 border-t border-[#1e293b]">
            <button onClick={() => setShowCreateModal(false)} className="flex-1 rounded-lg border border-[#1e293b] px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#1a2236] transition-colors">取消</button>
            <button onClick={handleCreateInterview} disabled={isSubmitting || loadingOptions} className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> 创建中...</>) : '创建面试'}
            </button>
          </div>
        </div>
      </Modal>

      {aiGenerateTarget && (
        <AIInterviewQuestionsModal isOpen={showAIGenerateModal} onClose={() => { setShowAIGenerateModal(false); setAiGenerateTarget(null); }} candidateId={aiGenerateTarget.candidateId} candidateName={aiGenerateTarget.candidateName} position={aiGenerateTarget.position} />
      )}
    </div>
  );
}
