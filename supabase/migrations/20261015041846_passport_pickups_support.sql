-- Add passport_id to pickups table and backfill
ALTER TABLE pickups ADD COLUMN IF NOT EXISTS passport_id text;

DO $$
DECLARE
  rec RECORD;
  seq integer := 1;
BEGIN
  FOR rec IN SELECT id FROM pickups WHERE passport_id IS NULL ORDER BY created_at ASC LOOP
    UPDATE pickups SET passport_id = 'RE-2026-P' || lpad(seq::text, 3, '0')
    WHERE id = rec.id;
    seq := seq + 1;
  END LOOP;
END $$;

-- Add passport_events support for pickups (request_id can reference either table)
-- Since passport_events.request_id references orders(id), we need a more flexible approach
-- for pickups. We'll add a pickup_id column to passport_events.

ALTER TABLE passport_events ADD COLUMN IF NOT EXISTS pickup_id uuid REFERENCES pickups(id) ON DELETE CASCADE;

-- Make request_id nullable since events can be for pickups OR orders
ALTER TABLE passport_events ALTER COLUMN request_id DROP NOT NULL;

-- Add CHECK: exactly one of request_id or pickup_id must be set
ALTER TABLE passport_events DROP CONSTRAINT IF EXISTS passport_events_one_parent;
ALTER TABLE passport_events ADD CONSTRAINT passport_events_one_parent
  CHECK ((request_id IS NOT NULL AND pickup_id IS NULL) OR (request_id IS NULL AND pickup_id IS NOT NULL));

-- Update RLS for pickups: user can read events for their own pickups
DROP POLICY IF EXISTS "passport_events_select_own_or_admin" ON passport_events;
CREATE POLICY "passport_events_select_own_or_admin"
ON passport_events FOR SELECT
TO authenticated
USING (
  (request_id IS NOT NULL AND auth.uid() = (SELECT user_id FROM orders WHERE id = request_id))
  OR (pickup_id IS NOT NULL AND auth.uid() = (SELECT user_id FROM pickups WHERE id = pickup_id))
  OR is_admin()
);

-- Backfill Submitted events for existing pickups
INSERT INTO passport_events (pickup_id, stage, note, created_at)
SELECT p.id, 'Submitted', '', p.created_at
FROM pickups p
WHERE NOT EXISTS (
  SELECT 1 FROM passport_events pe
  WHERE pe.pickup_id = p.id AND pe.stage = 'Submitted'
);

-- Trigger for pickups: auto-create Submitted event
CREATE OR REPLACE FUNCTION create_submitted_passport_event_pickup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO passport_events (pickup_id, stage, note, created_at)
  VALUES (NEW.id, 'Submitted', '', NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_submitted_event_pickup ON pickups;
CREATE TRIGGER trg_create_submitted_event_pickup
  AFTER INSERT ON pickups
  FOR EACH ROW
  EXECUTE FUNCTION create_submitted_passport_event_pickup();
