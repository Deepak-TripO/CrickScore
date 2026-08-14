-- 1. Create team_players table if missing
CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 2. Ensure all match columns exist
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_score TEXT DEFAULT '0/0';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_wickets INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_over NUMERIC(4,1) DEFAULT 0.0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Friendly';

-- 3. Safely Disable RLS only if tables exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
    ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'players') THEN
    ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_players') THEN
    ALTER TABLE public.team_players DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;
