-- Add category column to matches table if missing
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Friendly';
