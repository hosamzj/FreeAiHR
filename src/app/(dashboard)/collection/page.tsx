'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Globe,
  Plus,
  Settings,
  Play,
  Check,
  X,
  Loader2,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Briefcase,
  MapPin,
  GraduationCap,
  DollarSign,
  Users,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

// Channel types
interface Channel {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  connected: boolean;
}

interface GeneratedCandidate {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  education: string;
  school: string;
  major: string;
  experience: number;
  currentCompany: string;
  currentPosition: string;
  skills: string[];
  location: string;
  expectedSalary: string;
  source: string;
  matchScore: number;
  aiSummary: string;
  appliedPosition: string;
  tags: string[];
  selected?: boolean;
}

// Preset channels
const PRESET_CHANNELS: Channel[] = [
  { id: '51job', name: '前程无忧 (51job)', url: 'https://www.51job.com', icon: '51', color: 'from-blue-500 to-blue-600', connected: false },
  { id: 'boss', name: 'Boss直聘', url: 'https://www.zhipin.com', icon: 'BO', color: 'from-cyan-500 to-cyan-600', connected: false },
  { id: 'lagou', name: '拉勾网', url: 'https://www.lagou.com', icon: 'LG', color: 'from-green-500 to-green-600', connected: false },
  { id: 'liepin', name: '猎聘', url: 'https://www.liepin.com', icon: 'LP', color: 'from-purple-500 to-purple-600', connected: false },
];

const LOCATIONS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州'];
const EDUCATIONS = ['不限', '大专', '本科', '硕士', '博士'];

export default function CollectionPage() {
  const [channels, setChannels] = useState<Channel[]>(PRESET_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);

  // Config state
  const [configKeyword, setConfigKeyword] = useState('');
  const [configLocation, setConfigLocation] = useState('');
  const [configEducation, setConfigEducation] = useState('');
  const [configSalaryMin, setConfigSalaryMin] = useState('15');
  const [configSalaryMax, setConfigSalaryMax] = useState('40');
  const [configCount, setConfigCount] = useState('20');

  // Collection state
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectProgress, setCollectProgress] = useState(0);
  const [collectedCandidates, setCollectedCandidates] = useState<GeneratedCandidate[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Import result
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Add channel form
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');

  // Handle channel connect
  const handleConnectChannel = useCallback((channel: Channel) => {
    setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, connected: true } : c));
    setSelectedChannel({ ...channel, connected: true });
    setShowConfigModal(true);
  }, []);

  // Handle add custom channel
  const handleAddChannel = useCallback(() => {
    if (!newChannelName || !newChannelUrl) return;
    const newChannel: Channel = {
      id: `custom_${Date.now()}`,
      name: newChannelName,
      url: newChannelUrl,
      icon: newChannelName.slice(0, 2).toUpperCase(),
      color: 'from-slate-500 to-slate-600',
      connected: false,
    };
    setChannels(prev => [...prev, newChannel]);
    setNewChannelName('');
    setNewChannelUrl('');
    setShowAddChannelModal(false);
  }, [newChannelName, newChannelUrl]);

  // Handle remove channel
  const handleRemoveChannel = useCallback((channelId: string) => {
    if (PRESET_CHANNELS.find(c => c.id === channelId)) return; // Can't remove preset
    setChannels(prev => prev.filter(c => c.id !== channelId));
  }, []);

  // Handle start collection
  const handleStartCollection = useCallback(async () => {
    if (!selectedChannel || !configKeyword) return;

    setIsCollecting(true);
    setCollectProgress(0);
    setCollectedCandidates([]);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setCollectProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + randomProgress();
      });
    }, 200);

    try {
      const res = await fetch('/api/candidates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: configKeyword,
          location: configLocation,
          education: configEducation === '不限' ? '' : configEducation,
          salaryRange: { min: parseInt(configSalaryMin), max: parseInt(configSalaryMax) },
          count: parseInt(configCount),
          source: selectedChannel.name,
        }),
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setCollectProgress(100);

      if (data.code === 0 && data.data?.candidates) {
        setCollectedCandidates(data.data.candidates.map((c: GeneratedCandidate) => ({ ...c, selected: true })));
      }
    } catch (error) {
      console.error('Collection failed:', error);
    } finally {
      setTimeout(() => {
        setIsCollecting(false);
        setCollectProgress(0);
      }, 500);
    }
  }, [selectedChannel, configKeyword, configLocation, configEducation, configSalaryMin, configSalaryMax, configCount]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const newVal = !selectAll;
    setSelectAll(newVal);
    setCollectedCandidates(prev => prev.map(c => ({ ...c, selected: newVal })));
  }, [selectAll]);

  // Handle toggle candidate
  const handleToggleCandidate = useCallback((id: string) => {
    setCollectedCandidates(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  }, []);

  // Handle batch import
  const handleBatchImport = useCallback(async () => {
    const selected = collectedCandidates.filter(c => c.selected);
    if (selected.length === 0) return;

    try {
      const res = await fetch('/api/candidates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: selected }),
      });

      const data = await res.json();
      if (data.code === 0 && data.data) {
        setImportResult(data.data);
        setShowImportResultModal(true);
        // Remove imported candidates from list
        setCollectedCandidates(prev => prev.filter(c => !c.selected));
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [collectedCandidates]);

  const selectedCount = collectedCandidates.filter(c => c.selected).length;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">简历采集</h1>
        <p className="mt-0.5 text-xs text-slate-500">从招聘网站批量采集候选人简历，AI智能匹配导入系统</p>
      </div>

      {/* Channel Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">招聘渠道</h2>
          <button
            onClick={() => setShowAddChannelModal(true)}
            className="flex h-7 items-center gap-1 rounded-lg border border-[#1e293b] px-2.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <Plus className="h-3 w-3" /> 添加渠道
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(channel => (
            <div
              key={channel.id}
              className={cn(
                'relative rounded-xl border p-4 transition-all cursor-pointer',
                channel.connected
                  ? 'border-sky-500/30 bg-sky-500/5'
                  : 'border-[#1e293b] bg-[#111827] hover:border-slate-600'
              )}
              onClick={() => channel.connected ? (setSelectedChannel(channel), setShowConfigModal(true)) : handleConnectChannel(channel)}
            >
              {!PRESET_CHANNELS.find(c => c.id === channel.id) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveChannel(channel.id); }}
                  className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white', channel.color)}>
                  {channel.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{channel.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{channel.url}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                  channel.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', channel.connected ? 'bg-emerald-400' : 'bg-slate-500')} />
                  {channel.connected ? '已连接' : '未连接'}
                </span>
                <button className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer">
                  {channel.connected ? '配置采集' : '立即连接'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Results */}
      {collectedCandidates.length > 0 && (
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-300">采集结果</h2>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">
                {collectedCandidates.length} 条简历
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索候选人..."
                  className="h-8 w-full rounded-lg border border-[#1e293b] bg-[#111827] pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none sm:w-48"
                />
              </div>
              <button
                onClick={handleSelectAll}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] px-2.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                {selectAll ? <CheckSquare className="h-3.5 w-3.5 text-sky-400" /> : <Square className="h-3.5 w-3.5" />}
                {selectAll ? '取消全选' : '全选'}
              </button>
              <button
                onClick={handleBatchImport}
                disabled={selectedCount === 0}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                导入选中 ({selectedCount})
              </button>
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-2">
            {collectedCandidates
              .filter(c => !searchQuery || c.name.includes(searchQuery) || c.skills.some(s => s.includes(searchQuery)))
              .map(candidate => (
              <div
                key={candidate.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-all',
                  candidate.selected ? 'border-sky-500/30 bg-sky-500/5' : 'border-[#1e293b] bg-[#111827]'
                )}
              >
                <button onClick={() => handleToggleCandidate(candidate.id)} className="cursor-pointer">
                  {candidate.selected ? (
                    <CheckSquare className="h-4 w-4 text-sky-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-600" />
                  )}
                </button>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                  candidate.matchScore >= 85 ? 'from-emerald-500/30 to-green-600/30 text-emerald-400 border border-emerald-500/20' :
                  'from-amber-500/30 to-orange-600/30 text-amber-400 border border-amber-500/20'
                )}>
                  {candidate.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{candidate.name}</p>
                    <span className="rounded-full bg-[#0a0e1a] px-1.5 py-0.5 text-[10px] text-slate-500 border border-[#1e293b]">
                      来自 {candidate.source}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{candidate.currentPosition}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{candidate.location}</span>
                    <span className="flex items-center gap-0.5"><GraduationCap className="h-3 w-3" />{candidate.education}</span>
                    <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{candidate.expectedSalary}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="rounded bg-[#0a0e1a] px-1.5 py-0.5 text-[10px] text-slate-400 border border-[#1e293b]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-bold',
                    candidate.matchScore >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  )}>
                    {candidate.matchScore}
                  </div>
                  <span className="text-[10px] text-slate-500">匹配度</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Channel Modal */}
      <Modal isOpen={showAddChannelModal} onClose={() => setShowAddChannelModal(false)} title="添加招聘渠道">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">渠道名称</label>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="如：智联招聘"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">网站URL</label>
            <input
              type="url"
              value={newChannelUrl}
              onChange={(e) => setNewChannelUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAddChannel} className="flex-1 h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors">
              添加
            </button>
            <button onClick={() => setShowAddChannelModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Config Modal */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title={`配置采集 - ${selectedChannel?.name || ''}`} size="lg">
        <div className="space-y-4">
          {isCollecting ? (
            <div className="py-8 text-center">
              <div className="relative mx-auto mb-4 h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-sky-400 ai-pulse" />
              </div>
              <p className="text-sm font-medium text-white mb-1">正在从 {selectedChannel?.name} 采集简历...</p>
              <p className="text-xs text-slate-500 mb-4">AI 正在分析并匹配候选人数据</p>
              <div className="mx-auto max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-[#1e293b]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${collectProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-mono">{collectProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">采集关键词 *</label>
                <input
                  type="text"
                  value={configKeyword}
                  onChange={(e) => setConfigKeyword(e.target.value)}
                  placeholder="如：前端工程师、产品经理、Java开发"
                  className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">工作地点</label>
                  <select
                    value={configLocation}
                    onChange={(e) => setConfigLocation(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
                  >
                    <option value="">不限</option>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">学历要求</label>
                  <select
                    value={configEducation}
                    onChange={(e) => setConfigEducation(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
                  >
                    {EDUCATIONS.map(edu => <option key={edu} value={edu}>{edu}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">期望薪资下限 (K)</label>
                  <input
                    type="number"
                    value={configSalaryMin}
                    onChange={(e) => setConfigSalaryMin(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">期望薪资上限 (K)</label>
                  <input
                    type="number"
                    value={configSalaryMax}
                    onChange={(e) => setConfigSalaryMax(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">采集数量</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={configCount}
                    onChange={(e) => setConfigCount(e.target.value)}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-12 text-right text-sm text-sky-400 font-mono">{configCount}条</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleStartCollection}
                  disabled={!configKeyword}
                  className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-sm font-medium text-white hover:from-sky-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Play className="h-3.5 w-3.5" /> 开始采集
                </button>
                <button onClick={() => setShowConfigModal(false)} className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:text-white transition-colors">
                  取消
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Import Result Modal */}
      <Modal isOpen={showImportResultModal} onClose={() => setShowImportResultModal(false)} title="导入结果">
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">导入完成</p>
            <p className="mt-1 text-sm text-slate-400">
              成功 <span className="text-emerald-400 font-mono">{importResult?.success || 0}</span> 条，
              失败 <span className="text-red-400 font-mono">{importResult?.failed || 0}</span> 条
            </p>
          </div>
          {importResult?.errors && importResult.errors.length > 0 && (
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
              <p className="text-xs font-medium text-red-400 mb-1">失败原因：</p>
              <ul className="space-y-0.5">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-[11px] text-red-400/80">{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => setShowImportResultModal(false)}
            className="w-full h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
          >
            确定
          </button>
        </div>
      </Modal>
    </div>
  );
}

function randomProgress(): number {
  return Math.floor(Math.random() * 15) + 5;
}
