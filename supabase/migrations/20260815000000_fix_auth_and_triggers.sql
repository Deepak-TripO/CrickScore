-- ========================================================
-- BatScore Supabase Auth & Database Setup Migration
-- ========================================================

-- 1. Ensure Extension & Roles exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO public.roles (name) VALUES ('USER'), ('MASTER'), ('ADMIN') ON CONFLICT (name) DO NOTHING;

-- 2. Safe handle_new_user trigger with Exception Catching
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, username, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Cricket User'),
      COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
      new.email
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
    -- Prevent trigger failure from breaking auth signups
    RAISE NOTICE 'handle_new_user exception: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Grant proper permissions to public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
