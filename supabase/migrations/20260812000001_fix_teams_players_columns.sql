-- Migration to ensure teams and players tables have owner_id, manager_id, short_name, and avatar_url columns
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url TEXT;
