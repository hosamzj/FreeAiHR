'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Building2, MapPin, Users, Briefcase, Plus, Edit3, Trash2, Search, Filter, Eye, Play, ChevronDown, X, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { AIJDModal } from '@/components/ai-jd-modal';

interface Position {
  id: string;
  title: string;
  department: string | null;
  category: string | null;
  industry: string | null;
  location: string | null;
  headcount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string;
  niceToHave: string;
  status: string;
  templateId: string | null;
  createdAt: string;
  creator: { id: string; name: string };
  _count: { candidates: number };
}

interface DictionaryItem {
  id: string;
  groupKey: string;
  value: string;
  sortOrder: number;
  enabled: boolean;
}

const statusLabels: Record<string, string> = {
  open: '招聘中',
  closed: '已关闭',
  draft: '草稿',
};

const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function PositionsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIJDModal, setShowAIJDModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);
  const [categories, setCategories] = useState<DictionaryItem[]>([]);
  const [industries, setIndustries] = useState<DictionaryItem[]>([]);
  const [departments, setDepartments] = useState<DictionaryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [form, setForm] = useState({
    title: '',
    department: '',
    category: '',
    industry: '',
    location: '',
    headcount: 1,
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    niceToHave: '',
    status: 'open',
  });

  const fetchPositions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/positions?${params}`);
      const data = await res.json();
      if (data.code === 0) setPositions(data.data);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchDictionaries = useCallback(async () => {
    try {
      const [catRes, indRes, deptRes] = await Promise.all([
        fetch('/api/system/dictionary?groupKey=category'),
        fetch('/api/system/dictionary?groupKey=industry'),
        fetch('/api/system/dictionary?groupKey=department'),
      ]);
      const [catData, indData, deptData] = await Promise.all([catRes.json(), indRes.json(), deptRes.json()]);
      if (catData.code === 0) setCategories(catData.data.filter((d: DictionaryItem) => d.enabled));
      if (indData.code === 0) setIndustries(indData.data.filter((d: DictionaryItem) => d.enabled));
      if (deptData.code === 0) setDepartments(deptData.data.filter((d: DictionaryItem) => d.enabled));
    } catch (err) {
      console.error('Failed to fetch dictionaries:', err);
    }
  }, []);

  useEffect(() => { fetchPositions(); fetchDictionaries(); }, [fetchPositions, fetchDictionaries]);

  const resetForm = () => {
    setForm({ title: '', department: '', category: '', industry: '', location: '', headcount: 1, salaryMin: '', salaryMax: '', description: '', requirements: '', niceToHave: '', status: 'open' });
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          headcount: Number(form.headcount),
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
          niceToHave: form.niceToHave ? form.niceToHave.split('\n').filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowCreateModal(false);
        resetForm();
        fetchPositions();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingPosition) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPosition.id,
          ...form,
          headcount: Number(form.headcount),
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
          niceToHave: form.niceToHave ? form.niceToHave.split('\n').filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setShowEditModal(false);
        setEditingPosition(null);
        resetForm();
        fetchPositions();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该职位？')) return;
    await fetch(`/api/positions?id=${id}`, { method: 'DELETE' });
    fetchPositions();
  };

  const openEditModal = (pos: Position) => {
    setEditingPosition(pos);
    setForm({
      title: pos.title,
      department: pos.department || '',
      category: pos.category || '',
      industry: pos.industry || '',
      location: pos.location || '',
      headcount: pos.headcount,
      salaryMin: pos.salaryMin?.toString() || '',
      salaryMax: pos.salaryMax?.toString() || '',
      description: pos.description,
      requirements: (() => { try { return JSON.parse(pos.requirements).join('\n'); } catch { return pos.requirements; } })(),
      niceToHave: (() => { try { return JSON.parse(pos.niceToHave).join('\n'); } catch { return pos.niceToHave; } })(),
      status: pos.status,
    });
    setShowEditModal(true);
  };

  const handleAIGenerated = (result: { positionName: string; department: string; responsibilities: string[]; requirements: string[]; niceToHave: string[]; benefits: string[]; industry: string; experience: string; salary: string; skills: string[] }) => {
    setForm({
      ...form,
      title: result.positionName,
      department: result.department || '',
      industry: result.industry || '',
      description: result.responsibilities.join('\n'),
      requirements: result.requirements.join('\n'),
      niceToHave: result.niceToHave.join('\n'),
    });
    setShowAIJDModal(false);
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return '薪资面议';
    if (min && max) return `${(min / 1000).toFixed(0)}K-${(max / 1000).toFixed(0)}K`;
    if (min) return `${(min / 1000).toFixed(0)}K起`;
    return `最高${(max! / 1000).toFixed(0)}K`;
  };

  const filtered = positions.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.department || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formFields = (isEdit = false) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">职位名称 *</label>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="如：高级前端工程师"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">所属部门</label>
          <input
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            placeholder="如：技术部"
            list="dept-list"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <datalist id="dept-list">
            {departments.map(d => <option key={d.id} value={d.value} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">岗位类别</label>
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="如：技术研发"
            list="cat-list"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <datalist id="cat-list">
            {categories.map(c => <option key={c.id} value={c.value} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">行业类型</label>
          <input
            value={form.industry}
            onChange={e => setForm({ ...form, industry: e.target.value })}
            placeholder="如：互联网/IT"
            list="ind-list"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <datalist id="ind-list">
            {industries.map(i => <option key={i.id} value={i.value} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">工作地点</label>
          <input
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="如：北京"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">招聘人数</label>
          <input
            type="number"
            min={1}
            value={form.headcount}
            onChange={e => setForm({ ...form, headcount: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">薪资下限 (K/月)</label>
          <input
            type="number"
            value={form.salaryMin}
            onChange={e => setForm({ ...form, salaryMin: e.target.value })}
            placeholder="如：15"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">薪资上限 (K/月)</label>
          <input
            type="number"
            value={form.salaryMax}
            onChange={e => setForm({ ...form, salaryMax: e.target.value })}
            placeholder="如：25"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowAIJDModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI 生成 JD
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">职位描述 *</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={5}
          placeholder="详细描述职位职责和工作内容..."
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">任职要求（每行一条）</label>
        <textarea
          value={form.requirements}
          onChange={e => setForm({ ...form, requirements: e.target.value })}
          rows={4}
          placeholder="本科及以上学历&#10;3年以上相关经验&#10;熟悉React/Vue等主流框架"
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">加分项（每行一条）</label>
        <textarea
          value={form.niceToHave}
          onChange={e => setForm({ ...form, niceToHave: e.target.value })}
          rows={3}
          placeholder="有开源项目经验&#10;有团队管理经验"
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">状态</label>
        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="draft">草稿</option>
          <option value="open">招聘中</option>
          <option value="closed">已关闭</option>
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">职位发布</h1>
          <p className="text-sm text-muted-foreground mt-1">管理招聘职位，AI智能匹配候选人</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          发布职位
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索职位名称或部门..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">全部状态</option>
          <option value="open">招聘中</option>
          <option value="draft">草稿</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {/* Position Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无职位发布</p>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="mt-3 text-sm text-primary hover:underline"
          >
            发布第一个职位
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(pos => (
            <div
              key={pos.id}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{pos.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {pos.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {pos.department}
                      </span>
                    )}
                    {pos.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {pos.location}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs border ${statusColors[pos.status] || statusColors.open}`}>
                  {statusLabels[pos.status] || pos.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {pos.headcount}人
                </span>
                <span>{formatSalary(pos.salaryMin, pos.salaryMax)}</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {pos._count.candidates}候选人
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                {pos.description}
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => { setDetailPosition(pos); setShowDetailModal(true); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看
                </button>
                <button
                  onClick={() => openEditModal(pos)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(pos.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">发布新职位</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-muted/50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-4">{formFields(false)}</div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">取消</button>
              <button onClick={handleCreate} disabled={submitting || !form.title || !form.description} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {submitting ? '发布中...' : '发布职位'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">编辑职位</h2>
              <button onClick={() => { setShowEditModal(false); setEditingPosition(null); }} className="p-1 hover:bg-muted/50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-4">{formFields(true)}</div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setShowEditModal(false); setEditingPosition(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">取消</button>
              <button onClick={handleEdit} disabled={submitting || !form.title || !form.description} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {submitting ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailPosition.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {detailPosition.department && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{detailPosition.department}</span>}
                  {detailPosition.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{detailPosition.location}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[detailPosition.status]}`}>{statusLabels[detailPosition.status]}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-muted/50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">招聘 {detailPosition.headcount} 人</span>
                <span className="text-muted-foreground">{formatSalary(detailPosition.salaryMin, detailPosition.salaryMax)}</span>
                {detailPosition.category && <span className="text-muted-foreground">{detailPosition.category}</span>}
                {detailPosition.industry && <span className="text-muted-foreground">{detailPosition.industry}</span>}
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">职位描述</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailPosition.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">任职要求</h4>
                <ul className="list-disc list-inside space-y-1">
                  {((): string[] => { try { return JSON.parse(detailPosition.requirements); } catch { return []; } })().map((r: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">加分项</h4>
                <ul className="list-disc list-inside space-y-1">
                  {((): string[] => { try { return JSON.parse(detailPosition.niceToHave); } catch { return []; } })().map((r: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI JD Modal */}
      {showAIJDModal && (
        <AIJDModal
          isOpen={showAIJDModal}
          onClose={() => setShowAIJDModal(false)}
          onGenerate={handleAIGenerated}
        />
      )}
    </div>
  );
}
