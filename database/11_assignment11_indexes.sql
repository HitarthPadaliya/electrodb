-- Assignment 11 index experiment.
-- Measure the baseline first and record it in 10_query_timing_results.md.
-- Run these CREATE INDEX statements once against the disposable demo schema,
-- then repeat identical queries with the same data and measurement method.
-- The names are deliberately new and distinct from the schema's existing indexes.
USE electrodb;

-- Supports the category page's category + publication filter and name ordering.
CREATE INDEX idx_components_category_published_name
  ON components(category_id, is_published, name);

-- Supports the public catalogue's published-row scan ordered by component name.
CREATE INDEX idx_components_published_name_category
  ON components(is_published, name, category_id);

-- Compare with EXPLAIN before/after. Do not expect either index to improve every
-- query; record optimizer choices, row counts, repeated timings, and write cost.
EXPLAIN SELECT component_id,name,slug
FROM components
WHERE category_id=6 AND is_published=1
ORDER BY name;

EXPLAIN SELECT component_id,name,slug
FROM components
WHERE is_published=1
ORDER BY name;
