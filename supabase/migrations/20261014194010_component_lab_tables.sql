/*
# Component Lab — Components, Projects, Project Components, Component Requests

## Tables Created
1. components — lab components (name, category, quantity, status, is_demo)
2. projects — mini projects (name, description, tools_required)
3. project_components — components needed per project (component_name, required_quantity, note)
4. component_requests — student requests for components (user_id, component_id, quantity, purpose, status)

## Security
- components: all authenticated can read; admin can write
- projects: all authenticated can read; admin can write
- project_components: all authenticated can read; admin can write
- component_requests: students create & read their own; admin reads all & updates status
*/

-- ============================================================
-- COMPONENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Under Testing','Not Available')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "components_select_authenticated" ON components;
CREATE POLICY "components_select_authenticated"
ON components FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "components_insert_admin" ON components;
CREATE POLICY "components_insert_admin"
ON components FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "components_update_admin" ON components;
CREATE POLICY "components_update_admin"
ON components FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "components_delete_admin" ON components;
CREATE POLICY "components_delete_admin"
ON components FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  tools_required text DEFAULT '',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
CREATE POLICY "projects_select_authenticated"
ON projects FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
CREATE POLICY "projects_insert_admin"
ON projects FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "projects_update_admin" ON projects;
CREATE POLICY "projects_update_admin"
ON projects FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
CREATE POLICY "projects_delete_admin"
ON projects FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- PROJECT COMPONENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_name text NOT NULL,
  required_quantity integer,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_components_select_authenticated" ON project_components;
CREATE POLICY "project_components_select_authenticated"
ON project_components FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "project_components_insert_admin" ON project_components;
CREATE POLICY "project_components_insert_admin"
ON project_components FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "project_components_update_admin" ON project_components;
CREATE POLICY "project_components_update_admin"
ON project_components FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "project_components_delete_admin" ON project_components;
CREATE POLICY "project_components_delete_admin"
ON project_components FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- COMPONENT REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS component_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  purpose text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE component_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "component_requests_select_own_or_admin" ON component_requests;
CREATE POLICY "component_requests_select_own_or_admin"
ON component_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "component_requests_insert_own" ON component_requests;
CREATE POLICY "component_requests_insert_own"
ON component_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "component_requests_update_admin" ON component_requests;
CREATE POLICY "component_requests_update_admin"
ON component_requests FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_components_project_id ON project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_component_requests_user_id ON component_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_component_requests_component_id ON component_requests(component_id);

-- ============================================================
-- SEED: DEMO COMPONENTS
-- ============================================================
INSERT INTO components (name, category, quantity, status, is_demo) VALUES
  ('555 Timer IC', 'IC', 5, 'Available', true),
  ('LED', 'Optoelectronics', 10, 'Available', true),
  ('330 ohm resistor', 'Resistor', 6, 'Available', true),
  ('100 uF capacitor', 'Capacitor', 4, 'Available', true),
  ('Breadboard', 'Prototyping', 3, 'Available', true),
  ('100 kOhm resistor', 'Resistor', 2, 'Available', true),
  ('47 kOhm resistor', 'Resistor', 1, 'Available', true),
  ('390 ohm resistor', 'Resistor', 4, 'Available', true),
  ('9V battery with holder', 'Power Supply', 2, 'Available', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: DEMO PROJECTS + PROJECT COMPONENTS
-- ============================================================
DO $$
DECLARE
  p1 uuid; p2 uuid; p3 uuid;
BEGIN
  -- Project A: Traffic Light Circuit
  INSERT INTO projects (name, description, tools_required, is_demo)
  VALUES ('Traffic Light Circuit', 'A classic 555-timer-based traffic light circuit that cycles through red, yellow, and green LEDs.', '', true)
  RETURNING id INTO p1;

  INSERT INTO project_components (project_id, component_name, required_quantity, note) VALUES
    (p1, '555 Timer IC', 2, ''),
    (p1, '100 uF capacitor', 2, ''),
    (p1, '100 kOhm resistor', 1, ''),
    (p1, '47 kOhm resistor', 1, ''),
    (p1, '390 ohm resistor', 2, ''),
    (p1, '330 ohm resistor', 1, ''),
    (p1, 'Breadboard', 1, ''),
    (p1, 'Connecting wires', NULL, '');

  -- Project B: Touch Sensor Circuit
  INSERT INTO projects (name, description, tools_required, is_demo)
  VALUES ('Touch Sensor Circuit', 'A touch-sensitive switch circuit using a 555 timer. Specification to be confirmed.', '', true)
  RETURNING id INTO p2;

  INSERT INTO project_components (project_id, component_name, required_quantity, note) VALUES
    (p2, '555 Timer IC', 1, ''),
    (p2, 'LED', 2, ''),
    (p2, '4-pin touch plate/sensor connection', 1, 'Specification to be confirmed'),
    (p2, '330 ohm resistor', 1, ''),
    (p2, '9V battery with holder', 1, ''),
    (p2, 'Breadboard', 1, ''),
    (p2, 'Connecting wires', NULL, '');

  -- Project C: Automatic Street Light Science Project
  INSERT INTO projects (name, description, tools_required, is_demo)
  VALUES ('Automatic Street Light Science Project', 'An automatic street light that turns on at night using an IR sensor. A great school science project.', 'Glue', true)
  RETURNING id INTO p3;

  INSERT INTO project_components (project_id, component_name, required_quantity, note) VALUES
    (p3, 'Buzzer', NULL, ''),
    (p3, 'Switch', NULL, ''),
    (p3, 'LED light', NULL, ''),
    (p3, 'IR sensor', NULL, ''),
    (p3, 'Connecting wire', NULL, ''),
    (p3, 'Batteries', NULL, '');
END $$;
