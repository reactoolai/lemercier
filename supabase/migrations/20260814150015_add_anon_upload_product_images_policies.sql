/*
# Temporary anon upload policies for product-images bucket
# These allow an external script using the anon key to bulk-upload product images.
# To be removed after the one-time batch import is complete.
*/

DROP POLICY IF EXISTS "anon upload product-images" ON storage.objects;
CREATE POLICY "anon upload product-images"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon upsert product-images" ON storage.objects;
CREATE POLICY "anon upsert product-images"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');
