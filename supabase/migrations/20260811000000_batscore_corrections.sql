-- BatScore Complete Self-Contained Corrective Migration
-- Safe to run multiple times on any Supabase database without any error.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 0. Ensure Roles & has_role helper function exist
-- ==========================================================

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


-- ==========================================================
-- 1. Ensure master_applications table exists & is configured
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  experience TEXT,
  organization TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  preferred_playground TEXT,
  reason TEXT,
  experience_description TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.master_applications ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.master_applications ALTER COLUMN experience DROP NOT NULL;
ALTER TABLE public.master_applications ALTER COLUMN reason DROP NOT NULL;

ALTER TABLE public.master_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own application" ON public.master_applications;
DROP POLICY IF EXISTS "Users submit application" ON public.master_applications;
DROP POLICY IF EXISTS "Admins update application" ON public.master_applications;

CREATE POLICY "Users view own application" ON public.master_applications FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users submit application" ON public.master_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update application" ON public.master_applications FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));


-- ==========================================================
-- 2. Ensure Innings Columns Exist & Are Flexible
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS batting_team_id UUID;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS bowling_team_id UUID;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS total_runs INT DEFAULT 0;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS total_wickets INT DEFAULT 0;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS total_overs NUMERIC(4,1) DEFAULT 0.0;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS target INT;
ALTER TABLE public.innings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN_PROGRESS';

DO $$
BEGIN
  ALTER TABLE public.innings ALTER COLUMN batting_team_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.innings ALTER COLUMN bowling_team_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Insert default Innings for any match missing an innings
INSERT INTO public.innings (match_id, innings_number, total_runs, total_wickets, total_overs, status)
SELECT 
  m.id AS match_id,
  1 AS innings_number,
  0 AS total_runs,
  0 AS total_wickets,
  0.0 AS total_overs,
  'IN_PROGRESS' AS status
FROM public.matches m
WHERE NOT EXISTS (
  SELECT 1 FROM public.innings i WHERE i.match_id = m.id
)
ON CONFLICT DO NOTHING;


-- ==========================================================
-- 3. Ensure Deliveries & Commentary Tables Exist
-- ==========================================================

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
  wicket_type TEXT,
  dismissed_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  fielder_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  commentary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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


-- ==========================================================
-- 4. RLS Policies for Innings, Deliveries, Commentary
-- ==========================================================

ALTER TABLE public.innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_commentary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read innings" ON public.innings;
DROP POLICY IF EXISTS "Public insert innings" ON public.innings;
DROP POLICY IF EXISTS "Public update innings" ON public.innings;

CREATE POLICY "Public read innings" ON public.innings FOR SELECT USING (true);
CREATE POLICY "Public insert innings" ON public.innings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update innings" ON public.innings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public insert deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public update deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public delete deliveries" ON public.deliveries;

CREATE POLICY "Public read deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public insert deliveries" ON public.deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deliveries" ON public.deliveries FOR UPDATE USING (true);
CREATE POLICY "Public delete deliveries" ON public.deliveries FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read match_commentary" ON public.match_commentary;
DROP POLICY IF EXISTS "Public insert match_commentary" ON public.match_commentary;

CREATE POLICY "Public read match_commentary" ON public.match_commentary FOR SELECT USING (true);
CREATE POLICY "Public insert match_commentary" ON public.match_commentary FOR INSERT WITH CHECK (true);


-- ==========================================================
-- 5. Reload PostgREST Schema Cache & Communities Table
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  profile_image TEXT,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read communities" ON public.communities;
DROP POLICY IF EXISTS "Masters insert communities" ON public.communities;
DROP POLICY IF EXISTS "Owners update communities" ON public.communities;
DROP POLICY IF EXISTS "Owners delete communities" ON public.communities;

CREATE POLICY "Public read communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Masters insert communities" ON public.communities FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners update communities" ON public.communities FOR UPDATE USING (true);
CREATE POLICY "Owners delete communities" ON public.communities FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read community_members" ON public.community_members;
DROP POLICY IF EXISTS "Users join community_members" ON public.community_members;
DROP POLICY IF EXISTS "Users leave community_members" ON public.community_members;

CREATE POLICY "Public read community_members" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users join community_members" ON public.community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users leave community_members" ON public.community_members FOR DELETE USING (true);

NOTIFY pgrst, 'reload schema';
