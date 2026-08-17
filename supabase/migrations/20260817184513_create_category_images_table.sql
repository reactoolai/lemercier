/*
# Create category_images table

Stores a photo for each product category, managed by admin.
*/

CREATE TABLE IF NOT EXISTS category_images (
  category text PRIMARY KEY,
  img text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE category_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read category images (public storefront)
CREATE POLICY "read_category_images" ON category_images
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated (admin) can insert/update
CREATE POLICY "insert_category_images" ON category_images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_category_images" ON category_images
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_category_images" ON category_images
  FOR DELETE TO authenticated USING (true);
