-- 1) app_settings: remove broad anon/authenticated row read, expose whitelisted public fields via function
DROP POLICY IF EXISTS "app settings public read" ON public.app_settings;

CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS TABLE(key text, value jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.key,
    CASE s.key
      WHEN 'general' THEN jsonb_strip_nulls(jsonb_build_object(
        'site_name', s.value->'site_name',
        'tagline', s.value->'tagline',
        'maintenance_mode', s.value->'maintenance_mode',
        'maintenance_message', s.value->'maintenance_message',
        'signups_enabled', s.value->'signups_enabled',
        'allowed_email_domain', s.value->'allowed_email_domain'))
      WHEN 'limits' THEN jsonb_strip_nulls(jsonb_build_object(
        'max_photos_per_listing', s.value->'max_photos_per_listing',
        'max_active_listings', s.value->'max_active_listings',
        'max_price', s.value->'max_price',
        'min_price', s.value->'min_price'))
      WHEN 'content' THEN jsonb_strip_nulls(jsonb_build_object(
        'hero_title', s.value->'hero_title',
        'hero_subtitle', s.value->'hero_subtitle',
        'instagram_url', s.value->'instagram_url',
        'support_email', s.value->'support_email'))
    END
  FROM public.app_settings s
  WHERE s.key IN ('general','limits','content');
$$;

REVOKE ALL ON FUNCTION public.get_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;

-- 2) ratings: reviews only readable by signed-in users
DROP POLICY IF EXISTS "ratings public read" ON public.ratings;
CREATE POLICY "ratings authenticated read" ON public.ratings
FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.ratings FROM anon;