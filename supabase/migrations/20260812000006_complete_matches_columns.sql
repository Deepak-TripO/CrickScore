-- Migration to ensure all match columns exist in the matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_score TEXT DEFAULT '0/0';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_wickets INTEGER DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS current_over NUMERIC(4,1) DEFAULT 0.0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Friendly';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS toss_winner UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS toss_decision TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS umpire1 TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS umpire2 TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS third_umpire TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS scorer TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_referee TEXT;
