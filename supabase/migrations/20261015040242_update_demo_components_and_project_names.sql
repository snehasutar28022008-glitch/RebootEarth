/*
# Update demo components + fix project_components names

1. Upsert all 16 components (update qty/status if name exists, insert if not)
2. Fix project_components: "Connecting wire" → "Connecting wires"
*/

DO $$
DECLARE
  comp_record RECORD;
  comp_count integer;
BEGIN
  FOR comp_record IN VALUES
    ('Buzzer', 'Output Device', 5, 'Available'),
    ('Switch', 'Input Device', 6, 'Available'),
    ('LED light', 'Optoelectronics', 8, 'Available'),
    ('Batteries', 'Power Supply', 6, 'Available'),
    ('Connecting wires', 'Prototyping', 30, 'Available'),
    ('555 Timer IC', 'IC', 5, 'Available'),
    ('LED', 'Optoelectronics', 10, 'Available'),
    ('330 ohm resistor', 'Resistor', 6, 'Available'),
    ('100 uF capacitor', 'Capacitor', 4, 'Available'),
    ('100 kOhm resistor', 'Resistor', 3, 'Available'),
    ('47 kOhm resistor', 'Resistor', 3, 'Available'),
    ('390 ohm resistor', 'Resistor', 4, 'Available'),
    ('9V battery with holder', 'Power Supply', 3, 'Available'),
    ('Breadboard', 'Prototyping', 4, 'Available'),
    ('IR sensor', 'Sensor', 0, 'Not Available'),
    ('4-pin touch plate/sensor connection', 'Sensor', 0, 'Not Available')
  LOOP
    SELECT count(*) INTO comp_count FROM components WHERE name = comp_record.column1;
    IF comp_count > 0 THEN
      UPDATE components SET quantity = comp_record.column3, status = comp_record.column4, is_demo = true, updated_at = now()
      WHERE name = comp_record.column1;
    ELSE
      INSERT INTO components (name, category, quantity, status, is_demo)
      VALUES (comp_record.column1, comp_record.column2, comp_record.column3, comp_record.column4, true);
    END IF;
  END LOOP;
END $$;

-- Fix project_components: "Connecting wire" → "Connecting wires"
UPDATE project_components
SET component_name = 'Connecting wires'
WHERE component_name = 'Connecting wire';
