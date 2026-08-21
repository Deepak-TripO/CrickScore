-- ====================================================================
-- Migration: Add missing columns to matches table for proper
-- team name, logo, and player data persistence.
-- Safe & Idempotent: All statements use IF NOT EXISTS.
-- Does NOT drop, truncate, or modify existing data.
-- ====================================================================

-- Core match metadata columns
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS description TEXT;

-- Ownership/creator columns
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS master_id UUID;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS created_by UUID;

-- Team name and logo columns (used by the two-step create form)
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS your_team_name TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS opposite_team_name TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS your_team_logo_url TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS opposite_team_logo_url TEXT;

-- Player data JSON columns (stores Step 2 player arrays for quick retrieval)
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS your_team_players JSONB;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS opposite_team_players JSONB;

-- Additional columns referenced by the application code
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS playground_id UUID;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'PUBLIC';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
