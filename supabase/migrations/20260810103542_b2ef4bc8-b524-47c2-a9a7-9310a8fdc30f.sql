-- ============ A. SECURITY ============

-- A1. Ratings: rename + scoped read
ALTER TABLE public.ratings RENAME COLUMN tomatoes TO swapcoins;
ALTER TABLE public.profiles RENAME COLUMN tomato_rating TO swapcoin_rating;

DROP POLICY IF EXISTS "ratings authenticated read" ON public.ratings;
CREATE POLICY "ratings involved read" ON public.ratings FOR SELECT TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.seller_rating_stats AS
  SELECT reviewed_id AS seller_id,
         round(avg(swapcoins)::numeric, 1) AS avg_swapcoins,
         count(*)::int AS review_count
  FROM public.ratings
  GROUP BY reviewed_id;
GRANT SELECT ON public.seller_rating_stats TO anon, authenticated;

-- A2. Notifications: no self-insert
DROP POLICY IF EXISTS "notifications admin insert" ON public.notifications;
CREATE POLICY "notifications admin insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- A3. Profiles: anon limited to a narrow column projection
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, verification, campus, swapcoin_rating) ON public.profiles TO anon;

-- ============ C. DATA ARCHITECTURE ============

-- C9. status default
ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'approved'::listing_status;

-- C10. campus backfill
UPDATE public.profiles SET campus = 'Vishnu Institute of Technology'
WHERE campus IS NULL OR btrim(campus) = '';

-- D12. sale lifecycle
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS sold_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_id uuid;

-- D13. email preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_prefs jsonb NOT NULL
  DEFAULT '{"messages":true,"listing_status":true,"sales":true}'::jsonb;

-- D14. image moderation flags
ALTER TABLE public.listing_images
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_note text;

-- C11. indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewed ON public.ratings(reviewed_id);

-- ============ D15. ANTI-SPAM ============
CREATE OR REPLACE FUNCTION public.enforce_daily_listing_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cap int; v_today int;
BEGIN
  SELECT COALESCE((value->>'max_listings_per_day')::int, 10) INTO v_cap
  FROM public.app_settings WHERE key = 'limits';
  v_cap := COALESCE(v_cap, 10);
  SELECT count(*) INTO v_today FROM public.listings
   WHERE seller_id = NEW.seller_id AND created_at > now() - interval '24 hours';
  IF v_today >= v_cap THEN
    RAISE EXCEPTION 'You have posted % listings today. Please try again tomorrow.', v_cap;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS listings_daily_cap ON public.listings;
CREATE TRIGGER listings_daily_cap BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_listing_cap();

CREATE OR REPLACE FUNCTION public.enforce_message_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recent int;
BEGIN
  SELECT count(*) INTO v_recent FROM public.messages
   WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 minute';
  IF v_recent >= 20 THEN
    RAISE EXCEPTION 'You are sending messages too quickly. Take a breath and try again in a minute.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS messages_rate_limit ON public.messages;
CREATE TRIGGER messages_rate_limit BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate();

-- ============ D16. DEMO DATA ============
INSERT INTO public.profiles (id, full_name, bio, verification, swapcoin_rating, transactions_count, profile_complete, campus, account_type) VALUES
 ('11111111-1111-4111-8111-000000000001','Ananya Rao','Final year ECE. Selling my hostel kit before I graduate.','verified',4.8,12,true,'Vishnu Institute of Technology','edu'),
 ('11111111-1111-4111-8111-000000000002','Rahul Verma','Mech, 3rd year. Drafting tools and lab gear.','verified',4.5,7,true,'Vishnu Institute of Technology','edu'),
 ('11111111-1111-4111-8111-000000000003','Sneha Iyer','CSE 2nd year. Books, books, books.','verified',4.9,21,true,'Vishnu Institute of Technology','edu'),
 ('11111111-1111-4111-8111-000000000004','Karthik Naidu','Fresher, just moved into hostel.','verified',4.2,2,true,'Vishnu Institute of Technology','fresher'),
 ('11111111-1111-4111-8111-000000000005','Meera Joshi','Cycling, sports gear and camera rentals.','verified',4.6,9,true,'Vishnu Institute of Technology','edu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role FROM public.profiles
WHERE id::text LIKE '11111111-1111-4111-8111-%'
ON CONFLICT DO NOTHING;

INSERT INTO public.listings (id, seller_id, category_id, title, description, type, status, condition, price, rent_period, deposit, badge, featured) VALUES
 ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000001',(SELECT id FROM public.categories WHERE slug='hostel'),'Mini Fridge 45L','Used for two years, cools perfectly. Pickup from Block B.','sell','approved','good',3200,NULL,NULL,'Hostel favourite',true),
 ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000002',(SELECT id FROM public.categories WHERE slug='stationery'),'Drawing Board + T-square','Full drafting set for first year engineering graphics.','sell','approved','like_new',650,NULL,NULL,NULL,false),
 ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000003',(SELECT id FROM public.categories WHERE slug='books'),'GATE CSE Prep Bundle','Six books, minimal highlighting, all latest editions.','sell','approved','good',1800,NULL,NULL,'Bundle deal',true),
 ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000005',(SELECT id FROM public.categories WHERE slug='sports'),'Badminton Racket (Yonex)','Rent by the week for tournaments.','rent','approved','good',120,'week',500,NULL,false),
 ('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000001',(SELECT id FROM public.categories WHERE slug='fashion'),'Lab Coat (M)','Worn one semester, washed and pressed.','sell','approved','like_new',300,NULL,NULL,NULL,false),
 ('22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000002',(SELECT id FROM public.categories WHERE slug='stationery'),'Casio FX-991EX Calculator','Works flawlessly, includes cover.','sell','approved','good',900,NULL,NULL,'Exam ready',false),
 ('22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000005',(SELECT id FROM public.categories WHERE slug='others'),'Study Table Lamp','Warm LED, three brightness levels.','sell','approved','good',450,NULL,NULL,NULL,false),
 ('22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000003',(SELECT id FROM public.categories WHERE slug='books'),'Engineering Mathematics Vol 1-3','Pending review example listing.','sell','pending','fair',700,NULL,NULL,NULL,false),
 ('22222222-2222-4222-8222-000000000009','11111111-1111-4111-8111-000000000004',(SELECT id FROM public.categories WHERE slug='hostel'),'Bucket + Mug Set','Sold already — kept for records.','sell','completed','good',150,NULL,NULL,NULL,false)
ON CONFLICT (id) DO NOTHING;

UPDATE public.listings SET sold_at = now() - interval '3 days', buyer_id = '11111111-1111-4111-8111-000000000001'
WHERE id = '22222222-2222-4222-8222-000000000009';

INSERT INTO public.listing_images (listing_id, url, sort_order) VALUES
 ('22222222-2222-4222-8222-000000000001','https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000002','https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000003','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000004','https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000005','https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000006','https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000007','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000008','https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=70',0),
 ('22222222-2222-4222-8222-000000000009','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=70',0)
ON CONFLICT DO NOTHING;

INSERT INTO public.ratings (reviewer_id, reviewed_id, listing_id, communication, accuracy, experience, swapcoins, review) VALUES
 ('11111111-1111-4111-8111-000000000003','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001',5,5,5,5,'Super smooth handover near the library.'),
 ('11111111-1111-4111-8111-000000000004','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000002',4,5,4,4.5,'Exactly as described, fair price.'),
 ('11111111-1111-4111-8111-000000000001','11111111-1111-4111-8111-000000000003','22222222-2222-4222-8222-000000000003',5,5,5,5,'Books were in great shape.')
ON CONFLICT DO NOTHING;

INSERT INTO public.conversations (id, listing_id, buyer_id, seller_id) VALUES
 ('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000004','11111111-1111-4111-8111-000000000001'),
 ('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000002','11111111-1111-4111-8111-000000000003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (conversation_id, sender_id, content) VALUES
 ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000004','Hi! Is the fridge still available?'),
 ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000001','Yes it is. Free after 5pm near Block B.'),
 ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000002','Would you split the bundle?'),
 ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000003','Prefer selling together, but I can do 1600 for all six.')
ON CONFLICT DO NOTHING;

UPDATE public.app_settings
SET value = value || '{"max_listings_per_day": 10}'::jsonb
WHERE key = 'limits';