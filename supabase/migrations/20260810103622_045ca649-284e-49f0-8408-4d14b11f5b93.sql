DROP VIEW IF EXISTS public.seller_rating_stats;

CREATE OR REPLACE FUNCTION private.seller_rating_stats(_seller uuid)
RETURNS TABLE(avg_swapcoins numeric, review_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(round(avg(swapcoins)::numeric, 1), 0), count(*)::int
  FROM public.ratings WHERE reviewed_id = _seller;
$$;
GRANT EXECUTE ON FUNCTION private.seller_rating_stats(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_seller_rating_stats(_seller uuid)
RETURNS TABLE(avg_swapcoins numeric, review_count int)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT * FROM private.seller_rating_stats(_seller);
$$;
GRANT EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.enforce_daily_listing_cap() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_message_rate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_listing_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;