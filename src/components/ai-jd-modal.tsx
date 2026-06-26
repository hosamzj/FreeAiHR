'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Copy, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface AIJDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JDResult {
  positionName: string;
  department: string;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  benefits: string[];
}

export function AIJDModal({ isOpen, onClose }: AIJDModalProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [form, setForm] = useState({
    positionName: '',
    department: '',
    industry: '',
    experience: '',
    salaryMin: '',
    salaryMax: '',
    skills: '',
  });
  const [result, setResult] = useState<JDResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!form.positionName) return;
    setStep('loading');
    try {
      const res = await fetch('/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionName: form.positionName,
          department: form.department,
          industry: form.industry,
          experience: form.experience,
          salary: form.salaryMin && form.salaryMax ? `${form.salaryMin}-${form.salaryMax}K` : '',
          skills: form.skills.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setResult(data.data);
        setStep('result');
      } else {
        alert(data.message || '生成失败');
        setStep('form');
      }
    } catch {
      alert('请求失败，请重试');
      setStep('form');
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `## ${result.positionName || ''}`,
      result.department ? `部门：${result.department}` : '',
      '',
      '### 岗位职责',
      ...(result.responsibilities || []).map((r, i) => `${i + 1}. ${r}`),
      '',
      '### 任职要求',
      ...(result.requirements || []).map((r, i) => `${i + 1}. ${r}`),
      '',
      '### 加分项',
      ...(result.preferred || []).map((r, i) => `${i + 1}. ${r}`),
      '',
      '### 福利待遇',
      ...(result.benefits || []).map((r, i) => `${i + 1}. ${r}`),
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('form');
    setResult(null);
    setForm({ positionName: '', department: '', industry: '', experience: '', salaryMin: '', salaryMax: '', skills: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI生成职位描述" size="lg">
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">岗位名称 *</label>
            <input
              value={form.positionName}
              onChange={(e) => setForm({ ...form, positionName: e.target.value })}
              placeholder="如：高级前端工程师"
              className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">所属部门</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="如：技术部"
                className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">行业类型 *</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">请选择行业</option>
                <option value="互联网/IT">互联网/IT</option>
                <option value="金融/保险">金融/保险</option>
                <option value="电商/零售">电商/零售</option>
                <option value="教育/培训">教育/培训</option>
                <option value="医疗/健康">医疗/健康</option>
                <option value="制造/工业">制造/工业</option>
                <option value="房地产/建筑">房地产/建筑</option>
                <option value="物流/交通">物流/交通</option>
                <option value="能源/环保">能源/环保</option>
                <option value="广告/传媒">广告/传媒</option>
                <option value="游戏/娱乐">游戏/娱乐</option>
                <option value="人工智能/AI">人工智能/AI</option>
                <option value="企业服务/SaaS">企业服务/SaaS</option>
                <option value="汽车/出行">汽车/出行</option>
                <option value="消费/生活服务">消费/生活服务</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">工作年限</label>
              <select
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">不限</option>
                <option value="应届生">应届生</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5-10年">5-10年</option>
                <option value="10年以上">10年以上</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">薪资范围 (K/月)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  placeholder="最低"
                  className="flex-1 px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  placeholder="最高"
                  className="flex-1 px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">技能要求</label>
            <textarea
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="用逗号分隔，如：React, TypeScript, Node.js"
              rows={3}
              className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!form.positionName}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            AI 生成 JD
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-sky-400 ai-pulse" />
          </div>
          <p className="text-sm text-sky-400 font-medium">AI 正在生成职位描述...</p>
          <p className="mt-1 text-xs text-slate-500">根据岗位信息智能生成专业JD</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-medium text-white">{result.positionName}</h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制全文'}
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <Section title="岗位职责" items={result.responsibilities} />
            <Section title="任职要求" items={result.requirements} />
            <Section title="加分项" items={result.preferred} />
            <Section title="福利待遇" items={result.benefits} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep('form')}
              className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              重新生成
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors"
            >
              确认使用
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-sky-400 mb-1.5">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-300 flex gap-2">
            <span className="text-slate-600 shrink-0">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
