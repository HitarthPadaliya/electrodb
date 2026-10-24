-- ================================================================
-- ElectroDB - 06_triggers.sql
-- Integrity, normalization, audit, and restricted-hours triggers
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

USE electrodb;

DELIMITER $$

-- ----------------------------------------------------------------
-- 1. Category self-parent validation triggers
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_categories_no_self_parent_bi$$
CREATE TRIGGER trg_categories_no_self_parent_bi
BEFORE INSERT ON categories FOR EACH ROW
BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_categories_no_self_parent_bu$$
CREATE TRIGGER trg_categories_no_self_parent_bu
BEFORE UPDATE ON categories FOR EACH ROW
BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END$$

-- ----------------------------------------------------------------
-- 2. BEFORE triggers checking at least two integrity conditions
-- Integrity rule 1: Component name must not be blank after trimming.
-- Integrity rule 2: Short description must not exceed 1000 characters.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_components_validate_bi$$
CREATE TRIGGER trg_components_validate_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description) > 1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_components_validate_bu$$
CREATE TRIGGER trg_components_validate_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description) > 1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END$$

-- ----------------------------------------------------------------
-- 3. Uppercase trigger
-- Note: MySQL supports row-level triggers, which execute per changed row.
-- This normalizes component names to UPPER case on insert/update.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_components_uppercase_bi$$
CREATE TRIGGER trg_components_uppercase_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  SET NEW.name = UPPER(TRIM(NEW.name));
END$$

DROP TRIGGER IF EXISTS trg_components_uppercase_bu$$
CREATE TRIGGER trg_components_uppercase_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  SET NEW.name = UPPER(TRIM(NEW.name));
END$$

-- ----------------------------------------------------------------
-- 4. AFTER DML audit trigger logging to application_audit_log
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_components_audit_ai$$
CREATE TRIGGER trg_components_audit_ai
AFTER INSERT ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, old_values, new_values)
  VALUES
    ('components', 'INSERT', CAST(NEW.component_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), NULL,
     JSON_OBJECT('name', NEW.name, 'category_id', NEW.category_id, 'short_description', NEW.short_description));
END$$

DROP TRIGGER IF EXISTS trg_components_audit_au$$
CREATE TRIGGER trg_components_audit_au
AFTER UPDATE ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, old_values, new_values)
  VALUES
    ('components', 'UPDATE', CAST(NEW.component_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(),
     JSON_OBJECT('name', OLD.name, 'category_id', OLD.category_id, 'short_description', OLD.short_description),
     JSON_OBJECT('name', NEW.name, 'category_id', NEW.category_id, 'short_description', NEW.short_description));
END$$

DROP TRIGGER IF EXISTS trg_components_audit_ad$$
CREATE TRIGGER trg_components_audit_ad
AFTER DELETE ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, old_values, new_values)
  VALUES
    ('components', 'DELETE', CAST(OLD.component_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(),
     JSON_OBJECT('name', OLD.name, 'category_id', OLD.category_id, 'short_description', OLD.short_description), NULL);
END$$

-- ----------------------------------------------------------------
-- 5. Restricted-hours trigger
-- Blocks modifications on Monday (DAYOFWEEK = 2) from 14:00 to 16:00
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_components_restricted_bi$$
CREATE TRIGGER trg_components_restricted_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP) = 2 AND TIME(CURRENT_TIMESTAMP) >= '14:00:00'
     AND TIME(CURRENT_TIMESTAMP) < '16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component inserts are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_components_restricted_bu$$
CREATE TRIGGER trg_components_restricted_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP) = 2 AND TIME(CURRENT_TIMESTAMP) >= '14:00:00'
     AND TIME(CURRENT_TIMESTAMP) < '16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component updates are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_components_restricted_bd$$
CREATE TRIGGER trg_components_restricted_bd
BEFORE DELETE ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP) = 2 AND TIME(CURRENT_TIMESTAMP) >= '14:00:00'
     AND TIME(CURRENT_TIMESTAMP) < '16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component deletes are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

DELIMITER ;
