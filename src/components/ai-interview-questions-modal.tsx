'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Edit2, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface AIInterviewQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  position?: string;
}

interface Question {
  id: string;
  question: string;
  type: 'technical' | 'behavioral' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer: string;
  followUp: string[];
}

export function AIInterviewQuestionsModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  position,
}: AIInterviewQuestionsModalProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleGenerate = async () => {
    setStep('loading');
    try {
      const res = await fetch('/api/ai/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          positionName: position,
          difficulty,
          count,
        }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.questions) {
        setQuestions(data.data.questions);
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

  const handleDelete = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleStartEdit = (q: Question) => {
    setEditingId(q.id);
    setEditingText(q.question);
  };

  const handleSaveEdit = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: editingText } : q));
    setEditingId(null);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `custom_${Date.now()}`,
      question: '',
      type: 'technical',
      difficulty: 'medium',
      expectedAnswer: '',
      followUp: [],
    };
    setQuestions(prev => [...prev, newQ]);
    setEditingId(newQ.id);
    setEditingText('');
  };

  const handleCopyAll = () => {
    const text = questions.map((q, i) => {
      const typeLabel = { technical: '技术', behavioral: '行为', situational: '情景' }[q.type];
      return `${i + 1}. [${typeLabel}] ${q.question}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    technical: { label: '技术', color: 'bg-sky-500/10 text-sky-400' },
    behavioral: { label: '行为', color: 'bg-emerald-500/10 text-emerald-400' },
    situational: { label: '情景', color: 'bg-orange-500/10 text-orange-400' },
  };

  const difficultyLabels: Record<string, string> = {
    easy: '初级',
    medium: '中级',
    hard: '高级',
  };

  const handleClose = () => {
    setStep('form');
    setQuestions([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI生成面试题" size="lg">
      {step === 'form' && (
        <div className="space-y-4">
          <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-lg">
            <p className="text-xs text-sky-400">
              为 <span className="font-medium">{candidateName}</span>
              {position && <> 应聘的 <span className="font-medium">{position}</span></>} 生成面试题目
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">难度等级</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'px-3 py-2.5 rounded-lg border text-sm transition-all',
                    difficulty === d
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-700 bg-[#0a0e1a] text-slate-400 hover:border-slate-600'
                  )}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">题目数量</label>
            <div className="flex items-center gap-3">
              {[3, 5, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm transition-all',
                    count === n
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-slate-700 bg-[#0a0e1a] text-slate-400 hover:border-slate-600'
                  )}
                >
                  {n}题
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            生成面试题
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-sky-400 ai-pulse" />
          </div>
          <p className="text-sm text-sky-400 font-medium">AI 正在生成面试题...</p>
          <p className="mt-1 text-xs text-slate-500">根据岗位要求和候选人背景定制</p>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              共 {questions.length} 道题目 · {difficultyLabels[difficulty]}难度
            </p>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              复制全部
            </button>
          </div>

          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-600 font-mono shrink-0 mt-0.5">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    {editingId === q.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 px-2 py-1 bg-[#111827] border border-sky-500 rounded text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(q.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => handleSaveEdit(q.id)} className="p-1 text-sky-400">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-200 leading-relaxed">{q.question}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px]', typeLabels[q.type]?.color)}>
                        {typeLabels[q.type]?.label}
                      </span>
                      {q.expectedAnswer && (
                        <span className="text-[10px] text-slate-500">
                          参考答案: {q.expectedAnswer.slice(0, 50)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(q)}
                      className="p-1 text-slate-500 hover:text-sky-400 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddQuestion}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加自定义题目
            </button>
            <button
              onClick={() => setStep('form')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              重新生成
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
