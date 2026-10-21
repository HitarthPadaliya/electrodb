-- Optional least-privilege MySQL roles for Assignment 10.
-- Run only after electrodb.sql has created the electrodb schema, using an
-- administrative session. This script does not create accounts or passwords.
-- A DBA should create local accounts using the institution's credential policy,
-- then GRANT one of these roles to the corresponding account.

CREATE ROLE IF NOT EXISTS electrodb_naive_user;
CREATE ROLE IF NOT EXISTS electrodb_app_developer;
CREATE ROLE IF NOT EXISTS electrodb_dba;

-- Catalogue visitors/operators can read public catalogue data, not lab users,
-- audit entries, or stored password hashes.
GRANT SELECT ON electrodb.categories TO electrodb_naive_user;
GRANT SELECT ON electrodb.components TO electrodb_naive_user;
GRANT SELECT ON electrodb.content_types TO electrodb_naive_user;
GRANT SELECT ON electrodb.category_content_types TO electrodb_naive_user;
GRANT SELECT ON electrodb.component_content TO electrodb_naive_user;
GRANT SELECT ON electrodb.component_diagrams TO electrodb_naive_user;
GRANT SELECT ON electrodb.specifications TO electrodb_naive_user;
GRANT SELECT ON electrodb.component_specifications TO electrodb_naive_user;
GRANT SELECT ON electrodb.tags TO electrodb_naive_user;
GRANT SELECT ON electrodb.component_tags TO electrodb_naive_user;
GRANT SELECT ON electrodb.v_component_catalogue TO electrodb_naive_user;
GRANT SELECT ON electrodb.v_category_component_counts TO electrodb_naive_user;

-- Assignment/demo writer: component CRUD and approved routines. Do not use this
-- role as the application's public runtime account without further review.
GRANT SELECT, INSERT, UPDATE, DELETE ON electrodb.components TO electrodb_app_developer;
GRANT SELECT ON electrodb.categories TO electrodb_app_developer;
GRANT SELECT ON electrodb.content_types TO electrodb_app_developer;
GRANT SELECT ON electrodb.category_content_types TO electrodb_app_developer;
GRANT SELECT ON electrodb.component_content TO electrodb_app_developer;
GRANT SELECT ON electrodb.component_diagrams TO electrodb_app_developer;
GRANT SELECT ON electrodb.specifications TO electrodb_app_developer;
GRANT SELECT ON electrodb.component_specifications TO electrodb_app_developer;
GRANT SELECT ON electrodb.tags TO electrodb_app_developer;
GRANT SELECT ON electrodb.component_tags TO electrodb_app_developer;
GRANT SELECT (user_id,username,role_code,is_active,created_at) ON electrodb.app_users TO electrodb_app_developer;
GRANT EXECUTE ON electrodb.* TO electrodb_app_developer;

-- DBA role is schema-scoped, not global.
GRANT ALL PRIVILEGES ON electrodb.* TO electrodb_dba;

-- Example account creation / role assignment (run manually with chosen secrets):
-- CREATE USER 'electrodb_reader'@'localhost' IDENTIFIED BY '<unique-secret-from-secure-prompt>';
-- GRANT electrodb_naive_user TO 'electrodb_reader'@'localhost';
-- SET DEFAULT ROLE electrodb_naive_user TO 'electrodb_reader'@'localhost';
-- CREATE USER 'electrodb_lab'@'localhost' IDENTIFIED BY '<unique-secret-from-secure-prompt>';
-- GRANT electrodb_app_developer TO 'electrodb_lab'@'localhost';
-- SET DEFAULT ROLE electrodb_app_developer TO 'electrodb_lab'@'localhost';
-- Create a DBA account through the institution's secure DBA process; do not
-- store its password in this repository or use it in Node.js.
