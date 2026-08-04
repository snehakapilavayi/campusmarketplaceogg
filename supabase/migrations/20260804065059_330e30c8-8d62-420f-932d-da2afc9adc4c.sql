ALTER TABLE public.event_banners ADD COLUMN IF NOT EXISTS campus text;
CREATE INDEX IF NOT EXISTS event_banners_campus_idx ON public.event_banners (campus);