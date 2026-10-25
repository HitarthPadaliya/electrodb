-- ================================================================
-- ElectroDB - 08_assignment10_demo.sql
-- Demonstration script for the ElectroDB stored-program layer
-- Demonstrates:
--   1. Component CRUD stored procedures
--   2. Database accounts and roles
--   3. Login data CRUD stored procedures
--   4. Explicit cursor without limit (sp_cursor_components_all)
--   5. Explicit cursor with limit (sp_cursor_components_limited)
--   6. Paginated search without filter (sp_search_components_page)
--   7. Paginated search with filter (sp_search_components_by_category)
--   8. Sum function without grouping (fn_sum_component_ids)
--   9. Sum procedure with grouping (sp_sum_component_ids_by_category)
--  10. BEFORE trigger integrity enforcement
--  11. Uppercase statement trigger requirement (MySQL row equivalent)
--  12. AFTER DML trigger audit logging to application_audit_log
--  13. Restricted-hours trigger (Monday 14:00 - 16:00)
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

USE electrodb;

-- ----------------------------------------------------------------
-- Demo 1: Separate Insert / Update / Delete Stored Procedures
-- ----------------------------------------------------------------
SELECT '--- DEMO 1: Component CRUD Stored Procedures ---' AS section;

-- 1A: Insert a new component
CALL sp_insert_component(8, 'Demo Gate', 'a10-demo-gate', 'Temporary gate created for stored procedure demonstration');

-- Verify insertion and automatic uppercase trigger normalization
SELECT component_id, name, slug, short_description, created_at
FROM components
WHERE slug = 'a10-demo-gate';

-- 1B: Update the component
SET @demo_id = (SELECT component_id FROM components WHERE slug = 'a10-demo-gate' LIMIT 1);
CALL sp_update_component(@demo_id, 8, 'Updated Demo Gate', 'Updated description verifying sp_update_component');

-- Verify update
SELECT component_id, name, short_description, updated_at
FROM components
WHERE component_id = @demo_id;

-- 1C: Delete the component
CALL sp_delete_component(@demo_id);

-- Verify deletion
SELECT COUNT(*) AS remaining_count FROM components WHERE component_id = @demo_id;

-- ----------------------------------------------------------------
-- Demo 2: Database accounts and roles
-- ----------------------------------------------------------------
SELECT '--- DEMO 2: Database Roles and Accounts ---' AS section;

-- Display current connected database user and privileges
SELECT CURRENT_USER() AS connected_db_user;
SHOW GRANTS;
-- Note: Administrative queries on mysql.user can be executed with electrodb_dba:
-- SELECT User, Host FROM mysql.user WHERE User LIKE 'electrodb_%';

-- ----------------------------------------------------------------
-- Demo 3: Application user login-data CRUD stored procedures
-- ----------------------------------------------------------------
SELECT '--- DEMO 3: App User Login-Data CRUD ---' AS section;

-- 3A: Insert app user (with hashed password)
CALL sp_insert_app_user('demo_student', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W565n8.y0fXm3wye', 'APP_DEVELOPER');

-- 3B: Verify insertion
SELECT user_id, username, role_code, is_active, created_at FROM app_users WHERE username = 'demo_student';

-- 3C: Update app user role and status
SET @user_id = (SELECT user_id FROM app_users WHERE username = 'demo_student' LIMIT 1);
CALL sp_update_app_user(@user_id, 'DBA', 1);
SELECT user_id, username, role_code, is_active, updated_at FROM app_users WHERE user_id = @user_id;

-- 3D: Delete app user
CALL sp_delete_app_user(@user_id);
SELECT COUNT(*) AS user_count FROM app_users WHERE user_id = @user_id;

-- ----------------------------------------------------------------
-- Demo 4 & 5: Explicit Cursor Procedures (With and Without Limit)
-- ----------------------------------------------------------------
SELECT '--- DEMO 4: Explicit Cursor Without Limit ---' AS section;
-- Unbounded cursor iterates through all rows
CALL sp_cursor_components_all();

SELECT '--- DEMO 5: Explicit Cursor With Limit ---' AS section;
-- Bounded cursor stops after fetching N rows (e.g. 5)
CALL sp_cursor_components_limited(5);

-- ----------------------------------------------------------------
-- Demo 6 & 7: Paginated Search (With and Without Filter)
-- ----------------------------------------------------------------
SELECT '--- DEMO 6: Paginated Search Without Filter ---' AS section;
-- Page 1, page size 5
CALL sp_search_components_page(1, 5);

SELECT '--- DEMO 7: Paginated Search With Category Filter ---' AS section;
-- Filter for Flip-Flops (category_id = 7), Page 1, size 5
CALL sp_search_components_by_category(7, 1, 5);

-- ----------------------------------------------------------------
-- Demo 8 & 9: Sum Numeric Functions (With and Without Grouping)
-- ----------------------------------------------------------------
SELECT '--- DEMO 8: Ungrouped Numeric Sum Function ---' AS section;
SELECT fn_sum_component_ids() AS total_sum_of_component_ids;

SELECT '--- DEMO 9: Grouped Numeric Sum Procedure ---' AS section;
CALL sp_sum_component_ids_by_category();

-- ----------------------------------------------------------------
-- Demo 10: BEFORE Trigger Integrity Validation
-- ----------------------------------------------------------------
SELECT '--- DEMO 10: BEFORE Trigger Integrity Validation ---' AS section;

-- Test blank name (should trigger SIGNAL SQLSTATE '45000')
-- Uncomment below to observe validation failure:
-- CALL sp_insert_component(8, '   ', 'blank-gate', 'Should fail validation');

-- ----------------------------------------------------------------
-- Demo 11: Uppercase Trigger Verification
-- ----------------------------------------------------------------
SELECT '--- DEMO 11: Uppercase Trigger Verification ---' AS section;

-- Insert with lowercase name
CALL sp_insert_component(8, 'lowercase gate test', 'lowercase-gate-test', 'Testing uppercase trigger');
SELECT component_id, name, slug FROM components WHERE slug = 'lowercase-gate-test';
CALL sp_delete_component((SELECT component_id FROM components WHERE slug = 'lowercase-gate-test'));

-- ----------------------------------------------------------------
-- Demo 12: AFTER DML Trigger Audit Logging
-- ----------------------------------------------------------------
SELECT '--- DEMO 12: Audit Log Verification ---' AS section;

SELECT audit_id, table_name, operation_type, row_key, changed_at, db_user, old_values, new_values
FROM application_audit_log
ORDER BY audit_id DESC
LIMIT 10;

-- ----------------------------------------------------------------
-- Demo 13: Restricted-Hours Trigger Notice
-- ----------------------------------------------------------------
SELECT '--- DEMO 13: Restricted-Hours Trigger Notice ---' AS section;
SELECT 'Trigger trg_components_restricted_bi/bu/bd is active for Monday 14:00-16:00' AS trigger_status,
       DAYOFWEEK(CURRENT_TIMESTAMP) AS current_day_of_week,
       TIME(CURRENT_TIMESTAMP) AS cur_time;
