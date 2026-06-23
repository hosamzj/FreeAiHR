'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Settings, Shield, Key, Building2, Save, Loader2, Check,
  Globe, Lock, Mail, Download, Bot, AlertTriangle, Video, Plus, GripVertical, Trash2, Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'sso' | 'password' | 'general' | 'collection' | 'interview_methods';

interface SSOCfg {
  enabled: boolean;
  protocol: string;
  idpUrl: string;
  idpCert: string;
  entityId: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  autoProvision: boolean;
  defaultRole: string;
}

interface PasswordPolicyCfg {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  expiryDays: number;
  historyCount: number;
}

interface SystemCfg {
  companyName: string;
  logoUrl: string;
  emailNotification: boolean;
  smsNotification: boolean;
}

interface RpaCfg {
  scriptType: 'selenium' | 'playwright' | 'requests';
  username: string;
  password: string;
  requestInterval: number;
  randomDelay: boolean;
  proxyRotation: boolean;
  uaRotation: boolean;
}

interface CollectionCfg {
  defaultMode: 'mock' | 'rpa';
  rpa: RpaCfg;
}

interface InterviewMethod {
  id: string;
  name: string;
  order: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('sso');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [sso, setSso] = useState<SSOCfg>({
    enabled: false, protocol: 'saml', idpUrl: '', idpCert: '', entityId: '',
    clientId: '', clientSecret: '', callbackUrl: '', autoProvision: true, defaultRole: 'interviewer',
  });
  const [pwdPolicy, setPwdPolicy] = useState<PasswordPolicyCfg>({
    minLength: 8, requireUppercase: true, requireLowercase: true,
    requireNumbers: true, requireSpecial: true, expiryDays: 90, historyCount: 5,
  });
  const [sysCfg, setSysCfg] = useState<SystemCfg>({
    companyName: 'AI智能招聘', logoUrl: '', emailNotification: true, smsNotification: true,
  });
  const [collectionCfg, setCollectionCfg] = useState<CollectionCfg>({
    defaultMode: 'mock',
    rpa: {
      scriptType: 'playwright',
      username: '',
      password: '',
      requestInterval: 3,
      randomDelay: true,
      proxyRotation: false,
      uaRotation: true,
    },
  });

  // Interview methods state
  const [interviewMethods, setInterviewMethods] = useState<InterviewMethod[]>([]);
  const [newMethodName, setNewMethodName] = useState('');
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [editingMethodName, setEditingMethodName] = useState('');
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch('/api/system/sso').then(r => r.json()).then(d => { if (d.code === 0) setSso(d.data); });
    fetch('/api/system/password-policy').then(r => r.json()).then(d => { if (d.code === 0) setPwdPolicy(d.data); });
    fetch('/api/system/config').then(r => r.json()).then(d => { if (d.code === 0) setSysCfg(d.data); });
    // Fetch interview methods
    fetchInterviewMethods();
    // Collection config is stored locally for now
  }, [user]);

  const fetchInterviewMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await fetch('/api/system/interview-methods');
      const data = await res.json();
      if (data.code === 0) {
        setInterviewMethods(data.data);
      }
    } catch (err) {
      console.error('Fetch interview methods error:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleAddMethod = async () => {
    if (!newMethodName.trim()) return;
    try {
      const res = await fetch('/api/system/interview-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMethodName.trim() }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setInterviewMethods([...interviewMethods, data.data]);
        setNewMethodName('');
      }
    } catch (err) {
      console.error('Add method error:', err);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/system/interview-methods?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        setInterviewMethods(interviewMethods.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Delete method error:', err);
    }
  };

  const handleUpdateMethod = async (id: string) => {
    if (!editingMethodName.trim()) return;
    try {
      const res = await fetch('/api/system/interview-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingMethodName.trim() }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setInterviewMethods(data.data);
        setEditingMethodId(null);
        setEditingMethodName('');
      }
    } catch (err) {
      console.error('Update method error:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoints: Record<string, { url: string; body: unknown }> = {
        sso: { url: '/api/system/sso', body: sso },
        password: { url: '/api/system/password-policy', body: pwdPolicy },
        general: { url: '/api/system/config', body: sysCfg },
        collection: { url: '/api/system/collection', body: collectionCfg },
      };
      const { url, body } = endpoints[activeTab];
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">无权限访问此页面</p>
      </div>
    );
  }

  const tabs = [
    { id: 'sso' as TabId, label: 'SSO配置', icon: Globe },
    { id: 'password' as TabId, label: '密码策略', icon: Key },
    { id: 'general' as TabId, label: '基础配置', icon: Building2 },
    { id: 'collection' as TabId, label: '采集配置', icon: Download },
    { id: 'interview_methods' as TabId, label: '面试方式', icon: Video },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white md:text-2xl">系统设置</h1>
        <p className="text-sm text-slate-400 mt-1">配置系统参数、安全策略和集成服务</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap',
                activeTab === tab.id ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SSO Config */}
      {activeTab === 'sso' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">单点登录 (SSO)</h3>
              <p className="text-sm text-slate-400 mt-1">配置企业SSO集成，支持SAML 2.0和OIDC协议</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sso.enabled}
                onChange={(e) => setSso({ ...sso, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {sso.enabled && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-sm text-slate-300 mb-1">协议类型</label>
                <select value={sso.protocol} onChange={(e) => setSso({ ...sso, protocol: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
                  <option value="saml">SAML 2.0</option>
                  <option value="oidc">OpenID Connect (OIDC)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">IdP URL</label>
                <input value={sso.idpUrl} onChange={(e) => setSso({ ...sso, idpUrl: e.target.value })} placeholder="https://idp.company.com/saml" className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              </div>
              {sso.protocol === 'saml' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Entity ID</label>
                    <input value={sso.entityId} onChange={(e) => setSso({ ...sso, entityId: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">IdP Certificate</label>
                    <textarea value={sso.idpCert} onChange={(e) => setSso({ ...sso, idpCert: e.target.value })} rows={3} placeholder="粘贴PEM格式证书..." className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono" />
                  </div>
                </>
              )}
              {sso.protocol === 'oidc' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Client ID</label>
                    <input value={sso.clientId} onChange={(e) => setSso({ ...sso, clientId: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Client Secret</label>
                    <input type="password" value={sso.clientSecret} onChange={(e) => setSso({ ...sso, clientSecret: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-slate-300 mb-1">回调URL</label>
                <input value={sso.callbackUrl} onChange={(e) => setSso({ ...sso, callbackUrl: e.target.value })} placeholder="/api/auth/sso/callback" className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={sso.autoProvision} onChange={(e) => setSso({ ...sso, autoProvision: e.target.checked })} className="rounded border-slate-600" />
                  自动创建用户
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">默认角色:</span>
                  <select value={sso.defaultRole} onChange={(e) => setSso({ ...sso, defaultRole: e.target.value })} className="px-2 py-1 bg-[#0a0e1a] border border-slate-700 rounded text-sm text-white">
                    <option value="interviewer">面试官</option>
                    <option value="hr_manager">招聘经理</option>
                    <option value="candidate">候选人</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Policy */}
      {activeTab === 'password' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-lg font-medium text-white">密码安全策略</h3>
            <p className="text-sm text-slate-400 mt-1">设置密码复杂度要求和过期策略</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">最小长度</label>
              <input type="number" value={pwdPolicy.minLength} onChange={(e) => setPwdPolicy({ ...pwdPolicy, minLength: parseInt(e.target.value) })} min={6} max={32} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">密码过期天数</label>
              <input type="number" value={pwdPolicy.expiryDays} onChange={(e) => setPwdPolicy({ ...pwdPolicy, expiryDays: parseInt(e.target.value) })} min={0} max={365} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
              <p className="text-xs text-slate-500 mt-1">设为0表示永不过期</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'requireUppercase', label: '要求大写字母' },
                { key: 'requireLowercase', label: '要求小写字母' },
                { key: 'requireNumbers', label: '要求数字' },
                { key: 'requireSpecial', label: '要求特殊字符' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(pwdPolicy as unknown as Record<string, unknown>)[item.key] as boolean}
                    onChange={(e) => setPwdPolicy({ ...pwdPolicy, [item.key]: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">密码历史记录</label>
              <input type="number" value={pwdPolicy.historyCount} onChange={(e) => setPwdPolicy({ ...pwdPolicy, historyCount: parseInt(e.target.value) })} min={0} max={20} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
              <p className="text-xs text-slate-500 mt-1">禁止使用最近N次用过的密码</p>
            </div>
          </div>
        </div>
      )}

      {/* General Config */}
      {activeTab === 'general' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-lg font-medium text-white">基础配置</h3>
            <p className="text-sm text-slate-400 mt-1">设置公司信息、通知偏好等基础参数</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">公司名称</label>
              <input value={sysCfg.companyName} onChange={(e) => setSysCfg({ ...sysCfg, companyName: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">公司Logo URL</label>
              <input value={sysCfg.logoUrl} onChange={(e) => setSysCfg({ ...sysCfg, logoUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">邮件通知</span>
                </div>
                <input type="checkbox" checked={sysCfg.emailNotification} onChange={(e) => setSysCfg({ ...sysCfg, emailNotification: e.target.checked })} className="rounded border-slate-600" />
              </label>
              <label className="flex items-center justify-between p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">短信通知</span>
                </div>
                <input type="checkbox" checked={sysCfg.smsNotification} onChange={(e) => setSysCfg({ ...sysCfg, smsNotification: e.target.checked })} className="rounded border-slate-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Collection Config */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          {/* Default Mode */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-medium text-white">默认采集模式</h3>
              <p className="text-sm text-slate-400 mt-1">设置简历采集的默认模式</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'mock' as const, label: '模拟采集', desc: '随机生成候选人数据，用于演示和测试', color: 'slate' },
                { id: 'rpa' as const, label: 'RPA爬虫', desc: '自动化脚本采集，实验性功能', color: 'orange' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setCollectionCfg({ ...collectionCfg, defaultMode: mode.id })}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-colors',
                    collectionCfg.defaultMode === mode.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-700 bg-[#0a0e1a] hover:border-slate-600'
                  )}
                >
                  <p className="text-sm font-medium text-white">{mode.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* RPA Config */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  RPA爬虫配置
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-400 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    实验性功能
                  </span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">配置自动化爬虫脚本参数</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">脚本类型</label>
                <select
                  value={collectionCfg.rpa.scriptType}
                  onChange={(e) => setCollectionCfg({
                    ...collectionCfg,
                    rpa: { ...collectionCfg.rpa, scriptType: e.target.value as 'selenium' | 'playwright' | 'requests' },
                  })}
                  className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="playwright">Playwright（推荐）</option>
                  <option value="selenium">Selenium</option>
                  <option value="requests">Requests（仅静态页面）</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">平台账号</label>
                  <input
                    value={collectionCfg.rpa.username}
                    onChange={(e) => setCollectionCfg({
                      ...collectionCfg,
                      rpa: { ...collectionCfg.rpa, username: e.target.value },
                    })}
                    placeholder="登录账号"
                    className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">平台密码</label>
                  <input
                    type="password"
                    value={collectionCfg.rpa.password}
                    onChange={(e) => setCollectionCfg({
                      ...collectionCfg,
                      rpa: { ...collectionCfg.rpa, password: e.target.value },
                    })}
                    placeholder="登录密码"
                    className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">请求间隔（秒）</label>
                <input
                  type="number"
                  value={collectionCfg.rpa.requestInterval}
                  onChange={(e) => setCollectionCfg({
                    ...collectionCfg,
                    rpa: { ...collectionCfg.rpa, requestInterval: parseInt(e.target.value) || 3 },
                  })}
                  min={1}
                  max={30}
                  className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">两次请求之间的等待时间，建议3-10秒</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionCfg.rpa.randomDelay}
                    onChange={(e) => setCollectionCfg({
                      ...collectionCfg,
                      rpa: { ...collectionCfg.rpa, randomDelay: e.target.checked },
                    })}
                    className="rounded border-slate-600"
                  />
                  <span className="text-sm text-slate-300">随机延迟</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionCfg.rpa.proxyRotation}
                    onChange={(e) => setCollectionCfg({
                      ...collectionCfg,
                      rpa: { ...collectionCfg.rpa, proxyRotation: e.target.checked },
                    })}
                    className="rounded border-slate-600"
                  />
                  <span className="text-sm text-slate-300">代理轮换</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionCfg.rpa.uaRotation}
                    onChange={(e) => setCollectionCfg({
                      ...collectionCfg,
                      rpa: { ...collectionCfg.rpa, uaRotation: e.target.checked },
                    })}
                    className="rounded border-slate-600"
                  />
                  <span className="text-sm text-slate-300">UA轮换</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Methods Config */}
      {activeTab === 'interview_methods' && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-lg font-medium text-white">面试方式管理</h3>
            <p className="text-sm text-slate-400 mt-1">配置系统支持的面试方式，新建面试时可选择</p>
          </div>

          {/* Add new method */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="输入新的面试方式名称"
              className="flex-1 px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddMethod();
                }
              }}
            />
            <button
              onClick={handleAddMethod}
              disabled={!newMethodName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          {/* Methods list */}
          <div className="space-y-2">
            {loadingMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                <span className="ml-2 text-sm text-slate-400">加载中...</span>
              </div>
            ) : interviewMethods.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                暂无面试方式，请添加
              </div>
            ) : (
              interviewMethods.map((method, index) => (
                <div
                  key={method.id}
                  className="flex items-center gap-3 p-3 bg-[#0a0e1a] border border-slate-700 rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
                  <span className="text-xs text-slate-500 w-6">{index + 1}.</span>
                  {editingMethodId === method.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingMethodName}
                        onChange={(e) => setEditingMethodName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#111827] border border-sky-500 rounded text-sm text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateMethod(method.id);
                          } else if (e.key === 'Escape') {
                            setEditingMethodId(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleUpdateMethod(method.id)}
                        className="p-1 text-sky-400 hover:text-sky-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMethodId(null)}
                        className="p-1 text-slate-400 hover:text-slate-300"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-white">{method.name}</span>
                      <button
                        onClick={() => {
                          setEditingMethodId(method.id);
                          setEditingMethodName(method.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除"${method.name}"吗？`)) {
                            handleDeleteMethod(method.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-lg">
            <p className="text-xs text-sky-400">
              提示：面试方式将显示在新建面试表单的下拉列表中，供面试官和HR选择。
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? '保存中...' : saved ? '已保存' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
