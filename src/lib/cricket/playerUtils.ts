/**
 * Helper utilities for player name formatting, role classification, and team filtering
 */

export function cleanPlayerName(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.trim();
  // Strip prepended role labels like "Batter - ", "Bowler - ", "All-Rounder - ", "Batter: ", etc.
  cleaned = cleaned.replace(/^(Batter|Batsman|Bowler|All-Rounder|Allrounder|Wicketkeeper|WK)\s*[\–\-:]\s*/i, '');
  cleaned = cleaned.trim();
  
  // If the string was literally just a role label like "Batter" or "Bowler" or "All-Rounder" without a real name
  const upper = cleaned.toUpperCase();
  if (upper === 'BATTER' || upper === 'BATSMAN' || upper === 'BOWLER' || upper === 'ALL-ROUNDER' || upper === 'ALLROUNDER' || upper === 'WICKETKEEPER') {
    return 'Player';
  }
  
  return cleaned || 'Player';
}

export function getRoleCategory(p: any): 'BATSMAN' | 'ALL_ROUNDER' | 'BOWLER' {
  const roleStr = String(p?.role || p?.type || p?.player_role || p?.position || p?.playing_role || '').toUpperCase();
  if (roleStr.includes('BOWL') && !roleStr.includes('ALL')) {
    return 'BOWLER';
  }
  if (roleStr.includes('ALL') || roleStr.includes('AR') || roleStr.includes('ROUND')) {
    return 'ALL_ROUNDER';
  }
  return 'BATSMAN';
}

export function getOrderedBatters(players: any[]): any[] {
  if (!players || !Array.isArray(players)) return [];

  const batsmen: any[] = [];
  const allRounders: any[] = [];
  const bowlers: any[] = [];

  players.forEach((p) => {
    const cat = getRoleCategory(p);
    if (cat === 'BATSMAN') {
      batsmen.push(p);
    } else if (cat === 'ALL_ROUNDER') {
      allRounders.push(p);
    } else {
      bowlers.push(p);
    }
  });

  return [...batsmen, ...allRounders, ...bowlers];
}

export function getFilteredBowlers(players: any[]): any[] {
  if (!players || !Array.isArray(players)) return [];

  const bowlers: any[] = [];
  const allRounders: any[] = [];

  players.forEach((p) => {
    const cat = getRoleCategory(p);
    if (cat === 'BOWLER') {
      bowlers.push(p);
    } else if (cat === 'ALL_ROUNDER') {
      allRounders.push(p);
    }
  });

  const filtered = [...bowlers, ...allRounders];
  // Fallback: If opposite team has no designated bowlers/all-rounders in database, return all players so scoring is never blocked
  return filtered.length > 0 ? filtered : players;
}

export function formatRoleForDisplay(role?: string): string {
  if (!role) return 'Batsman';
  const r = String(role).toUpperCase();
  if (r.includes('BOWL') && !r.includes('ALL')) return 'Bowler';
  if (r.includes('ALL') || r.includes('AR') || r.includes('ROUND')) return 'All-Rounder';
  if (r.includes('WICKET') || r === 'WK' || r.includes('KEEPER')) return 'Wicketkeeper';
  return 'Batsman';
}
