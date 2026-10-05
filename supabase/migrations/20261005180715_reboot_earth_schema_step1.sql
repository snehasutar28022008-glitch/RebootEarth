/*
# Reboot Earth — Core Schema (Step 1)

## Overview
Creates the full database schema for the Reboot Earth e-waste collection platform,
including user profiles, roles, RLS policies, and seed data for the public-facing pages.

## Tables Created
1. **profiles** — extends auth.users with name, phone, address, role (user/admin), points, wallet
2. **rates** — per-category e-waste pricing (editable by admin)
3. **grade_factors** — grade-based value multipliers (A/B/C/Hazardous)
4. **accepted_items** — accepted / special-handling / not-accepted lists
5. **facts** — rotating "Did you know?" e-waste facts
6. **faqs** — FAQ entries for the public FAQ page
7. **badges** — achievement badges
8. **zones** — service areas for pickup
9. **settings** — key-value app settings (partner text, min quantity, etc.)
10. **activity_logs** — audit trail of admin actions

## Security
- RLS enabled on every table
- Profiles: users read/update only their own; admins read/update all
- Public-readable tables (rates, accepted_items, facts, faqs, badges, zones, settings): readable by anon + authenticated
- Admin-only write: rates, grade_factors, accepted_items, zones, settings, activity_logs
- An admin email trigger auto-assigns the "admin" role to snehasutar2802@gmail.com on signup/login
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT '',
  address text DEFAULT '',
  pincode text DEFAULT '',
  latitude double precision DEFAULT NULL,
  longitude double precision DEFAULT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points integer NOT NULL DEFAULT 0,
  wallet_balance numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Profiles: users read own, admins read all
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());

-- Profiles: users update own (but cannot change role)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Profiles: admins update all
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Profiles: insert on signup (trigger handles this, but allow direct insert for admin)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================================
-- RATES
-- ============================================================
CREATE TABLE IF NOT EXISTS rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  grade text DEFAULT 'A',
  rate numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'per_kg' CHECK (unit IN ('per_kg', 'per_item')),
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rates_select_public" ON rates;
CREATE POLICY "rates_select_public"
ON rates FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "rates_insert_admin" ON rates;
CREATE POLICY "rates_insert_admin"
ON rates FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "rates_update_admin" ON rates;
CREATE POLICY "rates_update_admin"
ON rates FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "rates_delete_admin" ON rates;
CREATE POLICY "rates_delete_admin"
ON rates FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- GRADE FACTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS grade_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL UNIQUE CHECK (grade IN ('A', 'B', 'C', 'Hazardous')),
  label text NOT NULL,
  factor numeric(3,2) NOT NULL DEFAULT 1.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grade_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grade_factors_select_public" ON grade_factors;
CREATE POLICY "grade_factors_select_public"
ON grade_factors FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "grade_factors_insert_admin" ON grade_factors;
CREATE POLICY "grade_factors_insert_admin"
ON grade_factors FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "grade_factors_update_admin" ON grade_factors;
CREATE POLICY "grade_factors_update_admin"
ON grade_factors FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "grade_factors_delete_admin" ON grade_factors;
CREATE POLICY "grade_factors_delete_admin"
ON grade_factors FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- ACCEPTED ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS accepted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('accepted', 'special', 'not_accepted')),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accepted_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accepted_items_select_public" ON accepted_items;
CREATE POLICY "accepted_items_select_public"
ON accepted_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "accepted_items_insert_admin" ON accepted_items;
CREATE POLICY "accepted_items_insert_admin"
ON accepted_items FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "accepted_items_update_admin" ON accepted_items;
CREATE POLICY "accepted_items_update_admin"
ON accepted_items FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "accepted_items_delete_admin" ON accepted_items;
CREATE POLICY "accepted_items_delete_admin"
ON accepted_items FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- FACTS (Did you know?)
-- ============================================================
CREATE TABLE IF NOT EXISTS facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facts_select_public" ON facts;
CREATE POLICY "facts_select_public"
ON facts FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "facts_insert_admin" ON facts;
CREATE POLICY "facts_insert_admin"
ON facts FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "facts_update_admin" ON facts;
CREATE POLICY "facts_update_admin"
ON facts FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "facts_delete_admin" ON facts;
CREATE POLICY "facts_delete_admin"
ON facts FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- FAQS
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_select_public" ON faqs;
CREATE POLICY "faqs_select_public"
ON faqs FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "faqs_insert_admin" ON faqs;
CREATE POLICY "faqs_insert_admin"
ON faqs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "faqs_update_admin" ON faqs;
CREATE POLICY "faqs_update_admin"
ON faqs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "faqs_delete_admin" ON faqs;
CREATE POLICY "faqs_delete_admin"
ON faqs FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'Award',
  threshold_kg numeric(8,2) DEFAULT 0,
  threshold_items integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select_public" ON badges;
CREATE POLICY "badges_select_public"
ON badges FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "badges_insert_admin" ON badges;
CREATE POLICY "badges_insert_admin"
ON badges FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "badges_update_admin" ON badges;
CREATE POLICY "badges_update_admin"
ON badges FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "badges_delete_admin" ON badges;
CREATE POLICY "badges_delete_admin"
ON badges FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- ZONES (service areas)
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zones_select_public" ON zones;
CREATE POLICY "zones_select_public"
ON zones FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "zones_insert_admin" ON zones;
CREATE POLICY "zones_insert_admin"
ON zones FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "zones_update_admin" ON zones;
CREATE POLICY "zones_update_admin"
ON zones FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "zones_delete_admin" ON zones;
CREATE POLICY "zones_delete_admin"
ON zones FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- SETTINGS (key-value)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public"
ON settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "settings_upsert_admin" ON settings;
CREATE POLICY "settings_upsert_admin"
ON settings FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
ON settings FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text DEFAULT '',
  action text NOT NULL,
  details text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
CREATE POLICY "activity_logs_select_admin"
ON activity_logs FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "activity_logs_insert_admin" ON activity_logs;
CREATE POLICY "activity_logs_insert_admin"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- ============================================================
-- ADMIN ROLE TRIGGER
-- Auto-assign "admin" role to snehasutar2802@gmail.com on profile creation
-- ============================================================
CREATE OR REPLACE FUNCTION handle_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'snehasutar2802@gmail.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_admin_role_on_profile_insert ON profiles;
CREATE TRIGGER set_admin_role_on_profile_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_admin_role();

-- Also handle role on update (in case email matches on update)
DROP TRIGGER IF EXISTS set_admin_role_on_profile_update ON profiles;
CREATE TRIGGER set_admin_role_on_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_admin_role();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA: GRADE FACTORS
-- ============================================================
INSERT INTO grade_factors (grade, label, factor) VALUES
  ('A', 'A — Working', 1.00),
  ('B', 'B — Intact, not working', 0.80),
  ('C', 'C — Damaged', 0.50),
  ('Hazardous', 'Hazardous — Swollen/leaking battery', 0.00)
ON CONFLICT (grade) DO UPDATE SET label = EXCLUDED.label, factor = EXCLUDED.factor, updated_at = now();

-- ============================================================
-- SEED DATA: RATES (SAMPLE — placeholder numbers)
-- ============================================================
INSERT INTO rates (category, grade, rate, unit) VALUES
  ('Mixed small e-waste', 'A', 25.00, 'per_kg'),
  ('Mixed small e-waste', 'B', 20.00, 'per_kg'),
  ('Mixed small e-waste', 'C', 15.00, 'per_kg'),
  ('Mobile phones', 'A', 350.00, 'per_item'),
  ('Mobile phones', 'B', 250.00, 'per_item'),
  ('Mobile phones', 'C', 150.00, 'per_item'),
  ('Chargers and adapters', 'A', 30.00, 'per_kg'),
  ('Chargers and adapters', 'B', 24.00, 'per_kg'),
  ('Chargers and adapters', 'C', 15.00, 'per_kg'),
  ('Cables and wires', 'A', 40.00, 'per_kg'),
  ('Cables and wires', 'B', 32.00, 'per_kg'),
  ('Cables and wires', 'C', 20.00, 'per_kg'),
  ('Earphones and headphones', 'A', 35.00, 'per_kg'),
  ('Earphones and headphones', 'B', 28.00, 'per_kg'),
  ('Earphones and headphones', 'C', 18.00, 'per_kg'),
  ('Power banks and batteries', 'A', 50.00, 'per_kg'),
  ('Power banks and batteries', 'B', 40.00, 'per_kg'),
  ('Power banks and batteries', 'C', 25.00, 'per_kg'),
  ('Laptops and tablets', 'A', 200.00, 'per_kg'),
  ('Laptops and tablets', 'B', 160.00, 'per_kg'),
  ('Laptops and tablets', 'C', 100.00, 'per_kg'),
  ('Circuit boards', 'A', 80.00, 'per_kg'),
  ('Circuit boards', 'B', 64.00, 'per_kg'),
  ('Circuit boards', 'C', 40.00, 'per_kg'),
  ('Drives and storage', 'A', 60.00, 'per_kg'),
  ('Drives and storage', 'B', 48.00, 'per_kg'),
  ('Drives and storage', 'C', 30.00, 'per_kg')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: ACCEPTED ITEMS
-- ============================================================
INSERT INTO accepted_items (name, type, sort_order) VALUES
  ('Mobile phones, smartphones and old keypad phones', 'accepted', 1),
  ('Chargers and adapters', 'accepted', 2),
  ('Cables and wires (USB, HDMI, power)', 'accepted', 3),
  ('Earphones and headphones', 'accepted', 4),
  ('Power banks', 'accepted', 5),
  ('Small lithium-ion batteries (mobile, laptop, camera)', 'accepted', 6),
  ('Laptops and tablets', 'accepted', 7),
  ('Keyboards and mice', 'accepted', 8),
  ('Routers and modems', 'accepted', 9),
  ('Pen drives, hard drives and memory cards', 'accepted', 10),
  ('Smartwatches and fitness bands', 'accepted', 11),
  ('Small speakers and Bluetooth devices', 'accepted', 12),
  ('Remotes', 'accepted', 13),
  ('Calculators', 'accepted', 14),
  ('Small circuit boards', 'accepted', 15),
  ('Small electronic toys', 'accepted', 16),
  ('Swollen, leaking, burnt or damaged batteries', 'special', 1),
  ('Large appliances (refrigerators, ACs, washing machines)', 'not_accepted', 1),
  ('CRT TVs and monitors', 'not_accepted', 2),
  ('Tube lights and CFL bulbs', 'not_accepted', 3),
  ('Lead-acid vehicle or inverter batteries', 'not_accepted', 4),
  ('Medical or radioactive equipment', 'not_accepted', 5),
  ('Devices with leaking chemicals or liquids', 'not_accepted', 6),
  ('General household or wet waste', 'not_accepted', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: FACTS
-- ============================================================
INSERT INTO facts (text, sort_order) VALUES
  ('The world produces over 50 million tonnes of e-waste every year — heavier than the Great Wall of China.', 1),
  ('Only 17% of global e-waste is formally collected and recycled.', 2),
  ('One million mobile phones contain about 24 kg of gold, 250 kg of silver, and 9,000 kg of copper.', 3),
  ('E-waste contains toxic substances like lead, mercury, and cadmium that can leach into soil and water.', 4),
  ('Recycling 1 million laptops saves energy equivalent to the electricity used by 3,500 homes in a year.', 5),
  ('Improper e-waste disposal releases greenhouse gases that contribute to climate change.', 6),
  ('India is the third-largest e-waste generator in the world, after China and the USA.', 7),
  ('Up to 60 elements from the periodic table can be found in e-waste, including precious and rare-earth metals.', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: FAQS
-- ============================================================
INSERT INTO faqs (question, answer, sort_order) VALUES
  ('What is e-waste?', 'E-waste (electronic waste) refers to discarded electrical or electronic devices. This includes phones, chargers, laptops, cables, batteries, and small electronic appliances that are no longer in use.', 1),
  ('How do I schedule a pickup?', 'Sign up or log in, add your e-waste items to your pickup basket, then book a pickup by selecting your address, a date, and a time slot. You will receive a notification once the admin confirms your pickup.', 2),
  ('Do I get paid for my e-waste?', 'High-value items like phones and laptops earn wallet cash. Low-value items like chargers and cables earn reward points. The final value is set by the admin at collection based on weight, grade, and current rates.', 3),
  ('What happens to my data on old phones and laptops?', 'Before handing over your device, back up your data, perform a factory reset, and remove your SIM and SD cards. Our recycling partner also ensures data destruction during processing.', 4),
  ('What if my battery is swollen or leaking?', 'Flag it as hazardous when adding the item. You will see a safety warning with handling instructions. Keep the battery away from heat, do not charge or puncture it, and store it in a non-flammable container until pickup.', 5),
  ('Which areas do you serve?', 'We currently serve select zones. You can check available zones on the booking page or contact us to find out if your area is covered.', 6),
  ('How do I get a recycling certificate?', 'Once your e-waste is handed over to our recycling partner, a recycling certificate is automatically generated. You can download it as a PDF from your dashboard.', 7),
  ('What items do you not accept?', 'We do not accept large appliances (refrigerators, ACs, washing machines), CRT TVs, tube lights, CFL bulbs, lead-acid batteries, medical equipment, or devices with leaking chemicals.', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: BADGES
-- ============================================================
INSERT INTO badges (name, description, icon, threshold_kg, threshold_items) VALUES
  ('First Recycler', 'Completed your first e-waste pickup', 'Sprout', 0, 1),
  ('5 kg Club', 'Recycled 5 kg of e-waste', 'Weight', 5, 0),
  ('10 kg Champion', 'Recycled 10 kg of e-waste', 'Trophy', 10, 0),
  ('25 kg Hero', 'Recycled 25 kg of e-waste', 'Medal', 25, 0),
  ('50 kg Earth Guardian', 'Recycled 50 kg of e-waste', 'Shield', 50, 0),
  ('Item Collector', 'Recycled 10 or more items', 'Package', 0, 10),
  ('Eco Streak', 'Completed 3 pickups in a row', 'Flame', 0, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: ZONES
-- ============================================================
INSERT INTO zones (name, city, is_active) VALUES
  ('Hadapsar', 'Pune', true),
  ('Kothrud', 'Pune', true),
  ('Kharadi', 'Pune', true),
  ('Baner', 'Pune', true),
  ('Wakad', 'Pune', true),
  ('Camp Area', 'Pune', true),
  (' Shivajinagar', 'Pune', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: SETTINGS
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('partner_text', 'Authorised recycling partner: tie-up in progress'),
  ('min_quantity', '3'),
  ('sample_rates_banner', 'Sample rates. Final rates are confirmed by our recycling partner at collection.'),
  ('accepted_list_note', 'The final list depends on our recycling partner''s rules.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
