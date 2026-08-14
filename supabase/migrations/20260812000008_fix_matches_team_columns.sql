-- Ensure both team_a_id/team_b_id and team1_id/team2_id exist and drop NOT NULL constraint on team_a_id/team_b_id/scheduled_at
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team1_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team2_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team_a_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team_b_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Drop NOT NULL constraints if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'team_a_id') THEN
    ALTER TABLE public.matches ALTER COLUMN team_a_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'team_b_id') THEN
    ALTER TABLE public.matches ALTER COLUMN team_b_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'scheduled_at') THEN
    ALTER TABLE public.matches ALTER COLUMN scheduled_at DROP NOT NULL;
  END IF;
END $$;
