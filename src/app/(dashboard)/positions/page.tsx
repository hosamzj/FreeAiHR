'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Briefcase, MapPin, Users, Clock,
  MoreHorizontal, Eye, Edit3, Pause, Play, Trash2,
  Sparkles, ChevronDown, FileText, Building2, DollarSign,
  X, Check, Loader2, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string | null;
  type: string;
  status: string;
  description: string | null;
  requirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  headcount: number;
  channels: string;
  createdAt: string;
  updatedAt: string;
  _count?: { candidates: number };
}

interface PositionTemplate {
  id: string;
  category: string;
  title: string;
  description: string | null;
  requirements: string | null;
  industry: string | null;
  usageCount: number;
}

const typeLabels: Record<string, string> = {
  full_time: '全职', part_time: '兼职', intern: '实习',
};

const statusLabels: Record<string, string> = {
  open: '招聘中', closed: '已关闭', paused: '已暂停',
};

const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const departmentColors: Record<string, string> = {
  '技术部': 'bg-sky-500/10 text-sky-400',
  '产品部': 'bg-violet-500/10 text-violet-400',
  '设计部': 'bg-pink-500/10 text-pink-400',
  '运营部': 'bg-orange-500/10 text-orange-400',
  '市场部': 'bg-emerald-500/10 text-emerald-400',
  '销售部': 'bg-amber-500/10 text-amber-400',
  '财务部': 'bg-cyan-500/10 text-cyan-400',
  '人事部': 'bg-rose-500/10 text-rose-400',
};

export default function PositionsPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [templates, setTemplates] = useState<PositionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFromTemplateModal, setShowFromTemplateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create / Edit form
  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'full_time',
    description: '', requirements: '', salaryMin: '', salaryMax: '',
    headcount: '1',
  });

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/positions');
      const data = await res.json();
      if (data.code === 0) {
        setPositions(data.data || []);
      }
    } catch (e) {
      console.error('Fetch positions error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/position-templates?status=active');
      const data = await res.json();
      if (data.code === 0) {
        setTemplates(data.data || []);
      }
    } catch (e) {
      console.error('Fetch templates error:', e);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    fetchTemplates();
  }, [fetchPositions, fetchTemplates]);

  // Create position
  const handleCreate = useCallback(async () => {
    if (!form.title || !form.department) {
      alert('请填写岗位名称和所属部门');
      return;
    }
    setActionLoading('create');
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          location: form.location || null,
          type: form.type,
          description: form.description || null,
          requirements: form.requirements || null,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
          headcount: parseInt(form.headcount) || 1,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowCreateModal(false);
        resetForm();
        fetchPositions();
      } else {
        alert(data.message || '创建失败');
      }
    } catch (e) {
      alert('创建失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [form, fetchPositions]);

  // Create from template
  const handleCreateFromTemplate = useCallback(async (template: PositionTemplate) => {
    setActionLoading(`template-${template.id}`);
    try {
      const requirements = template.requirements ? (() => {
        try { return JSON.parse(template.requirements); } catch { return template.requirements; }
      })() : '';
      const requirementsStr = typeof requirements === 'string' ? requirements : JSON.stringify(requirements);

      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title,
          department: template.category === 'tech' ? '技术部' :
            template.category === 'product' ? '产品部' :
            template.category === 'design' ? '设计部' :
            template.category === 'operations' ? '运营部' :
            template.category === 'sales' ? '销售部' : '人事部',
          type: 'full_time',
          description: template.description || null,
          requirements: requirementsStr || null,
          headcount: 1,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowFromTemplateModal(false);
        fetchPositions();
        // Update template usage count on server
        try {
          await fetch(`/api/position-templates?id=${template.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usageCount: (template.usageCount || 0) + 1 }),
          });
        } catch { /* ignore */ }
      } else {
        alert(data.message || '创建失败');
      }
    } catch (e) {
      alert('创建失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [fetchPositions]);

  // Edit position
  const handleEdit = useCallback(async () => {
    if (!selectedPosition || !form.title || !form.department) {
      alert('请填写岗位名称和所属部门');
      return;
    }
    setActionLoading('edit');
    try {
      const res = await fetch(`/api/positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPosition.id,
          title: form.title,
          department: form.department,
          location: form.location || null,
          type: form.type,
          description: form.description || null,
          requirements: form.requirements || null,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
          headcount: parseInt(form.headcount) || 1,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowEditModal(false);
        setSelectedPosition(null);
        resetForm();
        fetchPositions();
      } else {
        alert(data.message || '更新失败');
      }
    } catch (e) {
      alert('更新失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [selectedPosition, form, fetchPositions]);

  // Toggle status
  const handleToggleStatus = useCallback(async (pos: JobPosition) => {
    const newStatus = pos.status === 'open' ? 'paused' : 'open';
    setActionLoading(`status-${pos.id}`);
    try {
      const res = await fetch('/api/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pos.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.code === 0) {
        fetchPositions();
      }
    } catch (e) {
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  }, [fetchPositions]);

  // Delete position
  const handleDelete = useCallback(async (pos: JobPosition) => {
    if (!confirm(`确定要删除职位「${pos.title}」吗？此操作不可撤销。`)) return;
    setActionLoading(`delete-${pos.id}`);
    try {
      const res = await fetch(`/api/positions?id=${pos.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        fetchPositions();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (e) {
      alert('删除失败，请重试');
    } finally {
      setActionLoading(null);
    }
  }, [fetchPositions]);

  const openEditModal = useCallback((pos: JobPosition) => {
    setSelectedPosition(pos);
    setForm({
      title: pos.title,
      department: pos.department,
      location: pos.location || '',
      type: pos.type,
      description: pos.description || '',
      requirements: pos.requirements || '',
      salaryMin: pos.salaryMin?.toString() || '',
      salaryMax: pos.salaryMax?.toString() || '',
      headcount: pos.headcount.toString(),
    });
    setShowEditModal(true);
  }, []);

  const openDetailModal = useCallback((pos: JobPosition) => {
    setSelectedPosition(pos);
    setShowDetailModal(true);
  }, []);

  const resetForm = () => {
    setForm({
      title: '', department: '', location: '', type: 'full_time',
      description: '', requirements: '', salaryMin: '', salaryMax: '',
      headcount: '1',
    });
  };

  // Filter positions
  const filtered = positions.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())
      && !p.department.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: positions.length,
    open: positions.filter(p => p.status === 'open').length,
    paused: positions.filter(p => p.status === 'paused').length,
    closed: positions.filter(p => p.status === 'closed').length,
  };

  const parseRequirements = (req: string | null): string[] => {
    if (!req) return [];
    try {
      const parsed = JSON.parse(req);
      return Array.isArray(parsed) ? parsed : [req];
    } catch {
      return req.split('\n').filter(Boolean);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white md:text-xl">职位管理</h2>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">发布和管理招聘职位，从岗位模板快速创建</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowFromTemplateModal(true); fetchTemplates(); }}
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-400 transition-all hover:bg-sky-500/20 md:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            从模板创建
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-sky-600 md:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            新建职位
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        {[
          { label: '全部职位', value: stats.total, icon: Briefcase, color: 'bg-sky-500/10', iconColor: 'text-sky-400' },
          { label: '招聘中', value: stats.open, icon: Play, color: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
          { label: '已暂停', value: stats.paused, icon: Pause, color: 'bg-amber-500/10', iconColor: 'text-amber-400' },
          { label: '已关闭', value: stats.closed, icon: X, color: 'bg-slate-500/10', iconColor: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#1e293b] bg-[#111827] p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-1.5', s.color)}>
                <s.icon className={cn('h-3.5 w-3.5', s.iconColor)} />
              </div>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold text-white md:text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-lg bg-[#111827] border border-[#1e293b] p-1">
          {[
            { value: 'all', label: '全部' },
            { value: 'open', label: '招聘中' },
            { value: 'paused', label: '已暂停' },
            { value: 'closed', label: '已关闭' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                statusFilter === tab.value
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索职位..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1e293b] bg-[#111827] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none sm:w-56 md:text-sm"
          />
        </div>
      </div>

      {/* Position List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Briefcase className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">暂无职位</p>
          <p className="text-xs mt-1">点击「从模板创建」或「新建职位」开始发布</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(pos => (
            <div
              key={pos.id}
              className="group rounded-xl border border-[#1e293b] bg-[#111827] p-4 transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold text-white truncate cursor-pointer hover:text-sky-400 transition-colors"
                      onClick={() => openDetailModal(pos)}
                    >
                      {pos.title}
                    </h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium border shrink-0', statusColors[pos.status] || '')}>
                      {statusLabels[pos.status] || pos.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px]', departmentColors[pos.department] || 'bg-slate-500/10 text-slate-400')}>
                      {pos.department}
                    </span>
                    {pos.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {pos.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {typeLabels[pos.type] || pos.type}
                    </span>
                  </div>
                  {(pos.salaryMin || pos.salaryMax) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                      <DollarSign className="h-3 w-3" />
                      {pos.salaryMin && pos.salaryMax
                        ? `${(pos.salaryMin / 1000).toFixed(0)}k-${(pos.salaryMax / 1000).toFixed(0)}k`
                        : pos.salaryMin ? `${(pos.salaryMin / 1000).toFixed(0)}k起` : `最高${(pos.salaryMax! / 1000).toFixed(0)}k`
                      }
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openEditModal(pos)}
                    className="rounded p-1.5 text-slate-500 hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                    title="编辑"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(pos)}
                    disabled={actionLoading === `status-${pos.id}`}
                    className="rounded p-1.5 text-slate-500 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                    title={pos.status === 'open' ? '暂停' : '恢复'}
                  >
                    {actionLoading === `status-${pos.id}`
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : pos.status === 'open' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(pos)}
                    disabled={actionLoading === `delete-${pos.id}`}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    {actionLoading === `delete-${pos.id}`
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#1e293b] pt-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="h-3 w-3" />
                  <span>{pos._count?.candidates ?? 0} 位候选人</span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {new Date(pos.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建职位" size="lg">
        <PositionForm
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading === 'create'}
          submitLabel="创建职位"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPosition(null); }} title="编辑职位" size="lg">
        <PositionForm
          form={form}
          setForm={setForm}
          onSubmit={handleEdit}
          onCancel={() => { setShowEditModal(false); setSelectedPosition(null); }}
          loading={actionLoading === 'edit'}
          submitLabel="保存修改"
        />
      </Modal>

      {/* From Template Modal */}
      <Modal isOpen={showFromTemplateModal} onClose={() => setShowFromTemplateModal(false)} title="从模板创建职位" size="lg">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <FileText className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">暂无可用模板</p>
              <p className="text-xs mt-1">请先在「岗位模板库」中创建模板</p>
            </div>
          ) : (
            templates.map(t => (
              <div
                key={t.id}
                className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4 hover:border-sky-500/30 transition-all cursor-pointer"
                onClick={() => handleCreateFromTemplate(t)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white">{t.title}</h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px]', departmentColors[
                        t.category === 'tech' ? '技术部' :
                        t.category === 'product' ? '产品部' :
                        t.category === 'design' ? '设计部' :
                        t.category === 'operations' ? '运营部' :
                        t.category === 'sales' ? '销售部' : '人事部'
                      ] || 'bg-slate-500/10 text-slate-400')}>
                        {t.category === 'tech' ? '技术研发' :
                         t.category === 'product' ? '产品设计' :
                         t.category === 'design' ? '设计创意' :
                         t.category === 'operations' ? '运营管理' :
                         t.category === 'sales' ? '销售市场' : '职能支持'}
                      </span>
                      {t.industry && <span>· {t.industry}</span>}
                      <span>· 已使用 {t.usageCount || 0} 次</span>
                    </div>
                    {t.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                  {actionLoading === `template-${t.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-sky-400 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedPosition(null); }} title={selectedPosition?.title || '职位详情'} size="lg">
        {selectedPosition && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium border', statusColors[selectedPosition.status] || '')}>
                {statusLabels[selectedPosition.status] || selectedPosition.status}
              </span>
              <span className={cn('rounded px-2 py-0.5 text-xs', departmentColors[selectedPosition.department] || 'bg-slate-500/10 text-slate-400')}>
                {selectedPosition.department}
              </span>
              <span className="text-xs text-slate-400">{typeLabels[selectedPosition.type] || selectedPosition.type}</span>
              {selectedPosition.location && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" /> {selectedPosition.location}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-3 text-center">
                <p className="text-xs text-slate-400">招聘人数</p>
                <p className="mt-1 font-mono text-lg font-bold text-white">{selectedPosition.headcount}</p>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-3 text-center">
                <p className="text-xs text-slate-400">候选人</p>
                <p className="mt-1 font-mono text-lg font-bold text-white">{selectedPosition._count?.candidates ?? 0}</p>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-3 text-center">
                <p className="text-xs text-slate-400">薪资范围</p>
                <p className="mt-1 font-mono text-sm font-bold text-orange-400">
                  {selectedPosition.salaryMin && selectedPosition.salaryMax
                    ? `${(selectedPosition.salaryMin / 1000).toFixed(0)}k-${(selectedPosition.salaryMax / 1000).toFixed(0)}k`
                    : selectedPosition.salaryMin ? `${(selectedPosition.salaryMin / 1000).toFixed(0)}k起` : '面议'}
                </p>
              </div>
            </div>

            {selectedPosition.description && (
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
                <h4 className="text-xs font-medium text-slate-400 mb-2">岗位描述</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedPosition.description}</p>
              </div>
            )}

            {selectedPosition.requirements && parseRequirements(selectedPosition.requirements).length > 0 && (
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
                <h4 className="text-xs font-medium text-slate-400 mb-2">任职要求</h4>
                <ul className="space-y-1.5">
                  {parseRequirements(selectedPosition.requirements).map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-[#1e293b]">
              <Clock className="h-3 w-3" />
              创建于 {new Date(selectedPosition.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Position Form Component
function PositionForm({
  form, setForm, onSubmit, onCancel, loading, submitLabel,
}: {
  form: { title: string; department: string; location: string; type: string; description: string; requirements: string; salaryMin: string; salaryMax: string; headcount: string };
  setForm: (f: typeof form) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  const departments = ['技术部', '产品部', '设计部', '运营部', '市场部', '销售部', '财务部', '人事部'];
  const types = [
    { value: 'full_time', label: '全职' },
    { value: 'part_time', label: '兼职' },
    { value: 'intern', label: '实习' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">岗位名称 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="如：高级前端工程师"
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">所属部门 *</label>
          <select
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
          >
            <option value="">请选择部门</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">工作地点</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="如：北京"
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">工作类型</label>
          <div className="flex gap-2">
            {types.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  form.type === t.value
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-[#0a0e1a] text-slate-400 border border-[#1e293b] hover:border-slate-600'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">薪资下限 (K/月)</label>
          <input
            type="number"
            value={form.salaryMin}
            onChange={e => setForm({ ...form, salaryMin: e.target.value })}
            placeholder="如：15"
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">薪资上限 (K/月)</label>
          <input
            type="number"
            value={form.salaryMax}
            onChange={e => setForm({ ...form, salaryMax: e.target.value })}
            placeholder="如：25"
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">招聘人数</label>
          <input
            type="number"
            value={form.headcount}
            onChange={e => setForm({ ...form, headcount: e.target.value })}
            min="1"
            className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">岗位描述</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={4}
          placeholder="描述该岗位的主要职责和工作内容..."
          className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">任职要求（每行一条）</label>
        <textarea
          value={form.requirements}
          onChange={e => setForm({ ...form, requirements: e.target.value })}
          rows={4}
          placeholder="本科及以上学历&#10;3年以上相关工作经验&#10;熟悉React/TypeScript..."
          className="w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none resize-none"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1e293b]">
        <button
          onClick={onCancel}
          className="rounded-lg border border-[#1e293b] px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
