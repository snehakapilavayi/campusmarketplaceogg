CREATE POLICY "listing photos are readable by signed in users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-photos');

CREATE POLICY "students upload own listing photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "students update own listing photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "students delete own listing photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);