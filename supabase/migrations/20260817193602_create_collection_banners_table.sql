/*
# Create collection_banners table

1. New Tables
- `collection_banners`
  - `id` (uuid, primary key)
  - `title` (text, not null) — e.g. "Collections Costumes"
  - `category` (text, not null) — which category to link to, e.g. "Vestes & Costumes"
  - `img` (text, nullable) — image URL from product-images bucket
  - `sort_order` (integer, default 0) — display order
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `collection_banners`.
- SELECT: public (anon + authenticated) — all visitors see the banners.
- INSERT / UPDATE / DELETE: authenticated only — admin manages banners.
*/

CREATE TABLE IF NOT EXISTS collection_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  img text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collection_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_collection_banners" ON collection_banners;
CREATE POLICY "anon_select_collection_banners"
ON collection_banners FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_collection_banners" ON collection_banners;
CREATE POLICY "auth_insert_collection_banners"
ON collection_banners FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_collection_banners" ON collection_banners;
CREATE POLICY "auth_update_collection_banners"
ON collection_banners FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_collection_banners" ON collection_banners;
CREATE POLICY "auth_delete_collection_banners"
ON collection_banners FOR DELETE
TO authenticated USING (true);
