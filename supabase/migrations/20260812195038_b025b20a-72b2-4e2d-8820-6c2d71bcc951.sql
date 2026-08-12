-- Restrict profile visibility
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "profiles authenticated read"
ON public.profiles FOR SELECT TO authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM anon;

-- Safe public seller card for anonymous visitors on listing pages
CREATE OR REPLACE FUNCTION private.public_seller_card(_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, swapcoin_rating numeric, verification verification_status, campus text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.swapcoin_rating, p.verification, p.campus
  FROM public.profiles p
  WHERE p.id = _id AND p.suspended = false
$$;

CREATE OR REPLACE FUNCTION public.get_public_seller_card(_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, swapcoin_rating numeric, verification verification_status, campus text)
LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT * FROM private.public_seller_card(_id); $$;

CREATE OR REPLACE FUNCTION private.public_stats()
RETURNS TABLE(listing_count integer, student_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.listings WHERE status = 'approved'),
    (SELECT count(*)::int FROM public.profiles WHERE verification = 'verified')
$$;

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(listing_count integer, student_count integer)
LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT * FROM private.public_stats(); $$;

REVOKE ALL ON FUNCTION private.public_seller_card(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.public_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_seller_card(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;