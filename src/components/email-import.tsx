'use client';

import { useState, useCallback, useRef } from 'react';
import { Mail, Upload, Clipboard, Sparkles, FileText, X, Check, AlertCircle, User, Phone, MapPin, GraduationCap, Building2, Clock, DollarSign, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParsedResult {
  source: 'email' | 'clipboard';
  isResume?: boolean;
  emailInfo?: {
    from: string;
    to: string;
    subject: string;
    date: string;
    hasAttachments: boolean;
    attachmentCount: number;
    resumeAttachmentCount: number;
    attachmentNames: string[];
  };
  bodyPreview?: string;
  textPreview?: string;
  aiParsed: {
    name: string | null;
    email: string | null;
    phone: string | null;
    education: string | null;
    school: string | null;
    major: string | null;
    experience: number | null;
    currentCompany: string | null;
    currentPosition: string | null;
    skills: string[];
    expectedSalary: string | null;
    location: string | null;
    appliedPosition: string | null;
  };
}

export function EmailImport() {
  const [activeMode, setActiveMode] = useState<'drag' | 'paste'>('drag');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle .eml file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const emlFile = files.find(f => f.name.endsWith('.eml') || f.name.endsWith('.msg'));

    if (!emlFile) {
      setImportStatus('error');
      setImportMessage('请拖入 .eml 格式的邮件文件（从 Outlook 中拖拽邮件到桌面，再拖入此处）');
      return;
    }

    await processEmlFile(emlFile);
  }, []);

  // Handle file select via button
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processEmlFile(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const processEmlFile = async (file: File) => {
    setIsProcessing(true);
    setImportStatus('idle');
    setImportMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/candidates/parse-eml', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.code === 0) {
        setParsedResult(data.data);
      } else {
        setImportStatus('error');
        setImportMessage(data.message || '解析失败');
      }
    } catch {
      setImportStatus('error');
      setImportMessage('网络错误，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clipboard paste
  const handlePaste = useCallback(async () => {
    if (!pasteText.trim()) {
      setImportStatus('error');
      setImportMessage('请先粘贴邮件或简历内容');
      return;
    }

    setIsProcessing(true);
    setImportStatus('idle');

    try {
      const res = await fetch('/api/candidates/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setParsedResult(data.data);
      } else {
        setImportStatus('error');
        setImportMessage(data.message || '解析失败');
      }
    } catch {
      setImportStatus('error');
      setImportMessage('网络错误，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [pasteText]);

  // Import candidate to database
  const handleImportCandidate = useCallback(async () => {
    if (!parsedResult?.aiParsed) return;

    const p = parsedResult.aiParsed;
    if (!p.name && !p.email) {
      setImportStatus('error');
      setImportMessage('未能提取到姓名或邮箱，无法导入');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name || '未知候选人',
          email: p.email || null,
          phone: p.phone || null,
          education: p.education || null,
          school: p.school || null,
          major: p.major || null,
          experience: p.experience || 0,
          currentCompany: p.currentCompany || null,
          currentPosition: p.currentPosition || null,
          skills: p.skills || [],
          expectedSalary: p.expectedSalary || null,
          location: p.location || null,
          appliedPosition: p.appliedPosition || null,
          source: parsedResult.source,
        }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setImportStatus('success');
        setImportMessage(`候选人「${p.name || '未知'}」已成功导入`);
        // Clear result after 2s
        setTimeout(() => {
          setParsedResult(null);
          setPasteText('');
          setImportStatus('idle');
          setImportMessage('');
        }, 2000);
      } else {
        setImportStatus('error');
        setImportMessage(data.message || '导入失败');
      }
    } catch {
      setImportStatus('error');
      setImportMessage('网络错误，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedResult]);

  const clearResult = useCallback(() => {
    setParsedResult(null);
    setPasteText('');
    setImportStatus('idle');
    setImportMessage('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-[#0a0e1a] p-1 w-fit">
        <button
          onClick={() => setActiveMode('drag')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeMode === 'drag'
              ? 'bg-sky-500/20 text-sky-400'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          拖拽 .eml
        </button>
        <button
          onClick={() => setActiveMode('paste')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeMode === 'paste'
              ? 'bg-sky-500/20 text-sky-400'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Clipboard className="h-3.5 w-3.5" />
          粘贴内容
        </button>
      </div>

      {/* Drag .eml area */}
      {activeMode === 'drag' && !parsedResult && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
            isDragging
              ? 'border-sky-500/50 bg-sky-500/5'
              : 'border-[#1e293b] bg-[#111827]/50 hover:border-slate-600'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".eml,.msg"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center py-8 px-4">
            {isProcessing ? (
              <>
                <div className="relative mb-3">
                  <div className="h-10 w-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin"></div>
                  <Mail className="absolute inset-0 m-auto h-4 w-4 text-sky-400" />
                </div>
                <p className="text-sm font-medium text-sky-400">正在解析邮件...</p>
                <p className="mt-1 text-xs text-slate-500">提取发件人、正文和附件信息</p>
              </>
            ) : (
              <>
                <Mail className={cn('h-8 w-8 mb-3 transition-colors', isDragging ? 'text-sky-400' : 'text-slate-600')} />
                <p className="text-sm text-slate-400 text-center">
                  从 Outlook 拖拽邮件到此处，或 <span className="text-sky-400">点击选择 .eml 文件</span>
                </p>
                <p className="mt-1 text-xs text-slate-600">支持 .eml 格式的邮件文件</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  <p className="text-xs text-sky-400">AI 自动识别简历邮件并提取候选人信息</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Paste area */}
      {activeMode === 'paste' && !parsedResult && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827]/50 overflow-hidden">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="从 Outlook 邮件中复制内容（Ctrl+A → Ctrl+C），粘贴到这里..."
              className="w-full h-40 bg-transparent px-4 py-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between border-t border-[#1e293b] px-4 py-2">
              <p className="text-xs text-slate-500">
                已输入 {pasteText.length} 个字符
              </p>
              <button
                onClick={handlePaste}
                disabled={isProcessing || !pasteText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <><div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 解析中...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> AI 解析</>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <p className="text-xs text-sky-400">支持粘贴邮件正文、简历文本，AI 自动提取结构化信息</p>
          </div>
        </div>
      )}

      {/* Status messages */}
      {importStatus !== 'idle' && !parsedResult && (
        <div className={cn(
          'rounded-lg p-3 flex items-start gap-2',
          importStatus === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
        )}>
          {importStatus === 'success' ? (
            <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          )}
          <p className={cn('text-xs', importStatus === 'success' ? 'text-emerald-400' : 'text-red-400')}>
            {importMessage}
          </p>
        </div>
      )}

      {/* Parsed Result */}
      {parsedResult && (
        <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-semibold text-sky-400">AI 解析结果</span>
              {parsedResult.source === 'email' && (
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400 border border-sky-500/20">
                  {parsedResult.isResume ? '简历邮件' : '邮件'}
                </span>
              )}
            </div>
            <button onClick={clearResult} className="text-slate-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Email info (if from email) */}
            {parsedResult.emailInfo && (
              <div className="rounded-lg bg-[#0a0e1a] border border-[#1e293b] p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300 font-medium">{parsedResult.emailInfo.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>发件人: {parsedResult.emailInfo.from}</span>
                </div>
                {parsedResult.emailInfo.date && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>时间: {new Date(parsedResult.emailInfo.date).toLocaleString('zh-CN')}</span>
                  </div>
                )}
                {parsedResult.emailInfo.hasAttachments && (
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">
                      {parsedResult.emailInfo.attachmentCount} 个附件
                      {parsedResult.emailInfo.resumeAttachmentCount > 0 && (
                        <span className="text-sky-400 ml-1">
                          （{parsedResult.emailInfo.resumeAttachmentCount} 个简历文件）
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {parsedResult.emailInfo.attachmentNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedResult.emailInfo.attachmentNames.map((name, i) => (
                      <span key={i} className="rounded-md bg-[#111827] px-2 py-0.5 text-[10px] text-slate-400 border border-[#1e293b]">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Candidate info */}
            {parsedResult.aiParsed && (
              <div className="grid gap-3 md:grid-cols-2">
                {/* Name */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">姓名</p>
                    <p className="text-sm text-slate-200 truncate">{parsedResult.aiParsed.name || '未识别'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">邮箱</p>
                    <p className="text-sm text-slate-200 truncate">{parsedResult.aiParsed.email || '未识别'}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">手机</p>
                    <p className="text-sm text-slate-200 truncate">{parsedResult.aiParsed.phone || '未识别'}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">城市</p>
                    <p className="text-sm text-slate-200 truncate">{parsedResult.aiParsed.location || '未识别'}</p>
                  </div>
                </div>

                {/* Education */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">学历</p>
                    <p className="text-sm text-slate-200 truncate">
                      {[parsedResult.aiParsed.education, parsedResult.aiParsed.school, parsedResult.aiParsed.major]
                        .filter(Boolean).join(' · ') || '未识别'}
                    </p>
                  </div>
                </div>

                {/* Experience */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">工作年限</p>
                    <p className="text-sm text-slate-200">
                      {parsedResult.aiParsed.experience ? `${parsedResult.aiParsed.experience} 年` : '未识别'}
                    </p>
                  </div>
                </div>

                {/* Current Company */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">当前公司</p>
                    <p className="text-sm text-slate-200 truncate">
                      {[parsedResult.aiParsed.currentCompany, parsedResult.aiParsed.currentPosition]
                        .filter(Boolean).join(' · ') || '未识别'}
                    </p>
                  </div>
                </div>

                {/* Expected Salary */}
                <div className="flex items-center gap-2 rounded-lg bg-[#0a0e1a] border border-[#1e293b] px-3 py-2">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500">期望薪资</p>
                    <p className="text-sm text-slate-200 truncate">{parsedResult.aiParsed.expectedSalary || '未识别'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            {parsedResult.aiParsed?.skills && parsedResult.aiParsed.skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">技能标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedResult.aiParsed.skills.map((skill, i) => (
                    <span key={i} className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-400 border border-sky-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Body preview */}
            {(parsedResult.bodyPreview || parsedResult.textPreview) && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">内容预览</p>
                <div className="rounded-lg bg-[#0a0e1a] border border-[#1e293b] p-3">
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                    {parsedResult.bodyPreview || parsedResult.textPreview}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleImportCandidate}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <><div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 导入中...</>
                ) : (
                  <><Check className="h-4 w-4" /> 导入候选人</>
                )}
              </button>
              <button
                onClick={clearResult}
                className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                放弃
              </button>
            </div>

            {/* Success message */}
            {importStatus === 'success' && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">{importMessage}</p>
              </div>
            )}

            {/* Error message */}
            {importStatus === 'error' && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{importMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
