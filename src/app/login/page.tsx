'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.needPasswordChange) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  const handleSSOLogin = () => {
    // 生产环境禁用硬编码SSO，仅保留配置好的IdP跳转
    if (process.env.NODE_ENV === 'production') {
      setError('企业SSO登录功能未配置');
      return;
    }
    // 开发环境：模拟SSO回调（仅用于本地调试）
    const state = crypto.randomUUID();
    sessionStorage.setItem('sso_state', state);
    window.location.href = `/api/auth/sso/callback?code=demo&state=${state}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 mb-4">
            <Shield className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">AI 智能招聘系统</h1>
          <p className="text-slate-400 text-sm mt-2">企业级智能招聘管理平台</p>
        </div>

        {/* Login form */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                className="w-full px-4 py-3 bg-[#0a0e1a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#111827] text-slate-400">或</span>
            </div>
          </div>

          {/* SSO Login */}
          <button
            type="button"
            onClick={handleSSOLogin}
            className="w-full py-3 bg-[#0a0e1a] border border-slate-700 hover:border-slate-600 text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            企业SSO登录
          </button>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <a href="/forgot-password" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
              忘记密码？
            </a>
          </div>
        </div>

        {/* Demo accounts - only shown when enabled */}
        {process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true' && (
          <div className="mt-6 p-4 bg-[#111827]/50 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              演示账号（点击自动填入）
            </p>
            <div className="space-y-2">
              {[
                { role: '管理员', email: 'admin@recruit.ai', password: 'Admin@123', color: 'sky', hoverBorder: 'hover:border-sky-500/30', hoverBg: 'hover:bg-sky-500/5', iconBg: 'bg-sky-500/10', iconBorder: 'border-sky-500/20', iconText: 'text-sky-400' },
                { role: 'HR经理', email: 'hr@recruit.ai', password: 'Hr@12345', color: 'orange', hoverBorder: 'hover:border-orange-500/30', hoverBg: 'hover:bg-orange-500/5', iconBg: 'bg-orange-500/10', iconBorder: 'border-orange-500/20', iconText: 'text-orange-400' },
                { role: '面试官', email: 'interviewer@recruit.ai', password: 'Test@1234', color: 'emerald', hoverBorder: 'hover:border-emerald-500/30', hoverBg: 'hover:bg-emerald-500/5', iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20', iconText: 'text-emerald-400' },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0e1a]/50 border border-slate-800 ${account.hoverBorder} ${account.hoverBg} transition-all text-left group`}
                >
                  <span className={`w-8 h-8 rounded-lg ${account.iconBg} border ${account.iconBorder} flex items-center justify-center ${account.iconText} text-xs font-medium group-hover:scale-105 transition-transform`}>
                    {account.role.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 font-medium">{account.role}</p>
                    <p className="text-xs text-slate-500 truncate">{account.email}</p>
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
                    点击填入
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
