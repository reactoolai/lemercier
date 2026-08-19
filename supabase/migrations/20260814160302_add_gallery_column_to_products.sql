/*
# Add gallery column to products table
# Stores additional product images (beyond the main img column).
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
