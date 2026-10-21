-- MySQL view + procedure + trigger demonstration.
-- The consolidated electrodb.sql creates both views and base-table audit triggers.
-- MySQL does not support triggers directly on views. Instead, the lab UI calls
-- sp_insert_component(), the components AFTER INSERT trigger writes the audit
-- row, and this joined view exposes the inserted component/category record.
USE electrodb;

SELECT * FROM v_component_catalogue ORDER BY component_name LIMIT 25;
SELECT * FROM v_category_component_counts ORDER BY category_id;

-- Interactive demonstration: open /#/lab, choose Views, then click
-- “Run procedure + trigger demo”. It creates a temporary lab-view-demo-* row,
-- displays the joined view row and matching audit row, and provides a cleanup
-- action that invokes sp_delete_component() (which also runs its audit trigger).
-- No view-trigger feature is claimed; the trigger belongs to the base table.
