-- Disable RLS or set completely open policies for teams, players, team_players to prevent RLS errors permanently

ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players DISABLE ROW LEVEL SECURITY;

-- If RLS is re-enabled, ensure open policies exist
DROP POLICY IF EXISTS "Allow all for teams" ON public.teams;
CREATE POLICY "Allow all for teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for players" ON public.players;
CREATE POLICY "Allow all for players" ON public.players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for team_players" ON public.team_players;
CREATE POLICY "Allow all for team_players" ON public.team_players FOR ALL USING (true) WITH CHECK (true);
