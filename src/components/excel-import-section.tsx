'use client';

import { useState, useCallback } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Loader2,
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface AnalyzedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedPosition: string;
  department: string;
  experience: number;
  education: string;
  skills: string[];
  matchScore: number;
  profile: Record<string, unknown>;
  matchAnalysis: string;
  interviewAnalysis: Record<string, unknown> | null;
  interviewScore: number | null;
}

interface ComparisonResult {
  total: number;
  averageScore: number;
  topCandidate: AnalyzedCandidate;
  rankings: Array<{ rank: number } & AnalyzedCandidate>;
}

export default function ExcelImportSection() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ candidates: AnalyzedCandidate[]; comparison: ComparisonResult } | null>(null);
  const [syncResult, setSyncResult] = useState<{ total: number; results: Array<{ type: string; sheet: string; status: string; message?: string; isUpdate?: boolean }>; summary: Record<string, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSyncResult(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const hasSpecialSheet = workbook.SheetNames.some(name => 
        name.startsWith('JD-') || 
        name.endsWith('-简历分析') || 
        name.endsWith('-面试分析') || 
        name.startsWith('候选人对比-')
      );
      
      const formData = new FormData();
      formData.append('file', file);
      const apiUrl = hasSpecialSheet ? '/api/collection/excel-sync' : '/api/collection/excel-analyze';
      const res = await fetch(apiUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        if (hasSpecialSheet) {
          setSyncResult(data.data);
        } else {
          setResult(data.data);
        }
      } else {
        setError(data.message || '分析失败');
      }
    } catch {
      setError('请求失败，请检查网络');
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  const downloadTemplate = useCallback(() => {
    const headers = ['姓名', '邮箱', '电话', '学历', '学校', '专业', '工作年限', '应聘职位', '部门', '技能', '简历文本', '面试反馈', '面试评分'];
    const sample = ['张三', 'zhangsan@example.com', '13800138001', '本科', '北京大学', '计算机科学', '5', '前端工程师', '技术部', 'React,TypeScript,Node.js', '5年前端开发经验...', '技术面试表现优秀，沟通能力好', '85'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '候选人导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Excel 简历导入与分析</h2>
            <p className="text-xs text-slate-500 mt-1">上传候选人 Excel，自动进行简历分析、岗位匹配、面试评估和候选人对比</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 text-xs text-slate-300 hover:bg-[#1a2236] transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> 下载模板
          </button>
        </div>

        <div className="rounded-lg border border-dashed border-[#1e293b] bg-[#0a0e1a] p-8 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <span className="text-sm text-sky-400 hover:text-sky-300">{file ? file.name : '点击选择 Excel 文件'}</span>
          </label>
          <p className="text-xs text-slate-500 mt-2">支持 .xlsx、.xls、.csv，一次最多 20 条</p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {analyzing ? '分析中...' : '开始分析'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-sky-400" />
                <span className="text-xs text-slate-400">分析人数</span>
              </div>
              <p className="text-2xl font-bold text-white">{result.comparison.total}</p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-slate-400">平均匹配度</span>
              </div>
              <p className="text-2xl font-bold text-white">{result.comparison.averageScore}<span className="text-sm text-slate-500">分</span></p>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-slate-400">最佳候选人</span>
              </div>
              <p className="text-lg font-bold text-white truncate">{result.comparison.topCandidate?.name}</p>
              <p className="text-xs text-amber-400">{result.comparison.topCandidate?.matchScore} 分</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-400" /> 候选人对比排名
            </h3>
            <div className="space-y-2">
              {result.comparison.rankings.map((c) => (
                <div key={c.id} className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        c.rank === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                      )}>
                        {c.rank}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.appliedPosition || '未知职位'} · {c.experience}年 · {c.education || '未知学历'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-sky-400">{c.matchScore}分</span>
                      {expandedId === c.id ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </button>
                  {expandedId === c.id && (
                    <div className="border-t border-[#1e293b] p-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">AI 综合评价</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {(c.profile?.evaluation as string) || c.matchAnalysis || '暂无分析'}
                        </p>
                      </div>
                      {c.profile?.positionMatch ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs font-medium text-emerald-400 mb-1">优势</p>
                            <ul className="space-y-0.5">
                              {((c.profile.positionMatch as Record<string, string[]>)?.strengths || []).map((s, i) => (
                                <li key={i} className="text-[11px] text-slate-400">• {s as string}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-400 mb-1">不足</p>
                            <ul className="space-y-0.5">
                              {((c.profile.positionMatch as Record<string, string[]>)?.gaps || []).map((s, i) => (
                                <li key={i} className="text-[11px] text-slate-400">• {s as string}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                      {c.interviewAnalysis && (
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-1">面试分析</p>
                          <p className="text-xs text-slate-300">{(c.interviewAnalysis as Record<string, unknown>).summary as string || '已评估'}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">技能</p>
                        <div className="flex flex-wrap gap-1">
                          {c.skills.map((skill, i) => (
                            <span key={i} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {syncResult && (
        <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Excel 智能同步结果</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="rounded-lg bg-[#0a0e1a] p-2 text-center">
              <p className="text-lg font-bold text-sky-400">{syncResult.summary.created || 0}</p>
              <p className="text-[10px] text-slate-500">新增</p>
            </div>
            <div className="rounded-lg bg-[#0a0e1a] p-2 text-center">
              <p className="text-lg font-bold text-amber-400">{syncResult.summary.updated || 0}</p>
              <p className="text-[10px] text-slate-500">更新</p>
            </div>
            <div className="rounded-lg bg-[#0a0e1a] p-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{syncResult.summary.jd + syncResult.summary.resume + syncResult.summary.interview + syncResult.summary.comparison || 0}</p>
              <p className="text-[10px] text-slate-500">成功</p>
            </div>
            <div className="rounded-lg bg-[#0a0e1a] p-2 text-center">
              <p className="text-lg font-bold text-red-400">{syncResult.summary.errors || 0}</p>
              <p className="text-[10px] text-slate-500">失败</p>
            </div>
          </div>
          <div className="space-y-1">
            {syncResult.results.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-[#0a0e1a] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', r.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                    {r.status === 'success' ? '成功' : '失败'}
                  </span>
                  <span className="text-xs text-slate-400">{r.sheet}</span>
                </div>
                <span className="text-xs text-slate-300">{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
