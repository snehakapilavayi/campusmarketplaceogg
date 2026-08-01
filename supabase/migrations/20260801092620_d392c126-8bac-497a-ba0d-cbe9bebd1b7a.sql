
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('student','admin');
CREATE TYPE public.listing_type AS ENUM ('sell','rent');
CREATE TYPE public.listing_status AS ENUM ('draft','pending','approved','rejected','completed','archived');
CREATE TYPE public.item_condition AS ENUM ('brand_new','like_new','good','fair','used');
CREATE TYPE public.rent_period AS ENUM ('day','week','month');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.report_status AS ENUM ('pending','under_review','resolved','rejected');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT 'Student',
  avatar_url TEXT,
  bio TEXT,
  verification verification_status NOT NULL DEFAULT 'pending',
  tomato_rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  transactions_count INT NOT NULL DEFAULT 0,
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- new user -> profile + student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN NEW.email = 'admin@swapspace.in' THEN 'admin'::app_role ELSE 'student'::app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- LISTINGS
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type listing_type NOT NULL DEFAULT 'sell',
  status listing_status NOT NULL DEFAULT 'pending',
  condition item_condition NOT NULL DEFAULT 'good',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  rent_period rent_period,
  deposit NUMERIC(10,2),
  available_from DATE,
  available_until DATE,
  badge TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings approved public" ON public.listings FOR SELECT USING (status = 'approved');
CREATE POLICY "listings own read" ON public.listings FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "listings admin read" ON public.listings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings own insert" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings own update" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings admin update" ON public.listings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings own delete" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LISTING IMAGES
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.listing_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;
GRANT ALL ON public.listing_images TO service_role;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images follow listing read" ON public.listing_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'approved' OR l.seller_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "images owner write" ON public.listing_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

-- WISHLIST
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist own" ON public.wishlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CART
CREATE TABLE public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.cart TO authenticated;
GRANT ALL ON public.cart TO service_role;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart own" ON public.cart FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv participants" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "conv reported admin" ON public.conversations FOR SELECT TO authenticated USING (reported AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "conv buyer insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "conv participant update" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id) WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages participants" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid() OR (c.reported AND public.has_role(auth.uid(),'admin'))))
);
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RATINGS
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  communication INT NOT NULL DEFAULT 5,
  accuracy INT NOT NULL DEFAULT 5,
  experience INT NOT NULL DEFAULT 5,
  tomatoes NUMERIC(2,1) NOT NULL DEFAULT 5,
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ratings TO anon;
GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings public read" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings own insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id AND reviewer_id <> reviewed_id);

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  reason TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports own read" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports admin update" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications own update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);

-- EVENT BANNERS
CREATE TABLE public.event_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  accent TEXT,
  starts_at DATE,
  ends_at DATE,
  active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.event_banners TO anon, authenticated;
GRANT ALL ON public.event_banners TO service_role;
ALTER TABLE public.event_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.event_banners FOR SELECT USING (active);
CREATE POLICY "banners admin write" ON public.event_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ADMIN LOGS
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs admin read" ON public.admin_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "logs admin insert" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND auth.uid() = admin_id);

-- ============ SEED ============
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
 ('Electronics','electronics','Laptop',1),
 ('Books','books','BookOpen',2),
 ('Fashion','fashion','Shirt',3),
 ('Hostel Essentials','hostel','Lamp',4),
 ('Sports','sports','Dumbbell',5),
 ('Stationery','stationery','PenLine',6),
 ('Cycles','cycles','Bike',7),
 ('Others','others','Package',8);

INSERT INTO public.profiles (id, full_name, bio, verification, tomato_rating, transactions_count, profile_complete, avatar_url) VALUES
 ('11111111-1111-4111-8111-111111111111','Sneha Reddy','3rd year IT student. Selling stuff I no longer need.','verified',4.8,14,true,'https://i.pravatar.cc/200?img=47'),
 ('22222222-2222-4222-8222-222222222222','Rahul Verma','ECE, 2nd year. Gadget nerd.','verified',4.5,9,true,'https://i.pravatar.cc/200?img=12'),
 ('33333333-3333-4333-8333-333333333333','Aisha Khan','Design student, love thrifting.','verified',5.0,21,true,'https://i.pravatar.cc/200?img=32'),
 ('44444444-4444-4444-8444-444444444444','Karthik Nair','Mech final year. Cycles and tools.','verified',4.2,6,true,'https://i.pravatar.cc/200?img=15'),
 ('55555555-5555-4555-8555-555555555555','Meera Joshi','CSE 1st year. Books and notes.','pending',4.0,3,true,'https://i.pravatar.cc/200?img=45'),
 ('66666666-6666-4666-8666-666666666666','Arjun Pillai','Hostel block C. Sports gear on rent.','verified',4.7,11,true,'https://i.pravatar.cc/200?img=68');

WITH c AS (SELECT slug, id FROM public.categories),
ins AS (
  INSERT INTO public.listings (seller_id, category_id, title, description, type, status, condition, price, rent_period, deposit, badge, featured)
  SELECT s.seller, (SELECT id FROM c WHERE slug = s.cat), s.title, s.descr, s.ltype::listing_type, 'approved', s.cond::item_condition, s.price, s.rp::rent_period, s.dep, s.badge, s.feat
  FROM (VALUES
   ('11111111-1111-4111-8111-111111111111'::uuid,'electronics','Casio FX-991ES Plus Calculator','Used for two semesters, all functions working. Comes with cover.','sell','like_new',800,NULL,NULL,'Trending',true),
   ('22222222-2222-4222-8222-222222222222'::uuid,'electronics','HP Pavilion 14 Laptop','i5 11th gen, 8GB RAM, 512 SSD. Battery health 89%. Upgrading so selling.','sell','good',31000,NULL,NULL,'Best Seller',true),
   ('33333333-3333-4333-8333-333333333333'::uuid,'electronics','Wacom Intuos Drawing Tablet','Perfect for design assignments. Pen and cable included.','rent','like_new',120,'week',1000,'New',false),
   ('44444444-4444-4444-8444-444444444444'::uuid,'cycles','Firefox Bad Attitude MTB','21 gears, recently serviced, new tyres. Great for campus and city rides.','sell','good',6500,NULL,NULL,NULL,false),
   ('66666666-6666-4666-8666-666666666666'::uuid,'sports','Yonex Badminton Racket Pair','Two rackets plus a can of shuttles. Rent per week for tournaments.','rent','good',80,'week',500,'Trending',false),
   ('55555555-5555-4555-8555-555555555555'::uuid,'books','Engineering Mathematics Vol 1 & 2','B.S. Grewal set. Slight highlighting in chapter 4 only.','sell','good',450,NULL,NULL,NULL,false),
   ('55555555-5555-4555-8555-555555555555'::uuid,'books','Data Structures in C - Reema Thareja','Barely opened. Selling since I switched to Python.','sell','like_new',300,NULL,NULL,'New',false),
   ('33333333-3333-4333-8333-333333333333'::uuid,'fashion','Denim Jacket (Oversized, M)','Thrifted, washed and ready. Fits M-L.','sell','good',700,NULL,NULL,NULL,false),
   ('11111111-1111-4111-8111-111111111111'::uuid,'hostel','Study Table Lamp with Clamp','Warm and cool modes, USB powered. No flicker.','sell','like_new',420,NULL,NULL,NULL,false),
   ('11111111-1111-4111-8111-111111111111'::uuid,'hostel','Mini Fridge 45L','Perfect for hostel rooms. Available on monthly rent.','rent','good',450,'month',2000,'Trending',true),
   ('22222222-2222-4222-8222-222222222222'::uuid,'electronics','Boat Rockerz 450 Headphones','Bluetooth, 12h battery. Ear cushions still soft.','sell','good',1100,NULL,NULL,NULL,false),
   ('44444444-4444-4444-8444-444444444444'::uuid,'others','Vernier Caliper + Micrometer Set','Lab essentials, calibrated. Rent for the lab semester.','rent','good',60,'week',400,NULL,false),
   ('66666666-6666-4666-8666-666666666666'::uuid,'sports','Cricket Kit (Bat, Pads, Gloves)','Full kit for weekend matches. Rent per day.','rent','fair',150,'day',1500,NULL,false),
   ('33333333-3333-4333-8333-333333333333'::uuid,'stationery','Copic Marker Set (24 colours)','Design students only please. Barely used, all caps intact.','sell','like_new',2400,NULL,NULL,'Best Seller',false),
   ('55555555-5555-4555-8555-555555555555'::uuid,'stationery','Drafting Kit + A2 Board','Engineering graphics kit with board and clips.','sell','good',550,NULL,NULL,NULL,false),
   ('44444444-4444-4444-8444-444444444444'::uuid,'cycles','Hercules Roadeo Cycle','Single speed, light and quick. Ideal campus commuter.','rent','good',90,'week',1200,NULL,false),
   ('11111111-1111-4111-8111-111111111111'::uuid,'fashion','Formal Blazer (Navy, L)','Worn twice for placements. Dry cleaned.','rent','like_new',200,'day',1000,'New',false),
   ('22222222-2222-4222-8222-222222222222'::uuid,'electronics','Arduino Uno Starter Kit','Board, breadboard, sensors and jumper wires. Great for mini projects.','sell','good',1350,NULL,NULL,NULL,false),
   ('66666666-6666-4666-8666-666666666666'::uuid,'hostel','Foldable Study Chair','Cushioned, folds flat. Moving out so selling cheap.','sell','fair',600,NULL,NULL,NULL,false),
   ('33333333-3333-4333-8333-333333333333'::uuid,'others','DSLR Canon 200D + 18-55mm','For fest coverage and shoots. Rent per day with deposit.','rent','like_new',600,'day',5000,'Trending',true)
  ) AS s(seller,cat,title,descr,ltype,cond,price,rp,dep,badge,feat)
  RETURNING id, title
)
INSERT INTO public.listing_images (listing_id, url, sort_order)
SELECT ins.id, 'https://picsum.photos/seed/' || replace(lower(left(ins.title,18)),' ','-') || g || '/800/800', g
FROM ins, generate_series(0,2) g;

INSERT INTO public.event_banners (title, description, accent, active) VALUES
 ('Freshers Essentials Sale','Everything a first year needs — lamps, buckets, cycles and books.','amber',true),
 ('Hackathon Week','Rent laptops, Arduino kits and power banks from seniors.','slate',true);

INSERT INTO public.ratings (reviewer_id, reviewed_id, tomatoes, communication, accuracy, experience, review) VALUES
 ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',5,5,5,5,'Product was exactly as described. Smooth handover at the library.'),
 ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',4.5,5,4,5,'Replied fast, minor scratch not mentioned but fine overall.'),
 ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',5,5,5,5,'Best seller on campus. Packed the markers really carefully.'),
 ('44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666',4.5,4,5,5,'Cricket kit was clean and complete. Would rent again.');
