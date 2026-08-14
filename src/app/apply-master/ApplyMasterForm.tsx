'use client';

import React, { useState } from 'react';
import { submitMasterApplication } from '@/actions/master-applications';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function ApplyMasterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const res = await submitMasterApplication(formData);
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
      
      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
          <input 
            type="text" 
            name="fullName" 
            required 
            placeholder="Virat Sharma"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Club / Organization Name</label>
          <input 
            type="text" 
            name="organization" 
            placeholder="Bangalore Cricket Academy"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">City *</label>
          <input 
            type="text" 
            name="city" 
            required 
            placeholder="Bangalore"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">State *</label>
          <input 
            type="text" 
            name="state" 
            required 
            placeholder="Karnataka"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
      >
        {loading ? 'Submitting Application...' : 'Submit Application to Admin'}
        <ArrowRight className="w-4 h-4" />
      </button>

    </form>
  );
}
