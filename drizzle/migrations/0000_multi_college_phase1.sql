ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'college_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'escalated';

CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain_suffix text,
  city text,
  logo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.colleges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colleges public read" ON public.colleges FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "colleges super admin write" ON public.colleges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.colleges (name, slug, domain_suffix, city)
VALUES ('Vishnu Institute of Technology', 'vitb', 'vishnu.edu.in', 'Bhimavaram');

COMMENT ON TABLE public.campuses IS 'DEPRECATED: replaced by public.colleges';

ALTER TABLE public.user_roles ADD COLUMN college_id uuid REFERENCES public.colleges(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN created_by uuid;

ALTER TABLE public.profiles ADD COLUMN college_id uuid REFERENCES public.colleges(id);
ALTER TABLE public.listings ADD COLUMN college_id uuid REFERENCES public.colleges(id);
ALTER TABLE public.reports ADD COLUMN college_id uuid REFERENCES public.colleges(id);
ALTER TABLE public.event_banners ADD COLUMN college_id uuid REFERENCES public.colleges(id);

UPDATE public.profiles SET college_id = (SELECT id FROM public.colleges WHERE slug='vitb') WHERE college_id IS NULL;
UPDATE public.listings SET college_id = (SELECT id FROM public.colleges WHERE slug='vitb') WHERE college_id IS NULL;
UPDATE public.reports SET college_id = (SELECT id FROM public.colleges WHERE slug='vitb') WHERE college_id IS NULL;

ALTER TABLE public.reports ADD COLUMN assigned_to uuid;
ALTER TABLE public.reports ADD COLUMN resolution_note text;
ALTER TABLE public.reports ADD COLUMN escalated_at timestamptz;

ALTER TABLE public.admin_logs ADD COLUMN college_id uuid REFERENCES public.colleges(id);
ALTER TABLE public.admin_logs ADD COLUMN before jsonb;
ALTER TABLE public.admin_logs ADD COLUMN after jsonb;
ALTER TABLE public.admin_logs ADD COLUMN reason text;

-- listings inherit the seller's college
CREATE OR REPLACE FUNCTION public.set_listing_college()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.college_id IS NULL THEN
    SELECT college_id INTO NEW.college_id FROM public.profiles WHERE id = NEW.seller_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER listings_set_college BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_listing_college();

CREATE OR REPLACE FUNCTION public.set_report_college()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.college_id IS NULL THEN
    SELECT college_id INTO NEW.college_id FROM public.profiles WHERE id = NEW.reporter_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER reports_set_college BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_report_college();

-- role resolution: legacy 'admin' == super admin
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS TABLE(role text, college_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN r.role::text IN ('admin','super_admin') THEN 'super_admin' ELSE r.role::text END, r.college_id
  FROM public.user_roles r
  WHERE r.user_id = auth.uid() AND r.role::text IN ('admin','super_admin','college_admin','moderator')
  ORDER BY CASE WHEN r.role::text IN ('admin','super_admin') THEN 0 WHEN r.role::text = 'college_admin' THEN 1 ELSE 2 END
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_my_admin_role() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_admin_role() TO authenticated;

-- sign-ups route by college domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_email text := lower(coalesce(NEW.email, ''));
  v_fresher boolean := coalesce((NEW.raw_user_meta_data->>'fresher')::boolean, false);
  v_type text;
  v_verification verification_status;
  v_college uuid;
BEGIN
  SELECT id INTO v_college FROM public.colleges
   WHERE active AND domain_suffix IS NOT NULL AND v_email LIKE '%@' || lower(domain_suffix)
   LIMIT 1;

  IF v_email = 'admin@swapspace.in' THEN
    v_type := 'edu'; v_verification := 'verified';
  ELSIF v_college IS NOT NULL OR v_email LIKE '%.edu.in' OR v_email LIKE '%@edu.in' THEN
    v_type := 'edu'; v_verification := 'verified';
  ELSIF v_fresher AND v_email LIKE '%@gmail.com' THEN
    v_type := 'fresher'; v_verification := 'verified';
    BEGIN
      v_college := NULLIF(NEW.raw_user_meta_data->>'college_id','')::uuid;
    EXCEPTION WHEN others THEN v_college := NULL;
    END;
  ELSE
    RAISE EXCEPTION 'Sign-up is limited to college (.edu.in) addresses. Freshers can join with @gmail.com through the freshers link.';
  END IF;

  IF v_college IS NULL OR NOT EXISTS (SELECT 1 FROM public.colleges WHERE id = v_college) THEN
    SELECT id INTO v_college FROM public.colleges WHERE active ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, account_type, verification, college_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), v_type, v_verification, v_college)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student'::app_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;