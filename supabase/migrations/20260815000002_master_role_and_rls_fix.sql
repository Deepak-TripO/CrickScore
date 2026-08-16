-- Migration: Master Role Persistence, Auth Synchronization, RLS Security, and Realtime Updates

-- 1. ADD ROLE COLUMN TO PROFILES TABLE FOR PERMANENT FAST ROLE FETCHING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. BACKFILL EXISTING ROLES FROM USER_ROLES & MASTER_APPLICATIONS
UPDATE public.profiles p
SET role = 'ADMIN'
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p.id AND r.name = 'ADMIN'
) OR LOWER(p.email) IN ('admin@batscore.com', 'superadmin@batscore.com');

UPDATE public.profiles p
SET role = 'MASTER'
WHERE p.role != 'ADMIN' AND (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p.id AND r.name = 'MASTER'
  ) OR EXISTS (
    SELECT 1 FROM public.master_applications ma
    WHERE ma.user_id = p.id AND ma.status = 'APPROVED'
  )
);

-- 3. TRIGGER FUNCTION TO SYNC MASTER APPROVAL AUTOMATICALLY IN DATABASE
CREATE OR REPLACE FUNCTION public.sync_master_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Update profile role to MASTER permanently
    UPDATE public.profiles
    SET role = 'MASTER', updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Also maintain user_roles table for backward compatibility
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.user_id, r.id FROM public.roles r WHERE r.name = 'MASTER'
    ON CONFLICT DO NOTHING;
  ELSIF NEW.status = 'REJECTED' AND OLD.status = 'APPROVED' THEN
    UPDATE public.profiles
    SET role = 'USER', updated_at = NOW()
    WHERE id = NEW.user_id AND role = 'MASTER';

    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role_id IN (SELECT id FROM public.roles WHERE name = 'MASTER');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_master_approval ON public.master_applications;
CREATE TRIGGER trg_sync_master_approval
  AFTER INSERT OR UPDATE OF status ON public.master_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_master_approval();

-- 4. UPDATE SAFE AUTH NEW USER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  user_name_val TEXT;
  user_username_val TEXT;
BEGIN
  user_name_val := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1));
  user_username_val := COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1));

  BEGIN
    INSERT INTO public.profiles (id, full_name, username, email, role)
    VALUES (
      new.id,
      user_name_val,
      user_username_val,
      new.email,
      'USER'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();

    SELECT id INTO default_role_id FROM public.roles WHERE name = 'USER';
    IF default_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (new.id, default_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user trigger exception: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ENABLE RLS AND SET UP POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_applications ENABLE ROW LEVEL SECURITY;

-- Helper function for Admin check in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'SUPER_ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND LOWER(u.email) IN ('admin@batscore.com', 'superadmin@batscore.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (true); -- Public/authenticated view allowed for usernames/avatars

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- MASTER APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Master apps select policy" ON public.master_applications;
CREATE POLICY "Master apps select policy" ON public.master_applications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Master apps insert policy" ON public.master_applications;
CREATE POLICY "Master apps insert policy" ON public.master_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

DROP POLICY IF EXISTS "Master apps update policy" ON public.master_applications;
CREATE POLICY "Master apps update policy" ON public.master_applications
  FOR UPDATE USING (public.is_admin());

-- ROLES & USER_ROLES POLICIES
DROP POLICY IF EXISTS "Roles select policy" ON public.roles;
CREATE POLICY "Roles select policy" ON public.roles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User roles select policy" ON public.user_roles;
CREATE POLICY "User roles select policy" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 6. REALTIME PUBLICATION CONFIGURATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.master_applications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore if already added to publication
END $$;
