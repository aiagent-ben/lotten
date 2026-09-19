-- Migration: Cleanup ghost collections and rename Shoe Cabinet to Talbot
-- Deactivate empty scraper collections with 0 products
UPDATE collections 
SET is_active = false 
WHERE slug IN ('unknown', 'nuhoom', 'nesthouz', 'nestnordic', 'fyndfurniture', 'luooma');

-- Rename legacy category-slug collection to legitimate collection name
UPDATE collections 
SET name = 'Talbot', 
    slug = 'talbot', 
    description = 'Talbot collection by B2B Furniture Supply' 
WHERE slug = 'shoe-cabinet';
