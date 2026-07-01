-- ═══════════════════════════════════════════════════════════
--  AURUM — Fix order status constraint + tracking enhancements
--  Run this in Supabase SQL Editor (safe to re-run)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Fix status CHECK constraint to include 'paid' ────────
-- The app creates orders with status='paid' right after checkout,
-- but the original schema only allowed pending/processing/shipped/
-- delivered/cancelled — this patch adds 'paid' so checkout doesn't
-- throw a constraint violation.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('paid','pending','processing','shipped','delivered','cancelled'));

-- ─── 2. Tracking metadata columns ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='carrier') THEN
    ALTER TABLE public.orders ADD COLUMN carrier TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimated_delivery') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status_updated_at') THEN
    ALTER TABLE public.orders ADD COLUMN status_updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ─── 3. Auto-update status_updated_at whenever status changes ─
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change();

-- ─── 4. Public order lookup function (for /track-order page) ──
-- Lets a non-authenticated visitor look up ONE order by its ID +
-- the email on the shipping address, without exposing all orders.
-- SECURITY DEFINER bypasses RLS safely because it only returns
-- a single matched row, not the whole table.
CREATE OR REPLACE FUNCTION public.track_order(p_order_id UUID, p_email TEXT)
RETURNS TABLE (
  id UUID, status TEXT, subtotal NUMERIC, tax NUMERIC, total NUMERIC,
  address JSONB, payment_method TEXT, tracking_number TEXT, carrier TEXT,
  estimated_delivery DATE, status_updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.status, o.subtotal, o.tax, o.total, o.address,
         o.payment_method, o.tracking_number, o.carrier,
         o.estimated_delivery, o.status_updated_at, o.created_at
  FROM public.orders o
  WHERE o.id = p_order_id
    AND lower(o.address->>'email') = lower(p_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_order(UUID, TEXT) TO anon, authenticated;

-- ─── 5. Order items for public tracking lookup ────────────────
CREATE OR REPLACE FUNCTION public.track_order_items(p_order_id UUID, p_email TEXT)
RETURNS TABLE (product_name TEXT, price NUMERIC, quantity INTEGER, emoji TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Re-verify ownership before returning items
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id AND lower(o.address->>'email') = lower(p_email)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT oi.product_name, oi.price, oi.quantity,
         COALESCE(p.emoji, '💎') AS emoji
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_order_items(UUID, TEXT) TO anon, authenticated;

-- ─── 6. Enable realtime on orders (for live status updates) ───
-- This lets MyOrdersPage subscribe and see status changes instantly
-- without polling. Run once — safe to re-run (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
