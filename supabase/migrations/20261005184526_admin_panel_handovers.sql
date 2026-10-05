/*
# Admin Panel — Handovers table (dependency for stock_entries)

Creates handovers table first, then stock_entries can reference it.
*/

CREATE TABLE IF NOT EXISTS handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL DEFAULT '',
  total_weight_kg numeric(10,2) NOT NULL DEFAULT 0,
  total_items integer NOT NULL DEFAULT 0,
  total_value numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched','received','settled')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handovers_select_admin" ON handovers;
CREATE POLICY "handovers_select_admin"
ON handovers FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "handovers_insert_admin" ON handovers;
CREATE POLICY "handovers_insert_admin"
ON handovers FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "handovers_update_admin" ON handovers;
CREATE POLICY "handovers_update_admin"
ON handovers FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "handovers_delete_admin" ON handovers;
CREATE POLICY "handovers_delete_admin"
ON handovers FOR DELETE
TO authenticated
USING (is_admin());