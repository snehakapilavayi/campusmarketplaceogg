-- Split listing_images read policy so anon path no longer needs has_role()
DROP POLICY IF EXISTS "images follow listing read" ON public.listing_images;

CREATE POLICY "images approved public read"
ON public.listing_images FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id AND l.status = 'approved'::listing_status));

CREATE POLICY "images read authenticated"
ON public.listing_images FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id AND (l.status = 'approved'::listing_status OR l.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))));

-- Lock down SECURITY DEFINER functions from direct API execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;