/*
# Orders, Order Items, Companies — Checkout & Approval Flow

## Overview
Creates the orders/order_items/companies tables needed for the full checkout
and approval workflow. Replaces the older pickups approach with a cleaner
order-based flow that supports the approval chain:
submitted → admin_approved → waiting_company_approval → company_approved / rejected → collected.

## Tables Created
1. **companies** — recycling partner companies (4 dummy rows seeded)
2. **orders** — user pickup orders with address, phone, slot, status, company assignment
3. **order_items** — individual items within an order (category, name, image_url, user_id, order_id)

## Storage
- Creates `item-photos` storage bucket (public) if it does not exist.

## Security
- RLS on all tables
- orders: users see their own; admins see all
- order_items: users see their own (via order ownership); admins see all
- companies: public read (anon + authenticated), admin write
*/

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_public" ON companies;
CREATE POLICY "companies_select_public"
ON companies FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "companies_insert_admin" ON companies;
CREATE POLICY "companies_insert_admin"
ON companies FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "companies_update_admin" ON companies;
CREATE POLICY "companies_update_admin"
ON companies FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "companies_delete_admin" ON companies;
CREATE POLICY "companies_delete_admin"
ON companies FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','admin_approved','waiting_company_approval','company_approved','rejected','collected')),
  pickup_address text NOT NULL DEFAULT '',
  pickup_phone text NOT NULL DEFAULT '',
  pickup_date date,
  pickup_slot text NOT NULL DEFAULT '',
  city text DEFAULT '',
  pincode text DEFAULT '',
  total_items integer NOT NULL DEFAULT 0,
  estimated_value_min numeric(10,2) NOT NULL DEFAULT 0,
  estimated_value_max numeric(10,2) NOT NULL DEFAULT 0,
  has_special_request boolean NOT NULL DEFAULT false,
  has_hazardous boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  rejection_reason text DEFAULT '',
  points_awarded integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
ON orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON orders;
CREATE POLICY "orders_update_own_or_admin"
ON orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "orders_delete_own_or_admin" ON orders;
CREATE POLICY "orders_delete_own_or_admin"
ON orders FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  image_url text DEFAULT NULL,
  item_type text NOT NULL DEFAULT 'accepted' CHECK (item_type IN ('accepted','special_request','not_accepted')),
  quantity integer NOT NULL DEFAULT 1,
  grade text DEFAULT 'A',
  estimated_value_min numeric(10,2) NOT NULL DEFAULT 0,
  estimated_value_max numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON order_items;
CREATE POLICY "order_items_select_own_or_admin"
ON order_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "order_items_update_own_or_admin" ON order_items;
CREATE POLICY "order_items_update_own_or_admin"
ON order_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "order_items_delete_own_or_admin" ON order_items;
CREATE POLICY "order_items_delete_own_or_admin"
ON order_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);

-- ============================================================
-- SEED: COMPANIES
-- ============================================================
INSERT INTO companies (name, area, status) VALUES
  ('GreenLoop Recyclers', 'Hadapsar, Pune', 'active'),
  ('EcoCycle Pune', 'Kothrud, Pune', 'active'),
  ('ReNew E-Waste', 'Kharadi, Pune', 'active'),
  ('CleanTech Recovery', 'Baner, Pune', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: DUMMY ORDERS (8 orders with different statuses)
-- Uses the first real user found; if none, uses a placeholder UUID.
-- ============================================================
DO $$
DECLARE
  first_user uuid;
  o1 uuid; o2 uuid; o3 uuid; o4 uuid; o5 uuid; o6 uuid; o7 uuid; o8 uuid;
  c1 uuid; c2 uuid;
BEGIN
  SELECT id INTO first_user FROM profiles LIMIT 1;
  IF first_user IS NULL THEN
    -- no users yet; skip seeding
    RETURN;
  END IF;

  SELECT id INTO c1 FROM companies LIMIT 1;
  SELECT id INTO c2 FROM companies OFFSET 1 LIMIT 1;

  -- Order 1: submitted
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous)
  VALUES (first_user, 'submitted', '12 MG Road, Camp', '9876543210', '2026-10-10', '10:00-12:00', 'Pune', '411001', 5, 350, 700, false, false)
  RETURNING id INTO o1;

  -- Order 2: admin_approved
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous)
  VALUES (first_user, 'admin_approved', '45 Kothrud Road', '9876543211', '2026-10-11', '14:00-16:00', 'Pune', '411038', 3, 200, 400, false, false)
  RETURNING id INTO o2;

  -- Order 3: waiting_company_approval (special request)
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous, company_id)
  VALUES (first_user, 'waiting_company_approval', '78 Baner Road', '9876543212', '2026-10-12', '09:00-11:00', 'Pune', '411045', 1, 0, 0, true, false, c1)
  RETURNING id INTO o3;

  -- Order 4: company_approved
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous, company_id)
  VALUES (first_user, 'company_approved', '23 Wakad Road', '9876543213', '2026-10-13', '15:00-17:00', 'Pune', '411057', 2, 500, 1000, true, false, c1)
  RETURNING id INTO o4;

  -- Order 5: rejected
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous, rejection_reason)
  VALUES (first_user, 'rejected', '90 Hadapsar Road', '9876543214', '2026-10-09', '10:00-12:00', 'Pune', '411028', 1, 0, 0, true, false, 'Partner company does not accept this item type in your area.')
  RETURNING id INTO o5;

  -- Order 6: collected
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous, company_id, points_awarded)
  VALUES (first_user, 'collected', '67 Shivajinagar', '9876543215', '2026-10-08', '12:00-14:00', 'Pune', '411005', 8, 400, 800, false, false, c2, 50)
  RETURNING id INTO o6;

  -- Order 7: submitted (with hazardous)
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous)
  VALUES (first_user, 'submitted', '34 Kharadi Road', '9876543216', '2026-10-14', '11:00-13:00', 'Pune', '411014', 6, 300, 600, false, true)
  RETURNING id INTO o7;

  -- Order 8: admin_approved
  INSERT INTO orders (user_id, status, pickup_address, pickup_phone, pickup_date, pickup_slot, city, pincode, total_items, estimated_value_min, estimated_value_max, has_special_request, has_hazardous)
  VALUES (first_user, 'admin_approved', '56 Aundh Road', '9876543217', '2026-10-15', '16:00-18:00', 'Pune', '411007', 4, 250, 500, false, false)
  RETURNING id INTO o8;

  -- Seed items for each order
  INSERT INTO order_items (order_id, user_id, category, name, item_type, quantity) VALUES
    (o1, first_user, 'Mobile phones', 'Mobile phones, smartphones and old keypad phones', 'accepted', 2),
    (o1, first_user, 'Chargers and adapters', 'Chargers and adapters', 'accepted', 3),
    (o2, first_user, 'Cables and wires', 'Cables and wires (USB, HDMI, power)', 'accepted', 3),
    (o3, first_user, 'Large appliances', 'Refrigerator (large appliance)', 'special_request', 1),
    (o4, first_user, 'Large appliances', 'Washing machine (large appliance)', 'special_request', 1),
    (o4, first_user, 'CRT TVs', 'CRT TV and monitor', 'special_request', 1),
    (o5, first_user, 'Medical equipment', 'Medical equipment (radioactive)', 'not_accepted', 1),
    (o6, first_user, 'Mixed small e-waste', 'Keyboards and mice', 'accepted', 4),
    (o6, first_user, 'Cables and wires', 'Cables and wires (USB, HDMI, power)', 'accepted', 4),
    (o7, first_user, 'Power banks and batteries', 'Power banks', 'accepted', 3),
    (o7, first_user, 'Mobile phones', 'Mobile phones, smartphones and old keypad phones', 'accepted', 3),
    (o8, first_user, 'Laptops and tablets', 'Laptops and tablets', 'accepted', 2),
    (o8, first_user, 'Chargers and adapters', 'Chargers and adapters', 'accepted', 2);

END $$;

-- ============================================================
-- UPDATE SETTINGS: accepted_list_note
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('accepted_list_note', 'Final approval is given by our partner company.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();