/*
# Restrict products write operations to authenticated users

## Context
The original migration `20260813224801_create_products_table.sql` allowed the `anon` role
to INSERT, UPDATE, and DELETE on the `products` table. This is a security vulnerability:
any unauthenticated visitor could modify or delete the entire product catalog.

## Changes
1. Drop the existing `anon_insert_products`, `anon_update_products`, and
   `anon_delete_products` policies.
2. Recreate them as `authenticated`-only policies:
   - `authenticated_insert_products` — INSERT for `TO authenticated`
   - `authenticated_update_products` — UPDATE for `TO authenticated`
   - `authenticated_delete_products` — DELETE for `TO authenticated`
3. The public SELECT policy (`anon_select_products`) remains unchanged — both
   `anon` and `authenticated` can read the catalog.

## Security
- RLS stays enabled on `products`.
- Public read access is preserved (storefront must display products to all visitors).
- Write access (insert/update/delete) is now restricted to authenticated admin users only.
- The admin dashboard uses Supabase auth, so the logged-in admin session satisfies
  the `authenticated` role requirement and continues to work normally.
*/

-- Drop the old anon write policies
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

-- Recreate as authenticated-only
CREATE POLICY "authenticated_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_products" ON products FOR DELETE
  TO authenticated USING (true);
