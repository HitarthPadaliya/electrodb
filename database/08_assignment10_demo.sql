USE electrodb;

SELECT '--- DEMO 1: Component CRUD Stored Procedures ---' AS section;

CALL sp_insert_component(8, 'Demo Gate', 'a10-demo-gate', 'Temporary gate created for stored procedure demonstration');

SELECT component_id, name, slug, short_description, created_at
FROM components
WHERE slug = 'a10-demo-gate';

SET @demo_id = (SELECT component_id FROM components WHERE slug = 'a10-demo-gate' LIMIT 1);
CALL sp_update_component(@demo_id, 8, 'Updated Demo Gate', 'Updated description verifying sp_update_component');

SELECT component_id, name, short_description, updated_at
FROM components
WHERE component_id = @demo_id;

CALL sp_delete_component(@demo_id);

SELECT COUNT(*) AS remaining_count FROM components WHERE component_id = @demo_id;

SELECT '--- DEMO 2: Database Roles and Accounts ---' AS section;

SELECT CURRENT_USER() AS connected_db_user;
SHOW GRANTS;

SELECT '--- DEMO 3: App User Login-Data CRUD ---' AS section;

CALL sp_insert_app_user('demo_student', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W565n8.y0fXm3wye', 'APP_DEVELOPER');

SELECT user_id, username, role_code, is_active, created_at FROM app_users WHERE username = 'demo_student';

SET @user_id = (SELECT user_id FROM app_users WHERE username = 'demo_student' LIMIT 1);
CALL sp_update_app_user(@user_id, 'DBA', 1);
SELECT user_id, username, role_code, is_active, updated_at FROM app_users WHERE user_id = @user_id;

CALL sp_delete_app_user(@user_id);
SELECT COUNT(*) AS user_count FROM app_users WHERE user_id = @user_id;

SELECT '--- DEMO 4: Explicit Cursor Without Limit ---' AS section;

CALL sp_cursor_components_all();

SELECT '--- DEMO 5: Explicit Cursor With Limit ---' AS section;

CALL sp_cursor_components_limited(5);

SELECT '--- DEMO 6: Paginated Search Without Filter ---' AS section;

CALL sp_search_components_page(1, 5);

SELECT '--- DEMO 7: Paginated Search With Category Filter ---' AS section;

CALL sp_search_components_by_category(7, 1, 5);

SELECT '--- DEMO 8: Ungrouped Numeric Sum Function ---' AS section;
SELECT fn_sum_component_ids() AS total_sum_of_component_ids;

SELECT '--- DEMO 9: Grouped Numeric Sum Procedure ---' AS section;
CALL sp_sum_component_ids_by_category();

SELECT '--- DEMO 10: BEFORE Trigger Integrity Validation ---' AS section;

SELECT '--- DEMO 11: Uppercase Trigger Verification ---' AS section;

CALL sp_insert_component(8, 'lowercase gate test', 'lowercase-gate-test', 'Testing uppercase trigger');
SELECT component_id, name, slug FROM components WHERE slug = 'lowercase-gate-test';
CALL sp_delete_component((SELECT component_id FROM components WHERE slug = 'lowercase-gate-test'));

SELECT '--- DEMO 12: Audit Log Verification ---' AS section;

SELECT audit_id, table_name, operation_type, row_key, changed_at, db_user, old_values, new_values
FROM application_audit_log
ORDER BY audit_id DESC
LIMIT 10;

SELECT '--- DEMO 13: Restricted-Hours Trigger Notice ---' AS section;
SELECT 'Trigger trg_components_restricted_bi/bu/bd is active for Monday 14:00-16:00' AS trigger_status,
       DAYOFWEEK(CURRENT_TIMESTAMP) AS current_day_of_week,
       TIME(CURRENT_TIMESTAMP) AS cur_time;
