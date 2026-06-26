-- ═══════════════════════════════════════════════════════════
--  AURUM — Add Payment & Address columns to orders
--  Run this in Supabase SQL Editor if you already ran the original schema
-- ═══════════════════════════════════════════════════════════

-- Add payment columns to orders (safe — uses IF NOT EXISTS logic)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_id') THEN
    ALTER TABLE public.orders ADD COLUMN payment_id     TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'razorpay';
  END IF;
END $$;

-- The address column already exists as JSONB — but verify:
-- address JSONB stores: { full_name, phone, email, line1, line2, city, state, pincode, country }

-- Useful view for owner dashboard (orders with customer + address)
CREATE OR REPLACE VIEW public.orders_detailed AS
SELECT
  o.id,
  o.status,
  o.subtotal,
  o.tax,
  o.total,
  o.payment_id,
  o.payment_method,
  o.created_at,
  o.address->>'full_name' AS customer_name,
  o.address->>'phone'     AS customer_phone,
  o.address->>'email'     AS customer_email,
  o.address->>'line1'     AS addr_line1,
  o.address->>'line2'     AS addr_line2,
  o.address->>'city'      AS addr_city,
  o.address->>'state'     AS addr_state,
  o.address->>'pincode'   AS addr_pincode,
  o.address->>'country'   AS addr_country,
  p.full_name             AS profile_name,
  p.email                 AS profile_email
FROM public.orders o
LEFT JOIN public.profiles p ON p.id = o.user_id;

-- Grant access to authenticated users (owners can see all via RLS)
GRANT SELECT ON public.orders_detailed TO authenticated;
