-- BatScore Fix for has_role Function Parameter Renaming
-- Run this in your Supabase SQL Editor to replace the has_role function safely.

-- 1. DROP DEPENDENT POLICIES & OLD FUNCTION
DROP POLICY IF EXISTS "Users view own application" ON public.master_applications;
DROP POLICY IF EXISTS "Admins update application" ON public.master_applications;
DROP POLICY IF EXISTS "Owners manage playgrounds" ON public.playgrounds;
DROP POLICY IF EXISTS "Owners manage teams" ON public.teams;
DROP POLICY IF EXISTS "Owners manage players" ON public.players;
DROP POLICY IF EXISTS "Masters manage own matches" ON public.matches;

DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- 2. RECREATE HAS_ROLE FUNCTION WITH UNAMBIGUOUS PARAMETERS
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = p_role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE POLICIES USING HAS_ROLE
CREATE POLICY "Users view own application" ON public.master_applications FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins update application" ON public.master_applications FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

NOTIFY pgrst, 'reload schema';
