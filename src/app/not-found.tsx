import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-extrabold text-emerald-400 mb-2">404 - Page Not Found</h2>
      <p className="text-slate-400 mb-6">The match or page you are looking for could not be found.</p>
      <Link 
        href="/master/dashboard" 
        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all"
      >
        Return to Master Panel
      </Link>
    </div>
  );
}
