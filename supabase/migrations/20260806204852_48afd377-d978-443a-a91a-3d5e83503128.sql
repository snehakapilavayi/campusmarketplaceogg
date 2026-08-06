CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app settings public read" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "app settings admin write" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (key, value) VALUES
  ('general', '{"site_name":"SwapSpace","tagline":"Campus-only buy, rent and swap for Vishnu students.","maintenance_mode":false,"maintenance_message":"SwapSpace is getting a quick tune-up. Back in a few minutes.","signups_enabled":true,"allowed_email_domain":"vishnu.edu.in"}'::jsonb),
  ('limits', '{"max_photos_per_listing":6,"max_active_listings":10,"max_price":100000,"min_price":0}'::jsonb),
  ('content', '{"hero_title":"Everything you need is already on campus.","hero_subtitle":"Buy, rent and swap with verified Vishnu students. No strangers, no commission.","instagram_url":"https://www.instagram.com/swapspace.07?igsh=MWZ4NHUyeHI0bTEyZA==","support_email":"info.swapspace@gmail.com"}'::jsonb),
  ('moderation', '{"blocklist":[],"auto_flag":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;