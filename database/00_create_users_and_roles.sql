-- ================================================================
-- ElectroDB - 00_create_users_and_roles.sql
-- Database roles and least-privilege accounts for Assignment 10
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

-- Create application roles (where supported)
CREATE ROLE IF NOT EXISTS 'electrodb_role_naive';
CREATE ROLE IF NOT EXISTS 'electrodb_role_application_developer';
CREATE ROLE IF NOT EXISTS 'electrodb_role_dba';

-- Assign privileges to roles
GRANT SELECT ON electrodb.categories TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.components TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.content_types TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.component_content TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.component_diagrams TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.specifications TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.component_specifications TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.tags TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.component_tags TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.v_component_catalogue TO 'electrodb_role_naive';
GRANT SELECT ON electrodb.v_category_component_counts TO 'electrodb_role_naive';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON electrodb.* TO 'electrodb_role_application_developer';
GRANT ALL PRIVILEGES ON electrodb.* TO 'electrodb_role_dba';

-- Create actual database accounts
CREATE USER IF NOT EXISTS 'electrodb_naive'@'localhost' IDENTIFIED BY 'naive_user_pwd';
CREATE USER IF NOT EXISTS 'electrodb_naive'@'127.0.0.1' IDENTIFIED BY 'naive_user_pwd';

CREATE USER IF NOT EXISTS 'electrodb_app'@'localhost' IDENTIFIED BY 'electrodb_app_pwd';
CREATE USER IF NOT EXISTS 'electrodb_app'@'127.0.0.1' IDENTIFIED BY 'electrodb_app_pwd';

CREATE USER IF NOT EXISTS 'electrodb_developer'@'localhost' IDENTIFIED BY 'developer_pwd';
CREATE USER IF NOT EXISTS 'electrodb_developer'@'127.0.0.1' IDENTIFIED BY 'developer_pwd';

CREATE USER IF NOT EXISTS 'electrodb_dba'@'localhost' IDENTIFIED BY 'dba_pwd';
CREATE USER IF NOT EXISTS 'electrodb_dba'@'127.0.0.1' IDENTIFIED BY 'dba_pwd';

-- Grant roles/direct privileges to users
GRANT 'electrodb_role_naive' TO 'electrodb_naive'@'localhost', 'electrodb_naive'@'127.0.0.1';
GRANT SELECT ON electrodb.* TO 'electrodb_naive'@'localhost', 'electrodb_naive'@'127.0.0.1';

GRANT 'electrodb_role_application_developer' TO 'electrodb_app'@'localhost', 'electrodb_app'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON electrodb.* TO 'electrodb_app'@'localhost', 'electrodb_app'@'127.0.0.1';

GRANT 'electrodb_role_application_developer' TO 'electrodb_developer'@'localhost', 'electrodb_developer'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON electrodb.* TO 'electrodb_developer'@'localhost', 'electrodb_developer'@'127.0.0.1';

GRANT 'electrodb_role_dba' TO 'electrodb_dba'@'localhost', 'electrodb_dba'@'127.0.0.1';
GRANT ALL PRIVILEGES ON electrodb.* TO 'electrodb_dba'@'localhost', 'electrodb_dba'@'127.0.0.1';

FLUSH PRIVILEGES;
