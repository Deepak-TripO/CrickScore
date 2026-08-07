import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrickScore — Local Cricket Match Organizer & Live Scores',
  description: 'Organize local cricket matches, manage tournaments, track team statistics, and follow live ball-by-ball scorecards in real time.',
  openGraph: {
    title: 'CrickScore — Local Cricket Platform',
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
    <html lang="en" className="h-full bg-slate-50 text-slate-900">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
