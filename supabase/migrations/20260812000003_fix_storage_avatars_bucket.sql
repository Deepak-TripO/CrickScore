-- Ensure avatars bucket exists and is public with unrestricted read/upload policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone insert avatars" ON storage.objects;

CREATE POLICY "Public read avatars" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone insert avatars" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'avatars');
