/*
# Orders, abandoned carts, and newsletter tables

## Context
The store needs to persist orders (checkout), track abandoned carts, and collect
newsletter subscribers. No existing tables are altered.

## New Tables

1. `orders`
   - `id` (uuid, PK)
   - `order_number` (text, unique) — human-readable order number (e.g. LM-2026-01000)
   - `status` (text) — pending_payment | paid | preparing | ready_for_pickup | shipping | delivered | cancelled
   - `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`
   - `fulfillment_type` (text) — delivery | pickup
   - Shipping address fields: `ship_address1`, `ship_address2`, `ship_city`, `ship_province`, `ship_postal_code`, `ship_country`
   - `customer_note`
   - Money fields: `subtotal`, `shipping_total`, `tps`, `tvq`, `total` (all numeric(10,2))
   - `currency` (text, default CAD)
   - `payment_provider` (text, default square)
   - `square_payment_id` (text)
   - `payment_status` (text, default pending)
   - `cart_token` (text)
   - Timestamps: `created_at`, `updated_at`, `paid_at`

2. `order_items`
   - `id` (uuid, PK)
   - `order_id` (uuid, FK → orders, cascade delete)
   - `product_id` (text), `sku`, `name`, `brand`, `image_url`, `color`, `size`
   - `unit_price`, `quantity`, `line_total` (numeric)

3. `order_status_history`
   - `id` (uuid, PK)
   - `order_id` (uuid, FK → orders, cascade delete)
   - `status` (text), `note` (text), `email_sent` (boolean)
   - `created_at`

4. `abandoned_carts`
   - `id` (uuid, PK)
   - `cart_token` (text, unique)
   - `email`, `first_name`, `last_name`, `phone`
   - `items` (jsonb array), `items_count`, `subtotal`
   - `status` (text) — active | converted
   - `converted_order_id` (uuid, FK → orders)
   - `reached_checkout` (boolean)
   - `user_agent` (text)
   - `created_at`, `last_seen_at`

5. `newsletter_subscribers`
   - `id` (uuid, PK)
   - `email` (text, unique)
   - `source` (text, default footer)
   - `created_at`

6. Sequence + function
   - `order_number_seq` (start 1000)
   - `next_order_number()` — generates "LM-YYYY-NNNNN" from the sequence

## Security (RLS)
- `orders`, `order_items`, `order_status_history`, `abandoned_carts`: RLS enabled,
  ALL operations restricted to `authenticated` only. No `anon` policies — these tables
  are written exclusively by Edge Functions using the `service_role` key.
- `newsletter_subscribers`: `INSERT` allowed for `anon` (public signup form),
  `SELECT` restricted to `authenticated` (admin only).

## Important Notes
1. No existing tables are modified.
2. Newsletter INSERT is the only public write path; everything else requires auth.
3. The `next_order_number()` function is callable by Edge Functions with the service role.
*/

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment',
  customer_first_name text NOT NULL,
  customer_last_name  text NOT NULL,
  customer_email      text NOT NULL,
  customer_phone      text,
  fulfillment_type text NOT NULL DEFAULT 'delivery',
  ship_address1 text, ship_address2 text, ship_city text,
  ship_province text DEFAULT 'QC', ship_postal_code text, ship_country text DEFAULT 'CA',
  customer_note text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_total numeric(10,2) NOT NULL DEFAULT 0,
  tps numeric(10,2) NOT NULL DEFAULT 0,
  tvq numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  payment_provider text DEFAULT 'square',
  square_payment_id text,
  payment_status text DEFAULT 'pending',
  cart_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_orders" ON orders;
CREATE POLICY "authenticated_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_orders" ON orders;
CREATE POLICY "authenticated_insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_orders" ON orders;
CREATE POLICY "authenticated_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_orders" ON orders;
CREATE POLICY "authenticated_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  sku text,
  name text NOT NULL,
  brand text,
  image_url text,
  color text,
  size text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(10,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_order_items" ON order_items;
CREATE POLICY "authenticated_select_order_items" ON order_items FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_order_items" ON order_items;
CREATE POLICY "authenticated_insert_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_order_items" ON order_items;
CREATE POLICY "authenticated_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_order_items" ON order_items;
CREATE POLICY "authenticated_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);

-- Order status history
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_order_status_history" ON order_status_history;
CREATE POLICY "authenticated_select_order_status_history" ON order_status_history FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_order_status_history" ON order_status_history;
CREATE POLICY "authenticated_insert_order_status_history" ON order_status_history FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_order_status_history" ON order_status_history;
CREATE POLICY "authenticated_update_order_status_history" ON order_status_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_order_status_history" ON order_status_history;
CREATE POLICY "authenticated_delete_order_status_history" ON order_status_history FOR DELETE
  TO authenticated USING (true);

-- Abandoned carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_token text UNIQUE NOT NULL,
  email text, first_name text, last_name text, phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  items_count integer DEFAULT 0,
  subtotal numeric(10,2) DEFAULT 0,
  status text DEFAULT 'active',
  converted_order_id uuid REFERENCES orders(id),
  reached_checkout boolean DEFAULT false,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_last_seen ON abandoned_carts(last_seen_at DESC);
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_abandoned_carts" ON abandoned_carts;
CREATE POLICY "authenticated_select_abandoned_carts" ON abandoned_carts FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_abandoned_carts" ON abandoned_carts;
CREATE POLICY "authenticated_insert_abandoned_carts" ON abandoned_carts FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_abandoned_carts" ON abandoned_carts;
CREATE POLICY "authenticated_update_abandoned_carts" ON abandoned_carts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_abandoned_carts" ON abandoned_carts;
CREATE POLICY "authenticated_delete_abandoned_carts" ON abandoned_carts FOR DELETE
  TO authenticated USING (true);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'footer',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_newsletter" ON newsletter_subscribers;
CREATE POLICY "authenticated_select_newsletter" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (true);

-- Order number sequence + function
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;
CREATE OR REPLACE FUNCTION next_order_number() RETURNS text
LANGUAGE sql AS $$ SELECT 'LM-' || to_char(now(),'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0') $$;
