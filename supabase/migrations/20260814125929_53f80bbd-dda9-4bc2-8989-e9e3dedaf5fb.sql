
DROP POLICY IF EXISTS "profiles authenticated read" ON public.profiles;

CREATE POLICY "profiles scoped read" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.buyer_id = auth.uid() AND c.seller_id = profiles.id)
       OR (c.seller_id = auth.uid() AND c.buyer_id = profiles.id)
  )
);

CREATE OR REPLACE FUNCTION private.public_profile_cards(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile_cards(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$ SELECT * FROM private.public_profile_cards(_ids); $$;

REVOKE ALL ON FUNCTION public.get_public_profile_cards(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_cards(uuid[]) TO authenticated;

DROP POLICY IF EXISTS "students upload own listing photos" ON storage.objects;
DROP POLICY IF EXISTS "students update own listing photos" ON storage.objects;
DROP POLICY IF EXISTS "students delete own listing photos" ON storage.objects;
