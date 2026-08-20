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
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm text-slate-900 font-sans">
      
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
          <input 
            type="text" 
            name="fullName" 
            required 
            placeholder="Virat Sharma"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Club / Organization Name</label>
          <input 
            type="text" 
            name="organization" 
            placeholder="Bangalore Cricket Academy"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">City *</label>
          <input 
            type="text" 
            name="city" 
            required 
            placeholder="Bangalore"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">State *</label>
          <input 
            type="text" 
            name="state" 
            required 
            placeholder="Karnataka"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2"
      >
        {loading ? 'Submitting Application...' : 'Submit Application to Admin'}
        <ArrowRight className="w-4 h-4" />
      </button>

    </form>
  );
}
