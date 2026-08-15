-- ====================================================================
-- BatScore All-In-One Complete Database & Auth Setup Script
-- Safe & Idempotent (Can be run on brand new or existing Supabase projects)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Cricket Fan',
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

-- 3. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO public.roles (name, description) VALUES 
  ('USER', 'Standard User'),
  ('MASTER', 'Scorer / Organizer'),
  ('ADMIN', 'Administrator'),
  ('SUPER_ADMIN', 'Super Administrator')
ON CONFLICT (name) DO NOTHING;

-- 4. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 5. MASTER APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Applicant',
  phone TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT 'Beginner',
  organization TEXT,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  preferred_playground TEXT,
  reason TEXT NOT NULL DEFAULT '',
  experience_description TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLAYGROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.playgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'India',
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  pitch_type TEXT NOT NULL DEFAULT 'TURF',
  ground_type TEXT NOT NULL DEFAULT 'STADIUM',
  boundary_size INT,
  capacity INT,
  facilities TEXT[],
  contact_info TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TEAMS TABLE
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

-- 8. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  jersey_number INT,
  photo_url TEXT,
  batting_style TEXT DEFAULT 'Right Hand',
  bowling_style TEXT DEFAULT 'Right Arm Medium',
  role TEXT NOT NULL DEFAULT 'All-rounder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TEAM PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 10. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'T20',
  overs INT NOT NULL DEFAULT 20,
  category TEXT NOT NULL DEFAULT 'Friendly',
  scheduled_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  status TEXT NOT NULL DEFAULT 'UPCOMING',
  visibility TEXT DEFAULT 'PUBLIC',
  team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  toss_winner UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  toss_decision TEXT,
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

-- 11. MATCH PLAYERS TABLE
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

-- 12. INNINGS TABLE
CREATE TABLE IF NOT EXISTS public.innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_number INT NOT NULL,
  batting_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  bowling_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  total_runs INT NOT NULL DEFAULT 0,
  total_wickets INT NOT NULL DEFAULT 0,
  total_overs NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  target INT,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, innings_number)
);

-- 13. DELIVERIES TABLE
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
  extra_type TEXT DEFAULT 'NONE',
  wicket BOOLEAN NOT NULL DEFAULT FALSE,
  wicket_type TEXT,
  dismissed_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  fielder_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  commentary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. MATCH COMMENTARY TABLE
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

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  profile_image TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. COMMUNITY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 18. SAFE AUTH USER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, username, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Cricket User'),
      COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
      new.email
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();

    SELECT id INTO default_role_id FROM public.roles WHERE name = 'USER';
    IF default_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (new.id, default_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user trigger exception: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 17. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 18. DISABLE RLS FOR SEAMLESS ACCESS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgrounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.innings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_commentary DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
