'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="flex items-center justify-center min-h-screen text-white p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
          <h2 className="text-2xl font-extrabold text-red-400">Critical Error</h2>
          <p className="text-xs text-slate-400">
            A critical system error occurred. Please try reloading the app.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
