-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('SUPER_ADMIN', 'ORGANIZER', 'SCORER', 'TEAM_MANAGER', 'PLAYER', 'USER')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TOURNAMENTS
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  format TEXT NOT NULL DEFAULT 'T20' CHECK (format IN ('T10', 'T20', 'T30', 'T40', 'T50', 'CUSTOM')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('DRAFT', 'REGISTRATION_OPEN', 'UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED')),
  entry_fee NUMERIC(10,2) DEFAULT 0.00,
  prize_info TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  captain_id UUID,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAYERS
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  jersey_number INT,
  role TEXT NOT NULL DEFAULT 'ALL_ROUNDER' CHECK (role IN ('BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKETKEEPER')),
  batting_style TEXT DEFAULT 'Right-hand bat',
  bowling_style TEXT DEFAULT 'Right-arm medium',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VENUES
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  capacity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_b_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  scorer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL DEFAULT 'T20',
  overs INT NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED')),
  toss_winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  toss_decision TEXT CHECK (toss_decision IN ('BAT', 'BOWL')),
  winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  result_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INNINGS
CREATE TABLE IF NOT EXISTS public.innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  batting_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  innings_number INT NOT NULL CHECK (innings_number IN (1, 2)),
  runs INT NOT NULL DEFAULT 0,
  wickets INT NOT NULL DEFAULT 0,
  overs NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  target INT,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, innings_number)
);

-- BALLS
CREATE TABLE IF NOT EXISTS public.balls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  innings_id UUID NOT NULL REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT NOT NULL,
  ball_number INT NOT NULL,
  striker_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  non_striker_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  bowler_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  runs_batter INT NOT NULL DEFAULT 0,
  runs_total INT NOT NULL DEFAULT 0,
  extras_type TEXT CHECK (extras_type IN ('NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY')),
  extras_runs INT NOT NULL DEFAULT 0,
  wicket BOOLEAN NOT NULL DEFAULT FALSE,
  wicket_type TEXT CHECK (wicket_type IN (NULL, 'BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED_HURT', 'OBSTRUCTING_FIELD')),
  dismissed_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  commentary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MATCH PLAYERS
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  playing_role TEXT,
  is_playing BOOLEAN DEFAULT TRUE,
  UNIQUE(match_id, player_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL,
  location TEXT NOT NULL,
  availability TEXT DEFAULT 'Available',
  provider_name TEXT NOT NULL,
  provider_contact TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON public.matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_balls_innings_id ON public.balls(innings_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Cricket Fan'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'USER')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public READ for all core data
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public tournaments are readable" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public teams are readable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public players are readable" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public venues are readable" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public matches are readable" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public innings are readable" ON public.innings FOR SELECT USING (true);
CREATE POLICY "Public balls are readable" ON public.balls FOR SELECT USING (true);
CREATE POLICY "Public match_players are readable" ON public.match_players FOR SELECT USING (true);
CREATE POLICY "Public services are readable" ON public.services FOR SELECT USING (true);

-- User profile updates
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Write policies for Organizers / Admins / Scorers
CREATE POLICY "Organizers and Admins manage tournaments" ON public.tournaments FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ORGANIZER', 'SUPER_ADMIN')
  )
);

CREATE POLICY "Organizers and Admins manage teams" ON public.teams FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ORGANIZER', 'SUPER_ADMIN', 'TEAM_MANAGER')
  )
);

CREATE POLICY "Organizers and Admins manage matches" ON public.matches FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ORGANIZER', 'SUPER_ADMIN')
  )
);

CREATE POLICY "Scorers update assigned matches and balls" ON public.balls FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SCORER', 'ORGANIZER', 'SUPER_ADMIN')
  )
);

-- INITIAL SEED SERVICES
INSERT INTO public.services (name, description, image_url, price, location, availability, provider_name, provider_contact)
VALUES
  ('Turf Ground Booking - Turf A', 'Standard floodlit synthetic turf ground for day/night T20 and T10 matches. Includes pavilion & commentary box.', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80', 1500.00, 'Koramangala, Bangalore', 'Available Today', 'Bangalore Turf Arena', '+91 98765 43210'),
  ('Certified Digital Live Scorer Service', 'Professional certified scorer equipped with tablet for live ball-by-ball scoring & real-time updates.', 'https://images.unsplash.com/photo-1512716676800-4700e1fc70a1?w=600&auto=format&fit=crop&q=80', 800.00, 'Citywide Bangalore', 'Instant Booking', 'CrickScore Scorer Network', '+91 98765 00000'),
  ('Official Umpiring Panel (2 Umpires)', 'Pair of experienced state-level umpires with neutral officiating for tournament & club matches.', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80', 2000.00, 'Bangalore & Surrounds', 'Available Weekends', 'Karnataka Umpire Guild', '+91 98111 22233'),
  ('Full Match Live Stream & Drone Coverage', 'HD multi-camera live stream setup to YouTube/Facebook with dynamic score overlays.', 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80', 4500.00, 'Karnataka', 'Advance Booking', 'StreamCricket Pro', '+91 99887 76655')
ON CONFLICT DO NOTHING;
