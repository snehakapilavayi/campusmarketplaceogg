
DROP POLICY IF EXISTS "listing photos are readable by signed in users" ON storage.objects;
DROP POLICY IF EXISTS "listing photos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "listing photos owner update" ON storage.objects;
DROP POLICY IF EXISTS "listing photos owner delete" ON storage.objects;

CREATE POLICY "listing photos scoped read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.listing_images li
      JOIN public.listings l ON l.id = li.listing_id
      WHERE l.status = 'approved'::public.listing_status
        AND li.url LIKE '%' || storage.objects.name || '%'
    )
  )
);

CREATE POLICY "listing photos owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "listing photos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_images li
    JOIN public.listings l ON l.id = li.listing_id
    WHERE li.url LIKE '%' || storage.objects.name || '%'
      AND l.seller_id <> auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "listing photos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_images li
    JOIN public.listings l ON l.id = li.listing_id
    WHERE li.url LIKE '%' || storage.objects.name || '%'
      AND l.seller_id <> auth.uid()
  )
);
