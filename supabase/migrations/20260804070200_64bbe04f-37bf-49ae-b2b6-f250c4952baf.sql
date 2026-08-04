-- 1. Campus field on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus text;

-- 2. Slug uniqueness for categories
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (lower(slug));

-- 3. Let audit logs join to the admin's profile
ALTER TABLE public.admin_logs
  ADD CONSTRAINT admin_logs_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at DESC);

-- 4. Reported chat moderation: admins may act on reported conversations only
CREATE POLICY "conv reported admin update"
  ON public.conversations FOR UPDATE TO authenticated
  USING (reported AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "conv reported admin delete"
  ON public.conversations FOR DELETE TO authenticated
  USING (reported AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "messages reported admin delete"
  ON public.messages FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.reported
      AND public.has_role(auth.uid(), 'admin'::app_role)
  ));