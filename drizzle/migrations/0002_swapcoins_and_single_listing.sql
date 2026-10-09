ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason text, ADD COLUMN IF NOT EXISTS hidden_by uuid;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rating_reminded_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_deal ON public.ratings(reviewer_id, listing_id) WHERE listing_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_rating() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l record;
BEGIN
  IF NEW.reviewer_id = NEW.reviewed_id THEN RAISE EXCEPTION 'You can''t rate yourself.'; END IF;
  IF NEW.listing_id IS NULL THEN RAISE EXCEPTION 'Ratings can only be given for a completed deal.'; END IF;
  SELECT seller_id, buyer_id, status INTO l FROM public.listings WHERE id = NEW.listing_id;
  IF l IS NULL OR l.status <> 'completed' OR l.buyer_id IS NULL THEN
    RAISE EXCEPTION 'You can rate once the deal is marked sold.';
  END IF;
  IF NOT ((NEW.reviewer_id = l.seller_id AND NEW.reviewed_id = l.buyer_id) OR (NEW.reviewer_id = l.buyer_id AND NEW.reviewed_id = l.seller_id)) THEN
    RAISE EXCEPTION 'Only the buyer and seller of this deal can rate each other.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.ratings WHERE reviewer_id = NEW.reviewer_id AND listing_id = NEW.listing_id) THEN
    RAISE EXCEPTION 'You''ve already rated this swap.';
  END IF;
  NEW.communication := greatest(1, least(5, NEW.communication));
  NEW.accuracy := greatest(1, least(5, NEW.accuracy));
  NEW.experience := greatest(1, least(5, NEW.experience));
  NEW.swapcoins := round((NEW.communication + NEW.accuracy + NEW.experience)::numeric / 3, 1);
  NEW.hidden := false; NEW.hidden_reason := NULL; NEW.hidden_by := NULL;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ratings_validate ON public.ratings;
CREATE TRIGGER ratings_validate BEFORE INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

CREATE OR REPLACE FUNCTION public.refresh_swapcoins() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles p SET swapcoin_rating = COALESCE((SELECT round(avg(swapcoins)::numeric,1) FROM public.ratings r WHERE r.reviewed_id = NEW.reviewed_id AND NOT r.hidden), 0)
  WHERE p.id = NEW.reviewed_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ratings_refresh ON public.ratings;
CREATE TRIGGER ratings_refresh AFTER INSERT OR UPDATE OF hidden ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.refresh_swapcoins();

-- Only edit = admin hiding. Lock all other columns.
CREATE OR REPLACE FUNCTION public.ratings_lock() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF (NEW.reviewer_id, NEW.reviewed_id, NEW.listing_id, NEW.communication, NEW.accuracy, NEW.experience, NEW.swapcoins, NEW.review, NEW.created_at)
     IS DISTINCT FROM (OLD.reviewer_id, OLD.reviewed_id, OLD.listing_id, OLD.communication, OLD.accuracy, OLD.experience, OLD.swapcoins, OLD.review, OLD.created_at) THEN
    RAISE EXCEPTION 'Ratings can''t be edited.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ratings_lock ON public.ratings;
CREATE TRIGGER ratings_lock BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.ratings_lock();

GRANT UPDATE ON public.ratings TO authenticated;
DROP POLICY IF EXISTS "ratings admin hide" ON public.ratings;
CREATE POLICY "ratings admin hide" ON public.ratings FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR is_college_admin_of((SELECT college_id FROM public.profiles WHERE id = ratings.reviewed_id)))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR is_college_admin_of((SELECT college_id FROM public.profiles WHERE id = ratings.reviewed_id)));
DROP POLICY IF EXISTS "ratings college admin read" ON public.ratings;
CREATE POLICY "ratings college admin read" ON public.ratings FOR SELECT TO authenticated
USING (has_role(auth.uid(),'super_admin') OR is_college_admin_of((SELECT college_id FROM public.profiles WHERE id = ratings.reviewed_id)));

CREATE OR REPLACE FUNCTION private.seller_rating_stats(_seller uuid) RETURNS TABLE(avg_swapcoins numeric, review_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(round(avg(swapcoins)::numeric, 1), 0), count(*)::int FROM public.ratings WHERE reviewed_id = _seller AND NOT hidden;
$$;

-- Full public SwapCoins summary for a profile
CREATE OR REPLACE FUNCTION public.get_swapcoin_summary(_id uuid)
RETURNS TABLE(avg_swapcoins numeric, review_count int, communication numeric, accuracy numeric, experience numeric,
  completed_swaps int, completed_sales int, recent jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE(round(avg(r.swapcoins)::numeric,1),0), count(r.id)::int,
    COALESCE(round(avg(r.communication)::numeric,1),0), COALESCE(round(avg(r.accuracy)::numeric,1),0), COALESCE(round(avg(r.experience)::numeric,1),0),
    (SELECT count(*)::int FROM public.listings l WHERE l.status='completed' AND (l.seller_id=_id OR l.buyer_id=_id)),
    (SELECT count(*)::int FROM public.listings l WHERE l.status='completed' AND l.seller_id=_id),
    COALESCE((SELECT jsonb_agg(x) FROM (
      SELECT rr.review, rr.swapcoins, rr.created_at, p.full_name AS reviewer_name
      FROM public.ratings rr JOIN public.profiles p ON p.id = rr.reviewer_id
      WHERE rr.reviewed_id=_id AND NOT rr.hidden AND rr.review IS NOT NULL AND length(trim(rr.review))>0
      ORDER BY rr.created_at DESC LIMIT 5) x), '[]'::jsonb)
  FROM public.ratings r WHERE r.reviewed_id=_id AND NOT r.hidden;
$$;
GRANT EXECUTE ON FUNCTION public.get_swapcoin_summary(uuid) TO anon, authenticated;

-- Deal closed → notify both sides to rate, bump swap counts
CREATE OR REPLACE FUNCTION public.on_deal_completed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.profiles SET transactions_count = transactions_count + 1 WHERE id IN (NEW.seller_id, NEW.buyer_id);
    IF NEW.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, icon) VALUES
        (NEW.seller_id, 'Rate your swap', 'How was your deal for "' || left(NEW.title,60) || '"? Give your buyer SwapCoins.', '🪙'),
        (NEW.buyer_id, 'Rate your swap', 'How was your deal for "' || left(NEW.title,60) || '"? Give your seller SwapCoins.', '🪙');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS listings_deal_completed ON public.listings;
CREATE TRIGGER listings_deal_completed AFTER UPDATE OF status ON public.listings FOR EACH ROW EXECUTE FUNCTION public.on_deal_completed();

CREATE OR REPLACE FUNCTION public.send_rating_reminders() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l record;
BEGIN
  FOR l IN SELECT id, title, seller_id, buyer_id FROM public.listings
    WHERE status='completed' AND buyer_id IS NOT NULL AND rating_reminded_at IS NULL
      AND sold_at < now() - interval '24 hours' AND sold_at > now() - interval '14 days'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, icon)
    SELECT u, 'Don''t forget to rate', 'Your swap for "' || left(l.title,60) || '" is still waiting for your SwapCoins.', '🪙'
    FROM unnest(ARRAY[l.seller_id, l.buyer_id]) u
    WHERE NOT EXISTS (SELECT 1 FROM public.ratings r WHERE r.listing_id=l.id AND r.reviewer_id=u);
    UPDATE public.listings SET rating_reminded_at = now() WHERE id = l.id;
  END LOOP;
END; $$;
REVOKE EXECUTE ON FUNCTION public.send_rating_reminders() FROM PUBLIC, anon, authenticated;

-- One active listing per student (configurable), super admins exempt
CREATE OR REPLACE FUNCTION public.enforce_listing_limits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_limits jsonb; v_max_active int; v_min_price numeric; v_max_price numeric; v_active int;
BEGIN
  SELECT value INTO v_limits FROM public.app_settings WHERE key = 'limits';
  v_max_active := COALESCE((v_limits->>'max_active_listings')::int, 1);
  v_min_price  := COALESCE((v_limits->>'min_price')::numeric, 0);
  v_max_price  := COALESCE((v_limits->>'max_price')::numeric, 100000);
  IF NEW.price < v_min_price OR NEW.price > v_max_price THEN
    RAISE EXCEPTION 'Price must be between % and %', v_min_price, v_max_price;
  END IF;
  IF NEW.status IN ('pending','approved')
     AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('pending','approved'))
     AND NOT (private.has_role(NEW.seller_id,'admin') OR private.has_role(NEW.seller_id,'super_admin')) THEN
    SELECT count(*) INTO v_active FROM public.listings
     WHERE seller_id = NEW.seller_id AND status IN ('pending','approved') AND id <> NEW.id;
    IF v_active >= v_max_active THEN
      RAISE EXCEPTION 'You already have an item listed. Mark it sold, archive it or delete it to list something new.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;