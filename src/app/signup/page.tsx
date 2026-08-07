'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, UserCheck, Shield } from 'lucide-react';
import { UserRole } from '@/lib/cricket/types';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ORGANIZER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === 'ORGANIZER' || role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }, 800);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Create Your CrickScore Account</h1>
          <p className="text-sm font-medium text-slate-500">
            Select your primary role to customize your local cricket experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Account Type / Role</label>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              {[
                { id: 'ORGANIZER', label: 'Tournament Organizer', desc: 'Create & manage matches' },
                { id: 'TEAM_MANAGER', label: 'Team Manager', desc: 'Manage team roster' },
                { id: 'SCORER', label: 'Match Scorer', desc: 'Live ball-by-ball scoring' },
                { id: 'USER', label: 'Spectator / Player', desc: 'Follow scores & stats' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as UserRole)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">{r.label}</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {loading ? 'Creating Account...' : <><UserCheck className="w-4 h-4" /> Register Account</>}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-emerald-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
