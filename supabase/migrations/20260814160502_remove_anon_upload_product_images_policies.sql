/*
# Remove temporary anon upload policies from product-images bucket
# These were added for the one-time bulk import and are no longer needed.
*/

DROP POLICY IF EXISTS "anon upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "anon upsert product-images" ON storage.objects;
