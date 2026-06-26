'use client';

import { useState, useEffect } from 'react';
import {
  X, GraduationCap, Building2, Clock, MapPin, Phone, Mail,
  Award, Star, FileText, Download, Briefcase, BookOpen,
  Calendar, Sparkles, CheckCircle, AlertCircle, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface EducationItem {
  school?: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  courses?: string[];
}

interface ExperienceItem {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ParsedResume {
  name?: string;
  phone?: string;
  email?: string;
  education?: string;
  school?: string;
  major?: string;
  position?: string;
  currentPosition?: string;
  company?: string;
  experience?: number | string;
  matchScore?: number;
  summary?: string;
  selfEvaluation?: string;
  matchedSkills?: string[];
  uncertainSkills?: string[];
  certificates?: string[];
  honors?: string[];
  languages?: string[];
  birthplace?: string;
  currentLocation?: string;
  birthDate?: string;
  politicalStatus?: string;
  rawEducation?: EducationItem[];
  rawExperience?: ExperienceItem[];
  courses?: string[];
}

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    education?: string | null;
    school?: string | null;
    major?: string | null;
    experience?: number | null;
    currentCompany?: string | null;
    currentPosition?: string | null;
    skills?: string | string[];
    resumeUrl?: string | null;
    resumeFileKey?: string | null;
    resumeParsed?: string | Record<string, unknown>;
    status?: string;
    matchScore?: number | null;
    aiSummary?: string | null;
    appliedPosition?: string | null;
    department?: string | null;
    source?: string;
    tags?: string | string[];
    createdAt?: string;
  };
}

export function CandidateDetailModal({ isOpen, onClose, candidate }: CandidateDetailModalProps) {
  const [resumeDownloadUrl, setResumeDownloadUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Parse skills and tags from JSON strings
  const skills: string[] = typeof candidate.skills === 'string'
    ? (() => { try { return JSON.parse(candidate.skills); } catch { return []; } })()
    : (Array.isArray(candidate.skills) ? candidate.skills : []);

  const tags: string[] = typeof candidate.tags === 'string'
    ? (() => { try { return JSON.parse(candidate.tags); } catch { return []; } })()
    : (Array.isArray(candidate.tags) ? candidate.tags : []);

  // Parse resumeParsed
  const parsedResume: ParsedResume = typeof candidate.resumeParsed === 'string'
    ? (() => { try { return JSON.parse(candidate.resumeParsed); } catch { return {}; } })()
    : (candidate.resumeParsed as Record<string, unknown> || {});

  // Get resume download URL
  useEffect(() => {
    if (!isOpen || !candidate.resumeFileKey) return;
    let cancelled = false;
    setLoadingUrl(true);
    fetch(`/api/candidates/${candidate.id}/resume?action=download`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.code === 0 && data.data?.resumeUrl) {
          setResumeDownloadUrl(data.data.resumeUrl);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingUrl(false); });
    return () => { cancelled = true; };
  }, [isOpen, candidate.id, candidate.resumeFileKey]);

  const handleDownload = async () => {
    if (!resumeDownloadUrl) return;
    try {
      const response = await fetch(resumeDownloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${candidate.name}_简历`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // fallback: open in new tab
      window.open(resumeDownloadUrl, '_blank');
    }
  };

  const statusLabels: Record<string, string> = {
    new: '新投递', screening: '筛选中', interview: '面试中',
    offer: '待Offer', hired: '已入职', rejected: '已淘汰',
    interviewing: '面试中', offered: '待Offer',
  };

  const statusColor: Record<string, string> = {
    new: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    screening: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    interview: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    interviewing: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    offered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    hired: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const displayName = parsedResume.name || candidate.name;
  const displayPhone = parsedResume.phone || candidate.phone || '';
  const displayEmail = parsedResume.email || candidate.email || '';
  const displayPosition = parsedResume.position || candidate.appliedPosition || candidate.currentPosition || '';
  const displayCompany = parsedResume.company || candidate.currentCompany || '';
  const displayEducation = parsedResume.education || candidate.education || '';
  const displaySchool = parsedResume.school || candidate.school || '';
  const displayMajor = parsedResume.major || candidate.major || '';
  const displayExperience = typeof parsedResume.experience === 'number' 
    ? `${parsedResume.experience}年工作经验`
    : (parsedResume.experience as string) || (candidate.experience ? `${candidate.experience}年工作经验` : '');
  const displayScore = parsedResume.matchScore ?? candidate.matchScore ?? 0;
  const displaySummary = parsedResume.summary || candidate.aiSummary || '';
  const displaySelfEval = parsedResume.selfEvaluation || '';
  const displayBirthplace = parsedResume.birthplace || '';
  const displayLocation = parsedResume.currentLocation || '';
  const displayBirthDate = parsedResume.birthDate || '';
  const displayPolitical = parsedResume.politicalStatus || '';
  const matchedSkills = parsedResume.matchedSkills || [];
  const uncertainSkills = parsedResume.uncertainSkills || [];
  const certificates = parsedResume.certificates || [];
  const honors = parsedResume.honors || [];
  const languages = parsedResume.languages || [];
  const rawEducation = parsedResume.rawEducation || [];
  const rawExperience = parsedResume.rawExperience || [];
  const courses = parsedResume.courses || [];

  const hasParsedData = parsedResume.name || parsedResume.phone || parsedResume.email
    || rawEducation.length > 0 || rawExperience.length > 0 || matchedSkills.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sm font-bold text-sky-400 border border-sky-500/20">
            {displayName.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{displayName}</h3>
            {displayPosition && (
              <p className="text-sm text-slate-400">{displayPosition}</p>
            )}
          </div>
        </div>
      }
      size="xl"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Status & Score Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {candidate.status && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium border', statusColor[candidate.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
              {statusLabels[candidate.status] || candidate.status}
            </span>
          )}
          {displayScore > 0 && (
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-bold border',
              displayScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              displayScore >= 80 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            )}>
              <Sparkles className="h-3 w-3" /> AI匹配 {displayScore}分
            </div>
          )}
          {candidate.source && (
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400 border border-slate-700">
              来源: {candidate.source === 'ai' ? 'AI解析' : candidate.source === 'manual' ? '手动录入' : candidate.source}
            </span>
          )}
          {candidate.createdAt && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {new Date(candidate.createdAt).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>

        {/* Contact Info */}
        {(displayPhone || displayEmail || displayLocation || displayBirthplace) && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> 基本信息
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {displayPhone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{displayPhone}</span>
                </div>
              )}
              {displayEmail && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </div>
              )}
              {displayLocation && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{displayLocation}</span>
                </div>
              )}
              {displayBirthplace && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>籍贯: {displayBirthplace}</span>
                </div>
              )}
              {displayBirthDate && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{displayBirthDate}</span>
                </div>
              )}
              {displayPolitical && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Star className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{displayPolitical}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {displaySummary && (
          <div className="rounded-lg border border-sky-500/10 bg-gradient-to-r from-sky-500/5 to-transparent p-4">
            <h4 className="text-xs font-medium text-sky-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI 摘要
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{displaySummary}</p>
          </div>
        )}

        {/* Education */}
        {(rawEducation.length > 0 || displayEducation) && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> 教育背景
            </h4>
            {rawEducation.length > 0 ? (
              <div className="space-y-3">
                {rawEducation.map((edu, i) => (
                  <div key={i} className="border-l-2 border-sky-500/30 pl-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-white">{edu.school}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-300">{edu.degree}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{edu.major}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {edu.startDate} ~ {edu.endDate}
                    </p>
                    {edu.courses && edu.courses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {edu.courses.map((c, j) => (
                          <span key={j} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300">{displayEducation}{displaySchool ? ` · ${displaySchool}` : ''}{displayMajor ? ` · ${displayMajor}` : ''}</p>
            )}
            {courses.length > 0 && rawEducation.length === 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {courses.map((c, i) => (
                  <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Work Experience */}
        {(rawExperience.length > 0 || displayExperience || displayCompany) && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> 工作经历
            </h4>
            {rawExperience.length > 0 ? (
              <div className="space-y-4">
                {rawExperience.map((exp, i) => (
                  <div key={i} className="border-l-2 border-orange-500/30 pl-3">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium text-white">{exp.company}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-300">{exp.position}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {exp.startDate} ~ {exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {displayCompany && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-300">{displayCompany}</span>
                    {displayPosition && <span className="text-slate-500">· {displayPosition}</span>}
                  </div>
                )}
                {displayExperience && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-400">{displayExperience}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        {(matchedSkills.length > 0 || uncertainSkills.length > 0 || skills.length > 0) && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> 技能评估
            </h4>
            {matchedSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] text-emerald-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> 匹配技能
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.map((s, i) => (
                    <span key={i} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-500/20">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {uncertainSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] text-amber-400 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> 待确认
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uncertainSkills.map((s, i) => (
                    <span key={i} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400 border border-amber-500/20">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.length > 0 && matchedSkills.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span key={i} className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-400 border border-sky-500/20">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certificates & Honors */}
        {(certificates.length > 0 || honors.length > 0 || languages.length > 0) && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> 证书与荣誉
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">证书</p>
                  <div className="flex flex-wrap gap-1">
                    {certificates.map((c, i) => (
                      <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {honors.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">荣誉</p>
                  <div className="flex flex-wrap gap-1">
                    {honors.map((h, i) => (
                      <span key={i} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {languages.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">语言能力</p>
                  <div className="flex flex-wrap gap-1">
                    {languages.map((l, i) => (
                      <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Self Evaluation */}
        {displaySelfEval && (
          <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> 自我评价
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{displaySelfEval}</p>
          </div>
        )}

        {/* Original Resume File */}
        <div className="rounded-lg border border-[#1e293b] bg-[#0a0e1a]/50 p-4">
          <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> 原始简历文件
          </h4>
          {candidate.resumeFileKey ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">已上传原始简历文件</p>
              <button
                onClick={handleDownload}
                disabled={loadingUrl || !resumeDownloadUrl}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
              >
                {loadingUrl ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    加载中
                  </span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" /> 下载简历
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂未上传原始简历文件</p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag, i) => (
              <span key={i} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
