ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'edu';

CREATE TABLE IF NOT EXISTS public.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.campuses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campuses TO authenticated;
GRANT ALL ON public.campuses TO service_role;

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campuses public read" ON public.campuses FOR SELECT TO public USING (active);
CREATE POLICY "campuses admin write" ON public.campuses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.campuses (name, sort_order)
SELECT 'Vishnu Institute of Technology', 0
WHERE NOT EXISTS (SELECT 1 FROM public.campuses);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := lower(coalesce(NEW.email, ''));
  v_type text;
BEGIN
  IF v_email = 'admin@swapspace.in' THEN
    v_type := 'edu';
  ELSIF v_email LIKE '%.edu.in' OR v_email LIKE '%@edu.in' THEN
    v_type := 'edu';
  ELSIF v_email LIKE '%@gmail.com' THEN
    v_type := 'fresher';
  ELSE
    RAISE EXCEPTION 'Sign-up is limited to college (.edu.in) or gmail.com addresses';
  END IF;

  INSERT INTO public.profiles (id, full_name, account_type, verification)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    v_type,
    'pending'::verification_status
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $function$;