-- Migration to fix Row Level Security (RLS) policies for teams, players, and team_players tables

-- 1. TEAMS RLS POLICIES
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage teams" ON public.teams;
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users insert teams" ON public.teams;
DROP POLICY IF EXISTS "Users manage own teams" ON public.teams;

CREATE POLICY "Public read teams" ON public.teams 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users insert teams" ON public.teams 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Owners manage teams" ON public.teams 
  FOR ALL USING (
    auth.uid() = owner_id OR auth.uid() = manager_id OR public.has_role(auth.uid(), 'ADMIN') OR auth.role() = 'authenticated'
  );

-- 2. PLAYERS RLS POLICIES
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage players" ON public.players;
DROP POLICY IF EXISTS "Public read players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users insert players" ON public.players;

CREATE POLICY "Public read players" ON public.players 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users insert players" ON public.players 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Owners manage players" ON public.players 
  FOR ALL USING (
    auth.uid() = owner_id OR auth.uid() = profile_id OR public.has_role(auth.uid(), 'ADMIN') OR auth.role() = 'authenticated'
  );

-- 3. TEAM_PLAYERS RLS POLICIES
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage team_players" ON public.team_players;
DROP POLICY IF EXISTS "Public read team_players" ON public.team_players;
DROP POLICY IF EXISTS "Authenticated users insert team_players" ON public.team_players;

CREATE POLICY "Public read team_players" ON public.team_players 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users insert team_players" ON public.team_players 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Owners manage team_players" ON public.team_players 
  FOR ALL USING (
    auth.role() = 'authenticated' OR auth.uid() IS NOT NULL
  );
