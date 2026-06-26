'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  RotateCcw,
  DollarSign,
  UserCheck,
  UserX,
  Bot,
  Brain,
  AlertTriangle,
  SkipForward,
  Copy,
  GitBranch,
  CheckCircle,
  Mail,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCandidates, type Candidate } from '@/lib/mock-data';
import { Modal } from '@/components/ui/modal';
import { ResumePreviewModal } from '@/components/resume-preview-modal';
import { CandidateDetailModal } from '@/components/candidate-detail-modal';
import { AICandidateProfile } from '@/components/ai-candidate-profile';
import { PipelineTracker } from '@/components/pipeline-tracker';
import { EmailImport } from '@/components/email-import';

type CandidateStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
type TabType = 'all' | CandidateStatus;

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<{
    name: string; avatar: string; position: string; education: string;
    school: string; experience: number; company: string; matchScore: number;
    summary: string; matchedSkills: string[]; uncertainSkills: string[];
    phone?: string; email?: string; resumeFileKey?: string;
  } | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectOfferModal, setShowRejectOfferModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [candidates, setCandidates] = useState(mockCandidates);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [resumePreviewData, setResumePreviewData] = useState<{ id: string; name: string; position?: string; resumeUrl?: string } | null>(null);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Record<string, unknown> | null>(null);

  // AI features state
  const [showAIProfileModal, setShowAIProfileModal] = useState(false);
  const [aiProfileCandidate, setAiProfileCandidate] = useState<{ id: string; name: string; position?: string } | null>(null);

  // Multi-select & batch add to candidate pool
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchPoolModal, setShowBatchPoolModal] = useState(false);
  const [batchPoolForm, setBatchPoolForm] = useState({ status: 'active', skillTags: '', notes: '' });
  const [batchPoolLoading, setBatchPoolLoading] = useState(false);

  // Duplicate detection state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    duplicates: { id: string; name: string; email?: string; phone?: string; duplicateFields: string[] }[];
    pendingFile: File | null;
  } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Interview scheduling state
  const [interviewers, setInterviewers] = useState<{ id: string; name: string; department?: string }[]>([]);
  const [interviewMethods, setInterviewMethods] = useState<{ id: string; name: string }[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    interviewerId: '',
    methodId: '',
    type: 'first',
    date: '',
    time: '',
    duration: 60,
    location: '',
    notes: '',
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch candidates from database on mount
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch('/api/candidates');
        const data = await res.json();
        if (data.code === 0 && data.data?.candidates && data.data.candidates.length > 0) {
          // Transform database candidates to match UI format
          const transformed = data.data.candidates.map((c: Record<string, unknown>) => {
            // Parse JSON fields safely
            const parseJsonArray = (val: unknown): string[] => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string' && val) {
                try { return JSON.parse(val); } catch { return []; }
              }
              return [];
            };
            const parseWorkHistory = (val: unknown): { company: string; position: string; duration: string }[] => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string' && val) {
                try { return JSON.parse(val); } catch { return []; }
              }
              return [];
            };

            const skills = parseJsonArray(c.skills);
            const tags = parseJsonArray(c.tags);
            const workHistory = parseWorkHistory(c.workHistory);
            const experience = typeof c.experience === 'number' ? c.experience : 0;

            return {
              id: c.id as string,
              name: (c.name as string) || '未知候选人',
              avatar: ((c.name as string) || '未').charAt(0),
              email: (c.email as string) || '',
              phone: (c.phone as string) || '',
              gender: (c.gender as string) || 'male',
              age: 25 + experience,
              education: (c.education as string) || '未知',
              school: (c.school as string) || '',
              major: (c.major as string) || '',
              experience,
              currentCompany: (c.currentCompany as string) || '',
              currentPosition: (c.currentPosition as string) || '',
              skills,
              location: (c.location as string) || '',
              expectedSalary: (c.expectedSalary as string) || '',
              status: (c.status as CandidateStatus) || 'new',
              matchScore: typeof c.matchScore === 'number' ? c.matchScore : 75,
              source: (c.source as string) || 'channel',
              appliedPosition: (c.appliedPosition as string) || '',
              department: (c.department as string) || '',
              aiSummary: (c.aiSummary as string) || '',
              tags,
              workHistory,
              appliedAt: (c.createdAt as string)?.split('T')[0] || new Date().toISOString().split('T')[0],
            };
          });
          setCandidates(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      }
    };
    fetchCandidates();
  }, []);

  // Compute dynamic tab counts from candidates state
  const tabCounts = {
    all: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    screening: candidates.filter(c => c.status === 'screening').length,
    interview: candidates.filter(c => c.status === 'interview').length,
    offer: candidates.filter(c => c.status === 'offer').length,
    hired: candidates.filter(c => c.status === 'hired').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: tabCounts.all },
    { id: 'new', label: '新简历', count: tabCounts.new },
    { id: 'screening', label: '筛选中', count: tabCounts.screening },
    { id: 'interview', label: '面试中', count: tabCounts.interview },
    { id: 'offer', label: '待Offer', count: tabCounts.offer },
    { id: 'hired', label: '已入职', count: tabCounts.hired },
  ];

  // Upload file to AI parse API and return parsed result
  const uploadAndParse = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/candidates/parse-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setParsedResult(data.data);
      } else {
        alert('简历解析失败：' + (data.message || '未知错误'));
      }
    } catch (err) {
      console.error('Parse error:', err);
      alert('简历解析失败，请检查网络后重试');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsUploading(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadAndParse(file);
    }
  }, [uploadAndParse]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for duplicates first
    setCheckingDuplicate(true);
    try {
      const fileName = file.name.replace(/\.(pdf|doc|docx|png|jpg|jpeg)$/i, '');
      const res = await fetch('/api/candidates/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.isDuplicate && data.data.duplicates?.length > 0) {
        setDuplicateInfo({
          isDuplicate: true,
          duplicates: data.data.duplicates,
          pendingFile: file,
        });
        setCheckingDuplicate(false);
        return;
      }
    } catch {
      // If check fails, proceed with upload
    }
    setCheckingDuplicate(false);

    // No duplicate found, proceed with parsing
    uploadAndParse(file);
  }, [uploadAndParse]);

  // Handle duplicate resolution
  const handleDuplicateAction = useCallback((action: 'skip' | 'overwrite' | 'keep') => {
    if (action === 'skip') {
      setDuplicateInfo(null);
      return;
    }
    // For overwrite or keep, proceed with parsing
    const file = duplicateInfo?.pendingFile;
    setDuplicateInfo(null);
    if (file) {
      uploadAndParse(file);
    }
  }, [duplicateInfo?.pendingFile, uploadAndParse]);

  const handlePassScreen = useCallback(async (candidateId: string, candidateName: string) => {
    setActionLoading(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pass_screening' }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c => 
          c.id === candidateId ? { ...c, status: 'screening' as const } : c
        ));
        alert(`已通过 ${candidateName} 的筛选`);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Toggle candidate selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const filtered = candidates.filter(c => {
      if (activeTab !== 'all' && c.status !== activeTab) return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.position?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  }, [candidates, activeTab, searchQuery, selectedIds.size]);

  // Batch add to candidate pool
  const handleBatchAddToPool = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBatchPoolLoading(true);
    try {
      const res = await fetch('/api/candidate-pool/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: Array.from(selectedIds),
          status: batchPoolForm.status,
          skillTags: batchPoolForm.skillTags.split(',').map(s => s.trim()).filter(Boolean),
          notes: batchPoolForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        alert(`成功将 ${selectedIds.size} 位候选人添加到候选人池`);
        setSelectedIds(new Set());
        setShowBatchPoolModal(false);
        setBatchPoolForm({ status: 'active', skillTags: '', notes: '' });
      } else {
        alert(data.message || '批量添加失败');
      }
    } catch (e) {
      alert('批量添加失败，请重试');
    } finally {
      setBatchPoolLoading(false);
    }
  }, [selectedIds, batchPoolForm]);

  const handleScheduleInterview = useCallback(async (candidateId: string, candidateName: string) => {
    setSelectedCandidate(candidateId);
    setShowScheduleModal(true);
    
    // Fetch interviewers and interview methods
    try {
      const [interviewersRes, methodsRes] = await Promise.all([
        fetch('/api/users?role=interviewer'),
        fetch('/api/system/interview-methods'),
      ]);
      
      if (interviewersRes.ok) {
        const interviewersData = await interviewersRes.json();
        const users = Array.isArray(interviewersData?.data) 
          ? interviewersData.data 
          : Array.isArray(interviewersData?.data?.users) 
            ? interviewersData.data.users 
            : [];
        setInterviewers(users.map((u: { id: string; name: string; department?: string }) => ({ 
          id: u.id, 
          name: u.name, 
          department: u.department 
        })));
      }
      
      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        const methods = Array.isArray(methodsData?.data) ? methodsData.data : [];
        setInterviewMethods(methods.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      }
    } catch (error) {
      console.error('Failed to fetch interview data:', error);
    }
    
    // Reset form
    setScheduleForm({
      interviewerId: '',
      methodId: '',
      type: 'first',
      date: '',
      time: '',
      duration: 60,
      location: '',
      notes: '',
    });
  }, []);

  // Submit schedule interview - creates interview record and updates candidate status
  const handleSubmitSchedule = useCallback(async () => {
    if (!selectedCandidate) return;
    
    const candidate = candidates.find(c => c.id === selectedCandidate);
    if (!candidate) return;
    
    // Validate form
    if (!scheduleForm.interviewerId) {
      alert('请选择面试官');
      return;
    }
    if (!scheduleForm.methodId) {
      alert('请选择面试方式');
      return;
    }
    if (!scheduleForm.date || !scheduleForm.time) {
      alert('请选择面试日期和时间');
      return;
    }
    
    setScheduleLoading(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();
      
      // Create interview record
      const interviewRes = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          candidateName: candidate.name,
          candidatePosition: candidate.position,
          interviewerId: scheduleForm.interviewerId,
          type: scheduleForm.type,
          method: scheduleForm.methodId,
          scheduledAt,
          duration: scheduleForm.duration,
          location: scheduleForm.location,
          notes: scheduleForm.notes,
        }),
      });
      
      if (!interviewRes.ok) {
        const errorData = await interviewRes.json();
        throw new Error(errorData.message || '创建面试失败');
      }
      
      // Update candidate status to 'interview'
      const candidateRes = await fetch(`/api/candidates/${selectedCandidate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'interview' }),
      });
      
      if (!candidateRes.ok) {
        console.warn('Failed to update candidate status, but interview was created');
      }
      
      // Update local state
      setCandidates(prev => prev.map(c =>
        c.id === selectedCandidate ? { ...c, status: 'interview' as const } : c
      ));
      
      setShowScheduleModal(false);
      alert(`已为 ${candidate.name} 安排面试`);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      alert(error instanceof Error ? error.message : '安排面试失败，请重试');
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedCandidate, candidates, scheduleForm]);

  const handleReject = useCallback(async (candidateId: string, candidateName: string) => {
    if (!confirm(`确定要淘汰 ${candidateName} 吗？`)) return;
    setActionLoading(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: '不符合要求' }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c => 
          c.id === candidateId ? { ...c, status: 'rejected' as const } : c
        ));
        alert(`已淘汰 ${candidateName}`);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // 通过面试 → 发Offer（打开Offer模态框）
  const handlePassInterview = useCallback((candidateId: string) => {
    setSelectedCandidate(candidateId);
    setShowOfferModal(true);
  }, []);

  // 确认发Offer → 状态变为"待Offer"
  const handleConfirmOffer = useCallback(async () => {
    if (!selectedCandidate) return;
    setActionLoading(selectedCandidate);
    try {
      const res = await fetch(`/api/candidates/${selectedCandidate}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_offer' }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c =>
          c.id === selectedCandidate ? { ...c, status: 'offer' as const } : c
        ));
        const candidate = candidates.find(c => c.id === selectedCandidate);
        alert(`已向 ${candidate?.name || '候选人'} 发送Offer`);
        setShowOfferModal(false);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [selectedCandidate, candidates]);

  // 接受Offer → 状态变为"已入职" → 自动创建合同
  const handleAcceptOffer = useCallback(async (candidateId: string, candidateName: string) => {
    if (!confirm(`确认 ${candidateName} 已接受Offer并办理入职？\n\n系统将自动创建合同记录。`)) return;
    setActionLoading(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_offer' }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c =>
          c.id === candidateId ? { ...c, status: 'hired' as const } : c
        ));
        if (data.data?.contractId) {
          const contractId = data.data.contractId;
          if (confirm(`✅ ${candidateName} 已入职！\n\n已自动创建合同记录（编号：${contractId?.slice(-8) || 'N/A'}）。\n\n点击"确定"跳转到合同管理查看。`)) {
            window.location.href = '/contracts';
          }
        } else {
          alert(`${candidateName} 已入职！`);
        }
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // 拒绝Offer → 打开拒绝原因模态框
  const handleRejectOffer = useCallback((candidateId: string) => {
    setSelectedCandidate(candidateId);
    setShowRejectOfferModal(true);
  }, []);

  // 确认拒绝Offer → 状态变为"已淘汰"
  const handleConfirmRejectOffer = useCallback(async (reason: string) => {
    if (!selectedCandidate) return;
    setActionLoading(selectedCandidate);
    try {
      const res = await fetch(`/api/candidates/${selectedCandidate}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_offer', reason }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c =>
          c.id === selectedCandidate ? { ...c, status: 'rejected' as const } : c
        ));
        const candidate = candidates.find(c => c.id === selectedCandidate);
        alert(`${candidate?.name || '候选人'} 已拒绝Offer`);
        setShowRejectOfferModal(false);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [selectedCandidate, candidates]);

  // 重新激活 → 状态回到"筛选中"
  const handleReactivate = useCallback(async (candidateId: string, candidateName: string) => {
    if (!confirm(`确定要重新激活 ${candidateName} 的招聘流程吗？`)) return;
    setActionLoading(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.map(c =>
          c.id === candidateId ? { ...c, status: 'screening' as const } : c
        ));
        alert(`${candidateName} 已重新激活`);
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDeleteCandidate = useCallback(async (candidateId: string, candidateName: string) => {
    if (!confirm(`确定要删除 ${candidateName} 的简历吗？此操作不可撤销。`)) return;
    setActionLoading(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('删除失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Filter candidates based on active tab
  const filteredCandidates = candidates.filter(candidate => {
    if (activeTab === 'all') return true;
    return candidate.status === activeTab;
  });

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">简历管理</h1>
        <p className="mt-0.5 text-xs text-slate-500">AI 智能解析简历，自动评估候选人匹配度</p>
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

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
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#111827] px-2.5 text-sm text-slate-400 hover:text-white transition-colors sm:px-3"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">筛选</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCollectionModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 text-sm text-orange-400 hover:bg-orange-500/20 transition-colors sm:px-3"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">简历采集</span>
            <span className="sm:hidden">采集</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#111827] px-2.5 text-sm text-slate-400 hover:text-white transition-colors sm:px-3"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">批量导入</span>
            <span className="sm:hidden">导入</span>
          </button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-orange-400">已选择 {selectedIds.size} 位候选人</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              取消选择
            </button>
          </div>
          <button
            onClick={() => setShowBatchPoolModal(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            添加到候选人池
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsUploading(true); }}
        onDragLeave={() => setIsUploading(false)}
        onDrop={handleDrop}
        onClick={handleFileSelect}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
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
                  <span className="truncate">{parsedResult.company || '暂无工作经历'}</span>
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
                  {parsedResult.summary}
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
                    {parsedResult.uncertainSkills.map((s) => (
                      <span key={s} className="rounded-md bg-amber-500/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-amber-400 border border-amber-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!parsedResult) return;
                    try {
                      const res = await fetch('/api/candidates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: parsedResult.name,
                          email: parsedResult.email || '',
                          phone: parsedResult.phone || '',
                          education: parsedResult.education,
                          school: parsedResult.school,
                          experience: parsedResult.experience,
                          skills: parsedResult.matchedSkills,
                          appliedPosition: parsedResult.position,
                          matchScore: parsedResult.matchScore,
                          resumeFileKey: parsedResult.resumeFileKey || '',
                          resumeParsed: parsedResult,
                          source: 'ai',
                        }),
                      });
                      const data = await res.json();
                      if (data.code === 0) {
                        // Add to local candidates list
                        const newCandidate: Candidate = {
                          id: data.data.id,
                          name: parsedResult.name,
                          position: parsedResult.position,
                          status: 'new' as const,
                          appliedAt: new Date().toISOString().split('T')[0],
                          avatar: parsedResult.name.charAt(0),
                          avatarColor: 'bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 border border-sky-500/20',
                          matchScore: parsedResult.matchScore,
                          isAIRecommended: true,
                          skills: parsedResult.matchedSkills || [],
                          email: parsedResult.email || '',
                          phone: parsedResult.phone || '',
                          education: parsedResult.education || '',
                          school: parsedResult.school || '',
                          major: '',
                          department: '',
                          experience: typeof parsedResult.experience === 'number' ? parsedResult.experience : 0,
                          company: parsedResult.company,
                          resumeFileKey: parsedResult.resumeFileKey,
                          resumeParsed: parsedResult,
                          matchedSkills: parsedResult.matchedSkills || [],
                          unmatchedSkills: parsedResult.uncertainSkills || [],
                          workHistory: [],
                          source: 'ai',
                          tags: [],
                        };
                        setCandidates(prev => [newCandidate, ...prev]);
                        setParsedResult(null);
                      } else {
                        alert(data.message || '添加失败');
                      }
                    } catch {
                      alert('添加候选人失败，请重试');
                    }
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" /> 加入候选人池
                </button>
                <button
                  onClick={() => {
                    if (!parsedResult) return;
                    setDetailCandidate({
                      name: parsedResult.name,
                      email: parsedResult.email,
                      phone: parsedResult.phone,
                      education: parsedResult.education,
                      school: parsedResult.school,
                      experience: parsedResult.experience,
                      currentCompany: parsedResult.company,
                      currentPosition: parsedResult.position,
                      matchScore: parsedResult.matchScore,
                      aiSummary: parsedResult.summary,
                      resumeFileKey: parsedResult.resumeFileKey,
                      resumeParsed: parsedResult,
                      status: 'new',
                      source: 'ai',
                    });
                    setShowDetailModal(true);
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors"
                >
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
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center py-12 text-slate-500">
            <FileText className="h-10 w-10 mb-3 text-slate-700" />
            <p className="text-sm">暂无该状态的候选人</p>
          </div>
        ) : (
        filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="card-hover rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden relative"
          >
            {/* Pipeline Progress Bar */}
            <div className="flex h-1">
              {['new', 'screening', 'interview', 'offer', 'hired'].map((stage) => {
                const stageIndex = ['new', 'screening', 'interview', 'offer', 'hired'].indexOf(stage);
                const currentIndex = ['new', 'screening', 'interview', 'offer', 'hired'].indexOf(candidate.status);
                const isCompleted = stageIndex < currentIndex;
                const isCurrent = stageIndex === currentIndex;
                const isRejected = candidate.status === 'rejected';
                return (
                  <div
                    key={stage}
                    className={cn(
                      'flex-1 transition-all duration-500',
                      isRejected ? 'bg-red-500/30' :
                      isCompleted ? 'bg-emerald-500' :
                      isCurrent ? 'bg-sky-400' :
                      'bg-[#1e293b]'
                    )}
                  />
                );
              })}
            </div>
            {/* Selection checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(candidate.id); }}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                  selectedIds.has(candidate.id)
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-[#334155] bg-transparent hover:border-slate-400'
                )}
              >
                {selectedIds.has(candidate.id) && <Check className="h-3 w-3" />}
              </button>
            </div>
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
                      candidate.status === 'hired' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    )}>
                      {candidate.status === 'new' ? '新投递' : candidate.status === 'screening' ? '筛选中' :
                       candidate.status === 'interview' ? '面试中' : candidate.status === 'offer' ? '待Offer' :
                       candidate.status === 'hired' ? '已入职' : '已淘汰'}
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
                {(candidate.skills || []).slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded-md bg-[#0a0e1a] px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-slate-400 border border-[#1e293b]">
                    {skill}
                  </span>
                ))}
                {(candidate.skills || []).length > 4 && (
                  <span className="rounded-md bg-[#0a0e1a] px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-slate-500">
                    +{(candidate.skills || []).length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedCandidate === candidate.id && (
              <div className="border-t border-[#1e293b] bg-[#0a0e1a]/50 p-3 md:p-4 space-y-3">
                {/* 流程追踪区域 - 使用 PipelineTracker 组件 */}
                <PipelineTracker 
                  currentStatus={candidate.status} 
                  candidateId={candidate.id}
                  candidateName={candidate.name}
                />
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1">AI 评估摘要</p>
                  <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">{candidate.aiSummary}</p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1.5">工作经历</p>
                  <div className="space-y-2">
                    {(candidate.workHistory || []).map((work, i) => (
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
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* 查看简历按钮 */}
                  <button
                    onClick={() => {
                      setResumePreviewData({
                        id: candidate.id,
                        name: candidate.name,
                        position: candidate.position,
                        resumeUrl: candidate.resumeUrl,
                      });
                      setShowResumePreview(true);
                    }}
                    className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-sky-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-sky-400 hover:bg-sky-500/10 cursor-pointer transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    {candidate.resumeUrl ? '查看简历' : '上传简历'}
                  </button>
                  {/* AI画像按钮 */}
                  <button
                    onClick={() => {
                      setAiProfileCandidate({
                        id: candidate.id,
                        name: candidate.name,
                        position: candidate.position,
                      });
                      setShowAIProfileModal(true);
                    }}
                    className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-orange-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-orange-400 hover:bg-orange-500/10 cursor-pointer transition-colors"
                  >
                    <Brain className="h-3 w-3" />
                    AI画像
                  </button>

                  {/* 新简历 → 通过筛选、淘汰 */}
                  {candidate.status === 'new' && (
                    <>
                      <button
                        onClick={() => handlePassScreen(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg bg-sky-500 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {actionLoading === candidate.id ? (
                          <><div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 处理中...</>
                        ) : (
                          <><Check className="h-3 w-3" /> 通过筛选</>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <X className="h-3 w-3" /> 淘汰
                      </button>
                    </>
                  )}

                  {/* 筛选中 → 安排面试、淘汰 */}
                  {candidate.status === 'screening' && (
                    <>
                      <button
                        onClick={() => handleScheduleInterview(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg bg-violet-500 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {actionLoading === candidate.id ? (
                          <><div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 处理中...</>
                        ) : (
                          <><Calendar className="h-3 w-3" /> 安排面试</>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <X className="h-3 w-3" /> 淘汰
                      </button>
                    </>
                  )}

                  {/* 面试中 → 通过面试（发Offer）、淘汰 */}
                  {candidate.status === 'interview' && (
                    <>
                      <button
                        onClick={() => handlePassInterview(candidate.id)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {actionLoading === candidate.id ? (
                          <><div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 处理中...</>
                        ) : (
                          <><DollarSign className="h-3 w-3" /> 通过面试（发Offer）</>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <X className="h-3 w-3" /> 淘汰
                      </button>
                    </>
                  )}

                  {/* 待Offer → 接受Offer入职、拒绝Offer */}
                  {candidate.status === 'offer' && (
                    <>
                      <button
                        onClick={() => handleAcceptOffer(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg bg-emerald-500 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {actionLoading === candidate.id ? (
                          <><div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 处理中...</>
                        ) : (
                          <><UserCheck className="h-3 w-3" /> 接受Offer（入职）</>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectOffer(candidate.id)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <UserX className="h-3 w-3" /> 拒绝Offer
                      </button>
                    </>
                  )}

                  {/* 已入职 → 查看详情（无操作按钮） */}
                  {candidate.status === 'hired' && (
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      <span>已入职，流程完成</span>
                    </div>
                  )}

                  {/* 已淘汰 → 重新激活 */}
                  {candidate.status === 'rejected' && (
                    <button
                      onClick={() => handleReactivate(candidate.id, candidate.name)}
                      disabled={actionLoading === candidate.id}
                      className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-sky-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-sky-400 hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {actionLoading === candidate.id ? (
                        <><div className="h-3 w-3 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" /> 处理中...</>
                      ) : (
                        <><RotateCcw className="h-3 w-3" /> 重新激活</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#0a0e1a]/30 px-3 md:px-4 py-2">
              <button
                onClick={() => {
                  setDetailCandidate({
                    id: candidate.id,
                    name: candidate.name,
                    email: candidate.email,
                    phone: candidate.phone,
                    education: candidate.education,
                    school: candidate.school,
                    experience: candidate.experience,
                    currentCompany: candidate.company,
                    currentPosition: candidate.position,
                    matchScore: candidate.matchScore,
                    aiSummary: candidate.aiSummary,
                    skills: candidate.skills,
                    resumeFileKey: candidate.resumeFileKey,
                    resumeParsed: candidate.resumeParsed,
                    status: candidate.status,
                    source: candidate.source || 'manual',
                    tags: candidate.tags,
                    appliedPosition: candidate.position,
                  });
                  setShowDetailModal(true);
                }}
                className="text-[11px] md:text-xs text-slate-500 hover:text-sky-400 cursor-pointer transition-colors"
              >
                {expandedCandidate === candidate.id ? '收起详情' : '展开详情'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCandidate(candidate.id, candidate.name);
                }}
                disabled={actionLoading === candidate.id}
                className="text-[11px] md:text-xs text-slate-600 hover:text-red-400 cursor-pointer transition-colors disabled:opacity-50"
                title="删除简历"
              >
                {actionLoading === candidate.id ? (
                  <><div className="h-3 w-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin inline-block" /></>
                ) : (
                  <Trash2 className="h-3 w-3 inline" />
                )}
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
        )))
        }
      </div>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="筛选条件">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">目标岗位</label>
            <select className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none">
              <option value="">全部岗位</option>
              <option value="frontend">前端开发工程师</option>
              <option value="backend">后端开发工程师</option>
              <option value="fullstack">全栈开发工程师</option>
              <option value="product">产品经理</option>
              <option value="designer">UI/UX 设计师</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">候选人状态</label>
            <select className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none">
              <option value="">全部状态</option>
              <option value="new">新简历</option>
              <option value="screening">筛选中</option>
              <option value="interview">面试中</option>
              <option value="offer">待Offer</option>
              <option value="hired">已入职</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">最低匹配度</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" defaultValue="0" className="flex-1 accent-sky-500" />
              <span className="text-xs text-slate-400 font-mono w-8">0%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">关键技能</label>
            <input type="text" placeholder="输入技能关键词，如 React、Node.js" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">投递时间</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" />
              <input type="date" className="h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowFilterModal(false)} className="flex-1 h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors">
              应用筛选
            </button>
            <button onClick={() => setShowFilterModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              重置
            </button>
          </div>
        </div>
      </Modal>

      {/* Resume Collection Modal */}
      <Modal isOpen={showCollectionModal} onClose={() => setShowCollectionModal(false)} title="简历采集" size="lg">
        <div className="space-y-2">
          <p className="text-xs text-slate-500">从邮箱拖拽邮件或粘贴简历内容，AI 自动提取候选人信息</p>
          <EmailImport />
        </div>
      </Modal>

      {/* Batch Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="批量导入简历">
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            className="rounded-xl border-2 border-dashed border-[#1e293b] bg-[#0a0e1a]/50 p-6 text-center hover:border-slate-600 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-400">拖拽文件到此处，或 <span className="text-sky-400">点击选择文件</span></p>
            <p className="mt-1 text-xs text-slate-600">支持 PDF、Word 格式，单次最多 20 个文件</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">导入到岗位</label>
            <select className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none">
              <option value="">选择目标岗位</option>
              <option value="frontend">前端开发工程师</option>
              <option value="backend">后端开发工程师</option>
              <option value="fullstack">全栈开发工程师</option>
              <option value="product">产品经理</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 p-3">
            <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
            <p className="text-xs text-sky-400">导入后将自动进行 AI 解析和匹配度评估</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowImportModal(false)} className="flex-1 h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors">
              开始导入
            </button>
            <button onClick={() => setShowImportModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="安排面试">
        <div className="space-y-4">
          {/* Candidate Info */}
          {(() => {
            const candidate = candidates.find(c => c.id === selectedCandidate);
            return candidate ? (
              <div className="flex items-center gap-3 rounded-lg bg-sky-500/5 border border-sky-500/20 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-xs font-bold text-sky-400">
                  {candidate.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{candidate.name}</p>
                  <p className="text-xs text-slate-500">{candidate.position}</p>
                </div>
              </div>
            ) : null;
          })()}
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">面试轮次</label>
            <select 
              value={scheduleForm.type}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
            >
              <option value="first">初面</option>
              <option value="second">复面</option>
              <option value="final">终面</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">面试官 *</label>
            <select 
              value={scheduleForm.interviewerId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewerId: e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
            >
              <option value="">请选择面试官</option>
              {interviewers.map(i => (
                <option key={i.id} value={i.id}>{i.name}{i.department ? ` - ${i.department}` : ''}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">面试方式 *</label>
            <select 
              value={scheduleForm.methodId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, methodId: e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
            >
              <option value="">请选择面试方式</option>
              {interviewMethods.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">面试日期 *</label>
              <input 
                type="date" 
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">面试时间 *</label>
              <input 
                type="time" 
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">时长（分钟）</label>
            <input 
              type="number" 
              value={scheduleForm.duration}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              min={15}
              max={180}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">面试地点/链接</label>
            <input 
              type="text"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="线下填地址，线上填会议链接"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">备注</label>
            <textarea 
              rows={2} 
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="面试注意事项或特殊要求..." 
              className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none resize-none" 
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleSubmitSchedule}
              disabled={scheduleLoading}
              className="flex-1 h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scheduleLoading ? '安排中...' : '确认安排'}
            </button>
            <button onClick={() => setShowScheduleModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Offer Modal - 发Offer */}
      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="发放Offer">
        <div className="space-y-4">
          {(() => {
            const candidate = candidates.find(c => c.id === selectedCandidate);
            return candidate ? (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-xs font-bold text-emerald-400">
                  {candidate.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{candidate.name}</p>
                  <p className="text-xs text-slate-500">{candidate.position}</p>
                </div>
              </div>
            ) : null;
          })()}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">录用岗位</label>
            <input type="text" defaultValue={candidates.find(c => c.id === selectedCandidate)?.position || ''} className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">基本月薪 (元)</label>
              <input type="number" placeholder="如 25000" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">年终奖 (月数)</label>
              <input type="number" placeholder="如 3" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">预计入职日期</label>
              <input type="date" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Offer有效期至</label>
              <input type="date" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">试用期 (月)</label>
            <select className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none">
              <option value="3">3个月</option>
              <option value="6">6个月</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">备注</label>
            <textarea rows={2} placeholder="Offer附加说明..." className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleConfirmOffer}
              disabled={actionLoading === selectedCandidate}
              className="flex-1 h-9 rounded-lg bg-emerald-500 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading === selectedCandidate ? '发送中...' : '确认发送Offer'}
            </button>
            <button onClick={() => setShowOfferModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Offer Modal - 拒绝Offer */}
      <Modal isOpen={showRejectOfferModal} onClose={() => setShowRejectOfferModal(false)} title="拒绝Offer">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-red-500/5 border border-red-500/20 p-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">确认该候选人拒绝了Offer，将标记为已淘汰</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">拒绝原因</label>
            <select id="reject-reason-select" className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none">
              <option value="salary">薪资不满意</option>
              <option value="other_offer">接受了其他Offer</option>
              <option value="personal">个人原因</option>
              <option value="location">工作地点不合适</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">详细备注</label>
            <textarea id="reject-reason-detail" rows={3} placeholder="补充说明拒绝原因..." className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                const reasonSelect = document.getElementById('reject-reason-select') as HTMLSelectElement;
                const reasonDetail = document.getElementById('reject-reason-detail') as HTMLTextAreaElement;
                handleConfirmRejectOffer(`${reasonSelect?.value || '未指定'}: ${reasonDetail?.value || ''}`);
              }}
              disabled={actionLoading === selectedCandidate}
              className="flex-1 h-9 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading === selectedCandidate ? '处理中...' : '确认拒绝'}
            </button>
            <button onClick={() => setShowRejectOfferModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Resume Preview Modal */}
      {resumePreviewData && (
        <ResumePreviewModal
          isOpen={showResumePreview}
          onClose={() => {
            setShowResumePreview(false);
            setResumePreviewData(null);
          }}
          candidateId={resumePreviewData.id}
          candidateName={resumePreviewData.name}
          candidatePosition={resumePreviewData.position}
          resumeUrl={resumePreviewData.resumeUrl}
          onUploadSuccess={() => {
            // Refresh candidates data after upload
            fetch('/api/candidates')
              .then(res => res.json())
              .then(data => {
                if (data.code === 0 && data.data?.candidates) {
                  const transformed = data.data.candidates.map((c: Record<string, unknown>) => {
                    const parseJsonArray = (val: unknown): string[] => {
                      if (Array.isArray(val)) return val;
                      if (typeof val === 'string' && val) {
                        try { return JSON.parse(val); } catch { return []; }
                      }
                      return [];
                    };
                    const parseWorkHistory = (val: unknown): { company: string; position: string; duration: string }[] => {
                      if (Array.isArray(val)) return val;
                      if (typeof val === 'string' && val) {
                        try { return JSON.parse(val); } catch { return []; }
                      }
                      return [];
                    };
                    return {
                      id: c.id as string,
                      name: (c.name as string) || '未知候选人',
                      avatar: (c.avatar as string) || (c.name as string)?.charAt(0) || '?',
                      email: (c.email as string) || '',
                      phone: (c.phone as string) || '',
                      education: (c.education as string) || '未知',
                      school: (c.school as string) || '',
                      major: (c.major as string) || '',
                      experience: (typeof c.experience === 'number' ? c.experience : 0) as number,
                      currentCompany: (c.currentCompany as string) || '',
                      currentPosition: (c.currentPosition as string) || '',
                      skills: parseJsonArray(c.skills),
                      location: (c.location as string) || '',
                      expectedSalary: (c.expectedSalary as string) || '',
                      source: (c.source as string) || 'manual',
                      matchScore: (typeof c.matchScore === 'number' ? c.matchScore : 75) as number,
                      aiSummary: (c.aiSummary as string) || '',
                      appliedPosition: (c.appliedPosition as string) || '',
                      tags: parseJsonArray(c.tags),
                      status: (c.status as 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected') || 'new',
                      workHistory: parseWorkHistory(c.workHistory),
                      resumeUrl: (c.resumeUrl as string) || undefined,
                    };
                  });
                  setCandidates(transformed);
                  // Update resume preview data
                  const updatedCandidate = transformed.find((c: { id: string }) => c.id === resumePreviewData.id);
                  if (updatedCandidate) {
                    setResumePreviewData({
                      id: updatedCandidate.id,
                      name: updatedCandidate.name,
                      position: updatedCandidate.appliedPosition,
                      resumeUrl: updatedCandidate.resumeUrl,
                    });
                  }
                }
              })
              .catch(console.error);
          }}
        />
      )}

      {/* Duplicate Detection Modal */}
      <Modal isOpen={!!duplicateInfo} onClose={() => setDuplicateInfo(null)} title="检测到重复候选人">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">系统中已存在相似候选人，请选择处理方式</p>
          </div>

          <div className="space-y-2">
            {duplicateInfo?.duplicates.map((dup) => (
              <div key={dup.id} className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
                    {dup.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{dup.name}</p>
                    <p className="text-xs text-slate-500">
                      {[dup.email, dup.phone].filter(Boolean).join(' · ') || '无联系方式'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500">重复字段:</span>
                  {dup.duplicateFields.map((field) => (
                    <span key={field} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-400">
                      {field === 'email' ? '邮箱' : field === 'phone' ? '手机' : field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleDuplicateAction('skip')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-700 bg-[#0a0e1a] hover:border-slate-600 transition-colors"
            >
              <SkipForward className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">跳过</span>
            </button>
            <button
              onClick={() => handleDuplicateAction('overwrite')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400">覆盖</span>
            </button>
            <button
              onClick={() => handleDuplicateAction('keep')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 transition-colors"
            >
              <Copy className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-sky-400">保留两份</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Batch Add to Candidate Pool Modal */}
      <Modal isOpen={showBatchPoolModal} onClose={() => setShowBatchPoolModal(false)} title="批量添加到候选人池">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
            <UserCheck className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-xs text-orange-400">将 {selectedIds.size} 位候选人批量添加到候选人池</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">状态</label>
            <select
              value={batchPoolForm.status}
              onChange={e => setBatchPoolForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
            >
              <option value="active">活跃</option>
              <option value="reserve">储备</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">技能标签（逗号分隔，可选）</label>
            <input
              type="text"
              value={batchPoolForm.skillTags}
              onChange={e => setBatchPoolForm(prev => ({ ...prev, skillTags: e.target.value }))}
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">备注（可选）</label>
            <textarea
              value={batchPoolForm.notes}
              onChange={e => setBatchPoolForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
              rows={3}
              placeholder="添加备注信息..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleBatchAddToPool}
              disabled={batchPoolLoading}
              className="flex-1 h-9 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchPoolLoading ? '添加中...' : `确认添加 ${selectedIds.size} 人`}
            </button>
            <button onClick={() => setShowBatchPoolModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Candidate Profile Modal */}
      <Modal
        isOpen={showAIProfileModal}
        onClose={() => {
          setShowAIProfileModal(false);
          setAiProfileCandidate(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-sky-400" />
            <span>AI候选人画像</span>
            {aiProfileCandidate && (
              <span className="text-sm text-slate-400 font-normal">- {aiProfileCandidate.name}</span>
            )}
          </div>
        }
        size="lg"
      >
        {aiProfileCandidate && (
          <AICandidateProfile
            candidateId={aiProfileCandidate.id}
            candidateName={aiProfileCandidate.name}
            position={aiProfileCandidate.position}
          />
        )}
      </Modal>

      {/* Candidate Detail Modal */}
      {showDetailModal && detailCandidate && (
        <CandidateDetailModal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setDetailCandidate(null); }}
          candidate={detailCandidate as {
            id: string; name: string; email?: string | null; phone?: string | null;
            education?: string | null; school?: string | null; major?: string | null;
            experience?: number | null; currentCompany?: string | null; currentPosition?: string | null;
            skills?: string | string[]; resumeUrl?: string | null; resumeFileKey?: string | null;
            resumeParsed?: string | Record<string, unknown>; status?: string;
            matchScore?: number | null; aiSummary?: string | null;
            appliedPosition?: string | null; department?: string | null;
            source?: string; tags?: string | string[]; createdAt?: string;
          }}
        />
      )}
    </div>
  );
}
