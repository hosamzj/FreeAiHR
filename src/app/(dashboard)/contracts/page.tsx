'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSignature, AlertTriangle, CheckCircle, Clock, Plus, RefreshCw, Bell, Calendar, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface Contract {
  id: string;
  contractNo?: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  position?: string;
  contractType: string;
  startDate: string;
  endDate: string;
  status: string;
  source?: 'recruitment' | 'manual';
  candidateId?: string;
  onboardingId?: string;
  renewInitiatedBy?: string;
  renewApprovedBy?: string;
  renewExecutedBy?: string;
  renewNotes?: string;
  daysLeft?: number;
}

interface ReminderRule {
  id: string;
  name: string;
  daysBefore: number;
  recipientTypes: string[];
  enabled: boolean;
  templateSubject: string;
  templateBody: string;
}

interface WeeklySummary {
  period: { start: string; end: string };
  pending: { total: number; items: Array<{ employeeName: string; reminderType: string; recipientName: string }> };
  overdue: { total: number; items: Array<{ employeeName: string; daysOverdue: number }> };
  completed: { total: number; items: Array<{ employeeName: string; completedAt: string }> };
  upcoming: { total: number; items: Array<{ employeeName: string; daysLeft: number }> };
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  status?: string;
}

interface EmailPreview {
  to: string;
  cc: string;
  subject: string;
  body: string;
  reminderType: string;
}

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'rules' | 'summary'>('list');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<{ urgent: Contract[]; warning: Contract[]; normal: Contract[] }>({ urgent: [], warning: [], normal: [] });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [newContract, setNewContract] = useState({ employeeId: '', candidateId: '', employeeName: '', department: '', position: '', startDate: '', endDate: '' });
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<Array<{ id: string; name: string; department: string | null; appliedPosition: string | null; hireDate: Date | null }>>([]);

  const loadContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data.data || []);
    } catch (e) {
      console.error('Load contracts error:', e);
    }
  }, []);

  const loadExpiring = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/expiring?days=90');
      const data = await res.json();
      setExpiringContracts(data.data || { urgent: [], warning: [], normal: [] });
    } catch (e) {
      console.error('Load expiring error:', e);
    }
  }, []);

  const loadReminderRules = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/reminder-rules');
      const data = await res.json();
      setReminderRules(data.data || []);
    } catch (e) {
      console.error('Load reminder rules error:', e);
    }
  }, []);

  const loadWeeklySummary = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/weekly-summary');
      const data = await res.json();
      setWeeklySummary(data.data || null);
    } catch (e) {
      console.error('Load weekly summary error:', e);
    }
  }, []);

  const loadTimeline = useCallback(async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/timeline`);
      const data = await res.json();
      setTimeline(data.data?.timeline || []);
    } catch (e) {
      console.error('Load timeline error:', e);
    }
  }, []);

  const loadEmailPreview = useCallback(async (contractId: string, reminderType: string = 'T-45') => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/preview-email?reminderType=${reminderType}`);
      const data = await res.json();
      setEmailPreview(data.data || null);
    } catch (e) {
      console.error('Load email preview error:', e);
    }
  }, []);

  const openOutlookCompose = () => {
    if (!emailPreview) return;
    const params = new URLSearchParams({
      to: emailPreview.to,
      cc: emailPreview.cc,
      subject: emailPreview.subject,
      body: emailPreview.body,
    });
    // Outlook Web deep link
    const url = `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
    window.open(url, '_blank');
  };

  const confirmEmailSent = async () => {
    if (!selectedContract) return;
    try {
      // 如果合同状态是pending_sign，先改为signing（开始签署）
      const res = await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContract.id,
          status: selectedContract.status === 'pending_sign' ? 'signing' : selectedContract.status,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowEmailModal(false);
        loadContracts();
      }
    } catch (e) {
      console.error('Confirm email sent error:', e);
    }
  };

  const loadEligibleEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/eligible-employees');
      const data = await res.json();
      // API返回 { code: 0, data: { employees: [...], total: N } }
      const employees = data?.data?.employees || data?.employees || [];
      setEligibleEmployees(Array.isArray(employees) ? employees : []);
    } catch (e) {
      console.error('Load eligible employees error:', e);
      setEligibleEmployees([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadContracts(), loadExpiring()]).finally(() => setLoading(false));
  }, [loadContracts, loadExpiring]);

  useEffect(() => {
    if (activeTab === 'rules') loadReminderRules();
    if (activeTab === 'summary') loadWeeklySummary();
  }, [activeTab, loadReminderRules, loadWeeklySummary]);

  useEffect(() => {
    if (showAddModal) loadEligibleEmployees();
  }, [showAddModal, loadEligibleEmployees]);

  const handleSelectEmployee = (emp: typeof eligibleEmployees[0]) => {
    const startDate = emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    // Default end date is 1 year from start date
    const endDateObj = new Date(startDate);
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    
    setNewContract({
      ...newContract,
      employeeId: emp.id, // Use candidate id as employee id
      candidateId: emp.id,
      employeeName: emp.name,
      department: emp.department || '',
      position: emp.appliedPosition || '',
      startDate,
      endDate,
    });
  };

  const handleAddContract = async () => {
    // Validate required fields
    if (!newContract.employeeId || !newContract.employeeName || !newContract.startDate || !newContract.endDate) {
      alert('请填写必填字段：员工、开始日期、结束日期');
      return;
    }
    
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract),
      });
      
      const data = await res.json();
      
      if (res.ok && data.code === 0) {
        setShowAddModal(false);
        setNewContract({ employeeId: '', candidateId: '', employeeName: '', department: '', position: '', startDate: '', endDate: '' });
        loadContracts();
        loadExpiring();
        alert('合同创建成功！');
      } else {
        alert(`创建失败: ${data.message || '未知错误'}`);
      }
    } catch (e) {
      console.error('Add contract error:', e);
      alert('创建合同失败，请稍后重试');
    }
  };

  const handleRenew = async (contractId: string, action: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/renew`, {
        method: action === 'initiate' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'initiate' ? {} : { action }),
      });
      if (res.ok) {
        setShowRenewModal(false);
        loadContracts();
        loadExpiring();
      }
    } catch (e) {
      console.error('Renew error:', e);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch('/api/contracts/reminder-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, enabled }),
      });
      loadReminderRules();
    } catch (e) {
      console.error('Toggle rule error:', e);
    }
  };

  const openTimeline = (contract: Contract) => {
    setSelectedContract(contract);
    loadTimeline(contract.id);
    setShowTimelineModal(true);
  };

  const openEmailPreview = (contract: Contract, reminderType: string = 'T-45') => {
    setSelectedContract(contract);
    loadEmailPreview(contract.id, reminderType);
    setShowEmailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_sign': return 'text-orange-400 bg-orange-500/10';
      case 'signing': return 'text-yellow-400 bg-yellow-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'expiring': return 'text-yellow-400 bg-yellow-500/10';
      case 'renewing': return 'text-sky-400 bg-sky-500/10';
      case 'renewed': return 'text-emerald-400 bg-emerald-500/10';
      case 'terminated': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_sign': return '待签署';
      case 'signing': return '签核中';
      case 'completed': return '已完成';
      case 'active': return '生效中';
      case 'expiring': return '即将到期';
      case 'renewing': return '续签中';
      case 'renewed': return '已续签';
      case 'terminated': return '已终止';
      default: return status;
    }
  };

  // 更新合同状态
  const handleUpdateStatus = async (contractId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/contracts?id=${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.code === 0) {
        // 如果状态变为completed，自动触发入职流程
        if (newStatus === 'completed') {
          const contract = contracts.find(c => c.id === contractId);
          if (contract) {
            try {
              const onboardingRes = await fetch('/api/onboarding/auto-initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId }),
              });
              const onboardingData = await onboardingRes.json();
              if (onboardingData.code === 0) {
                alert(`已为 ${contract.employeeName} 自动创建入职记录并通知相关人员`);
              }
            } catch (err) {
              console.error('自动创建入职记录失败:', err);
            }
          }
        }
        loadContracts();
      } else {
        alert(data.message || '状态更新失败');
      }
    } catch (err) {
      console.error('状态更新失败:', err);
      alert('状态更新失败，请稍后重试');
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
          <h1 className="text-2xl font-bold text-white">合同管理</h1>
          <p className="mt-1 text-sm text-slate-400">员工合同续签提醒与生命周期管理</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4" />
          新建合同
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[#1e293b] bg-[#111827] p-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}
        >
          <FileSignature className="mr-2 inline h-4 w-4" />
          合同列表
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Bell className="mr-2 inline h-4 w-4" />
          提醒规则
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar className="mr-2 inline h-4 w-4" />
          周报摘要
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Expiring Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-400">{expiringContracts.urgent.length}</p>
                  <p className="text-xs text-slate-400">30天内到期</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{expiringContracts.warning.length}</p>
                  <p className="text-xs text-slate-400">31-60天到期</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{contracts.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-slate-400">正常合同</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contracts List */}
          <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
            <div className="border-b border-[#1e293b] p-4">
              <h2 className="text-lg font-semibold text-white">合同列表</h2>
            </div>
            <div className="divide-y divide-[#1e293b]">
              {contracts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无合同记录</div>
              ) : (
                contracts.map(contract => (
                  <div key={contract.id}>
                    <div className="flex items-center justify-between p-4 hover:bg-[#1a2236]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                          <FileSignature className="h-5 w-5 text-sky-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{contract.employeeName}</p>
                            {contract.contractNo && (
                              <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
                                {contract.contractNo}
                              </span>
                            )}
                            {contract.source === 'recruitment' && (
                              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                招聘转入
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {contract.department} · {contract.position} · {contract.contractType === 'regular' ? '正式' : contract.contractType === 'fixed_term' ? '固定期限' : '实习'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-300">
                            {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                          {contract.daysLeft !== undefined && contract.daysLeft <= 90 && (
                            <p className={`text-xs ${contract.daysLeft <= 30 ? 'text-red-400' : contract.daysLeft <= 60 ? 'text-yellow-400' : 'text-slate-400'}`}>
                              剩余 {contract.daysLeft} 天
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                        {/* 状态流转按钮 */}
                        {contract.status === 'pending_sign' && (
                          <button
                            onClick={() => handleUpdateStatus(contract.id, 'signing')}
                            className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/20"
                          >
                            开始签署
                          </button>
                        )}
                        {contract.status === 'signing' && (
                          <button
                            onClick={() => handleUpdateStatus(contract.id, 'completed')}
                            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20"
                          >
                            完成签署
                          </button>
                        )}
                        {contract.status === 'completed' && contract.onboardingId && (
                          <span className="rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-400">
                            已发起入职
                          </span>
                        )}
                        <button
                          onClick={() => openTimeline(contract)}
                          className="rounded-lg bg-slate-500/10 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-500/20"
                          title="查看时间线"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        {(contract.status === 'active' || contract.status === 'expiring') && (
                          <>
                            <button
                              onClick={() => openEmailPreview(contract)}
                              className="rounded-lg bg-purple-500/10 px-2 py-1.5 text-xs text-purple-400 hover:bg-purple-500/20"
                              title="预览提醒邮件"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedContract(contract); setShowRenewModal(true); }}
                              className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20"
                            >
                              续签
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                          className="rounded-lg bg-slate-500/10 p-1.5 text-slate-400 hover:bg-slate-500/20"
                        >
                          {expandedContract === contract.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {expandedContract === contract.id && (
                      <div className="border-t border-[#1e293b] bg-[#0a0e1a] p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-slate-500">合同类型</p>
                            <p className="text-white">{contract.contractType === 'regular' ? '正式合同' : contract.contractType === 'fixed_term' ? '固定期限' : '实习合同'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">员工ID</p>
                            <p className="text-white">{contract.employeeId.slice(0, 8)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">续签状态</p>
                            <p className="text-white">{contract.renewInitiatedBy ? '已发起' : '未发起'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">备注</p>
                            <p className="text-white">{contract.renewNotes || '无'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'rules' && (
        <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
          <div className="border-b border-[#1e293b] p-4">
            <h2 className="text-lg font-semibold text-white">提醒规则配置</h2>
            <p className="mt-1 text-sm text-slate-400">配置合同到期前的自动提醒规则（T-45/T-30/T-15/T-7）</p>
          </div>
          <div className="divide-y divide-[#1e293b]">
            {reminderRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${rule.enabled ? 'bg-sky-500/10' : 'bg-slate-500/10'}`}>
                    <Bell className={`h-5 w-5 ${rule.enabled ? 'text-sky-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{rule.name} 提醒</p>
                    <p className="text-xs text-slate-400">
                      到期前 {rule.daysBefore} 天 · 接收人：{rule.recipientTypes.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openEmailPreview({ id: 'preview', employeeId: 'demo', employeeName: '演示员工', department: '技术部', position: '工程师', contractType: 'regular', startDate: '', endDate: '' } as Contract, rule.name)}
                    className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-500/20"
                  >
                    预览邮件
                  </button>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id, !rule.enabled)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sky-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'summary' && weeklySummary && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
            <h2 className="text-lg font-semibold text-white">
              周报摘要 ({weeklySummary.period?.start || 'N/A'} ~ {weeklySummary.period?.end || 'N/A'})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-2xl font-bold text-sky-400">{weeklySummary.pending?.total || 0}</p>
              <p className="text-sm text-slate-400">本周待处理</p>
              <div className="mt-2 space-y-1">
                {(weeklySummary.pending?.items || []).slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500">{item.employeeName} - {item.reminderType}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-2xl font-bold text-red-400">{weeklySummary.overdue?.total || 0}</p>
              <p className="text-sm text-slate-400">逾期风险</p>
              <div className="mt-2 space-y-1">
                {(weeklySummary.overdue?.items || []).slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500">{item.employeeName} - 逾期{item.daysOverdue}天</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-2xl font-bold text-green-400">{weeklySummary.completed?.total || 0}</p>
              <p className="text-sm text-slate-400">本周已完成</p>
              <div className="mt-2 space-y-1">
                {(weeklySummary.completed?.items || []).slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500">{item.employeeName}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-2xl font-bold text-yellow-400">{weeklySummary.upcoming?.total || 0}</p>
              <p className="text-sm text-slate-400">未来30天到期</p>
              <div className="mt-2 space-y-1">
                {(weeklySummary.upcoming?.items || []).slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500">{item.employeeName} - {item.daysLeft}天</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新建合同">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">选择已入职员工（可选）</label>
            <select
              value={newContract.candidateId}
              onChange={e => {
                const emp = eligibleEmployees.find(emp => emp.id === e.target.value);
                if (emp) handleSelectEmployee(emp);
                else setNewContract({ ...newContract, candidateId: '' });
              }}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            >
              <option value="">-- 手动填写或选择员工 --</option>
              {(eligibleEmployees || []).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.department || '未分配'} - {emp.appliedPosition || '未设置'}</option>
              ))}
            </select>
            {(eligibleEmployees || []).length === 0 && (
              <p className="mt-1 text-xs text-slate-500">暂无可选择的已入职员工，请手动填写</p>
            )}
          </div>
          <div>
            <label className="text-sm text-slate-400">员工姓名</label>
            <input
              type="text"
              value={newContract.employeeName}
              onChange={e => setNewContract({ ...newContract, employeeName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">部门</label>
              <input
                type="text"
                value={newContract.department}
                onChange={e => setNewContract({ ...newContract, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">职位</label>
              <input
                type="text"
                value={newContract.position}
                onChange={e => setNewContract({ ...newContract, position: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">开始日期</label>
              <input
                type="date"
                lang="zh-CN"
                value={newContract.startDate}
                onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white [color-scheme:dark]"
                placeholder="请选择开始日期"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">结束日期</label>
              <input
                type="date"
                lang="zh-CN"
                value={newContract.endDate}
                onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white [color-scheme:dark]"
                placeholder="请选择结束日期"
              />
            </div>
          </div>
          <button
            onClick={handleAddContract}
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
          >
            创建合同
          </button>
        </div>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="合同续签">
        {selectedContract && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0e1a] p-4">
              <p className="text-sm text-slate-400">员工</p>
              <p className="font-medium text-white">{selectedContract.employeeName}</p>
              <p className="mt-2 text-sm text-slate-400">当前到期日</p>
              <p className="font-medium text-white">{new Date(selectedContract.endDate).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRenew(selectedContract.id, 'initiate')}
                className="flex-1 rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
              >
                发起续签
              </button>
              {selectedContract.status === 'renewing' && (
                <>
                  <button
                    onClick={() => handleRenew(selectedContract.id, 'approve')}
                    className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                  >
                    审批通过
                  </button>
                  <button
                    onClick={() => handleRenew(selectedContract.id, 'execute')}
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-white hover:bg-emerald-600"
                  >
                    执行签署
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Timeline Modal */}
      <Modal isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="合同状态追踪">
        {selectedContract && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0e1a] p-4">
              <p className="font-medium text-white">{selectedContract.employeeName}</p>
              <p className="text-sm text-slate-400">{selectedContract.department} · {selectedContract.position}</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="py-4 text-center text-slate-500">暂无时间线记录</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-4 top-8 h-full w-px bg-[#1e293b]" />
                      )}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.type === 'system' ? 'bg-slate-500/20' : event.type === 'action' ? 'bg-sky-500/20' : 'bg-green-500/20'}`}>
                        {event.type === 'system' ? <FileSignature className="h-4 w-4 text-slate-400" /> :
                         event.type === 'action' ? <CheckCircle className="h-4 w-4 text-sky-400" /> :
                         <Bell className="h-4 w-4 text-green-400" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-sm text-slate-400">{event.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleString()} · {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Email Preview Modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="邮件预览">
        {emailPreview && (
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
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
              <p className="text-xs text-purple-400">
                说明：本邮件由 AI 辅助生成，具体续签决定需由业务经理与 HRBP/RP 按公司流程人工确认。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openOutlookCompose}
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                <Mail className="h-4 w-4" />
                通过 Outlook 发送
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
        )}
      </Modal>
    </div>
  );
}
