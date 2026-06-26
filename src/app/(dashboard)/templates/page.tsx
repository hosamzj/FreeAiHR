'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Sparkles, RefreshCw, Edit2, Trash2 } from 'lucide-react';
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

const CATEGORIES = [
  { value: 'tech', label: '技术' },
  { value: 'product', label: '产品' },
  { value: 'design', label: '设计' },
  { value: 'operations', label: '运营' },
  { value: 'sales', label: '销售' },
  { value: 'management', label: '管理' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ category: 'tech', title: '', description: '', requirements: '', industry: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiIndustry, setAiIndustry] = useState('互联网/IT');

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
    try {
      const res = await fetch('/api/position-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTemplate({ category: 'tech', title: '', description: '', requirements: '', industry: '' });
        loadTemplates();
      }
    } catch (e) {
      console.error('Add template error:', e);
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

  const handleAIGenerate = async () => {
    try {
      const res = await fetch('/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionName: aiPrompt, department: '', industry: aiIndustry }),
      });
      const data = await res.json();
      if (data.data) {
        setNewTemplate({
          ...newTemplate,
          description: data.data.responsibilities?.join('\n') || '',
          requirements: data.data.requirements?.join('\n') || '',
        });
        setShowAIModal(false);
        setShowAddModal(true);
      }
    } catch (e) {
      console.error('AI generate error:', e);
    }
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

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
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${categoryFilter === cat.value ? 'bg-sky-500 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'}`}
          >
            {cat.label}
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
            <div key={t.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 hover:border-sky-500/30">
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
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI生成岗位模板">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">描述您需要的岗位</label>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              rows={4}
              placeholder="例如：高级前端工程师，负责核心业务系统的前端架构设计和开发..."
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">行业类型</label>
            <select
              value={aiIndustry}
              onChange={e => setAiIndustry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            >
              {['互联网/IT','金融','电商','教育','医疗','制造','房地产','物流','能源','广告/传媒','游戏','AI/人工智能','SaaS/企业服务','汽车','消费品/零售'].map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-sky-500/10 p-3">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span className="text-xs text-sky-400">AI将根据岗位描述和行业类型自动生成岗位职责和任职要求</span>
          </div>
          <button
            onClick={handleAIGenerate}
            className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 py-2 text-white hover:from-sky-600 hover:to-blue-700"
          >
            生成模板
          </button>
        </div>
      </Modal>
    </div>
  );
}
