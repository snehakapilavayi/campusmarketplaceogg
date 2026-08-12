CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := lower(coalesce(NEW.email, ''));
  v_fresher boolean := coalesce((NEW.raw_user_meta_data->>'fresher')::boolean, false);
  v_type text;
  v_verification verification_status;
BEGIN
  IF v_email = 'admin@swapspace.in' THEN
    v_type := 'edu';
    v_verification := 'verified'::verification_status;
  ELSIF v_email LIKE '%.edu.in' OR v_email LIKE '%@edu.in' THEN
    v_type := 'edu';
    v_verification := 'verified'::verification_status;
  ELSIF v_fresher AND v_email LIKE '%@gmail.com' THEN
    v_type := 'fresher';
    v_verification := 'verified'::verification_status;
  ELSE
    RAISE EXCEPTION 'Sign-up is limited to college (.edu.in) addresses. Freshers can join with @gmail.com through the freshers link.';
  END IF;

  INSERT INTO public.profiles (id, full_name, account_type, verification)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    v_type,
    v_verification
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $function$;