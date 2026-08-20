import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import { HelpCircle, ArrowLeft, BookOpen, MessageSquare, Mail, ShieldCheck } from 'lucide-react';

export default async function HelpPage() {
  const { user, role: userRole } = await getUserAndRole();

  const faqs = [
    {
      q: 'How do I start scoring a live match?',
      a: 'If you are an approved Master Scorer, go to the Master Dashboard, click "Create Match" to set up team details and players, and then launch Live Scoring.'
    },
    {
      q: 'How do I apply for Master Scorer access?',
      a: 'Go to your Profile or click "Master" in the navigation to fill out the Master Application form.'
    },
    {
      q: 'Can I join local cricket communities?',
      a: 'Yes! Navigate to the Community tab to discover active local communities and join with a single click.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="p-2 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            title="Back to Profile"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5 text-orange-500" />
          </Link>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            <span>Help & Support</span>
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h3 className="text-xs font-bold text-slate-900">{faq.q}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Contact Support
          </h2>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700">
            <Mail className="w-5 h-5 text-orange-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-slate-900">Email Support</h3>
              <p className="text-[11px] text-orange-600 truncate">support@batscore.local</p>
            </div>
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
