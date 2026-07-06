'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Sparkles, RefreshCw, Edit2, Trash2, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { AIJDModal } from '@/components/ai-jd-modal';

interface Template {
  id: string;
  category: string;
  title: string;
  department?: string;
  description?: string;
  requirements?: string;
  industry?: string;
  version: number;
  usageCount: number;
  status: string;
}

interface DictItem { id: string; groupKey: string; value: string; sortOrder: number; enabled: boolean; }

const emptyTemplate = { category: '', title: '', department: '', description: '', requirements: '', industry: '' };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState(emptyTemplate);
  const [saving, setSaving] = useState(false);

  // Dynamic dropdown options from dictionary
  const [categories, setCategories] = useState<DictItem[]>([]);
  const [industries, setIndustries] = useState<DictItem[]>([]);
  const [departments, setDepartments] = useState<DictItem[]>([]);

  // Load dictionary options
  useEffect(() => {
    const loadDict = async (groupKey: string) => {
      try {
        const res = await fetch(`/api/system/dictionary?groupKey=${groupKey}`);
        const data = await res.json();
        if (data.code === 0) return data.data as DictItem[];
      } catch (e) { console.error(`Load ${groupKey} error:`, e); }
      return [];
    };
    Promise.all([
      loadDict('category').then(setCategories),
      loadDict('industry').then(setIndustries),
      loadDict('department').then(setDepartments),
    ]);
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/position-templates?${params}`);
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (e) {
      console.error('Load templates error:', e);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadTemplates().finally(() => setLoading(false));
  }, [loadTemplates]);

  const handleAdd = async () => {
    if (!newTemplate.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTemplate(emptyTemplate);
        loadTemplates();
      }
    } catch (e) {
      console.error('Add template error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/position-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate.id,
          category: editingTemplate.category,
          title: editingTemplate.title,
          department: editingTemplate.department,
          description: editingTemplate.description,
          requirements: editingTemplate.requirements,
          industry: editingTemplate.industry,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingTemplate(null);
        loadTemplates();
      }
    } catch (e) {
      console.error('Edit template error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此模板？')) return;
    try {
      await fetch(`/api/position-templates?id=${id}`, { method: 'DELETE' });
      loadTemplates();
    } catch (e) {
      console.error('Delete template error:', e);
    }
  };

  // AI 生成完成后自动创建模板
  const handleAIGenerated = async (jdData: {
    positionName: string;
    department: string;
    responsibilities: string[];
    requirements: string[];
    niceToHave: string[];
    benefits: string[];
    industry: string;
    experience: string;
    salary: string;
    skills: string[];
  }) => {
    try {
      const res = await fetch('/api/position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'tech',
          title: jdData.positionName || 'AI生成岗位',
          department: jdData.department || '',
          description: jdData.responsibilities?.join('\n') || '',
          requirements: jdData.requirements?.join('\n') || '',
          industry: jdData.industry || '',
        }),
      });
      if (res.ok) {
        setShowAIModal(false);
        loadTemplates();
      }
    } catch (e) {
      console.error('Auto-create template error:', e);
    }
  };

  const openEditModal = (t: Template) => {
    setEditingTemplate({ ...t });
    setShowEditModal(true);
  };

  const getCategoryLabel = (cat: string) => categories.find(c => c.value === cat)?.value || cat;

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
          <h1 className="text-2xl font-bold text-white">岗位模板库</h1>
          <p className="mt-1 text-sm text-slate-400">标准化JD模板管理与AI辅助生成</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20"
          >
            <Sparkles className="h-4 w-4" />
            AI生成模板
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            新建模板
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={`rounded-lg px-3 py-1.5 text-sm ${!categoryFilter ? 'bg-sky-500 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'}`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${categoryFilter === cat.value ? 'bg-sky-500 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'}`}
          >
            {cat.value}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center text-slate-500">
            暂无模板，点击上方按钮创建
          </div>
        ) : (
          templates.map(t => (
            <div
              key={t.id}
              onClick={() => openEditModal(t)}
              className="group cursor-pointer rounded-xl border border-[#1e293b] bg-[#111827] p-4 transition-all duration-200 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-sky-400" />
                  <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                    {getCategoryLabel(t.category)}
                  </span>
                  {t.industry && (
                    <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                      {t.industry}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                    className="rounded p-1 text-slate-500 hover:bg-sky-500/10 hover:text-sky-400"
                    title="编辑"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                    className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 font-medium text-white">{t.title}</h3>
              {t.department && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Building2 className="h-3 w-3" />
                  {t.department}
                </p>
              )}
              {t.description && (
                <p className="mt-2 line-clamp-3 text-xs text-slate-400">{t.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>版本 v{t.version}</span>
                <span>使用 {t.usageCount} 次</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新建岗位模板">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">岗位类别</label>
              <input
                type="text"
                value={newTemplate.category}
                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                placeholder="如：技术研发、产品设计..."
                list="category-suggestions-add"
              />
              <datalist id="category-suggestions-add">
                {categories.map(c => <option key={c.id} value={c.value} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm text-slate-400">行业类型</label>
              <input
                type="text"
                value={newTemplate.industry}
                onChange={e => setNewTemplate({ ...newTemplate, industry: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                placeholder="请选择或输入行业"
                list="industry-suggestions-add"
              />
              <datalist id="industry-suggestions-add">
                {industries.map(i => <option key={i.id} value={i.value} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">岗位名称</label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">所属部门</label>
              <input
                type="text"
                value={newTemplate.department}
                onChange={e => setNewTemplate({ ...newTemplate, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                placeholder="如：技术部"
                list="department-suggestions-add"
              />
              <datalist id="department-suggestions-add">
                {departments.map(d => <option key={d.id} value={d.value} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400">岗位职责</label>
            <textarea
              value={newTemplate.description}
              onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">任职要求</label>
            <textarea
              value={newTemplate.requirements}
              onChange={e => setNewTemplate({ ...newTemplate, requirements: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              rows={4}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newTemplate.title.trim()}
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {saving ? '创建中...' : '创建模板'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingTemplate(null); }} title="编辑岗位模板">
        {editingTemplate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">岗位类别</label>
                <input
                  type="text"
                  value={editingTemplate.category}
                  onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  placeholder="如：技术研发、产品设计..."
                  list="category-suggestions-edit"
                />
                <datalist id="category-suggestions-edit">
                  {categories.map(c => <option key={c.id} value={c.value} />)}
                </datalist>
              </div>
              <div>
                <label className="text-sm text-slate-400">行业类型</label>
                <input
                  type="text"
                  value={editingTemplate.industry || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  placeholder="请选择或输入行业"
                  list="industry-suggestions-edit"
                />
                <datalist id="industry-suggestions-edit">
                  {industries.map(i => <option key={i.id} value={i.value} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">岗位名称</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">所属部门</label>
                <input
                  type="text"
                  value={editingTemplate.department || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, department: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  placeholder="如：技术部"
                  list="department-suggestions-edit"
                />
                <datalist id="department-suggestions-edit">
                  {departments.map(d => <option key={d.id} value={d.value} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">岗位职责</label>
              <textarea
                value={editingTemplate.description || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">任职要求</label>
              <textarea
                value={editingTemplate.requirements || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, requirements: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { handleDelete(editingTemplate.id); setShowEditModal(false); setEditingTemplate(null); }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="mr-1 inline h-4 w-4" />
                删除
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Generate Modal */}
      <AIJDModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerated}
      />
    </div>
  );
}
