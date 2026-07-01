-- ═══════════════════════════════════════════════════════════
--  AURUM — Add 'Clothing' as a valid product category
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Step 1: Drop the old CHECK constraint that only allowed
--         Jewellery, Watches, Accessories, Fragrance
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

-- Step 2: Add new constraint with Clothing included
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('Jewellery','Watches','Clothing','Accessories','Fragrance'));

-- Step 3: Seed some clothing products into the database
INSERT INTO public.products (brand, name, description, price, category, emoji, stock, tags, badge, rating, reviews) VALUES
('Maison Aurum',  'Duchess Cashmere Overcoat',   'Double-faced pure cashmere in midnight navy. Crafted by hand in our Florence atelier with horn buttons and silk-satin lining. A singular garment built to last generations.',          385000, 'Clothing', '🧥', 4,  ARRAY['new arrival','limited edition'], 'New',    4.9, 22),
('Aurum Couture', 'Silk Charmeuse Evening Gown',  'Pure 22-momme silk charmeuse, bias-cut and hand-finished. The fluid drape and champagne ivory tone are understated perfection for black-tie occasions.',                           295000, 'Clothing', '👗', 3,  ARRAY['limited edition'],              'Limited', 4.8, 14),
('Aurum Couture', 'Bespoke Wool Suit Noir',        'Hand-tailored in 120s super-fine English wool. Two-button silhouette, hand-sewn lapels, and full canvas construction. Includes two fittings at our boutique.',                     450000, 'Clothing', '🤵', 6,  ARRAY['bestseller'],                   NULL,     5.0, 38),
('Maison Aurum',  'Heritage Linen Shirt',           'Portuguese linen of the finest weave, stonewashed for a lived-in softness. Mother-of-pearl buttons. Available in ivory, sand, and slate blue.',                                  28000,  'Clothing', '👕', 18, ARRAY['new arrival','bestseller'],     NULL,     4.7, 61),
('Aurum Couture', 'Velvet Smoking Jacket',          'Midnight blue silk-velvet with grosgrain lapels. Peak-lapel single-button cut inspired by the great tailors of Savile Row. Fully lined in bespoke paisley silk.',                195000, 'Clothing', '🎩', 5,  ARRAY['rare'],                         'Rare',   4.9, 17),
('Maison Aurum',  'Pashmina Shawl Or & Noir',      'The finest grade-A Pashmina from Ladakh — 12 microns. Hand-woven and hand-embroidered by master artisans in Srinagar. One shawl takes six months to complete.',                 75000,  'Clothing', '🧣', 9,  ARRAY['new arrival'],                  'New',    4.9, 29);

-- Verify the new category shows up correctly
SELECT category, COUNT(*) as product_count
FROM public.products
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;
