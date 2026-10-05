/*
# Admin Panel — Pickups, Pickup Items, Stock Entries

Creates operational tables for the admin panel.
*/

-- ============================================================
-- PICKUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','scheduled','collected','completed','cancelled')),
  scheduled_date date,
  time_slot text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  pincode text DEFAULT '',
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  total_items integer NOT NULL DEFAULT 0,
  estimated_value_min numeric(10,2) NOT NULL DEFAULT 0,
  estimated_value_max numeric(10,2) NOT NULL DEFAULT 0,
  has_hazardous boolean NOT NULL DEFAULT false,
  notes text DEFAULT '',
  collected_weight_kg numeric(10,2) DEFAULT NULL,
  final_value numeric(10,2) DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickups_select_own_or_admin" ON pickups;
CREATE POLICY "pickups_select_own_or_admin"
ON pickups FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "pickups_insert_own" ON pickups;
CREATE POLICY "pickups_insert_own"
ON pickups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pickups_update_own_or_admin" ON pickups;
CREATE POLICY "pickups_update_own_or_admin"
ON pickups FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "pickups_delete_own_or_admin" ON pickups;
CREATE POLICY "pickups_delete_own_or_admin"
ON pickups FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- PICKUP ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id uuid NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  grade text NOT NULL DEFAULT 'A' CHECK (grade IN ('A','B','C','Hazardous')),
  hazard_level text NOT NULL DEFAULT 'none' CHECK (hazard_level IN ('none','hazardous')),
  has_battery boolean NOT NULL DEFAULT false,
  estimated_value_min numeric(10,2) NOT NULL DEFAULT 0,
  estimated_value_max numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'per_kg' CHECK (unit IN ('per_kg','per_item')),
  photo_url text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pickup_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickup_items_select_own_or_admin" ON pickup_items;
CREATE POLICY "pickup_items_select_own_or_admin"
ON pickup_items FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM pickups WHERE pickups.id = pickup_items.pickup_id AND (pickups.user_id = auth.uid() OR is_admin()))
);

DROP POLICY IF EXISTS "pickup_items_insert_own_or_admin" ON pickup_items;
CREATE POLICY "pickup_items_insert_own_or_admin"
ON pickup_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM pickups WHERE pickups.id = pickup_id AND (pickups.user_id = auth.uid() OR is_admin()))
);

DROP POLICY IF EXISTS "pickup_items_update_admin" ON pickup_items;
CREATE POLICY "pickup_items_update_admin"
ON pickup_items FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "pickup_items_delete_own_or_admin" ON pickup_items;
CREATE POLICY "pickup_items_delete_own_or_admin"
ON pickup_items FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM pickups WHERE pickups.id = pickup_items.pickup_id AND (pickups.user_id = auth.uid() OR is_admin()))
);

-- ============================================================
-- STOCK ENTRIES (collected inventory)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'pickup' CHECK (source IN ('pickup','manual')),
  pickup_id uuid REFERENCES pickups(id) ON DELETE SET NULL,
  weight_kg numeric(10,2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'A' CHECK (grade IN ('A','B','C','Hazardous')),
  status text NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','handed_over')),
  handover_id uuid REFERENCES handovers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_select_admin" ON stock_entries;
CREATE POLICY "stock_select_admin"
ON stock_entries FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "stock_insert_admin" ON stock_entries;
CREATE POLICY "stock_insert_admin"
ON stock_entries FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "stock_update_admin" ON stock_entries;
CREATE POLICY "stock_update_admin"
ON stock_entries FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "stock_delete_admin" ON stock_entries;
CREATE POLICY "stock_delete_admin"
ON stock_entries FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pickups_user_id ON pickups(user_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup_id ON pickup_items(pickup_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_category ON stock_entries(category);
CREATE INDEX IF NOT EXISTS idx_stock_entries_status ON stock_entries(status);