-- Change products table to use text ID (SKU-based) instead of integer
-- This is needed because Retailpoint SKUs contain letters (e.g. "00HR817")

-- First, drop the old integer-based table
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  brand text DEFAULT '',
  cat text DEFAULT '',
  price numeric(10,2) DEFAULT 0,
  color text DEFAULT '',
  sizes text[] DEFAULT '{}',
  img text DEFAULT '',
  stock integer DEFAULT 0,
  sku text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);
