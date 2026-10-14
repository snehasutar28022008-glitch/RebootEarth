/*
# Update accepted_items type constraint

Adds 'special_request' as a valid type for accepted_items.
Moves large appliances, CRT, tube lights, and lead-acid batteries from not_accepted to special_request.
*/

-- Drop old constraint and add new one with special_request
ALTER TABLE accepted_items DROP CONSTRAINT IF EXISTS accepted_items_type_check;
ALTER TABLE accepted_items ADD CONSTRAINT accepted_items_type_check CHECK (type IN ('accepted', 'special', 'not_accepted', 'special_request'));

-- Move items to special_request
UPDATE accepted_items SET type = 'special_request' 
WHERE name IN (
  'Large appliances (refrigerators, ACs, washing machines)',
  'CRT TVs and monitors',
  'Tube lights and CFL bulbs',
  'Lead-acid vehicle or inverter batteries'
);

-- Update the special_request item sort orders
UPDATE accepted_items SET sort_order = 1 WHERE name = 'Large appliances (refrigerators, ACs, washing machines)';
UPDATE accepted_items SET sort_order = 2 WHERE name = 'CRT TVs and monitors';
UPDATE accepted_items SET sort_order = 3 WHERE name = 'Tube lights and CFL bulbs';
UPDATE accepted_items SET sort_order = 4 WHERE name = 'Lead-acid vehicle or inverter batteries';