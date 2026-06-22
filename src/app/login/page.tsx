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
    window.location.href = '/api/auth/sso/callback?code=demo&state=sso';
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

        {/* Demo accounts */}
        <div className="mt-6 p-4 bg-[#111827]/50 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500 mb-2">演示账号：</p>
          <div className="space-y-1 text-xs text-slate-400">
            <p>管理员：admin@recruit.ai / Admin@123</p>
            <p>HR经理：hr@recruit.ai / Hr@12345</p>
            <p>面试官：interviewer@recruit.ai / Test@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
