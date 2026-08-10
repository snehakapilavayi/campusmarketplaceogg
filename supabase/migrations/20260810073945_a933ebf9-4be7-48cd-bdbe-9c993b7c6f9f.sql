CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_public_settings()
RETURNS TABLE(key text, value jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT s.key,
    CASE s.key
      WHEN 'general' THEN jsonb_strip_nulls(jsonb_build_object(
        'site_name', s.value->'site_name',
        'tagline', s.value->'tagline',
        'maintenance_mode', s.value->'maintenance_mode',
        'maintenance_message', s.value->'maintenance_message',
        'signups_enabled', s.value->'signups_enabled',
        'allowed_email_domains', s.value->'allowed_email_domains',
        'fresher_domains', s.value->'fresher_domains'))
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
$function$;

REVOKE ALL ON FUNCTION private.get_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_settings() TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_public_settings();

CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS TABLE(key text, value jsonb)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT * FROM private.get_public_settings();
$function$;

REVOKE ALL ON FUNCTION public.get_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated, service_role;