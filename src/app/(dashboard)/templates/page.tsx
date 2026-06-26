'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Sparkles, RefreshCw, Edit2, Trash2, Pencil, Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface Template {
  id: string;
  category: string;
  title: string;
  description?: string;
  requirements?: string;
  industry?: string;
  version: number;
  usageCount: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newTemplate, setNewTemplate] = useState({ category: '', title: '', description: '', requirements: '', industry: '' });
  const [aiPrompt, setAiPrompt] = useState({ positionName: '', department: '', experience: '', skills: '', category: '' });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ responsibilities: string[]; requirements: string[]; preferred: string[]; benefits: string[] } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/position-categories');
      const data = await res.json();
      if (data.code === 0) {
        setCategories(data.data || []);
        if (!categoryFilter && data.data?.length > 0) {
          // Don't auto-set filter, keep "all" selected
        }
      }
    } catch (e) {
      console.error('Load categories error:', e);
    }
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
    Promise.all([loadCategories(), loadTemplates()]).finally(() => setLoading(false));
  }, [loadTemplates]);

  const handleAdd = async () => {
    if (!newTemplate.title.trim()) {
      alert('请输入模板标题');
      return;
    }
    if (!newTemplate.category) {
      alert('请选择岗位类别');
      return;
    }
    try {
      const res = await fetch('/api/position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        setShowAddModal(false);
        setNewTemplate({ category: '', title: '', description: '', requirements: '', industry: '' });
        loadTemplates();
      } else {
        alert(data.message || '创建模板失败，请重试');
      }
    } catch (e) {
      console.error('Add template error:', e);
      alert('网络错误，创建模板失败');
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

  // AI Generate JD
  const handleAIGenerate = async () => {
    if (!aiPrompt.positionName.trim()) {
      alert('请输入岗位名称');
      return;
    }
    setAiGenerating(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionName: aiPrompt.positionName,
          department: aiPrompt.department,
          experience: aiPrompt.experience,
          skills: aiPrompt.skills.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setAiResult({
          responsibilities: data.data.responsibilities || [],
          requirements: data.data.requirements || [],
          preferred: data.data.niceToHave || data.data.preferred || [],
          benefits: data.data.benefits || [],
        });
      } else {
        alert(data.message || '生成失败');
      }
    } catch {
      alert('请求失败，请重试');
    } finally {
      setAiGenerating(false);
    }
  };

  // Import AI result into template library
  const handleImportAIResult = async () => {
    if (!aiResult || !aiPrompt.category) {
      alert('请选择岗位类别');
      return;
    }
    try {
      const res = await fetch('/api/position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: aiPrompt.category,
          title: aiPrompt.positionName,
          description: aiResult.responsibilities.join('\n'),
          requirements: aiResult.requirements,
          industry: aiPrompt.department || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        alert('已导入模板库');
        setShowAIModal(false);
        setAiResult(null);
        setAiPrompt({ positionName: '', department: '', experience: '', skills: '', category: '' });
        loadTemplates();
      } else {
        alert(data.message || '导入失败');
      }
    } catch (e) {
      console.error('Import AI result error:', e);
      alert('导入失败，请重试');
    }
  };

  // Category management
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      alert('请输入类别名称');
      return;
    }
    try {
      const res = await fetch('/api/position-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), sortOrder: categories.length + 1 }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        setNewCatName('');
        loadCategories();
      } else {
        alert(data.message || '添加失败');
      }
    } catch (e) {
      console.error('Add category error:', e);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editCatName.trim()) return;
    try {
      const res = await fetch('/api/position-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCategory.id, name: editCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        setEditingCategory(null);
        setEditCatName('');
        loadCategories();
        loadTemplates();
      } else {
        alert(data.message || '更新失败');
      }
    } catch (e) {
      console.error('Edit category error:', e);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`确定删除类别"${cat.name}"？\n\n注意：删除类别不会删除该类别下的模板。`)) return;
    try {
      const res = await fetch(`/api/position-categories?id=${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        if (categoryFilter === cat.name) setCategoryFilter('');
        loadCategories();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (e) {
      console.error('Delete category error:', e);
    }
  };

  const getCategoryLabel = (cat: string) => categories.find(c => c.name === cat)?.name || cat;

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
            onClick={() => {
              setAiResult(null);
              setAiPrompt({ positionName: '', department: '', experience: '', skills: '', category: categories[0]?.name || '' });
              setShowAIModal(true);
            }}
            className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/20"
          >
            <Sparkles className="h-4 w-4" />
            AI生成模板
          </button>
          <button
            onClick={() => {
              setNewTemplate({ category: categories[0]?.name || '', title: '', description: '', requirements: '', industry: '' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            新建模板
          </button>
        </div>
      </div>

      {/* Category Filter with Edit */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={`rounded-lg px-3 py-1.5 text-sm ${!categoryFilter ? 'bg-sky-500 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'}`}
        >
          全部
        </button>
        {categories.map(cat => (
          <div key={cat.id} className="group relative flex items-center">
            <button
              onClick={() => setCategoryFilter(cat.name)}
              className={`rounded-lg px-3 py-1.5 text-sm ${categoryFilter === cat.name ? 'bg-sky-500 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'}`}
            >
              {cat.name}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setEditCatName(cat.name); }}
              className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-sky-500 hover:text-white"
              title="编辑类别"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {/* Add category button */}
        <div className="relative flex items-center">
          {newCatName !== '' ? (
            <div className="flex items-center gap-1">
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setNewCatName(''); }}
                className="w-20 rounded-lg border border-sky-500/50 bg-[#0a0e1a] px-2 py-1 text-xs text-white focus:outline-none"
                placeholder="类别名"
                autoFocus
              />
              <button onClick={handleAddCategory} className="rounded p-0.5 text-emerald-400 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setNewCatName('')} className="rounded p-0.5 text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button
              onClick={() => setNewCatName(' ')}
              className="flex items-center gap-1 rounded-lg border border-dashed border-slate-600 px-2 py-1.5 text-xs text-slate-500 hover:border-sky-500/50 hover:text-sky-400"
            >
              <Plus className="h-3 w-3" />
              自定义
            </button>
          )}
        </div>
      </div>

      {/* Edit Category Inline */}
      {editingCategory && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2">
          <span className="text-xs text-slate-400">编辑类别：</span>
          <input
            value={editCatName}
            onChange={e => setEditCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditCategory(); if (e.key === 'Escape') setEditingCategory(null); }}
            className="w-32 rounded border border-[#1e293b] bg-[#0a0e1a] px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500"
            autoFocus
          />
          <button onClick={handleEditCategory} className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditingCategory(null)} className="rounded p-1 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
          <button onClick={() => handleDeleteCategory(editingCategory)} className="ml-auto rounded p-1 text-slate-500 hover:text-red-400" title="删除类别"><Trash2 className="h-4 w-4" /></button>
        </div>
      )}

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
              onClick={() => setPreviewTemplate(t)}
              className="group cursor-pointer rounded-xl border border-[#1e293b] bg-[#111827] p-4 transition-all duration-200 hover:border-sky-500/30 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-sky-400" />
                  <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                    {getCategoryLabel(t.category)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 font-medium text-white">{t.title}</h3>
              {t.description && (
                <p className="mt-2 line-clamp-3 text-xs text-slate-400">{t.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>版本 v{t.version}</span>
                <span>使用 {t.usageCount} 次</span>
                {t.industry && <span>{t.industry}</span>}
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
              <select
                value={newTemplate.category}
                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              >
                <option value="">请选择</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">行业</label>
              <input
                type="text"
                value={newTemplate.industry}
                onChange={e => setNewTemplate({ ...newTemplate, industry: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                placeholder="互联网/金融/制造..."
              />
            </div>
          </div>
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
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
          >
            创建模板
          </button>
        </div>
      </Modal>

      {/* AI Generate Modal */}
      <Modal isOpen={showAIModal} onClose={() => { setShowAIModal(false); setAiResult(null); }} title="AI生成岗位模板" size="lg">
        <div className="space-y-4">
          {!aiResult ? (
            <>
              <div>
                <label className="text-sm text-slate-400">岗位类别</label>
                <select
                  value={aiPrompt.category}
                  onChange={e => setAiPrompt({ ...aiPrompt, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                >
                  <option value="">请选择</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">岗位名称 *</label>
                <input
                  value={aiPrompt.positionName}
                  onChange={e => setAiPrompt({ ...aiPrompt, positionName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  placeholder="例如：高级前端工程师"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400">所属部门</label>
                  <input
                    value={aiPrompt.department}
                    onChange={e => setAiPrompt({ ...aiPrompt, department: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                    placeholder="如：技术部"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">工作年限</label>
                  <select
                    value={aiPrompt.experience}
                    onChange={e => setAiPrompt({ ...aiPrompt, experience: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  >
                    <option value="">不限</option>
                    <option value="应届生">应届生</option>
                    <option value="1-3年">1-3年</option>
                    <option value="3-5年">3-5年</option>
                    <option value="5-10年">5-10年</option>
                    <option value="10年以上">10年以上</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">技能要求</label>
                <textarea
                  value={aiPrompt.skills}
                  onChange={e => setAiPrompt({ ...aiPrompt, skills: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
                  rows={3}
                  placeholder="用逗号分隔，如：React, TypeScript, Node.js"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-sky-500/10 p-3">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <span className="text-xs text-sky-400">AI将根据描述自动生成岗位职责和任职要求，生成后可直接导入模板库</span>
              </div>
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.positionName || aiGenerating}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 py-2 text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-50"
              >
                {aiGenerating ? '生成中...' : '生成模板'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{aiPrompt.positionName}</h3>
                  <p className="text-xs text-slate-500">AI 生成结果 · 将导入到「{aiPrompt.category}」类别</p>
                </div>
              </div>
              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                <div>
                  <h4 className="text-xs font-medium text-sky-400 mb-1.5">岗位职责</h4>
                  <ul className="space-y-1">
                    {aiResult.responsibilities.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-slate-600 shrink-0">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-sky-400 mb-1.5">任职要求</h4>
                  <ul className="space-y-1">
                    {aiResult.requirements.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-slate-600 shrink-0">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {aiResult.preferred.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-sky-400 mb-1.5">加分项</h4>
                    <ul className="space-y-1">
                      {aiResult.preferred.map((item, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-2">
                          <span className="text-slate-600 shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.benefits.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-sky-400 mb-1.5">福利待遇</h4>
                    <ul className="space-y-1">
                      {aiResult.benefits.map((item, i) => (
                        <li key={i} className="text-xs text-slate-300 flex gap-2">
                          <span className="text-slate-600 shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  onClick={() => setAiResult(null)}
                  className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  重新生成
                </button>
                <button
                  onClick={handleImportAIResult}
                  className="flex-1 px-4 py-2 text-sm text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  导入模板库
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title="模板详情" size="lg">
        {previewTemplate && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                    {getCategoryLabel(previewTemplate.category)}
                  </span>
                  <span className="text-xs text-slate-500">版本 v{previewTemplate.version}</span>
                </div>
                <h2 className="text-xl font-semibold text-white">{previewTemplate.title}</h2>
                {previewTemplate.industry && (
                  <p className="text-sm text-slate-400 mt-1">{previewTemplate.industry}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>使用 {previewTemplate.usageCount} 次</span>
                <span className={`rounded px-2 py-0.5 ${previewTemplate.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  {previewTemplate.status === 'active' ? '启用' : '停用'}
                </span>
              </div>
            </div>

            {/* Responsibilities */}
            {previewTemplate.description && (
              <div>
                <h3 className="text-sm font-medium text-sky-400 mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  岗位职责
                </h3>
                <div className="rounded-lg bg-[#0a0e1a] border border-[#1e293b] p-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{previewTemplate.description}</p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {previewTemplate.requirements && (() => {
              let reqs: string[] = [];
              try {
                const parsed = JSON.parse(previewTemplate.requirements);
                reqs = Array.isArray(parsed) ? parsed : [];
              } catch {
                reqs = previewTemplate.requirements.split('\n').filter(Boolean);
              }
              if (reqs.length === 0) return null;
              return (
                <div>
                  <h3 className="text-sm font-medium text-sky-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    任职要求
                  </h3>
                  <div className="rounded-lg bg-[#0a0e1a] border border-[#1e293b] p-4">
                    <ul className="space-y-1.5">
                      {reqs.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-sky-500 shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Footer actions */}
            <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                  setNewTemplate({
                    category: previewTemplate.category,
                    title: previewTemplate.title,
                    description: previewTemplate.description || '',
                    requirements: previewTemplate.requirements || '',
                    industry: previewTemplate.industry || '',
                  });
                  setShowAddModal(true);
                }}
                className="flex-1 px-4 py-2 text-sm text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-4 w-4" />
                编辑模板
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
