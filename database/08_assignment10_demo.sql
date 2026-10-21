-- Assignment 10 MySQL stored-program demonstrations.
-- Run against a fresh schema created by electrodb.sql. This file is a
-- reference/demo checklist: electrodb.sql already defines these objects.
USE electrodb;

-- Component CRUD routines
-- CALL sp_insert_component(8,'Demo Gate','demo-gate','Assignment demonstration');
-- CALL sp_update_component(1,6,'Decade Counter','Updated summary');
-- CALL sp_delete_component(<component_id>);

-- Search procedures: page and category-filtered page
CALL sp_search_components_page(1,10);
CALL sp_search_components_by_category(6,1,10);

-- Sum with and without grouping
SELECT fn_sum_component_ids() AS sum_component_ids;
CALL sp_sum_component_ids_by_category();

-- Explicit cursor procedures (return result sets)
CALL sp_cursor_components_all();
CALL sp_cursor_components_limited(10);

-- Application login record CRUD uses hashes only; never pass plaintext passwords.
-- CALL sp_insert_app_user('demo-user','<application-generated-password-hash>','NAIVE_USER');

-- The component BEFORE/AFTER/restricted-hours triggers are exercised by
-- ordinary component insert/update/delete statements against a disposable DB.
-- MySQL has row-level triggers only; uppercase normalization is the documented
-- row-trigger equivalent and is not mislabeled as a statement trigger.
