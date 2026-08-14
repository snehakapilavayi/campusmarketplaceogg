CREATE OR REPLACE FUNCTION public.get_public_settings()
 RETURNS TABLE(key text, value jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT * FROM private.get_public_settings(); $function$;

CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS TABLE(listing_count integer, student_count integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT * FROM private.public_stats(); $function$;

CREATE OR REPLACE FUNCTION public.get_public_profile_cards(_ids uuid[])
 RETURNS TABLE(id uuid, full_name text, avatar_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT * FROM private.public_profile_cards(_ids); $function$;

GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_cards(uuid[]) TO anon, authenticated;