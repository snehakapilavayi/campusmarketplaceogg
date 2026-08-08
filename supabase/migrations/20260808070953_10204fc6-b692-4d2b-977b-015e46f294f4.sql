-- 1. app_settings: hide internal moderation config from non-admins
DROP POLICY IF EXISTS "app settings public read" ON public.app_settings;
CREATE POLICY "app settings public read" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('general','limits','content'));
CREATE POLICY "app settings admin read" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. storage: exact path matching instead of LIKE patterns
DROP POLICY IF EXISTS "listing photos scoped read" ON storage.objects;
CREATE POLICY "listing photos scoped read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'listing-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.listing_images li
        JOIN public.listings l ON l.id = li.listing_id
        WHERE l.status = 'approved'::listing_status
          AND split_part(li.url, '/listing-photos/', 2) = objects.name
      )
    )
  );

DROP POLICY IF EXISTS "listing photos owner update" ON storage.objects;
CREATE POLICY "listing photos owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "listing photos owner delete" ON storage.objects;
CREATE POLICY "listing photos owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. user_roles: explicit admin-only write path
CREATE POLICY "roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles admin read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));