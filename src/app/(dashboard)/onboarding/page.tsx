'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, CheckCircle, Clock, AlertCircle, RefreshCw, Plus, Bell, Calendar, Mail, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface OnboardingTask {
  id: string;
  category: string;
  title: string;
  description?: string;
  assigneeName?: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
}

interface Onboarding {
  id: string;
  candidateId: string;
  contractId?: string;
  contractStatus?: string;
  employeeName: string;
  employeeId?: string;
  position?: string;
  department?: string;
  startDate: string;
  status: string;
  tasks: OnboardingTask[];
  progress: number;
  completedTasks: number;
  totalTasks: number;
  daysSinceStart: number;
  day7FollowUp?: boolean;
  day30FollowUp?: boolean;
  anomalies?: string[];
}

interface DailySummary {
  date: string;
  completedCount: number;
  anomalyCount: number;
  pendingCount: number;
  completed: Onboarding[];
  anomalies: Onboarding[];
}

interface NotificationRule {
  id: string;
  trigger: string;
  recipients: string[];
  action: string;
  enabled: boolean;
}

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'daily' | 'rules'>('list');
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, needFollowUp: 0 });
  const [loading, setLoading] = useState(true);
  const [showInitModal, setShowInitModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [newOnboarding, setNewOnboarding] = useState({ candidateId: '', employeeName: '', position: '', department: '', startDate: '' });
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ to: string; cc: string; subject: string; body: string } | null>(null);
  const [timeline, setTimeline] = useState<{ time: string; action: string; user: string }[]>([]);
  const [eligibleEmployees, setEligibleEmployees] = useState<{ id: string; name: string; department: string | null; position: string | null; startDate: Date | null; email: string | null; phone: string | null }[]>([]);

  const loadEligibleEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/eligible-employees');
      const data = await res.json();
      // API返回 { code: 0, data: { employees: [...], total: N } }
      const employees = data?.data?.employees || data?.employees || [];
      setEligibleEmployees(Array.isArray(employees) ? employees : []);
    } catch (e) {
      console.error('Load eligible employees error:', e);
      setEligibleEmployees([]);
    }
  }, []);

  const handleSelectEmployee = (emp: { id: string; name: string; department: string | null; position: string | null; startDate: Date | null }) => {
    setNewOnboarding({
      candidateId: emp.id,
      employeeName: emp.name,
      department: emp.department || '',
      position: emp.position || '',
      startDate: emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : '',
    });
  };

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/dashboard');
      const data = await res.json();
      const list = data?.data?.onboardings || data?.onboardings || [];
      setOnboardings(Array.isArray(list) ? list : []);
      setStats(data?.data?.stats || data?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, needFollowUp: 0 });
    } catch (e) {
      console.error('Load dashboard error:', e);
      setOnboardings([]);
    }
  }, []);

  const loadDailySummary = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/daily-summary');
      const data = await res.json();
      const summary = data?.data || data || null;
      setDailySummary(summary);
    } catch (e) {
      console.error('Load daily summary error:', e);
      setDailySummary(null);
    }
  }, []);

  const loadNotificationRules = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/notification-rules');
      const data = await res.json();
      const rules = data?.data?.rules || data?.rules || [];
      setNotificationRules(Array.isArray(rules) ? rules : []);
    } catch (e) {
      console.error('Load notification rules error:', e);
      setNotificationRules([]);
    }
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'daily') loadDailySummary();
    if (activeTab === 'rules') loadNotificationRules();
  }, [activeTab, loadDailySummary, loadNotificationRules]);

  const handleInitiate = async () => {
    try {
      const res = await fetch('/api/onboarding/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOnboarding),
      });
      if (res.ok) {
        setShowInitModal(false);
        setNewOnboarding({ candidateId: '', employeeName: '', position: '', department: '', startDate: '' });
        loadDashboard();
      }
    } catch (e) {
      console.error('Initiate error:', e);
    }
  };

  const handleTaskComplete = async (onboardingId: string, taskId: string) => {
    try {
      await fetch(`/api/onboarding/${onboardingId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'completed' }),
      });
      loadDashboard();
      if (selectedOnboarding?.id === onboardingId) {
        const res = await fetch(`/api/onboarding/${onboardingId}/tasks`);
        const data = await res.json();
        const ob = data?.data?.onboarding || data?.onboarding || null;
        if (ob) {
          ob.tasks = Array.isArray(ob.tasks) ? ob.tasks : [];
        }
        setSelectedOnboarding(ob);
      }
    } catch (e) {
      console.error('Complete task error:', e);
    }
  };

  const loadTimeline = async (onboardingId: string) => {
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/timeline`);
      const data = await res.json();
      const tl = data?.data?.timeline || data?.timeline || [];
      setTimeline(Array.isArray(tl) ? tl : []);
    } catch (e) {
      console.error('Load timeline error:', e);
      setTimeline([]);
    }
  };

  const previewEmail = async (onboardingId: string) => {
    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/preview-email`);
      const data = await res.json();
      const preview = data?.data || data || null;
      setEmailPreview(preview);
      setShowEmailPreview(true);
    } catch (e) {
      console.error('Preview email error:', e);
    }
  };

  const openOutlookCompose = async () => {
    if (!emailPreview) return;
    const to = emailPreview.to;
    const cc = emailPreview.cc;
    const subject = emailPreview.subject;
    // Strip HTML tags for plain text body
    const plainBody = emailPreview.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    
    const MAX_BODY_LENGTH = 1800;
    
    if (plainBody.length <= MAX_BODY_LENGTH) {
      // Short body - use full mailto
      const mailto = `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
      window.location.href = mailto;
    } else {
      // Long body - put summary in mailto, copy full content to clipboard
      const summary = plainBody.substring(0, MAX_BODY_LENGTH) + '\n\n[完整内容已复制到剪贴板，请在正文中Ctrl+V粘贴]';
      const mailto = `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
      
      try {
        await navigator.clipboard.writeText(plainBody);
        window.location.href = mailto;
      } catch {
        // Fallback: create textarea to copy
        const textarea = document.createElement('textarea');
        textarea.value = plainBody;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        window.location.href = mailto;
      }
    }
  };

  const confirmEmailSent = async () => {
    if (!selectedOnboarding) return;
    try {
      // 状态流转逻辑：pending -> notified -> in_progress
      let nextStatus: string;
      if (selectedOnboarding.status === 'pending') {
        nextStatus = 'notified';
      } else if (selectedOnboarding.status === 'notified') {
        nextStatus = 'in_progress';
      } else {
        nextStatus = selectedOnboarding.status;
      }

      const res = await fetch(`/api/onboarding/initiate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOnboarding.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowEmailPreview(false);
        setSelectedOnboarding(null);
        setEmailPreview(null);
        loadDashboard();
        const statusLabels: Record<string, string> = { pending: '待通知', notified: '已通知', in_progress: '接待中', training: '培训中', completed: '已完成' };
        alert(`邮件已确认发送，入职状态已更新为"${statusLabels[nextStatus] || nextStatus}"`);
      } else {
        alert(`状态更新失败: ${data.message || '未知错误'}`);
      }
    } catch (e) {
      console.error('Confirm email sent error:', e);
      alert('确认发送失败，请重试');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'it': return '💻';
      case 'admin': return '🏢';
      case 'training': return '📚';
      case 'team': return '👥';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'notified': return 'text-purple-400 bg-purple-500/10';
      case 'in_progress': return 'text-sky-400 bg-sky-500/10';
      case 'training': return 'text-orange-400 bg-orange-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  // 入职流程步骤
  const onboardingSteps = [
    { key: 'pending', label: '待通知' },
    { key: 'notified', label: '已通知' },
    { key: 'in_progress', label: '接待中' },
    { key: 'training', label: '培训中' },
    { key: 'completed', label: '已完成' },
  ];

  const getOnboardingStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'notified': return 1;
      case 'in_progress': return 2;
      case 'training': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">入职管理</h1>
          <p className="mt-1 text-sm text-slate-400">新员工入职流程协同与进度追踪</p>
        </div>
        <button
          onClick={() => setShowInitModal(true)}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4" />
          发起入职
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b]">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm ${activeTab === 'list' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <UserPlus className="h-4 w-4" />
          入职列表
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm ${activeTab === 'daily' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Calendar className="h-4 w-4" />
          每日汇总
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm ${activeTab === 'rules' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Bell className="h-4 w-4" />
          通知规则
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">总入职</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-slate-400">待入职</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <p className="text-2xl font-bold text-sky-400">{stats.inProgress}</p>
              <p className="text-xs text-slate-400">入职中</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-xs text-slate-400">已完成</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-2xl font-bold text-red-400">{stats.needFollowUp}</p>
              <p className="text-xs text-slate-400">待回访</p>
            </div>
          </div>

          {/* Onboarding List */}
          <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
            <div className="border-b border-[#1e293b] p-4">
              <h2 className="text-lg font-semibold text-white">入职列表</h2>
            </div>
            <div className="divide-y divide-[#1e293b]">
              {onboardings.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无入职记录</div>
              ) : (
                onboardings.map(ob => (
                  <div key={ob.id} className={`p-4 hover:bg-[#1a2236] ${ob.anomalies && ob.anomalies.length > 0 ? 'border-l-2 border-l-red-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ob.anomalies && ob.anomalies.length > 0 ? 'bg-red-500/10' : 'bg-sky-500/10'}`}>
                          <UserPlus className={`h-5 w-5 ${ob.anomalies && ob.anomalies.length > 0 ? 'text-red-400' : 'text-sky-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{ob.employeeName}</p>
                            {ob.anomalies && ob.anomalies.length > 0 && (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">异常</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {ob.department} · {ob.position} · 入职日期: {new Date(ob.startDate).toLocaleDateString()}
                          </p>
                          {ob.contractId && (
                            <p className="mt-1 text-xs text-slate-500">
                              合同: {ob.contractStatus === 'completed' ? '已完成' : ob.contractStatus === 'pending_sign' ? '待签署' : ob.contractStatus === 'in_progress' ? '签核中' : ob.contractStatus || '未知'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#1e293b]">
                              <div className="h-full bg-sky-500 transition-all" style={{ width: `${ob.progress}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{ob.progress}%</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {ob.completedTasks}/{ob.totalTasks} 任务完成
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(ob.status)}`}>
                          {ob.status === 'pending' ? '待通知' : ob.status === 'notified' ? '已通知' : ob.status === 'in_progress' ? '接待中' : ob.status === 'training' ? '培训中' : ob.status === 'completed' ? '已完成' : ob.status}
                        </span>
                        <button
                          onClick={() => { setSelectedOnboarding(ob); loadTimeline(ob.id); }}
                          className="rounded-lg bg-[#1a2236] px-3 py-1.5 text-xs text-slate-300 hover:bg-[#253049]"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                    {ob.anomalies && ob.anomalies.length > 0 && (
                      <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2">
                        <p className="text-xs text-red-400">异常项: {ob.anomalies.join(', ')}</p>
                      </div>
                    )}
                    {ob.daysSinceStart >= 7 && !ob.day7FollowUp && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">入职已满7天，请安排回访</span>
                      </div>
                    )}
                    {/* 步骤进度条 */}
                    <div className="mt-3 border-t border-[#1e293b] pt-3">
                      <div className="flex items-center justify-between">
                        {onboardingSteps.map((step, idx) => {
                          const currentStep = getOnboardingStepIndex(ob.status);
                          const isCompleted = idx < currentStep;
                          const isCurrent = idx === currentStep;
                          return (
                            <div key={step.key} className="flex flex-1 items-center">
                              <div className="flex flex-col items-center">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                                  isCompleted ? 'border-green-500 bg-green-500/20 text-green-400' :
                                  isCurrent ? 'border-sky-500 bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/30' :
                                  'border-[#1e293b] bg-[#111827] text-slate-500'
                                }`}>
                                  {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                </div>
                                <span className={`mt-0.5 text-[10px] ${isCurrent ? 'text-sky-400 font-medium' : isCompleted ? 'text-green-400' : 'text-slate-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < onboardingSteps.length - 1 && (
                                <div className={`mx-1 h-0.5 flex-1 transition-all ${idx < currentStep ? 'bg-green-500' : 'bg-[#1e293b]'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'daily' && dailySummary && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">每日汇总{dailySummary.date ? ` - ${new Date(dailySummary.date).toLocaleDateString()}` : ''}</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
              <p className="text-3xl font-bold text-green-400">{dailySummary.completedCount || 0}</p>
              <p className="mt-1 text-sm text-slate-400">当日完成入职</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-3xl font-bold text-red-400">{dailySummary.anomalyCount || 0}</p>
              <p className="mt-1 text-sm text-slate-400">异常记录</p>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <p className="text-3xl font-bold text-yellow-400">{dailySummary.pendingCount || 0}</p>
              <p className="mt-1 text-sm text-slate-400">待处理</p>
            </div>
          </div>
          {(dailySummary.anomalies || []).length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-[#111827]">
              <div className="border-b border-red-500/20 p-4">
                <h3 className="text-sm font-medium text-red-400">异常记录</h3>
              </div>
              <div className="divide-y divide-[#1e293b]">
                {(dailySummary.anomalies || []).map((ob, i) => (
                  <div key={ob?.id || i} className="p-4">
                    <p className="font-medium text-white">{ob.employeeName}</p>
                    <p className="text-xs text-red-400">{(ob.anomalies || []).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
          <div className="border-b border-[#1e293b] p-4">
            <h2 className="text-lg font-semibold text-white">通知规则配置</h2>
          </div>
          <div className="divide-y divide-[#1e293b]">
            {notificationRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-white">{rule.trigger}</p>
                  <p className="text-xs text-slate-400">接收人: {rule.recipients.join(', ')}</p>
                  <p className="text-xs text-slate-500">动作: {rule.action}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${rule.enabled ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  {rule.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Initiate Modal */}
      <Modal isOpen={showInitModal} onClose={() => setShowInitModal(false)} title="发起入职">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">选择员工（已签合同人员）</label>
            <select
              value={newOnboarding.candidateId}
              onChange={e => {
                const emp = (eligibleEmployees || []).find(el => el.id === e.target.value);
                if (emp) handleSelectEmployee(emp);
              }}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            >
              <option value="">-- 请选择员工 --</option>
              {(eligibleEmployees || []).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.department || '未分配'} / {emp.position || '未设置'}</option>
              ))}
            </select>
            {(eligibleEmployees || []).length === 0 && (
              <p className="mt-1 text-xs text-slate-500">暂无可入职人员，请先完成合同签署</p>
            )}
          </div>
          <div>
            <label className="text-sm text-slate-400">员工姓名</label>
            <input
              type="text"
              value={newOnboarding.employeeName}
              onChange={e => setNewOnboarding({ ...newOnboarding, employeeName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">部门</label>
              <input
                type="text"
                value={newOnboarding.department}
                onChange={e => setNewOnboarding({ ...newOnboarding, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">职位</label>
              <input
                type="text"
                value={newOnboarding.position}
                onChange={e => setNewOnboarding({ ...newOnboarding, position: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400">入职日期</label>
            <input
              type="date"
              lang="zh-CN"
              value={newOnboarding.startDate}
              onChange={e => setNewOnboarding({ ...newOnboarding, startDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white [color-scheme:dark]"
              placeholder="请选择入职日期"
            />
          </div>
          <button
            onClick={handleInitiate}
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
          >
            发起入职流程
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedOnboarding} onClose={() => setSelectedOnboarding(null)} title="入职详情">
        {selectedOnboarding && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0e1a] p-4">
              <p className="text-lg font-medium text-white">{selectedOnboarding.employeeName}</p>
              <p className="text-sm text-slate-400">{selectedOnboarding.department} · {selectedOnboarding.position}</p>
              <p className="mt-2 text-sm text-slate-400">入职日期: {new Date(selectedOnboarding.startDate).toLocaleDateString()}</p>
            </div>
            
            {/* Timeline */}
            {timeline.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-slate-300">状态时间线</h3>
                <div className="space-y-2 rounded-lg bg-[#0a0e1a] p-3">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">{item.time}</span>
                      <span className="text-white">{item.action}</span>
                      <span className="text-slate-400">by {item.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">入职任务</h3>
              <div className="space-y-2">
                {Array.isArray(selectedOnboarding.tasks) ? selectedOnboarding.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border border-[#1e293b] p-3">
                    <span className="text-lg">{getCategoryIcon(task.category)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                      {task.assigneeName && <p className="text-xs text-slate-500">负责人: {task.assigneeName}</p>}
                    </div>
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <button
                        onClick={() => handleTaskComplete(selectedOnboarding.id, task.id)}
                        className="rounded-lg bg-sky-500/10 px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/20"
                      >
                        完成
                      </button>
                    )}
                  </div>
                )) : null}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => previewEmail(selectedOnboarding.id)}
                className="flex items-center gap-2 rounded-lg bg-[#1a2236] px-3 py-2 text-sm text-slate-300 hover:bg-[#253049]"
              >
                <Mail className="h-4 w-4" />
                预览通知邮件
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Preview Modal */}
      <Modal isOpen={showEmailPreview} onClose={() => setShowEmailPreview(false)} title="邮件预览">
        {emailPreview ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0e1a] p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">收件人：</span>
                  <span className="text-white">{emailPreview.to}</span>
                </div>
                <div>
                  <span className="text-slate-500">抄送：</span>
                  <span className="text-white">{emailPreview.cc}</span>
                </div>
                <div>
                  <span className="text-slate-500">主题：</span>
                  <span className="font-medium text-white">{emailPreview.subject}</span>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg bg-white p-4">
              <div
                className="prose prose-sm max-w-none text-slate-800"
                dangerouslySetInnerHTML={{ __html: emailPreview.body }}
              />
            </div>
            <div className="rounded-lg bg-yellow-500/10 p-3">
              <p className="text-xs text-yellow-400">
                说明：本通知由AI辅助生成，入职状态以HRS系统记录为准。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openOutlookCompose}
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Mail className="h-4 w-4" />
                通过Outlook发送
              </button>
              <button
                onClick={confirmEmailSent}
                className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20"
              >
                <CheckCircle className="h-4 w-4" />
                确认已发送
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">加载中...</div>
        )}
      </Modal>
    </div>
  );
}
