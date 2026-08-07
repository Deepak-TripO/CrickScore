export type UserRole = 'SUPER_ADMIN' | 'ORGANIZER' | 'SCORER' | 'TEAM_MANAGER' | 'PLAYER' | 'USER';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';

export type TournamentFormat = 'T10' | 'T20' | 'T30' | 'T40' | 'T50' | 'CUSTOM';

export type WicketType = 
  | 'BOWLED'
  | 'CAUGHT'
  | 'LBW'
  | 'RUN_OUT'
  | 'STUMPED'
  | 'HIT_WICKET'
  | 'RETIRED_HURT'
  | 'OBSTRUCTING_FIELD';

export type ExtrasType = 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';

export type PlayerRole = 'BATTER' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKETKEEPER';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface Tournament {
  id: string;
  organizer_id?: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  format: TournamentFormat;
  start_date: string;
  end_date: string;
  location: string;
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  entry_fee?: number;
  prize_info?: string;
  rules?: string;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id?: string;
  name: string;
  logo_url?: string;
  captain_id?: string;
  manager_id?: string;
}

export interface Player {
  id: string;
  profile_id?: string;
  team_id?: string;
  name: string;
  jersey_number?: number;
  role: PlayerRole;
  batting_style?: string;
  bowling_style?: string;
  status?: string;
  team_name?: string;
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strike_rate?: number;
  economy?: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
}

export interface Match {
  id: string;
  tournament_id?: string;
  tournament_name?: string;
  team_a: Team;
  team_b: Team;
  venue?: Venue;
  scheduled_at: string;
  format: TournamentFormat;
  overs: number;
  status: MatchStatus;
  toss_winner_id?: string;
  toss_decision?: 'BAT' | 'BOWL';
  winner_id?: string;
  result_summary?: string;
  current_innings?: Innings;
  all_innings?: Innings[];
}

export interface Innings {
  id: string;
  match_id: string;
  batting_team_id: string;
  batting_team_name?: string;
  innings_number: 1 | 2;
  runs: number;
  wickets: number;
  overs: number; // e.g. 18.3
  target?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Ball {
  id: string;
  innings_id: string;
  over_number: number;
  ball_number: number;
  striker_id: string;
  striker_name?: string;
  non_striker_id: string;
  non_striker_name?: string;
  bowler_id: string;
  bowler_name?: string;
  runs_batter: number;
  runs_total: number;
  extras_type: ExtrasType;
  extras_runs: number;
  wicket: boolean;
  wicket_type?: WicketType;
  dismissed_player_id?: string;
  commentary?: string;
  created_at: string;
}

export interface BatterStats {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissal?: string;
  isOnStrike: boolean;
}

export interface BowlerStats {
  id: string;
  name: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface ExtrasSummary {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  overs: string;
  playerName: string;
}

export interface Partnership {
  runs: number;
  balls: number;
  player1Name: string;
  player2Name: string;
}

export interface CricketServiceItem {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  price: number;
  location: string;
  availability: string;
  provider_name: string;
  provider_contact: string;
}

export interface PointsTableEntry {
  team_id: string;
  team_name: string;
  logo_url?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  no_result: number;
  points: number;
  net_run_rate: number;
  runs_scored: number;
  overs_faced: number;
  runs_conceded: number;
  overs_bowled: number;
}
