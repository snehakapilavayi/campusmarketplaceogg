ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ratings_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count int NOT NULL DEFAULT 0;
UPDATE public.profiles p SET
  ratings_count = (SELECT count(*) FROM public.ratings r WHERE r.reviewed_id=p.id AND NOT r.hidden),
  sales_count = (SELECT count(*) FROM public.listings l WHERE l.seller_id=p.id AND l.status='completed'),
  swapcoin_rating = COALESCE((SELECT round(avg(swapcoins)::numeric,1) FROM public.ratings r WHERE r.reviewed_id=p.id AND NOT r.hidden),0);

CREATE OR REPLACE FUNCTION public.refresh_swapcoins() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles p SET
    swapcoin_rating = COALESCE((SELECT round(avg(swapcoins)::numeric,1) FROM public.ratings r WHERE r.reviewed_id = NEW.reviewed_id AND NOT r.hidden), 0),
    ratings_count = (SELECT count(*) FROM public.ratings r WHERE r.reviewed_id = NEW.reviewed_id AND NOT r.hidden)
  WHERE p.id = NEW.reviewed_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.on_deal_completed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.profiles SET transactions_count = transactions_count + 1 WHERE id IN (NEW.seller_id, NEW.buyer_id);
    UPDATE public.profiles SET sales_count = sales_count + 1 WHERE id = NEW.seller_id;
    IF NEW.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, icon) VALUES
        (NEW.seller_id, 'Rate your swap', 'How was your deal for "' || left(NEW.title,60) || '"? Give your buyer SwapCoins.', '🪙'),
        (NEW.buyer_id, 'Rate your swap', 'How was your deal for "' || left(NEW.title,60) || '"? Give your seller SwapCoins.', '🪙');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP FUNCTION IF EXISTS public.get_public_seller_card(uuid);
DROP FUNCTION IF EXISTS private.public_seller_card(uuid);
CREATE FUNCTION private.public_seller_card(_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, swapcoin_rating numeric, verification verification_status, campus text, ratings_count int, sales_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.swapcoin_rating, p.verification, p.campus, p.ratings_count, p.sales_count
  FROM public.profiles p WHERE p.id = _id AND p.suspended = false
$$;
CREATE FUNCTION public.get_public_seller_card(_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, swapcoin_rating numeric, verification verification_status, campus text, ratings_count int, sales_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT * FROM private.public_seller_card(_id); $$;
GRANT EXECUTE ON FUNCTION public.get_public_seller_card(uuid) TO anon, authenticated;