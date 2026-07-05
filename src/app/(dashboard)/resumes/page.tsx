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
  ExternalLink,
  Trash2,
  Archive,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCandidates } from '@/lib/mock-data';

// 简历解析结果类型
interface ParsedResumeData {
  name: string;
  phone: string;
  email: string;
  gender?: string;
  age?: number;
  location?: string;
  education: { school: string; degree: string; major: string; startDate?: string; endDate?: string }[];
  workExperience: { company: string; position: string; startDate?: string; endDate?: string; description: string }[];
  skills: string[];
  certificates?: string[];
  languages?: string[];
  summary?: string;
  expectedSalary?: string;
  expectedPosition?: string;
  fileName?: string;
  confidence?: number;
  parseMethod?: string;
  rawTextLength?: number;
  fileUrl?: string;
}
import { Candidate } from '@/lib/mock-data';

type ResumeCandidate = Candidate & {
  age?: number;
  location?: string;
  expectedSalary?: string;
  appliedPosition?: string;
  resumeParsed?: Record<string, unknown>;
  matchAnalysis?: string;
  rawResume?: string;
};

import { Modal } from '@/components/ui/modal';
import { ResumePreviewModal } from '@/components/resume-preview-modal';
import { AICandidateProfile } from '@/components/ai-candidate-profile';

type CandidateStatus = 'new' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'archived' | 'pool' | 'contacted';
type TabType = 'all' | CandidateStatus;

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeData | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPositionId, setImportPositionId] = useState('');
  const [positions, setPositions] = useState<{ id: string; title: string; department?: string }[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectOfferModal, setShowRejectOfferModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ResumeCandidate[]>(mockCandidates);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [resumePreviewData, setResumePreviewData] = useState<{ id: string; name: string; position?: string; resumeUrl?: string } | null>(null);

  // AI features state
  const [showAIProfileModal, setShowAIProfileModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [aiProfileCandidate, setAiProfileCandidate] = useState<{ id: string; name: string; position?: string; resumeParsed?: Record<string, unknown>; matchAnalysis?: string } | null>(null);

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

  // Fetch candidates from database
  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      if (data.code === 0 && data.data?.candidates && data.data.candidates.length > 0) {
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
            position: (c.appliedPosition as string) || (c.currentPosition as string) || '',
            appliedAt: (c.createdAt as string)?.split('T')[0] || new Date().toISOString().split('T')[0],
            resumeParsed: (c.resumeParsed as Record<string, unknown>) || {},
            matchAnalysis: (c.matchAnalysis as string) || '',
            rawResume: (c.rawResume as string) || '',
          };
        });
        setCandidates(transformed);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCandidates();
    // Fetch open positions for import dropdown
    fetch('/api/positions?status=open')
      .then(r => r.json())
      .then(d => { if (d.code === 0) setPositions(d.data?.positions || d.data || []); })
      .catch(() => {});
  }, [fetchCandidates]);

  // Compute dynamic tab counts from candidates state
  const tabCounts = {
    all: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    screening: candidates.filter(c => c.status === 'screening').length,
    interviewing: candidates.filter(c => c.status === 'interviewing').length,
    offered: candidates.filter(c => c.status === 'offered').length,
    hired: candidates.filter(c => c.status === 'hired').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: tabCounts.all },
    { id: 'new', label: '新简历', count: tabCounts.new },
    { id: 'screening', label: '筛选中', count: tabCounts.screening },
    { id: 'interviewing', label: '面试中', count: tabCounts.interviewing },
    { id: 'offered', label: '待Offer', count: tabCounts.offered },
    { id: 'hired', label: '已入职', count: tabCounts.hired },
    { id: 'rejected', label: '已淘汰', count: tabCounts.rejected },
  ];

  const isExcelFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name);

  const syncExcelFile = async (file: File) => {
    setIsParsing(true);
    setParsedResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/collection/excel-sync', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        alert('Excel 同步完成：共 ' + data.data.total + ' 条，新增 ' + data.data.summary.created + ' 条，更新 ' + data.data.summary.updated + ' 条');
        fetchCandidates();
      } else {
        alert(data.message || 'Excel 同步失败');
      }
    } catch (err) {
      console.error('Excel sync error:', err);
      alert('Excel 同步失败，请检查网络连接');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsUploading(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (isExcelFile(file)) {
      await syncExcelFile(file);
      return;
    }
    
    await parseResumeFile(file);
  }, [fetchCandidates]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isExcelFile(file)) {
      await syncExcelFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

    await parseResumeFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [fetchCandidates]);

  // 实际调用 API 解析简历
  const parseResumeFile = async (file: File) => {
    setIsParsing(true);
    setParsedResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/candidates/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.code === 0 && data.data) {
        setParsedResult(data.data as ParsedResumeData);
      } else {
        alert(data.message || '简历解析失败，请重试');
      }
    } catch (err) {
      console.error('Parse resume error:', err);
      alert('简历解析失败，请检查网络连接后重试');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle duplicate resolution
  const handleDuplicateAction = useCallback(async (action: 'skip' | 'overwrite' | 'keep') => {
    if (action === 'skip') {
      setDuplicateInfo(null);
      return;
    }
    // For overwrite or keep, proceed with parsing
    const file = duplicateInfo?.pendingFile;
    setDuplicateInfo(null);
    if (file) {
      await parseResumeFile(file);
    }
  }, [duplicateInfo]);

  // 确认导入候选人到候选人池
  const handleConfirmImport = useCallback(async () => {
    if (!parsedResult) return;
    
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedResult.name,
          phone: parsedResult.phone,
          email: parsedResult.email,
          gender: parsedResult.gender,
          age: parsedResult.age,
          location: parsedResult.location,
          education: parsedResult.education,
          workExperience: parsedResult.workExperience,
          skills: parsedResult.skills,
          certificates: parsedResult.certificates,
          languages: parsedResult.languages,
          summary: parsedResult.summary,
          expectedSalary: parsedResult.expectedSalary,
          expectedPosition: parsedResult.expectedPosition,
          source: 'ai_parse',
          status: 'new',
          positionId: importPositionId || undefined,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        // If position is selected, trigger match scoring
        if (importPositionId && data.data?.id) {
          fetch('/api/positions/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: data.data.id, positionId: importPositionId }),
          }).catch(() => {});
        }
        setParsedResult(null);
        setImportPositionId('');
        // Refresh candidate list
        fetchCandidates();
      } else {
        alert(data.message || '导入失败，请重试');
      }
    } catch (err) {
      console.error('Import candidate error:', err);
      alert('导入失败，请检查网络连接');
    }
  }, [parsedResult, importPositionId, fetchCandidates]);

  const handlePassScreen = useCallback(async (candidateId: string, candidateName: string) => {
    setActionLoading(candidateId);
    try {
      // Update local state for immediate feedback
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, status: 'screening' as const } : c
      ));
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(`已通过 ${candidateName} 的筛选`);
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

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
        body: JSON.stringify({ status: 'interviewing' }),
      });
      
      if (!candidateRes.ok) {
        console.warn('Failed to update candidate status, but interview was created');
      }
      
      // Update local state
      setCandidates(prev => prev.map(c =>
        c.id === selectedCandidate ? { ...c, status: 'interviewing' as const } : c
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
      // Add to candidate pool
      await fetch('/api/candidate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: 'rejected' }),
      });
      // Update candidate status to archived
      await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      alert(`已淘汰 ${candidateName}，已自动归档到候选人池`);
    } catch (error) {
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
      setCandidates(prev => prev.map(c =>
        c.id === selectedCandidate ? { ...c, status: 'offered' as const } : c
      ));
      await new Promise(resolve => setTimeout(resolve, 500));
      const candidate = candidates.find(c => c.id === selectedCandidate);
      alert(`已向 ${candidate?.name || '候选人'} 发送Offer`);
      setShowOfferModal(false);
    } catch (error) {
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
      // 1. 更新候选人状态
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, status: 'hired' as const } : c
      ));
      
      // 2. 调用后端API更新状态并自动创建合同
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hired' }),
      });
      
      const data = await res.json();
      
      if (data.code === 0 && data.data?.contractCreated) {
        // 合同创建成功，显示提示并提供跳转
        const contractId = data.data.contractId;
        if (confirm(`✅ ${candidateName} 已入职！\n\n已自动创建合同记录（编号：${contractId?.slice(-8) || 'N/A'}）。\n\n点击"确定"跳转到合同管理查看。`)) {
          window.location.href = '/contracts';
        }
      } else {
        alert(`${candidateName} 已入职！`);
      }
    } catch (error) {
      console.error('Accept offer error:', error);
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
      // Add to candidate pool
      await fetch('/api/candidate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate, status: 'rejected' }),
      });
      // Update candidate status to archived
      await fetch(`/api/candidates/${selectedCandidate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      setCandidates(prev => prev.filter(c => c.id !== selectedCandidate));
      const candidate = candidates.find(c => c.id === selectedCandidate);
      alert(`${candidate?.name || '候选人'} 已拒绝Offer，已自动归档到候选人池`);
      setShowRejectOfferModal(false);
    } catch (error) {
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
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, status: 'screening' as const } : c
      ));
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(`${candidateName} 已重新激活`);
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Move rejected candidate to candidate pool
  const handleMoveToPool = useCallback(async (candidateId: string) => {
    if (!confirm('确定将该候选人转入候选人池？转入后将从简历管理列表中移除。')) return;
    setActionLoading(candidateId);
    try {
      // Add to candidate pool
      await fetch('/api/candidate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: 'rejected' }),
      });
      // Update candidate status to archived
      await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      alert('已转入候选人池');
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Delete candidate permanently (opens confirmation modal)
  const handleDeleteCandidate = useCallback((candidateId: string, candidateName?: string) => {
    setDeleteConfirm({ id: candidateId, name: candidateName || '该候选人' });
  }, []);

  // Confirm and execute delete
  const confirmDeleteCandidate = useCallback(async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      } else {
        let errorMessage = '删除失败';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // ignore parse error
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Delete candidate error:', error);
      alert('删除失败，请检查网络连接');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm]);

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
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
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
          {/* 批量导入已移除，请使用上方拖拽区上传简历或 Excel */}
        </div>
      </div>

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
                拖拽简历或 Excel 到此处，或 <span className="text-sky-400 cursor-pointer hover:text-sky-300">点击上传</span>
              </p>
              <p className="mt-1 text-[11px] md:text-xs text-slate-600">支持 PDF、Word、图片、Excel 格式</p>
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
                  {parsedResult.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-white">{parsedResult.name}</p>
                  <p className="text-[11px] md:text-xs text-slate-500">{parsedResult.expectedPosition || '未知职位'}</p>
                </div>
              </div>
              <div className="space-y-2 text-[11px] md:text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{parsedResult.education?.[0]?.degree || '未知'} · {parsedResult.education?.[0]?.school || '未知院校'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  {parsedResult.workExperience?.length || 0}段工作经历
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{(parsedResult.workExperience || []).map(w => w.company).join(' → ') || '暂无工作经历'}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className={cn(
                  'flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg font-mono text-base md:text-lg font-bold',
                  (parsedResult.confidence || 0) >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                  (parsedResult.confidence || 0) >= 80 ? 'bg-sky-500/10 text-sky-400' :
                  'bg-amber-500/10 text-amber-400'
                )}>
                  {parsedResult.confidence || 0}
                </div>
                <div>
                  <p className="text-[11px] md:text-xs text-slate-400">AI 置信度</p>
                  <p className="text-[10px] text-slate-600">{parsedResult.parseMethod === 'llm' ? 'LLM 解析' : '解析'}</p>
                </div>
              </div>
              {parsedResult.fileUrl && (
                <a
                  href={parsedResult.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-[11px] md:text-xs text-sky-400 hover:bg-[#111827] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">查看原始简历</span>
                  <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
                </a>
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1.5">AI 摘要</p>
                <p className="text-[11px] md:text-xs leading-relaxed text-slate-300 bg-[#0a0e1a] rounded-lg p-2.5 md:p-3 border border-[#1e293b]">
                  {parsedResult.summary || `${parsedResult.name}，${parsedResult.education?.[0]?.degree || ''}学历，${parsedResult.workExperience?.length || 0}段工作经历，擅长${(parsedResult.skills || []).slice(0, 5).join('、')}。`}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex-1">
                  <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" /> 核心技能
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(parsedResult.skills || []).slice(0, 8).map((s) => (
                      <span key={s} className="rounded-md bg-emerald-500/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-emerald-400 border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                    {(parsedResult.skills || []).length === 0 && (
                      <span className="text-[10px] text-slate-600">暂无</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] md:text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> 证书/语言
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(parsedResult.certificates || []).concat(parsedResult.languages || []).slice(0, 6).map((s) => (
                      <span key={s} className="rounded-md bg-amber-500/10 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] text-amber-400 border border-amber-500/20">
                        {s}
                      </span>
                    ))}
                    {!parsedResult.certificates?.length && !parsedResult.languages?.length && (
                      <span className="text-[10px] text-slate-600">暂无</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleConfirmImport} className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 transition-colors">
                  <Check className="h-3.5 w-3.5" /> 加入候选人池
                </button>
                <button onClick={() => setParsedResult(null)} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-400 hover:text-white transition-colors">
                  <Eye className="h-3.5 w-3.5" /> 取消
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
                      candidate.status === 'interviewing' ? 'bg-violet-500/10 text-violet-400' :
                      candidate.status === 'offered' ? 'bg-emerald-500/10 text-emerald-400' :
                      candidate.status === 'hired' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    )}>
                      {candidate.status === 'new' ? '新投递' : candidate.status === 'screening' ? '筛选中' :
                       candidate.status === 'interviewing' ? '面试中' : candidate.status === 'offered' ? '待Offer' :
                       candidate.status === 'hired' ? '已入职' : '已淘汰'}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] md:text-[11px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" /> {candidate.appliedAt}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div className={cn(
                    'flex h-9 w-9 md:h-11 md:w-11 shrink-0 flex-col items-center justify-center rounded-lg',
                    candidate.source === 'excel_import' ? 'bg-sky-500/10' : candidate.matchScore >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  )}>
                    <span title={candidate.source === 'excel_import' ? '评分来源：Excel 导入' : '评分来源：AI 评估'} className={cn(
                      'font-mono text-sm md:text-base font-bold',
                      candidate.source === 'excel_import' ? 'text-sky-400' : candidate.matchScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    )}>
                      {candidate.matchScore}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id, candidate.name); }}
                    disabled={actionLoading === candidate.id}
                    title="删除候选人"
                    className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {actionLoading === candidate.id ? (
                      <div className="h-3 w-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
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
                {/* 流程追踪区域 */}
                <div className="rounded-lg border border-[#1e293b] bg-[#111827]/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-3.5 w-3.5 text-sky-400" />
                    <p className="text-[11px] md:text-xs font-medium text-slate-300">流程追踪</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {candidate.status === 'rejected' || candidate.status === 'archived' ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-red-400">
                        <X className="h-3 w-3" /> 已淘汰
                      </span>
                    ) : candidate.status === 'hired' ? (
                      <>
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-green-400">
                          <CheckCircle className="h-3 w-3" /> 已完成入职
                        </span>
                        <a href="/contracts" className="text-[10px] md:text-[11px] text-sky-400 hover:underline">
                          查看合同 →
                        </a>
                      </>
                    ) : candidate.status === 'offered' ? (
                      <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-orange-400">
                        <FileText className="h-3 w-3" /> 待接受Offer
                      </span>
                    ) : candidate.status === 'interviewing' ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-blue-400">
                        <Calendar className="h-3 w-3" /> 面试中
                      </span>
                    ) : candidate.status === 'screening' ? (
                      <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-purple-400">
                        <Search className="h-3 w-3" /> 简历筛选中
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" /> 新简历
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1">AI 评估摘要</p>
                  <p className="text-[11px] md:text-xs leading-relaxed text-slate-300">
                    {candidate.matchAnalysis || candidate.aiSummary || '暂无评估摘要'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 mb-1.5">工作经历</p>
                  <div className="space-y-2">
                    {(() => {
                      const basicInfo = candidate.resumeParsed?.basicInfo as string | undefined;
                      if (basicInfo) {
                        return <p className="text-[11px] md:text-xs text-slate-300">{basicInfo}</p>;
                      }
                      return (candidate.workHistory || []).map((work, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/50" />
                          <div>
                            <p className="text-[11px] md:text-xs text-slate-300">{work.company} · {work.position}</p>
                            <p className="text-[10px] md:text-[11px] text-slate-500">{work.duration}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* 查看简历按钮：已淘汰/已归档时只展示，禁止上传入口 */}
                  {candidate.status === 'rejected' || candidate.status === 'archived' ? (
                    candidate.resumeUrl ? (
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
                        查看简历
                      </button>
                    ) : null
                  ) : (
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
                      {candidate.resumeUrl ? '详细信息' : '上传简历'}
                    </button>
                  )}
                  {/* AI画像按钮：已淘汰/已归档时隐藏 */}
                  {candidate.status !== 'rejected' && candidate.status !== 'archived' && (
                    <button
                      onClick={() => {
                        setAiProfileCandidate({
                          id: candidate.id,
                          name: candidate.name,
                          position: candidate.position,
                          resumeParsed: candidate.resumeParsed,
                          matchAnalysis: candidate.matchAnalysis,
                        });
                        setShowAIProfileModal(true);
                      }}
                      className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-orange-500/20 px-2.5 md:px-3 text-[11px] md:text-xs text-orange-400 hover:bg-orange-500/10 cursor-pointer transition-colors"
                    >
                      <Brain className="h-3 w-3" />
                      AI画像
                    </button>
                  )}

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
                  {candidate.status === 'interviewing' && (
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
                  {candidate.status === 'offered' && (
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

                  {/* 已淘汰 → 重新激活 / 转入候选人池 / 删除 */}
                  {(candidate.status === 'rejected' || candidate.status === 'archived') && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReactivate(candidate.id, candidate.name)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-sky-500/20 px-2 md:px-2.5 text-[11px] md:text-xs text-sky-400 hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {actionLoading === candidate.id ? (
                          <><div className="h-3 w-3 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" /> 处理中...</>
                        ) : (
                          <><RotateCcw className="h-3 w-3" /> 重新激活</>
                        )}
                      </button>
                      <button
                        onClick={() => handleMoveToPool(candidate.id)}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-amber-500/20 px-2 md:px-2.5 text-[11px] md:text-xs text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <UserPlus className="h-3 w-3" /> 转入池
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id, candidate.name); }}
                        disabled={actionLoading === candidate.id}
                        className="flex h-7 md:h-8 items-center gap-1 rounded-lg border border-red-500/20 px-2 md:px-2.5 text-[11px] md:text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> 删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#0a0e1a]/30 px-3 md:px-4 py-2">
              <button
                onClick={() => setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)}
                className="text-[11px] md:text-xs text-slate-500 hover:text-sky-400 cursor-pointer transition-colors"
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
                      status: (c.status as CandidateStatus) || 'new',
                      workHistory: parseWorkHistory(c.workHistory),
                      position: (c.appliedPosition as string) || (c.currentPosition as string) || '',
                      resumeParsed: (c.resumeParsed as Record<string, unknown>) || {},
                      matchAnalysis: (c.matchAnalysis as string) || '',
                      rawResume: (c.rawResume as string) || '',
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
            resumeParsed={aiProfileCandidate.resumeParsed}
            matchAnalysis={aiProfileCandidate.matchAnalysis}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="删除候选人">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            确定要删除 <span className="font-medium text-white">{deleteConfirm?.name}</span> 吗？此操作不可恢复。
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={confirmDeleteCandidate}
              disabled={actionLoading === deleteConfirm?.id}
              className="flex-1 h-9 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading === deleteConfirm?.id ? '删除中...' : '确认删除'}
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
