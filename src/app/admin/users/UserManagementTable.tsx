'use client';

import React, { useState } from 'react';
import { Search, Shield, User, Award, ShieldAlert, Eye, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateUserRole } from '@/actions/admin';

export default function UserManagementTable({ profiles }: { profiles: any[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<any>(null);
  const [targetRole, setTargetRole] = useState<'USER' | 'MASTER' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = 
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || (p.roles && p.roles.includes(roleFilter));
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async () => {
    if (!changeRoleUser) return;
    setLoading(true);
    setMsg('');

    const res = await updateUserRole(changeRoleUser.id, targetRole);
    setLoading(false);

    if (res?.error) {
      setMsg(res.error);
    } else {
      setMsg(`Role updated to ${targetRole} for ${changeRoleUser.email}`);
      setChangeRoleUser(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* SEARCH AND ROLE FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MASTER">MASTER</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold">
          {msg}
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">User / Email</th>
                <th className="p-4">Username</th>
                <th className="p-4">Roles</th>
                <th className="p-4">City / Location</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No registered users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                          {p.email?.slice(0, 2) || 'US'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{p.full_name || 'Cricket User'}</span>
                          <span className="text-slate-400 text-[11px]">{p.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      @{p.username || p.email?.split('@')[0]}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {p.roles?.map((r: string) => {
                          const roleLabel = r === 'ADMIN' ? 'Admin' : r === 'MASTER' ? 'Master' : 'Normal User';
                          return (
                            <span
                              key={r}
                              className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                                r === 'ADMIN'
                                  ? 'bg-purple-950 text-purple-400 border-purple-500/30'
                                  : r === 'MASTER'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {roleLabel}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      {p.city ? `${p.city}, ${p.state || ''}` : 'Not specified'}
                    </td>

                    <td className="p-4 text-slate-400">
                      {new Date(p.created_at || Date.now()).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedUser(p)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          setChangeRoleUser(p);
                          setTargetRole(p.roles?.includes('ADMIN') ? 'ADMIN' : p.roles?.includes('MASTER') ? 'MASTER' : 'USER');
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                User Account Overview
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <strong className="text-white">{selectedUser.full_name || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <span className="font-mono text-slate-400">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Username:</span>
                  <strong className="text-slate-200">@{selectedUser.username}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roles:</span>
                  <span className="font-bold text-purple-400">{selectedUser.roles?.join(', ')}</span>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Bio:</span>
                  <p className="text-slate-300 italic">{selectedUser.bio}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {changeRoleUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Change User Role
              </h3>
              <button onClick={() => setChangeRoleUser(null)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Update role for <strong className="text-white">{changeRoleUser.email}</strong>:
              </p>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold block">Select Role</label>
                <select
                  value={targetRole}
                  onChange={(e: any) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="USER">USER (Standard Member)</option>
                  <option value="MASTER">MASTER (Match & Scoring Manager)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setChangeRoleUser(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleRoleChange}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20"
              >
                {loading ? 'Saving...' : 'Confirm Role Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
