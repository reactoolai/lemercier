/*
# Create product_variants table

1. New Tables
- `product_variants`
  - `id` (uuid, primary key)
  - `product_id` (text, foreign key to products.id, ON DELETE CASCADE)
  - `color` (text) — color name (e.g. "Noir", "Marine", "Gris")
  - `img` (text) — image URL for this color variant
  - `sizes` (text[]) — available sizes for this color (e.g. ["S","M","L","XL"])
  - `stock` (integer, default 0) — stock quantity for this variant
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `product_variants`.
- SELECT open to anon + authenticated (public storefront reads variants).
- INSERT/UPDATE/DELETE restricted to authenticated (admin only).
3. Important Notes
- Variants are linked to products via product_id with CASCADE delete.
- When a product is deleted, all its variants are automatically removed.
- The admin manages variants from the product edit modal.
*/

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color text DEFAULT '',
  img text DEFAULT '',
  sizes text[] DEFAULT '{}',
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_variants" ON product_variants;
CREATE POLICY "anon_select_variants" ON product_variants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_variants" ON product_variants;
CREATE POLICY "admin_insert_variants" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_variants" ON product_variants;
CREATE POLICY "admin_update_variants" ON product_variants FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_variants" ON product_variants;
CREATE POLICY "admin_delete_variants" ON product_variants FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
