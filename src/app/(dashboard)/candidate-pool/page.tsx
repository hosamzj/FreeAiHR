'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, Search, Filter, UserPlus, Star, RefreshCw, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface PoolCandidate {
  id: string;
  candidateId: string;
  status: string;
  poolTags: string[];
  skillTags: string[];
  notes?: string;
  expectedSalary?: string;
  location?: string;
  yearsExp?: number;
  education?: string;
  matchScore?: number;
  candidate?: {
    name: string;
    email?: string;
    phone?: string;
    appliedPosition?: string;
    currentCompany?: string;
  };
}

export default function CandidatePoolPage() {
  const [pool, setPool] = useState<PoolCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPoolEntry, setNewPoolEntry] = useState({ candidateId: '', status: 'active', skillTags: '', notes: '' });

  const loadPool = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('skillTag', searchTerm);
      const res = await fetch(`/api/candidate-pool?${params}`);
      const data = await res.json();
      setPool(data.data || []);
    } catch (e) {
      console.error('Load pool error:', e);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadPool().finally(() => setLoading(false));
  }, [loadPool]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/candidate-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPoolEntry,
          skillTags: newPoolEntry.skillTags.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewPoolEntry({ candidateId: '', status: 'active', skillTags: '', notes: '' });
        loadPool();
      }
    } catch (e) {
      console.error('Add to pool error:', e);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/candidate-pool', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      loadPool();
    } catch (e) {
      console.error('Update status error:', e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要从候选人池中移除 ${name} 吗？`)) return;
    try {
      const res = await fetch(`/api/candidate-pool?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        loadPool();
      } else {
        alert(data.message || '移除失败');
      }
    } catch (e) {
      console.error('Delete from pool error:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'reserve': return 'text-sky-400 bg-sky-500/10';
      case 'blacklist': return 'text-red-400 bg-red-500/10';
      case 'hired': return 'text-emerald-400 bg-emerald-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'reserve': return '储备';
      case 'blacklist': return '黑名单';
      case 'hired': return '已入职';
      default: return status;
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
          <h1 className="text-2xl font-bold text-white">候选人池</h1>
          <p className="mt-1 text-sm text-slate-400">人才储备与多维度筛选管理</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          <UserPlus className="h-4 w-4" />
          添加到池
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索技能标签..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#1e293b] bg-[#111827] py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#1e293b] bg-[#111827] px-3 py-2 text-sm text-white"
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="reserve">储备</option>
            <option value="blacklist">黑名单</option>
            <option value="hired">已入职</option>
          </select>
        </div>
      </div>

      {/* Pool List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pool.length === 0 ? (
          <div className="col-span-full rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center text-slate-500">
            暂无候选人
          </div>
        ) : (
          pool.map(p => (
            <div key={p.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 hover:border-sky-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{p.candidate?.name || '未知'}</p>
                  <p className="text-xs text-slate-400">{p.candidate?.appliedPosition || '未指定岗位'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                  <button
                    onClick={() => handleDelete(p.id, p.candidate?.name || '未知')}
                    className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="从候选池移除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(p.skillTags || []).slice(0, 4).map((tag, i) => (
                  <span key={i} className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">
                    {tag}
                  </span>
                ))}
                {(p.skillTags || []).length > 4 && (
                  <span className="text-[10px] text-slate-500">+{p.skillTags.length - 4}</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                {p.yearsExp && <span>{p.yearsExp}年经验</span>}
                {p.education && <span>{p.education}</span>}
                {p.location && <span>{p.location}</span>}
              </div>
              {p.matchScore && (
                <div className="mt-2 flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">匹配度 {p.matchScore}%</span>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <select
                  value={p.status}
                  onChange={e => handleStatusChange(p.id, e.target.value)}
                  className="flex-1 rounded border border-[#1e293b] bg-[#0a0e1a] px-2 py-1 text-xs text-white"
                >
                  <option value="active">活跃</option>
                  <option value="reserve">储备</option>
                  <option value="blacklist">黑名单</option>
                  <option value="hired">已入职</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="添加到候选人池">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">候选人ID</label>
            <input
              type="text"
              value={newPoolEntry.candidateId}
              onChange={e => setNewPoolEntry({ ...newPoolEntry, candidateId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              placeholder="输入候选人ID"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">状态</label>
            <select
              value={newPoolEntry.status}
              onChange={e => setNewPoolEntry({ ...newPoolEntry, status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            >
              <option value="active">活跃</option>
              <option value="reserve">储备</option>
              <option value="blacklist">黑名单</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400">技能标签（逗号分隔）</label>
            <input
              type="text"
              value={newPoolEntry.skillTags}
              onChange={e => setNewPoolEntry({ ...newPoolEntry, skillTags: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">备注</label>
            <textarea
              value={newPoolEntry.notes}
              onChange={e => setNewPoolEntry({ ...newPoolEntry, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              rows={3}
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
          >
            添加到池
          </button>
        </div>
      </Modal>
    </div>
  );
}
