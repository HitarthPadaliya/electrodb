-- ================================================================
-- ElectroDB - 09_assignment11_queries.sql
-- Demonstration queries for the ElectroDB query layer
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

USE electrodb;

-- ----------------------------------------------------------------
-- Query 1: Full-table display query
-- Note: Also available in XML format at /api/lab/components.xml
-- ----------------------------------------------------------------
SELECT '=== Query 1: Full-Table Display ===' AS query_title;
SELECT component_id, category_id, name, slug, short_description, is_published, is_illustrative, created_at
FROM components
ORDER BY component_id;

-- ----------------------------------------------------------------
-- Query 2: Integrity-preserving inserts into related tables
-- ----------------------------------------------------------------
SELECT '=== Query 2: Integrity-Preserving Related Table Inserts ===' AS query_title;

START TRANSACTION;

-- Step 2A: Verify parent category exists or insert if needed
INSERT INTO components (category_id, name, slug, short_description, is_published)
VALUES (8, 'Demo Buffer Gate', 'demo-buffer-gate', 'Temporary component testing FK integrity', 1);

SET @new_comp_id = LAST_INSERT_ID();

-- Step 2B: Insert into related child table: component_specifications (respects FK to components and specifications)
INSERT INTO component_specifications (component_id, specification_id, numeric_value, source_note)
VALUES (@new_comp_id, 3, 1, 'Verified input count for buffer gate');

-- Step 2C: Insert into related child table: component_diagrams (respects FK to components)
INSERT INTO component_diagrams (component_id, title, image_path, alt_text, display_order)
VALUES (@new_comp_id, 'Circuit Symbol', '/assets/svg/gates/buffer.svg', 'Buffer symbol', 1);

-- Verify all related records inserted
SELECT c.component_id, c.name, s.name AS spec_name, cs.numeric_value, cd.title AS diagram_title
FROM components c
JOIN component_specifications cs ON cs.component_id = c.component_id
JOIN specifications s ON s.specification_id = cs.specification_id
JOIN component_diagrams cd ON cd.component_id = c.component_id
WHERE c.component_id = @new_comp_id;

ROLLBACK; -- Clean rollback for reproducible demonstration

-- ----------------------------------------------------------------
-- Query 3: Aggregate query
-- Note: Also available in XML format at /api/lab/aggregate.xml
-- ----------------------------------------------------------------
SELECT '=== Query 3: Aggregate Query ===' AS query_title;
SELECT COUNT(*) AS total_components,
       COUNT(DISTINCT category_id) AS distinct_categories,
       MIN(component_id) AS min_id,
       MAX(component_id) AS max_id,
       AVG(component_id) AS avg_id
FROM components;

-- ----------------------------------------------------------------
-- Query 4: Conditional query
-- Note: Also available in XML format at /api/lab/filter.xml
-- ----------------------------------------------------------------
SELECT '=== Query 4: Conditional Query ===' AS query_title;
SELECT component_id, category_id, name, slug, is_published
FROM components
WHERE category_id = 6 AND is_published = 1
ORDER BY component_id;

-- ----------------------------------------------------------------
-- Query 5: Join query
-- ----------------------------------------------------------------
SELECT '=== Query 5: Two-Table Join Query ===' AS query_title;
SELECT c.component_id,
       c.name AS component_name,
       cat.name AS category_name,
       cat.slug AS category_slug,
       c.short_description
FROM components c
INNER JOIN categories cat ON cat.category_id = c.category_id
ORDER BY c.component_id
LIMIT 20;

-- ----------------------------------------------------------------
-- Query 6: Subquery across tables
-- ----------------------------------------------------------------
SELECT '=== Query 6: Subquery Across Tables ===' AS query_title;
-- Find components belonging to categories under Digital Electronics (parent_category_id = 1)
SELECT component_id, name, category_id
FROM components
WHERE category_id IN (
  SELECT category_id
  FROM categories
  WHERE parent_category_id = 1
)
ORDER BY category_id, component_id
LIMIT 20;

-- ----------------------------------------------------------------
-- Query 7: Correlated subquery across tables
-- ----------------------------------------------------------------
SELECT '=== Query 7: Correlated Subquery Across Tables ===' AS query_title;
-- Find all categories that contain at least one published component
SELECT cat.category_id, cat.name, cat.slug
FROM categories cat
WHERE EXISTS (
  SELECT 1
  FROM components c
  WHERE c.category_id = cat.category_id
    AND c.is_published = 1
)
ORDER BY cat.category_id;

-- ----------------------------------------------------------------
-- Query 8: Update query and refreshed row preview
-- ----------------------------------------------------------------
SELECT '=== Query 8: Update Query and Verification ===' AS query_title;

START TRANSACTION;

UPDATE components
SET short_description = CONCAT(short_description, ' [Verified]')
WHERE slug = 'decade-counter';

-- Preview refreshed row
SELECT component_id, name, slug, short_description, updated_at
FROM components
WHERE slug = 'decade-counter';

ROLLBACK;

-- ----------------------------------------------------------------
-- Demonstration of views
-- ----------------------------------------------------------------
SELECT '=== View 1: v_component_catalogue ===' AS query_title;
SELECT * FROM v_component_catalogue LIMIT 10;

SELECT '=== View 2: v_category_component_counts ===' AS query_title;
SELECT * FROM v_category_component_counts;
