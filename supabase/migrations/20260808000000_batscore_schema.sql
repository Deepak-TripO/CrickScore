-- BatScore Normalized PostgreSQL Schema Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROLES & USER_ROLES
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('USER', 'MASTER', 'ADMIN'))
);

INSERT INTO public.roles (name) VALUES ('USER'), ('MASTER'), ('ADMIN') ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MASTER APPLICATIONS
CREATE TABLE IF NOT EXISTS public.master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT NOT NULL,
  organization TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  preferred_playground TEXT,
  reason TEXT NOT NULL,
  experience_description TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PLAYGROUNDS
CREATE TABLE IF NOT EXISTS public.playgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  pitch_type TEXT NOT NULL DEFAULT 'TURF' CHECK (pitch_type IN ('TURF', 'MATTING', 'CEMENT', 'NATURAL')),
  ground_type TEXT NOT NULL DEFAULT 'STADIUM' CHECK (ground_type IN ('STADIUM', 'CLUB', 'SCHOOL', 'COLLEGE', 'LOCAL', 'PRIVATE')),
  boundary_size INT,
  capacity INT,
  facilities TEXT[],
  contact_info TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  captain_id UUID,
  vice_captain_id UUID,
  coach TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLAYERS
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  jersey_number INT,
  photo_url TEXT,
  batting_style TEXT DEFAULT 'Right Hand' CHECK (batting_style IN ('Right Hand', 'Left Hand')),
  bowling_style TEXT DEFAULT 'Right Arm Medium' CHECK (bowling_style IN ('Right Arm Fast', 'Right Arm Medium', 'Right Arm Spin', 'Left Arm Fast', 'Left Arm Medium', 'Left Arm Spin')),
  role TEXT NOT NULL DEFAULT 'All-rounder' CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TEAM PLAYERS
CREATE TABLE IF NOT EXISTS public.team_players (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, player_id)
);

-- 8. MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'T20' CHECK (format IN ('T10', 'T20', 'T20 League', 'ODI', 'Test', '30 Overs', '40 Overs', '50 Overs', 'Custom Overs')),
  overs INT NOT NULL DEFAULT 20,
  category TEXT NOT NULL DEFAULT 'Friendly' CHECK (category IN ('Friendly', 'League', 'Tournament', 'Knockout', 'Quarter Final', 'Semi Final', 'Final', 'Practice Match', 'Corporate Match', 'School Match', 'College Match', 'Club Match')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('DRAFT', 'UPCOMING', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'CANCELLED', 'ABANDONED', 'POSTPONED')),
  visibility TEXT DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  toss_winner UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  toss_decision TEXT CHECK (toss_decision IN ('BAT', 'BOWL')),
  current_innings INT DEFAULT 1,
  current_score TEXT DEFAULT '0/0',
  current_wickets INT DEFAULT 0,
  current_over NUMERIC(4,1) DEFAULT 0.0,
  target INT,
  winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  result_summary TEXT,
  player_of_match_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  umpire1 TEXT,
  umpire2 TEXT,
  third_umpire TEXT,
  scorer TEXT,
  match_referee TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MATCH PLAYERS
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  is_playing BOOLEAN DEFAULT TRUE,
  is_captain BOOLEAN DEFAULT FALSE,
  is_vice_captain BOOLEAN DEFAULT FALSE,
  substitute BOOLEAN DEFAULT FALSE,
  UNIQUE(match_id, player_id)
);

-- 10. INNINGS
CREATE TABLE IF NOT EXISTS public.innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_number INT NOT NULL CHECK (innings_number IN (1, 2, 3, 4)),
  batting_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  bowling_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  total_runs INT NOT NULL DEFAULT 0,
  total_wickets INT NOT NULL DEFAULT 0,
  total_overs NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  target INT,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, innings_number)
);

-- 11. OVERS
CREATE TABLE IF NOT EXISTS public.overs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  innings_id UUID NOT NULL REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT NOT NULL,
  runs INT NOT NULL DEFAULT 0,
  wickets INT NOT NULL DEFAULT 0,
  bowler_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DELIVERIES
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  innings_id UUID NOT NULL REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT NOT NULL,
  ball_number INT NOT NULL,
  striker_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  non_striker_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  bowler_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  runs_batter INT NOT NULL DEFAULT 0,
  runs_extras INT NOT NULL DEFAULT 0,
  total_runs INT NOT NULL DEFAULT 0,
  extra_type TEXT CHECK (extra_type IN ('NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY')),
  wicket BOOLEAN NOT NULL DEFAULT FALSE,
  wicket_type TEXT CHECK (wicket_type IN (NULL, 'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Retired Hurt', 'Retired Out', 'Obstructing the Field', 'Hit the Ball Twice', 'Timed Out')),
  dismissed_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  fielder_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  commentary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. MATCH COMMENTARY
CREATE TABLE IF NOT EXISTS public.match_commentary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_id UUID REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. MATCH VIEWERS
CREATE TABLE IF NOT EXISTS public.match_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PLAYER MATCH STATS
CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  runs_scored INT DEFAULT 0,
  balls_faced INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  overs_bowled NUMERIC(4,1) DEFAULT 0.0,
  maidens INT DEFAULT 0,
  runs_conceded INT DEFAULT 0,
  wickets_taken INT DEFAULT 0,
  wides INT DEFAULT 0,
  no_balls INT DEFAULT 0,
  catches INT DEFAULT 0,
  run_outs INT DEFAULT 0,
  stumpings INT DEFAULT 0,
  UNIQUE(match_id, player_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled ON public.matches(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_deliveries_innings ON public.deliveries(innings_id);
CREATE INDEX IF NOT EXISTS idx_match_viewers_match ON public.match_viewers(match_id);

-- AUTH TRIGGER: ASSIGN DEFAULT 'USER' ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Cricket Fan'),
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO default_role_id FROM public.roles WHERE name = 'USER';
  IF default_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, default_role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_commentary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Public read user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Public read playgrounds" ON public.playgrounds FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public read team_players" ON public.team_players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read match_players" ON public.match_players FOR SELECT USING (true);
CREATE POLICY "Public read innings" ON public.innings FOR SELECT USING (true);
CREATE POLICY "Public read overs" ON public.overs FOR SELECT USING (true);
CREATE POLICY "Public read deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public read commentary" ON public.match_commentary FOR SELECT USING (true);

-- USER WRITE POLICIES
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- MASTER APPLICATIONS POLICIES
CREATE POLICY "Users view own application" ON public.master_applications FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users submit application" ON public.master_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update application" ON public.master_applications FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- PLAYGROUNDS, TEAMS, PLAYERS POLICIES (OWNER OR ADMIN)
CREATE POLICY "Owners manage playgrounds" ON public.playgrounds FOR ALL USING (
  auth.uid() = owner_id OR public.has_role(auth.uid(), 'ADMIN')
);

CREATE POLICY "Owners manage teams" ON public.teams FOR ALL USING (
  auth.uid() = owner_id OR public.has_role(auth.uid(), 'ADMIN')
);

CREATE POLICY "Owners manage players" ON public.players FOR ALL USING (
  auth.uid() = owner_id OR public.has_role(auth.uid(), 'ADMIN')
);

CREATE POLICY "Owners manage team_players" ON public.team_players FOR ALL USING (
  auth.uid() IN (SELECT owner_id FROM public.teams WHERE id = team_id) OR public.has_role(auth.uid(), 'ADMIN')
);

-- MATCH SCORING & MATCH MANAGEMENT POLICIES
CREATE POLICY "Masters manage own matches" ON public.matches FOR ALL USING (
  auth.uid() = master_id OR public.has_role(auth.uid(), 'ADMIN')
);

CREATE POLICY "Masters manage match deliveries" ON public.deliveries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.innings i
    JOIN public.matches m ON i.match_id = m.id
    WHERE i.id = innings_id AND (m.master_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'))
  )
);

CREATE POLICY "Masters manage match commentary" ON public.match_commentary FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.master_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'))
  )
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
