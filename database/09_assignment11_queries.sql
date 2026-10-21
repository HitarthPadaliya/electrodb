-- Assignment 11 query demonstrations for MySQL 8.0+.
-- This file is intentionally non-destructive. Run against the imported
-- electrodb schema. The INSERT example is commented to avoid adding a row
-- on every execution; uncomment only in a disposable demo database.
USE electrodb;

-- 1. Full table display (API XML: GET /api/lab/components.xml)
SELECT * FROM components ORDER BY component_id;

-- 2. Insert into related tables while preserving keys.
-- INSERT INTO components (category_id,name,slug,short_description)
-- VALUES (8,'Assignment Demo Gate','assignment-demo-gate','Temporary assignment row');
-- INSERT INTO component_tags (component_id,tag_id)
-- SELECT LAST_INSERT_ID(),tag_id FROM tags WHERE slug='digital';

-- 3. Aggregate (API XML: GET /api/lab/aggregate.xml)
SELECT COUNT(*) AS component_count FROM components;

-- 4. Conditional query (API XML: GET /api/lab/filter.xml?categoryId=6)
SELECT component_id,name,slug,category_id FROM components
WHERE category_id=6 ORDER BY name;

-- 5. Join
SELECT c.component_id,c.name AS component_name,cat.name AS category_name
FROM components c JOIN categories cat ON cat.category_id=c.category_id;

-- 6. Subquery across tables
SELECT name,slug FROM categories
WHERE category_id IN (SELECT category_id FROM components WHERE is_published=1);

-- 7. Correlated subquery across tables
SELECT cat.category_id,cat.name,
       (SELECT COUNT(*) FROM components c WHERE c.category_id=cat.category_id) AS component_count
FROM categories cat
WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id=cat.category_id);

-- 8. Update a known seed row, then verify it. Restore the original value after demo.
-- UPDATE components SET short_description='Updated during Assignment 11 demo'
-- WHERE slug='decade-counter';
-- SELECT component_id,name,short_description FROM components WHERE slug='decade-counter';

-- The complete safe allowlisted versions of these exercises are exposed under
-- /api/lab. Record actual benchmark results in 10_query_timing_results.md.
