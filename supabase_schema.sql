-- ═══════════════════════════════════════════════════════════
--  AURUM Luxury Boutique — Supabase Database Schema
--  Run this entire file in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── ENABLE UUID EXTENSION ───────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES TABLE ──────────────────────────────────────
-- Extends Supabase auth.users with role & metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  role        TEXT DEFAULT 'customer' CHECK (role IN ('customer','owner')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand       TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  category    TEXT NOT NULL CHECK (category IN ('Jewellery','Watches','Accessories','Fragrance')),
  emoji       TEXT DEFAULT '💎',
  stock       INTEGER DEFAULT 0 CHECK (stock >= 0),
  tags        TEXT[] DEFAULT '{}',
  badge       TEXT,
  rating      NUMERIC(2,1) DEFAULT 0,
  reviews     INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  subtotal     NUMERIC(12,2) NOT NULL,
  tax          NUMERIC(12,2) DEFAULT 0,
  total        NUMERIC(12,2) NOT NULL,
  address      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  price       NUMERIC(12,2) NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WISHLIST TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── UPDATED_AT TRIGGER FUNCTION ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at   BEFORE UPDATE ON public.products   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at     BEFORE UPDATE ON public.orders     FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_profiles_updated_at   BEFORE UPDATE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist    ENABLE ROW LEVEL SECURITY;

-- Profiles: users see & edit only their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products: anyone can read active products
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (is_active = TRUE);
-- Only owners can insert/update/delete
CREATE POLICY "products_insert_owner" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "products_update_owner" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "products_delete_owner" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Orders: users see only their own orders; owners see all
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "orders_insert_auth" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_owner" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Order items follow their order
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')))
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);

-- Wishlist: users manage their own
CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ─── SEED DATA ───────────────────────────────────────────
-- Create owner user via Supabase Dashboard Auth, then run:
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'owner@aurum.com';

INSERT INTO public.products (brand, name, description, price, category, emoji, stock, tags, badge, rating, reviews) VALUES
('Maison Aurum',      'Eternal Rose Diamond Ring',       'A masterpiece of 18k rose gold adorned with 0.8ct VS1 diamonds. Each stone hand-selected for exceptional brilliance and clarity.', 285000,  'Jewellery',   '💍', 5,  ARRAY['bestseller','new arrival'], 'Bestseller', 4.9, 128),
('Aurum Horlogerie',  'Grand Perpetual Tourbillon',      'An extraordinary achievement in watchmaking. The self-winding tourbillon movement offers 72-hour power reserve with exhibition caseback.', 1850000, 'Watches',     '⌚', 2,  ARRAY['limited edition'],          'Limited',    5.0, 24),
('Casa Aurum',        'Nuit d''Or Parfum',               'An intoxicating blend of rare Damascene rose, aged oud from the forests of Assam, and white amber. Lasts 18+ hours on skin.', 45000,   'Fragrance',   '🌹', 20, ARRAY['new arrival'],              NULL,         4.8, 89),
('Aurum Maroquinerie','Regent Tote Éclat',               'Hand-stitched by master artisans in Florence from butter-soft full-grain calfskin. Gold-plated hardware, suede interior.', 125000,  'Accessories', '👜', 8,  ARRAY['new arrival'],              'New',        4.7, 56),
('Maison Aurum',      'Celestine Sapphire Necklace',     'A single 3.5ct Kashmir sapphire, unheated and certified by GRS, suspended on a hand-forged 18k white gold chain with pavé bail.', 520000,  'Jewellery',   '💙', 1,  ARRAY['rare','limited edition'],   'Rare',       5.0, 12),
('Aurum Horlogerie',  'Calendrier Perpétuel Noir',       'Matte black PVD titanium case with perpetual calendar and moon-phase display. Swiss automatic movement, 300m water resistance.', 395000,  'Watches',     '🖤', 4,  ARRAY['bestseller'],               NULL,         4.9, 67),
('Casa Aurum',        'Amber Soleil Extrait',            'A solar accord of Sicilian bergamot, orris butter, and aged Haitian vetiver, bottled in hand-blown Venetian glass. 100ml.', 38000,   'Fragrance',   '🧡', 15, ARRAY['new arrival'],              NULL,         4.6, 43),
('Aurum Maroquinerie','Windsor Briefcase Obsidian',      'Corporate luxury redefined. Full-grain obsidian leather, hand-painted edges, and 14k gold-plated solid brass fittings. Fits 15" laptop.', 185000,  'Accessories', '💼', 6,  ARRAY['bestseller'],               NULL,         4.8, 91),
('Maison Aurum',      'Riviera Emerald Bracelet',        'Colombian emeralds totalling 4.2ct set in a flexible 18k yellow gold bracelet. Accompanied by Swiss gemological certificate.', 780000,  'Jewellery',   '💚', 3,  ARRAY['rare'],                     'Rare',       4.9, 18),
('Aurum Horlogerie',  'Skeleton Moonphase Rose',         'Skeletonised movement visible through sapphire crystals front and back. Rose gold case, hand-stitched alligator strap.', 620000,  'Watches',     '🌕', 3,  ARRAY['new arrival','limited edition'], 'New',    4.8, 31);
