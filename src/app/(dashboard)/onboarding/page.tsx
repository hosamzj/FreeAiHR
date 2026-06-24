'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, CheckCircle, Clock, AlertCircle, RefreshCw, Plus } from 'lucide-react';
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
  employeeName: string;
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
}

export default function OnboardingPage() {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, needFollowUp: 0 });
  const [loading, setLoading] = useState(true);
  const [showInitModal, setShowInitModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [newOnboarding, setNewOnboarding] = useState({ candidateId: '', employeeName: '', position: '', department: '', startDate: '' });

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/dashboard');
      const data = await res.json();
      setOnboardings(data.data?.onboardings || []);
      setStats(data.data?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, needFollowUp: 0 });
    } catch (e) {
      console.error('Load dashboard error:', e);
    }
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

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
        setSelectedOnboarding(data.data?.onboarding || null);
      }
    } catch (e) {
      console.error('Complete task error:', e);
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
      case 'in_progress': return 'text-sky-400 bg-sky-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
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
              <div key={ob.id} className="p-4 hover:bg-[#1a2236]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                      <UserPlus className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{ob.employeeName}</p>
                      <p className="text-xs text-slate-400">
                        {ob.department} · {ob.position} · 入职日期: {new Date(ob.startDate).toLocaleDateString()}
                      </p>
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
                      {ob.status === 'pending' ? '待入职' : ob.status === 'in_progress' ? '入职中' : ob.status === 'completed' ? '已完成' : ob.status}
                    </span>
                    <button
                      onClick={() => setSelectedOnboarding(ob)}
                      className="rounded-lg bg-[#1a2236] px-3 py-1.5 text-xs text-slate-300 hover:bg-[#253049]"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
                {ob.daysSinceStart >= 7 && !ob.day7FollowUp && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-red-400">入职已满7天，请安排回访</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Initiate Modal */}
      <Modal isOpen={showInitModal} onClose={() => setShowInitModal(false)} title="发起入职">
        <div className="space-y-4">
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
              value={newOnboarding.startDate}
              onChange={e => setNewOnboarding({ ...newOnboarding, startDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
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
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">入职任务</h3>
              <div className="space-y-2">
                {selectedOnboarding.tasks?.map(task => (
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
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
