CREATE OR REPLACE FUNCTION private.admin_college(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT college_id FROM public.user_roles
  WHERE user_id = _uid AND role::text IN ('college_admin','moderator') AND college_id IS NOT NULL
  LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.is_college_admin_of(_college uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _college IS NOT NULL AND private.admin_college(auth.uid()) = _college;
$$;
REVOKE ALL ON FUNCTION public.is_college_admin_of(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_college_admin_of(uuid) TO authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE POLICY "listings college admin read" ON public.listings FOR SELECT TO authenticated USING (public.is_college_admin_of(college_id));
CREATE POLICY "listings college admin update" ON public.listings FOR UPDATE TO authenticated USING (public.is_college_admin_of(college_id)) WITH CHECK (public.is_college_admin_of(college_id));
CREATE POLICY "listings college admin delete" ON public.listings FOR DELETE TO authenticated USING (public.is_college_admin_of(college_id));
CREATE POLICY "images college admin read" ON public.listing_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND public.is_college_admin_of(l.college_id)));

CREATE POLICY "profiles college admin read" ON public.profiles FOR SELECT TO authenticated USING (public.is_college_admin_of(college_id));
CREATE POLICY "profiles college admin update" ON public.profiles FOR UPDATE TO authenticated USING (public.is_college_admin_of(college_id)) WITH CHECK (public.is_college_admin_of(college_id));

CREATE POLICY "reports college admin read" ON public.reports FOR SELECT TO authenticated USING (public.is_college_admin_of(college_id));
CREATE POLICY "reports college admin update" ON public.reports FOR UPDATE TO authenticated USING (public.is_college_admin_of(college_id)) WITH CHECK (public.is_college_admin_of(college_id));

CREATE POLICY "banners college admin write" ON public.event_banners FOR ALL TO authenticated USING (public.is_college_admin_of(college_id)) WITH CHECK (public.is_college_admin_of(college_id));

CREATE POLICY "notifications college admin insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND public.is_college_admin_of(p.college_id)));

CREATE POLICY "logs college admin insert" ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = admin_id AND public.is_college_admin_of(college_id));
CREATE POLICY "logs college admin read" ON public.admin_logs FOR SELECT TO authenticated USING (public.is_college_admin_of(college_id));

ALTER TABLE public.listings ADD COLUMN removal_reason text;
ALTER TABLE public.profiles ADD COLUMN trusted_seller boolean NOT NULL DEFAULT false;