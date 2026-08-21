'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AutoRefresh({ intervalMs }: { intervalMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // In development mode, use a 60s interval and tab visibility check to prevent dev console Fast Refresh spam
    const defaultInterval = process.env.NODE_ENV === 'development' ? 60000 : 20000;
    const duration = intervalMs || defaultInterval;

    const interval = setInterval(() => {
      // Do not revalidate if the tab is inactive / backgrounded
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      router.refresh();
    }, duration);

    return () => clearInterval(interval);
  }, [router, pathname, intervalMs]);

  return null;
}
