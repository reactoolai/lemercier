/*
# Add desc column to products and color_name to product_variants

1. Modified Tables
- products: add `desc` text column (nullable) for product descriptions
- product_variants: add `color_name` text column (nullable) for human-readable color names like "Noir", "Bleu marine"
2. Notes
- The `desc` column was referenced in the app code but missing from the schema, causing "Could not find the 'desc' column" errors.
- The `color_name` column allows assigning named colors to variants instead of only hex codes.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS "desc" text DEFAULT NULL;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_name text DEFAULT NULL;
