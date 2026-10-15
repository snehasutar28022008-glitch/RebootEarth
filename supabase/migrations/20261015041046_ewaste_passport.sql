/*
# E-Waste Passport: passport_id on orders + passport_events table

1. Add passport_id text column to orders (format RE-2026-001, ...)
2. Backfill all existing orders with sequential passport IDs
3. Create passport_events table with RLS
4. Create "Submitted" events for all existing orders (backfill)
*/

-- ============================================================
-- ADD passport_id TO orders
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS passport_id text;

-- ============================================================
-- BACKFILL passport_id for existing orders
-- Format: RE-2026-001, RE-2026-002, ... ordered by created_at
-- ============================================================
DO $$
DECLARE
  rec RECORD;
  seq integer := 1;
BEGIN
  FOR rec IN SELECT id FROM orders WHERE passport_id IS NULL ORDER BY created_at ASC LOOP
    UPDATE orders SET passport_id = 'RE-2026-' || lpad(seq::text, 3, '0')
    WHERE id = rec.id;
    seq := seq + 1;
  END LOOP;
END $$;

-- ============================================================
-- passport_events TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS passport_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('Submitted','Picked Up','Inspected','Recovery Decision','Recycled','Recovered')),
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE passport_events ENABLE ROW LEVEL SECURITY;

-- Users can read events only for their own requests
DROP POLICY IF EXISTS "passport_events_select_own_or_admin" ON passport_events;
CREATE POLICY "passport_events_select_own_or_admin"
ON passport_events FOR SELECT
TO authenticated
USING (
  auth.uid() = (SELECT user_id FROM orders WHERE id = request_id)
  OR is_admin()
);

-- Only admin can insert events
DROP POLICY IF EXISTS "passport_events_insert_admin" ON passport_events;
CREATE POLICY "passport_events_insert_admin"
ON passport_events FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admin can delete events
DROP POLICY IF EXISTS "passport_events_delete_admin" ON passport_events;
CREATE POLICY "passport_events_delete_admin"
ON passport_events FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_passport_events_request_id ON passport_events(request_id);
CREATE INDEX IF NOT EXISTS idx_passport_events_created_at ON passport_events(created_at);

-- ============================================================
-- BACKFILL: Create "Submitted" events for existing orders
-- Only for orders that don't already have a Submitted event
-- ============================================================
INSERT INTO passport_events (request_id, stage, note, created_at)
SELECT o.id, 'Submitted', '', o.created_at
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM passport_events pe
  WHERE pe.request_id = o.id AND pe.stage = 'Submitted'
);
