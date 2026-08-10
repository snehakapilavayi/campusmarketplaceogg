-- 1. Fresher auto-approval + strict domain gatekeeping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(coalesce(NEW.email, ''));
  v_type text;
  v_verification verification_status;
BEGIN
  IF v_email = 'admin@swapspace.in' THEN
    v_type := 'edu';
    v_verification := 'verified'::verification_status;
  ELSIF v_email LIKE '%@gmail.com' THEN
    v_type := 'fresher';
    v_verification := 'verified'::verification_status;
  ELSIF v_email LIKE '%.edu.in' OR v_email LIKE '%@edu.in' THEN
    v_type := 'edu';
    v_verification := 'verified'::verification_status;
  ELSE
    RAISE EXCEPTION 'Sign-up is limited to college (.edu.in) or @gmail.com addresses';
  END IF;

  INSERT INTO public.profiles (id, full_name, account_type, verification)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    v_type,
    v_verification
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

-- 2. Server-side enforcement of marketplace limits
CREATE OR REPLACE FUNCTION public.enforce_listing_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits jsonb;
  v_max_active int;
  v_min_price numeric;
  v_max_price numeric;
  v_active int;
BEGIN
  SELECT value INTO v_limits FROM public.app_settings WHERE key = 'limits';
  v_max_active := COALESCE((v_limits->>'max_active_listings')::int, 20);
  v_min_price  := COALESCE((v_limits->>'min_price')::numeric, 0);
  v_max_price  := COALESCE((v_limits->>'max_price')::numeric, 100000);

  IF NEW.price < v_min_price OR NEW.price > v_max_price THEN
    RAISE EXCEPTION 'Price must be between % and %', v_min_price, v_max_price;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status IN ('pending','approved') THEN
    SELECT count(*) INTO v_active
    FROM public.listings
    WHERE seller_id = NEW.seller_id AND status IN ('pending','approved');

    IF v_active >= v_max_active THEN
      RAISE EXCEPTION 'You have reached the limit of % active listings', v_max_active;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS listings_enforce_limits ON public.listings;
CREATE TRIGGER listings_enforce_limits
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_limits();

-- 3. Admin management of campuses
DROP POLICY IF EXISTS "campuses admin write" ON public.campuses;
CREATE POLICY "campuses admin write" ON public.campuses
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campuses TO authenticated;
GRANT SELECT ON public.campuses TO anon;
GRANT ALL ON public.campuses TO service_role;