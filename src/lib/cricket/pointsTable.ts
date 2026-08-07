import { Match, PointsTableEntry, Team } from './types';
import { calculateNRR } from './netRunRate';

/**
 Calculates full points table for a tournament from completed matches
 Default Points Rule: Win = 2, Tie/No Result = 1, Loss = 0
 */
export function calculatePointsTable(
  teams: Team[],
  matches: Match[],
  winPoints: number = 2,
  tiePoints: number = 1
): PointsTableEntry[] {
  const tableMap: Record<string, PointsTableEntry> = {};

  // Initialize for all teams
  teams.forEach((t) => {
    tableMap[t.id] = {
      team_id: t.id,
      team_name: t.name,
      logo_url: t.logo_url,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      no_result: 0,
      points: 0,
      net_run_rate: 0,
      runs_scored: 0,
      overs_faced: 0,
      runs_conceded: 0,
      overs_bowled: 0,
    };
  });

  matches
    .filter((m) => m.status === 'COMPLETED' || m.status === 'ABANDONED')
    .forEach((match) => {
      const teamA = tableMap[match.team_a.id];
      const teamB = tableMap[match.team_b.id];

      if (!teamA || !teamB) return;

      teamA.played += 1;
      teamB.played += 1;

      if (match.status === 'ABANDONED') {
        teamA.no_result += 1;
        teamB.no_result += 1;
        teamA.points += tiePoints;
        teamB.points += tiePoints;
        return;
      }

      if (match.winner_id === teamA.team_id) {
        teamA.won += 1;
        teamA.points += winPoints;
        teamB.lost += 1;
      } else if (match.winner_id === teamB.team_id) {
        teamB.won += 1;
        teamB.points += winPoints;
        teamA.lost += 1;
      } else {
        // Tied
        teamA.tied += 1;
        teamB.tied += 1;
        teamA.points += tiePoints;
        teamB.points += tiePoints;
      }

      // Add Innings stats for NRR if present
      if (match.all_innings && match.all_innings.length > 0) {
        const inn1 = match.all_innings.find((i) => i.batting_team_id === teamA.team_id);
        const inn2 = match.all_innings.find((i) => i.batting_team_id === teamB.team_id);

        if (inn1 && inn2) {
          teamA.runs_scored += inn1.runs;
          teamA.overs_faced += inn1.overs;
          teamA.runs_conceded += inn2.runs;
          teamA.overs_bowled += inn2.overs;

          teamB.runs_scored += inn2.runs;
          teamB.overs_faced += inn2.overs;
          teamB.runs_conceded += inn1.runs;
          teamB.overs_bowled += inn1.overs;
        }
      }
    });

  // Calculate NRR for each team and sort by Points desc, then NRR desc
  return Object.values(tableMap)
    .map((team) => {
      team.net_run_rate = calculateNRR(
        team.runs_scored,
        team.overs_faced,
        team.runs_conceded,
        team.overs_bowled
      );
      return team;
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.net_run_rate - a.net_run_rate;
    });
}
