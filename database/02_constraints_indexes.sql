-- ================================================================
-- ElectroDB - 02_constraints_indexes.sql
-- Keys, constraints, and candidate benchmark indexes
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

USE electrodb;

-- Core indexes for search, join, and filtering paths
-- Check if index exists before creating, or use ALTER TABLE ... ADD INDEX IF NOT EXISTS (MariaDB/MySQL 8)

-- 1. Index on components(category_id) for joining with categories
-- Useful for Assignment 11 Query 5 (join) and Query 4 (conditional category query)
ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_category (category_id);

-- 2. Composite index on components(is_published, category_id)
-- Useful for catalogue queries filtering published components by category
ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_published_category (is_published, category_id);

-- 3. Index on components(name) for alphabetical lookups and search
ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_name (name);

-- 4. Index on component_content(component_id, display_order)
-- Speeds up detail page rendering of ordered educational sections
ALTER TABLE component_content ADD INDEX IF NOT EXISTS idx_component_content_order (component_id, display_order);

-- 5. Index on component_diagrams(component_id, display_order)
-- Speeds up retrieval of component diagrams
ALTER TABLE component_diagrams ADD INDEX IF NOT EXISTS idx_component_diagrams_order (component_id, display_order);

-- 6. Index on categories(parent_category_id, display_order)
-- Speeds up hierarchical tree navigation
ALTER TABLE categories ADD INDEX IF NOT EXISTS idx_categories_parent_order (parent_category_id, display_order);

-- 7. Index on application_audit_log(table_name, changed_at)
-- Speeds up audit log lookups by table
ALTER TABLE application_audit_log ADD INDEX IF NOT EXISTS idx_audit_table_time (table_name, changed_at);
