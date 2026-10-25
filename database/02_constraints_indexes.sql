USE electrodb;

ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_category (category_id);

ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_published_category (is_published, category_id);

ALTER TABLE components ADD INDEX IF NOT EXISTS idx_components_name (name);

ALTER TABLE component_content ADD INDEX IF NOT EXISTS idx_component_content_order (component_id, display_order);

ALTER TABLE component_diagrams ADD INDEX IF NOT EXISTS idx_component_diagrams_order (component_id, display_order);

ALTER TABLE categories ADD INDEX IF NOT EXISTS idx_categories_parent_order (parent_category_id, display_order);

ALTER TABLE application_audit_log ADD INDEX IF NOT EXISTS idx_audit_table_time (table_name, changed_at);
