/*
# Update products RLS for admin access

1. Security changes
- SELECT stays open to anon + authenticated (public storefront reads products)
- INSERT/UPDATE/DELETE now restricted to authenticated only (admin only)
- This prevents anonymous visitors from modifying product data
*/

-- Drop old open policies
DROP POLICY IF EXISTS "anon_select_products" ON products;
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

-- SELECT: anyone can read (public storefront)
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: only authenticated (admin)
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

-- UPDATE: only authenticated (admin)
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- DELETE: only authenticated (admin)
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);
