'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSignature, AlertTriangle, CheckCircle, Clock, Plus, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  position?: string;
  contractType: string;
  startDate: string;
  endDate: string;
  status: string;
  renewInitiatedBy?: string;
  renewApprovedBy?: string;
  renewExecutedBy?: string;
  renewNotes?: string;
  daysLeft?: number;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<{ urgent: Contract[]; warning: Contract[]; normal: Contract[] }>({ urgent: [], warning: [], normal: [] });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [newContract, setNewContract] = useState({ employeeId: '', employeeName: '', department: '', position: '', startDate: '', endDate: '' });

  const loadContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data.data || []);
    } catch (e) {
      console.error('Load contracts error:', e);
    }
  }, []);

  const loadExpiring = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/expiring?days=90');
      const data = await res.json();
      setExpiringContracts(data.data || { urgent: [], warning: [], normal: [] });
    } catch (e) {
      console.error('Load expiring error:', e);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadContracts(), loadExpiring()]).finally(() => setLoading(false));
  }, [loadContracts, loadExpiring]);

  const handleAddContract = async () => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewContract({ employeeId: '', employeeName: '', department: '', position: '', startDate: '', endDate: '' });
        loadContracts();
        loadExpiring();
      }
    } catch (e) {
      console.error('Add contract error:', e);
    }
  };

  const handleRenew = async (contractId: string, action: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/renew`, {
        method: action === 'initiate' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'initiate' ? {} : { action }),
      });
      if (res.ok) {
        setShowRenewModal(false);
        loadContracts();
        loadExpiring();
      }
    } catch (e) {
      console.error('Renew error:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'expiring': return 'text-yellow-400 bg-yellow-500/10';
      case 'renewing': return 'text-sky-400 bg-sky-500/10';
      case 'renewed': return 'text-emerald-400 bg-emerald-500/10';
      case 'terminated': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '生效中';
      case 'expiring': return '即将到期';
      case 'renewing': return '续签中';
      case 'renewed': return '已续签';
      case 'terminated': return '已终止';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">合同管理</h1>
          <p className="mt-1 text-sm text-slate-400">员工合同续签提醒与生命周期管理</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4" />
          新建合同
        </button>
      </div>

      {/* Expiring Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-400">{expiringContracts.urgent.length}</p>
              <p className="text-xs text-slate-400">30天内到期</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">{expiringContracts.warning.length}</p>
              <p className="text-xs text-slate-400">31-60天到期</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{contracts.filter(c => c.status === 'active').length}</p>
              <p className="text-xs text-slate-400">正常合同</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
        <div className="border-b border-[#1e293b] p-4">
          <h2 className="text-lg font-semibold text-white">合同列表</h2>
        </div>
        <div className="divide-y divide-[#1e293b]">
          {contracts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">暂无合同记录</div>
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="flex items-center justify-between p-4 hover:bg-[#1a2236]">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                    <FileSignature className="h-5 w-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{contract.employeeName}</p>
                    <p className="text-xs text-slate-400">
                      {contract.department} · {contract.position} · {contract.contractType === 'regular' ? '正式' : contract.contractType === 'fixed_term' ? '固定期限' : '实习'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-300">
                      {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                    {contract.daysLeft !== undefined && contract.daysLeft <= 90 && (
                      <p className={`text-xs ${contract.daysLeft <= 30 ? 'text-red-400' : contract.daysLeft <= 60 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        剩余 {contract.daysLeft} 天
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(contract.status)}`}>
                    {getStatusLabel(contract.status)}
                  </span>
                  {(contract.status === 'active' || contract.status === 'expiring') && (
                    <button
                      onClick={() => { setSelectedContract(contract); setShowRenewModal(true); }}
                      className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20"
                    >
                      续签
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Contract Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新建合同">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">员工姓名</label>
            <input
              type="text"
              value={newContract.employeeName}
              onChange={e => setNewContract({ ...newContract, employeeName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">部门</label>
              <input
                type="text"
                value={newContract.department}
                onChange={e => setNewContract({ ...newContract, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">职位</label>
              <input
                type="text"
                value={newContract.position}
                onChange={e => setNewContract({ ...newContract, position: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">开始日期</label>
              <input
                type="date"
                value={newContract.startDate}
                onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">结束日期</label>
              <input
                type="date"
                value={newContract.endDate}
                onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            onClick={handleAddContract}
            className="w-full rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
          >
            创建合同
          </button>
        </div>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="合同续签">
        {selectedContract && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0e1a] p-4">
              <p className="text-sm text-slate-400">员工</p>
              <p className="font-medium text-white">{selectedContract.employeeName}</p>
              <p className="mt-2 text-sm text-slate-400">当前到期日</p>
              <p className="font-medium text-white">{new Date(selectedContract.endDate).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRenew(selectedContract.id, 'initiate')}
                className="flex-1 rounded-lg bg-sky-500 py-2 text-white hover:bg-sky-600"
              >
                发起续签
              </button>
              {selectedContract.status === 'renewing' && (
                <>
                  <button
                    onClick={() => handleRenew(selectedContract.id, 'approve')}
                    className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                  >
                    审批通过
                  </button>
                  <button
                    onClick={() => handleRenew(selectedContract.id, 'execute')}
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-white hover:bg-emerald-600"
                  >
                    执行签署
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
