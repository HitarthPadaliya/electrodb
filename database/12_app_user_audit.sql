-- ================================================================
-- ElectroDB - 12_app_user_audit.sql
-- Audit trail for account changes (app_users)
-- Target: MySQL 8.0+ / MariaDB 10.4+
--
-- Additive only: these triggers write to the existing
-- `application_audit_log` table and do not alter it.
--
-- Run once, after 11_auth_and_personalization.sql:
--   mysql -u <dba user> -p electrodb < database/12_app_user_audit.sql
--
-- Rollback:
--   DROP TRIGGER IF EXISTS trg_app_users_audit_ai;
--   DROP TRIGGER IF EXISTS trg_app_users_audit_au;
--   DROP TRIGGER IF EXISTS trg_app_users_audit_ad;
--
-- Notes
--   * Password material is never written to the log. An UPDATE records only
--     whether the hash changed.
--   * `application_user` is the account the row belongs to - a trigger cannot
--     see the HTTP session, so the acting administrator is not recorded here.
--     Application-level logging (controllers) is where that identity belongs.
-- ================================================================

USE electrodb;

DELIMITER $$

-- ---------------------------------------------------------------- INSERT
DROP TRIGGER IF EXISTS trg_app_users_audit_ai$$
CREATE TRIGGER trg_app_users_audit_ai
AFTER INSERT ON app_users FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'INSERT', CAST(NEW.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), NEW.username, NULL,
     JSON_OBJECT(
       'username', NEW.username,
       'email', NEW.email,
       'role_code', NEW.role_code,
       'is_active', NEW.is_active
     ));
END$$

-- ---------------------------------------------------------------- UPDATE
DROP TRIGGER IF EXISTS trg_app_users_audit_au$$
CREATE TRIGGER trg_app_users_audit_au
AFTER UPDATE ON app_users FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'UPDATE', CAST(NEW.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), NEW.username,
     JSON_OBJECT(
       'username', OLD.username,
       'email', OLD.email,
       'role_code', OLD.role_code,
       'is_active', OLD.is_active,
       'password_changed', NOT (OLD.password_hash <=> NEW.password_hash)
     ),
     JSON_OBJECT(
       'username', NEW.username,
       'email', NEW.email,
       'role_code', NEW.role_code,
       'is_active', NEW.is_active,
       'password_changed', NOT (OLD.password_hash <=> NEW.password_hash)
     ));
END$$

-- ---------------------------------------------------------------- DELETE
DROP TRIGGER IF EXISTS trg_app_users_audit_ad$$
CREATE TRIGGER trg_app_users_audit_ad
AFTER DELETE ON app_users FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'DELETE', CAST(OLD.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), OLD.username,
     JSON_OBJECT(
       'username', OLD.username,
       'email', OLD.email,
       'role_code', OLD.role_code,
       'is_active', OLD.is_active
     ), NULL);
END$$

DELIMITER ;

SELECT 'App-user audit triggers installed.' AS status;
