-- Seed merchant_category_mappings with example rows for the first household
-- Inserts only if a matching mapping does not already exist (case-insensitive by merchant)

-- Walmart -> Groceries
INSERT INTO merchant_category_mappings (household_id, merchant, category_id)
SELECT h.id, 'Walmart', c.id
FROM households h
JOIN categories c ON c.name = 'Groceries' AND c.household_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_category_mappings m WHERE m.household_id = h.id AND lower(m.merchant) = lower('Walmart')
)
LIMIT 1;

-- Amazon -> Other
INSERT INTO merchant_category_mappings (household_id, merchant, category_id)
SELECT h.id, 'Amazon', c.id
FROM households h
JOIN categories c ON c.name = 'Other' AND c.household_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_category_mappings m WHERE m.household_id = h.id AND lower(m.merchant) = lower('Amazon')
)
LIMIT 1;

-- Uber -> Transport
INSERT INTO merchant_category_mappings (household_id, merchant, category_id)
SELECT h.id, 'Uber', c.id
FROM households h
JOIN categories c ON c.name = 'Transport' AND c.household_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_category_mappings m WHERE m.household_id = h.id AND lower(m.merchant) = lower('Uber')
)
LIMIT 1;

-- Spotify -> Entertainment
INSERT INTO merchant_category_mappings (household_id, merchant, category_id)
SELECT h.id, 'Spotify', c.id
FROM households h
JOIN categories c ON c.name = 'Entertainment' AND c.household_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_category_mappings m WHERE m.household_id = h.id AND lower(m.merchant) = lower('Spotify')
)
LIMIT 1;

-- Local Pharmacy -> Health
INSERT INTO merchant_category_mappings (household_id, merchant, category_id)
SELECT h.id, 'Local Pharmacy', c.id
FROM households h
JOIN categories c ON c.name = 'Health' AND c.household_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_category_mappings m WHERE m.household_id = h.id AND lower(m.merchant) = lower('Local Pharmacy')
)
LIMIT 1;

-- Refresh updated_at for inserted rows
UPDATE merchant_category_mappings SET updated_at = now() WHERE updated_at IS NULL;
