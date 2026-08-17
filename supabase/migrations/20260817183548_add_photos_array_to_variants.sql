/*
# Add photos array to product_variants

1. Modified Tables
- product_variants: add `photos` text[] column (nullable, defaults to empty array)
  This allows assigning multiple photos to a single color variant (e.g. multiple blue photos, multiple red photos).
2. Notes
- The existing `img` column is kept for backward compatibility. The new `photos` array is the primary way to store multiple photos per color.
- On save, the app will populate `photos` with all assigned photo URLs.
*/

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[];
