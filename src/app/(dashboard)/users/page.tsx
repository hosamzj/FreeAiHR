'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import {
  Users, Search, Plus, Edit2, Trash2, Shield, ShieldCheck, ShieldAlert,
  MoreVertical, X, Check, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserItem {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: string;
  department: string | null;
  position: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: '超级管理员',
  hr_manager: '招聘经理',
  interviewer: '面试官',
  candidate: '候选人',
};

const roleColors: Record<string, string> = {
  admin: 'text-red-400 bg-red-500/10 border-red-500/20',
  hr_manager: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  interviewer: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  candidate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export default function UsersPage() {
  const { setActiveModule } = useAppContext();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (data.code === 0) {
        setUsers(data.data.users);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.code === 0) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 0) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">无权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">用户管理</h1>
          <p className="text-sm text-slate-400 mt-1">管理系统用户、角色和权限</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索用户名、邮箱..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">全部角色</option>
          <option value="admin">超级管理员</option>
          <option value="hr_manager">招聘经理</option>
          <option value="interviewer">面试官</option>
          <option value="candidate">候选人</option>
        </select>
      </div>

      {/* Users table - desktop */}
      <div className="hidden md:block bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">用户</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">角色</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">部门</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">状态</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">最后登录</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">暂无用户数据</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-[#1a2236]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sm font-medium text-sky-400">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border', roleColors[u.role])}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{u.department || '-'}</td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md', u.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10')}>
                      {u.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('zh-CN') : '从未登录'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                      >
                        {u.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      {u.id !== currentUser?.userId && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users cards - mobile */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sm font-medium text-sky-400">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <span className={cn('px-2 py-0.5 text-xs rounded-md border', roleColors[u.role])}>
                {roleLabels[u.role]}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>{u.department || '未分配部门'}</span>
              <span>·</span>
              <span className={u.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                {u.status === 'active' ? '启用' : '禁用'}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
              <button onClick={() => setEditingUser(u)} className="flex-1 py-2 text-xs text-sky-400 bg-sky-500/10 rounded-lg">编辑</button>
              <button onClick={() => handleToggleStatus(u)} className="flex-1 py-2 text-xs text-orange-400 bg-orange-500/10 rounded-lg">
                {u.status === 'active' ? '禁用' : '启用'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-[#1a2236]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-[#1a2236]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowCreateModal(false); setEditingUser(null); }}
          onSaved={() => { setShowCreateModal(false); setEditingUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }: { user: UserItem | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'interviewer',
    department: user?.department || '',
    position: user?.position || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // Update
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, role: form.role, department: form.department, position: form.position }),
        });
        const data = await res.json();
        if (data.code === 0) onSaved();
        else setError(data.message);
      } else {
        // Create
        if (!form.password) { setError('请设置初始密码'); setLoading(false); return; }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.code === 0) onSaved();
        else setError(data.message);
      }
    } catch {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">{user ? '编辑用户' : '新增用户'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">姓名 *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">邮箱 *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">手机号</label>
            <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">角色 *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="admin">超级管理员</option>
              <option value="hr_manager">招聘经理</option>
              <option value="interviewer">面试官</option>
              <option value="candidate">候选人</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">部门</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">职位</label>
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          {!user && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">初始密码 *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e1a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" required />
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-300 bg-[#0a0e1a] border border-slate-700 rounded-lg hover:bg-[#1a2236]">取消</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white bg-sky-500 hover:bg-sky-400 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {user ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
