/*
# Create products table for Le Mercier inventory

1. New Tables
- `products`
  - `id` (int, primary key) — product ID
  - `name` (text) — product name
  - `brand` (text) — brand name
  `cat` (text) — category (Chemises, Pantalons, Chandails, etc.)
  - `price` (numeric) — price in CAD
  - `color` (text) — color description
  - `sizes` (text[]) — available sizes array
  - `img` (text) — image URL
  - `stock` (int) — stock quantity (default 0)
  - `sku` (text) — product SKU code
  - `updated_at` (timestamptz) — last sync timestamp
2. Security
- Enable RLS on `products`.
- Allow anon + authenticated CRUD (single-tenant, no sign-in — public catalog).
- This is a public storefront catalog, so all data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS products (
  id integer PRIMARY KEY,
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

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);
