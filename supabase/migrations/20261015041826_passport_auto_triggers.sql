-- Auto-generate passport_id and Submitted passport_event on order insert
-- This avoids race conditions and RLS issues with client-side creation

-- ============================================================
-- Function: auto-assign passport_id on insert
-- ============================================================
CREATE OR REPLACE FUNCTION assign_passport_id()
RETURNS trigger AS $$
DECLARE
  max_seq integer;
  new_seq integer;
BEGIN
  IF NEW.passport_id IS NULL THEN
    -- Extract the highest sequence number from existing passport_ids
    SELECT COALESCE(MAX(CAST(REPLACE(passport_id, 'RE-2026-', '') AS integer)), 0)
    INTO max_seq
    FROM orders
    WHERE passport_id LIKE 'RE-2026-%';

    new_seq := max_seq + 1;
    NEW.passport_id := 'RE-2026-' || lpad(new_seq::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: before insert on orders
DROP TRIGGER IF EXISTS trg_assign_passport_id ON orders;
CREATE TRIGGER trg_assign_passport_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION assign_passport_id();

-- ============================================================
-- Function: auto-create "Submitted" passport_event on insert
-- ============================================================
CREATE OR REPLACE FUNCTION create_submitted_passport_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO passport_events (request_id, stage, note, created_at)
  VALUES (NEW.id, 'Submitted', '', NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after insert on orders
DROP TRIGGER IF EXISTS trg_create_submitted_event ON orders;
CREATE TRIGGER trg_create_submitted_event
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_submitted_passport_event();
