import type { Metadata, Viewport } from 'next';
import './globals.css';
import AutoRefresh from '@/components/common/AutoRefresh';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'overlays-content',
};

export const metadata: Metadata = {
  title: 'BatScore — Local Cricket Match Organizer & Live Scores',
  description: 'Organize local cricket matches, manage tournaments, track team statistics, and follow live ball-by-ball scorecards in real time.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'BatScore — Local Cricket Platform',
    description: 'Live scores, tournament management, and team statistics for local cricket.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="flex flex-col min-h-screen">
        <AutoRefresh />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
