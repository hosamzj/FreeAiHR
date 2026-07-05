'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Trash2,
  Bot,
  FlaskConical,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  Mail,
 Pause,
 StopCircle,
 FileText,
 Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import ExcelImportSection from '@/components/excel-import-section';

// Collection modes - only mock and RPA (platform API removed as 51job/Boss don't have open APIs)
type CollectionMode = 'mock' | 'rpa';
type CollectionTab = 'channels' | 'email' | 'tasks' | 'excel';

interface CollectionModeConfig {
  id: CollectionMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const COLLECTION_MODES: CollectionModeConfig[] = [
  {
    id: 'mock',
    name: '模拟采集',
    description: '使用数据池随机生成候选人，适合演示和测试',
    icon: <Sparkles className="h-5 w-5" />,
    badge: '推荐',
    badgeColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'rpa',
    name: 'RPA爬虫',
    description: '通过浏览器自动化工具采集，需自行配置登录态',
    icon: <Bot className="h-5 w-5" />,
    badge: '实验性',
    badgeColor: 'bg-orange-500/10 text-orange-400',
  },
];

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

  // Tab state
  const [activeTab, setActiveTab] = useState<CollectionTab>('channels');

  // Email import state
  const [emailConfigs, setEmailConfigs] = useState<Array<{
    id: string; name: string; email: string; imapServer: string; imapPort: number; authCode: string; createdAt: string;
  }>>([]);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: '', imapServer: '', imapPort: '993', authCode: '', name: '' });
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Array<{
    subject: string; from: string; date: string; attachments: string[]; imported: boolean;
  }>>([]);
  const [selectedEmailConfig, setSelectedEmailConfig] = useState('');

  // Task management state
  const [tasks, setTasks] = useState<Array<{
    id: string; name: string; source: string; status: 'running' | 'paused' | 'completed' | 'failed';
    collected: number; total: number; startedAt: string; duration: string;
  }>>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Collection mode state
  const [collectionMode, setCollectionMode] = useState<CollectionMode>('mock');

  // Config state
  const [configKeyword, setConfigKeyword] = useState('');
  const [configLocation, setConfigLocation] = useState('');
  const [configEducation, setConfigEducation] = useState('');
  const [configSalaryMin, setConfigSalaryMin] = useState('15');
  const [configSalaryMax, setConfigSalaryMax] = useState('40');
  const [configCount, setConfigCount] = useState('20');

  // RPA config
  const [rpaScriptType, setRpaScriptType] = useState('selenium');
  const [rpaUsername, setRpaUsername] = useState('');
  const [rpaPassword, setRpaPassword] = useState('');
  const [rpaDelay, setRpaDelay] = useState('2');
  const [rpaProxy, setRpaProxy] = useState(false);
  const [rpaUARotate, setRpaUARotate] = useState(true);

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
    setCollectionMode('mock'); // Default to mock mode
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
    if (PRESET_CHANNELS.find(c => c.id === channelId)) return;
    setChannels(prev => prev.filter(c => c.id !== channelId));
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch('/api/collection/tasks');
      const data = await res.json();
      const taskList = data?.data?.tasks || data?.tasks || [];
      setTasks(Array.isArray(taskList) ? taskList : []);
    } catch {
      setTasks([]);
    }
    setLoadingTasks(false);
  }, []);

  // Load email configs
  const loadEmailConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/collection/email-config');
      const data = await res.json();
      const configs = data?.data?.configs || data?.configs || [];
      setEmailConfigs(Array.isArray(configs) ? configs : []);
    } catch {
      setEmailConfigs([]);
    }
  }, []);

  // Add email config
  const handleAddEmailConfig = useCallback(async () => {
    if (!emailForm.email || !emailForm.authCode) return;
    try {
      const res = await fetch('/api/collection/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: emailForm.name,
          email: emailForm.email,
          imapServer: emailForm.imapServer || 'imap.qq.com',
          imapPort: parseInt(emailForm.imapPort) || 993,
          authCode: emailForm.authCode,
        }),
      });
      if (res.ok) {
        setShowAddEmailModal(false);
        setEmailForm({ email: '', imapServer: '', imapPort: '993', authCode: '', name: '' });
        loadEmailConfigs();
      }
    } catch {
      // ignore
    }
  }, [emailForm, loadEmailConfigs]);

  // Load email configs on mount
  useEffect(() => {
    loadEmailConfigs();
  }, [loadEmailConfigs]);

  // Handle start collection based on mode
  const handleStartCollection = useCallback(async () => {
    if (!selectedChannel || !configKeyword) return;

    // Validate RPA credentials
    if (collectionMode === 'rpa') {
      if (!rpaUsername || !rpaPassword) {
        alert('请先配置登录凭证');
        return;
      }
    }

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
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    try {
      let apiUrl = '';
      let requestBody: Record<string, unknown> = {
        keyword: configKeyword,
        location: configLocation,
        education: configEducation === '不限' ? '' : configEducation,
        salaryRange: { min: parseInt(configSalaryMin), max: parseInt(configSalaryMax) },
        count: parseInt(configCount),
        source: selectedChannel.name,
      };

      switch (collectionMode) {
        case 'mock':
          apiUrl = '/api/candidates/generate';
          break;
        case 'rpa':
          apiUrl = '/api/candidates/scrape';
          requestBody = {
            ...requestBody,
            scriptType: rpaScriptType,
            credentials: { username: rpaUsername, password: rpaPassword },
            antiCrawl: {
              delay: parseInt(rpaDelay),
              proxy: rpaProxy,
              uaRotate: rpaUARotate,
            },
          };
          break;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setCollectProgress(100);

      if (data.code === 0 && data.data?.candidates) {
        setCollectedCandidates(data.data.candidates.map((c: GeneratedCandidate) => ({ ...c, selected: true })));
      } else if (data.code !== 0) {
        alert(data.message || '采集失败');
      }
    } catch (error) {
      console.error('Collection failed:', error);
      alert('采集请求失败，请检查网络');
    } finally {
      setTimeout(() => {
        setIsCollecting(false);
        setCollectProgress(0);
      }, 500);
    }
  }, [selectedChannel, configKeyword, configLocation, configEducation, configSalaryMin, configSalaryMax, configCount, collectionMode, rpaScriptType, rpaUsername, rpaPassword, rpaDelay, rpaProxy, rpaUARotate]);

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
        setCollectedCandidates(prev => prev.filter(c => !c.selected));
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [collectedCandidates]);

  const selectedCount = collectedCandidates.filter(c => c.selected).length;

  // Get source tag style based on collection mode
  const getSourceTagStyle = (source: string) => {
    if (source.includes('爬虫')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (source.includes('API')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">简历采集</h1>
        <p className="mt-0.5 text-xs text-slate-500">从招聘网站批量采集候选人简历，支持多种采集模式</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 bg-[#111827] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'channels'
              ? 'bg-[#1a2236] text-[#38bdf8] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-1.5" />
          渠道采集
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'email'
              ? 'bg-[#1a2236] text-[#38bdf8] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-1.5" />
          邮箱导入
        </button>
       <button
         onClick={() => { setActiveTab('tasks'); loadTasks(); }}
         className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
           activeTab === 'tasks'
             ? 'bg-[#1a2236] text-[#38bdf8] shadow-sm'
             : 'text-[#94a3b8] hover:text-[#e2e8f0]'
         }`}
       >
         <FileText className="w-4 h-4 inline mr-1.5" />
         任务管理
       </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'excel'
              ? 'bg-[#1a2236] text-[#38bdf8] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 inline mr-1.5" />
          Excel 导入
        </button>
      </div>

      {/* Channels Tab */}
      {activeTab === 'channels' && (
      <>
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
      </>
      )}

      {/* Email Import Tab */}
      {activeTab === 'email' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">邮箱简历导入</h2>
              <p className="text-xs text-slate-500 mt-1">配置IMAP邮箱，自动扫描简历邮件并导入候选人</p>
            </div>
            <button
              onClick={() => setShowAddEmailModal(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1a2236] px-3 text-xs text-slate-300 hover:bg-[#243049] cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> 添加邮箱
            </button>
          </div>

          {/* Email configs list */}
          {(emailConfigs || []).length === 0 ? (
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center">
              <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">暂无邮箱配置</p>
              <p className="text-xs text-slate-500">添加IMAP邮箱后，可自动扫描简历邮件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(emailConfigs || []).map(config => (
                <div key={config.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                        <Mail className="h-4 w-4 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{config.name || config.email}</p>
                        <p className="text-xs text-slate-500">{config.imapServer}:{config.imapPort}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setSelectedEmailConfig(config.id);
                          setScanning(true);
                          try {
                            const res = await fetch('/api/collection/email-scan', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ configId: config.id }),
                            });
                            const data = await res.json();
                            setScanResults(data.data?.results || []);
                          } catch {
                            setScanResults([]);
                          }
                          setScanning(false);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-colors"
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', scanning && 'animate-spin')} />
                        扫描邮箱
                      </button>
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/collection/email-config?id=${config.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            setEmailConfigs(prev => prev.filter(c => c.id !== config.id));
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scan results */}
          {scanResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">扫描结果</h3>
              <div className="space-y-2">
                {scanResults.map((result, idx) => (
                  <div key={idx} className={cn(
                    'rounded-lg border p-3 flex items-center justify-between',
                    result.imported ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#1e293b] bg-[#111827]'
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{result.subject}</p>
                      <p className="text-xs text-slate-500">发件人: {result.from} | {result.date}</p>
                      <p className="text-xs text-slate-500">附件: {result.attachments.join(', ')}</p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      result.imported ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    )}>
                      {result.imported ? '已导入' : '待导入'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">采集任务管理</h2>
            <button
              onClick={loadTasks}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a2236] px-3 py-1.5 text-xs text-slate-300 hover:bg-[#243049] cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </button>
          </div>

          {loadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
            </div>
          ) : (tasks || []).length === 0 ? (
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">暂无采集任务</p>
              <p className="text-xs text-slate-500">通过渠道采集或邮箱导入创建的任务会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(tasks || []).map(task => (
                <div key={task.id} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        task.status === 'running' ? 'bg-sky-500/10' :
                        task.status === 'paused' ? 'bg-amber-500/10' :
                        task.status === 'completed' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      )}>
                        {task.status === 'running' ? <Play className="h-4 w-4 text-sky-400" /> :
                         task.status === 'paused' ? <Pause className="h-4 w-4 text-amber-400" /> :
                         task.status === 'completed' ? <Check className="h-4 w-4 text-emerald-400" /> :
                         <AlertTriangle className="h-4 w-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{task.name}</p>
                        <p className="text-xs text-slate-500">来源: {task.source} | 开始: {task.startedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'running' && (
                        <button
                          onClick={async () => {
                            await fetch('/api/collection/tasks', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ taskId: task.id, status: 'paused' }),
                            });
                            loadTasks();
                          }}
                          className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Pause className="h-3 w-3" /> 暂停
                        </button>
                      )}
                      {task.status === 'paused' && (
                        <button
                          onClick={async () => {
                            await fetch('/api/collection/tasks', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ taskId: task.id, status: 'running' }),
                            });
                            loadTasks();
                          }}
                          className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400 hover:bg-sky-500/20 cursor-pointer"
                        >
                          <Play className="h-3 w-3" /> 恢复
                        </button>
                      )}
                      {(task.status === 'running' || task.status === 'paused') && (
                        <button
                          onClick={async () => {
                            await fetch('/api/collection/tasks', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ taskId: task.id, status: 'failed' }),
                            });
                            loadTasks();
                          }}
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 cursor-pointer"
                        >
                          <StopCircle className="h-3 w-3" /> 取消
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>进度: {task.collected}/{task.total}</span>
                    <span>耗时: {task.duration}</span>
                    <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${task.total > 0 ? (task.collected / task.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
         )}
       </div>
     )}

     {/* Collection Results */}

      {/* Excel Import Tab */}
      {activeTab === 'excel' && <ExcelImportSection />}

      {/* Collection Results */}
      {collectedCandidates.length > 0 && (
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-300">采集结果</h2>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">
                {collectedCandidates.length} 条简历
              </span>
              {collectionMode === 'rpa' && (
                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-400">
                  爬虫采集
                </span>
              )}
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
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] border', getSourceTagStyle(candidate.source))}>
                      {candidate.source}
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

      {/* Config Modal with Collection Mode Selector */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title={`配置采集 - ${selectedChannel?.name || ''}`} size="lg">
        <div className="space-y-4">
          {isCollecting ? (
            <div className="py-8 text-center">
              <div className="relative mx-auto mb-4 h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-sky-400 ai-pulse" />
              </div>
              <p className="text-sm font-medium text-white mb-1">
                正在从 {selectedChannel?.name} 采集简历...
                {collectionMode === 'rpa' && ' (RPA模式)'}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                {collectionMode === 'mock' && 'AI 正在生成候选人数据'}
                {collectionMode === 'rpa' && '爬虫脚本正在执行...'}
              </p>
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
              {/* Collection Mode Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">采集模式</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLLECTION_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setCollectionMode(mode.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all cursor-pointer',
                        collectionMode === mode.id
                          ? 'border-sky-500/50 bg-sky-500/10'
                          : 'border-[#1e293b] bg-[#0a0e1a] hover:border-slate-600'
                      )}
                    >
                      {mode.badge && (
                        <span className={cn('absolute -top-1.5 right-1 rounded-full px-1.5 py-0.5 text-[9px]', mode.badgeColor)}>
                          {mode.badge}
                        </span>
                      )}
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        collectionMode === mode.id ? 'text-sky-400' : 'text-slate-500'
                      )}>
                        {mode.icon}
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        collectionMode === mode.id ? 'text-white' : 'text-slate-400'
                      )}>
                        {mode.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {COLLECTION_MODES.find(m => m.id === collectionMode)?.description}
                </p>
              </div>

              {/* RPA Config */}
              {collectionMode === 'rpa' && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 space-y-3">
                  {/* Warning Banner */}
                  <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-orange-300 leading-relaxed">
                      <p className="font-medium mb-0.5">注意：RPA爬虫模式需要用户自行在浏览器中登录目标网站，配置Cookie和爬虫参数。</p>
                      <p>该模式可能违反目标网站的服务条款，<span className="font-medium">建议仅用于内部测试，不要商用</span>。</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium text-orange-400">RPA爬虫配置 (实验性)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">脚本类型</label>
                      <select
                        value={rpaScriptType}
                        onChange={(e) => setRpaScriptType(e.target.value)}
                        className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-orange-500/50 focus:outline-none"
                      >
                        <option value="selenium">Selenium</option>
                        <option value="playwright">Playwright</option>
                        <option value="requests">Requests</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">请求延迟 (秒)</label>
                      <input
                        type="number"
                        value={rpaDelay}
                        onChange={(e) => setRpaDelay(e.target.value)}
                        min="1"
                        max="10"
                        className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 focus:border-orange-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">登录账号 *</label>
                      <input
                        type="text"
                        value={rpaUsername}
                        onChange={(e) => setRpaUsername(e.target.value)}
                        placeholder="平台登录账号"
                        className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-orange-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">登录密码 *</label>
                      <input
                        type="password"
                        value={rpaPassword}
                        onChange={(e) => setRpaPassword(e.target.value)}
                        placeholder="平台登录密码"
                        className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-slate-300 placeholder:text-slate-600 focus:border-orange-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rpaProxy}
                        onChange={(e) => setRpaProxy(e.target.checked)}
                        className="rounded border-[#1e293b] bg-[#0a0e1a] text-orange-500 focus:ring-orange-500/20"
                      />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> 代理轮换
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rpaUARotate}
                        onChange={(e) => setRpaUARotate(e.target.checked)}
                        className="rounded border-[#1e293b] bg-[#0a0e1a] text-orange-500 focus:ring-orange-500/20"
                      />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> UA轮换
                      </span>
                    </label>
                  </div>
                  <p className="text-[10px] text-orange-400/60">
                    注意：RPA爬虫为实验性功能，可能因平台反爬策略导致采集失败
                  </p>
                </div>
              )}

              {/* Common Config */}
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

      {/* Add Email Config Modal */}
      <Modal isOpen={showAddEmailModal} onClose={() => setShowAddEmailModal(false)} title="添加邮箱配置">
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">配置名称</label>
            <input
              type="text"
              value={emailForm.name}
              onChange={e => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="如：公司招聘邮箱"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">邮箱地址 *</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={e => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="recruit@company.com"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">IMAP服务器</label>
              <input
                type="text"
                value={emailForm.imapServer}
                onChange={e => setEmailForm(prev => ({ ...prev, imapServer: e.target.value }))}
                placeholder="imap.qq.com"
                className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">端口</label>
              <input
                type="text"
                value={emailForm.imapPort}
                onChange={e => setEmailForm(prev => ({ ...prev, imapPort: e.target.value }))}
                placeholder="993"
                className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">授权码/密码 *</label>
            <input
              type="password"
              value={emailForm.authCode}
              onChange={e => setEmailForm(prev => ({ ...prev, authCode: e.target.value }))}
              placeholder="邮箱授权码"
              className="w-full h-9 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-400">
              提示：QQ邮箱、网易邮箱需要在设置中开启IMAP服务并生成授权码；企业邮箱请使用企业提供的IMAP地址。
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowAddEmailModal(false)}
              className="flex-1 h-9 rounded-lg border border-[#1e293b] text-sm text-slate-400 hover:bg-[#111827] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddEmailConfig}
              className="flex-1 h-9 rounded-lg bg-sky-500 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
