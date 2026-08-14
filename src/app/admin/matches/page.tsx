import React from 'react';
import AdminMatchesTable from './AdminMatchesTable';
import { fetchMatchesSafely } from '@/lib/fetchMatches';

export default async function AdminMatchesPage() {
  const matches = await fetchMatchesSafely();

  return (
    <div className="space-y-6">
      <AdminMatchesTable matches={matches} />
    </div>
  );
}
