-- ================================================================
-- ElectroDB - 04_plsql_procedures.sql
-- MySQL stored procedures implementing Assignment 10 requirements
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

USE electrodb;

DELIMITER $$

-- ----------------------------------------------------------------
-- 1. Component CRUD stored procedures
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_insert_component$$
CREATE PROCEDURE sp_insert_component(
  IN p_category_id BIGINT UNSIGNED,
  IN p_name VARCHAR(180),
  IN p_slug VARCHAR(200),
  IN p_short_description VARCHAR(1000)
)
BEGIN
  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name is required';
  END IF;
  
  -- If slug is null, generate default from name
  IF p_slug IS NULL OR CHAR_LENGTH(TRIM(p_slug)) = 0 THEN
    SET p_slug = LOWER(REPLACE(TRIM(p_name), ' ', '-'));
  END IF;

  INSERT INTO components(category_id, name, slug, short_description)
  VALUES (p_category_id, TRIM(p_name), p_slug, p_short_description);
  
  SELECT LAST_INSERT_ID() AS component_id;
END$$

DROP PROCEDURE IF EXISTS sp_update_component$$
CREATE PROCEDURE sp_update_component(
  IN p_component_id BIGINT UNSIGNED,
  IN p_category_id BIGINT UNSIGNED,
  IN p_name VARCHAR(180),
  IN p_short_description VARCHAR(1000)
)
BEGIN
  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name is required';
  END IF;

  UPDATE components
     SET category_id = p_category_id,
         name = TRIM(p_name),
         short_description = p_short_description
   WHERE component_id = p_component_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component not found or no values changed';
  END IF;
  
  SELECT p_component_id AS component_id, 'Component updated successfully' AS status;
END$$

DROP PROCEDURE IF EXISTS sp_delete_component$$
CREATE PROCEDURE sp_delete_component(
  IN p_component_id BIGINT UNSIGNED
)
BEGIN
  DELETE FROM components WHERE component_id = p_component_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component not found';
  END IF;
  
  SELECT p_component_id AS component_id, 'Component deleted successfully' AS status;
END$$

-- ----------------------------------------------------------------
-- 2. Explicit cursor procedures (Assignment 10)
-- ----------------------------------------------------------------

-- 2A. Unbounded explicit cursor: iterates through all qualifying rows
DROP PROCEDURE IF EXISTS sp_cursor_components_all$$
CREATE PROCEDURE sp_cursor_components_all()
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_id BIGINT UNSIGNED;
  DECLARE v_name VARCHAR(180);
  
  DECLARE cur_components CURSOR FOR
    SELECT component_id, name FROM components ORDER BY component_id;
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
  CREATE TEMPORARY TABLE tmp_cursor_components (
    component_id BIGINT UNSIGNED,
    name VARCHAR(180)
  );

  OPEN cur_components;
  read_loop: LOOP
    FETCH cur_components INTO v_id, v_name;
    IF v_done THEN
      LEAVE read_loop;
    END IF;
    INSERT INTO tmp_cursor_components VALUES (v_id, v_name);
  END LOOP;
  CLOSE cur_components;

  SELECT * FROM tmp_cursor_components ORDER BY component_id;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
END$$

-- 2B. Bounded explicit cursor: fetches rows up to a specified limit
DROP PROCEDURE IF EXISTS sp_cursor_components_limited$$
CREATE PROCEDURE sp_cursor_components_limited(IN p_limit INT)
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_id BIGINT UNSIGNED;
  DECLARE v_name VARCHAR(180);
  DECLARE v_count INT DEFAULT 0;

  DECLARE cur_components CURSOR FOR
    SELECT component_id, name FROM components ORDER BY component_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 10000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Limit must be between 1 and 10000';
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
  CREATE TEMPORARY TABLE tmp_cursor_components (
    component_id BIGINT UNSIGNED,
    name VARCHAR(180)
  );

  OPEN cur_components;
  read_loop: LOOP
    IF v_count >= p_limit THEN
      LEAVE read_loop;
    END IF;
    FETCH cur_components INTO v_id, v_name;
    IF v_done THEN
      LEAVE read_loop;
    END IF;
    INSERT INTO tmp_cursor_components VALUES (v_id, v_name);
    SET v_count = v_count + 1;
  END LOOP;
  CLOSE cur_components;

  SELECT * FROM tmp_cursor_components ORDER BY component_id;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
END$$

-- ----------------------------------------------------------------
-- 3. Paginated search procedures
-- ----------------------------------------------------------------

-- 3A. Paginated search without filter
DROP PROCEDURE IF EXISTS sp_search_components_page$$
CREATE PROCEDURE sp_search_components_page(IN p_page INT, IN p_page_size INT)
BEGIN
  DECLARE v_offset INT;

  IF p_page IS NULL OR p_page < 1 OR p_page_size IS NULL OR p_page_size < 1 OR p_page_size > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid page or page size';
  END IF;

  SET v_offset = (p_page - 1) * p_page_size;

  SELECT component_id, category_id, name, slug, short_description, is_published, is_illustrative
  FROM components
  WHERE is_published = 1
  ORDER BY component_id
  LIMIT p_page_size OFFSET v_offset;

  SELECT COUNT(*) AS total_rows FROM components WHERE is_published = 1;
END$$

-- 3B. Paginated search with category filter
DROP PROCEDURE IF EXISTS sp_search_components_by_category$$
CREATE PROCEDURE sp_search_components_by_category(
  IN p_category_id BIGINT UNSIGNED,
  IN p_page INT,
  IN p_page_size INT
)
BEGIN
  DECLARE v_offset INT;

  IF p_page IS NULL OR p_page < 1 OR p_page_size IS NULL OR p_page_size < 1 OR p_page_size > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid page or page size';
  END IF;

  SET v_offset = (p_page - 1) * p_page_size;

  SELECT component_id, category_id, name, slug, short_description, is_published, is_illustrative
  FROM components
  WHERE is_published = 1 AND category_id = p_category_id
  ORDER BY component_id
  LIMIT p_page_size OFFSET v_offset;

  SELECT COUNT(*) AS total_rows
  FROM components
  WHERE is_published = 1 AND category_id = p_category_id;
END$$

-- ----------------------------------------------------------------
-- 4. Grouped sum procedure (Assignment 10)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_sum_component_ids_by_category$$
CREATE PROCEDURE sp_sum_component_ids_by_category()
BEGIN
  SELECT cat.category_id,
         cat.name AS category_name,
         COUNT(c.component_id) AS component_count,
         COALESCE(SUM(c.component_id), 0) AS sum_component_ids
  FROM categories cat
  LEFT JOIN components c ON c.category_id = cat.category_id
  GROUP BY cat.category_id, cat.name
  ORDER BY cat.category_id;
END$$

-- ----------------------------------------------------------------
-- 5. Application user login CRUD procedures (Assignment 10)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_insert_app_user$$
CREATE PROCEDURE sp_insert_app_user(
  IN p_username VARCHAR(100),
  IN p_password_hash VARCHAR(255),
  IN p_role_code VARCHAR(40)
)
BEGIN
  IF p_username IS NULL OR CHAR_LENGTH(TRIM(p_username)) = 0 OR p_password_hash IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username and password hash are required';
  END IF;

  IF p_role_code NOT IN ('NAIVE_USER', 'APP_DEVELOPER', 'DBA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid application role; must be NAIVE_USER, APP_DEVELOPER, or DBA';
  END IF;

  INSERT INTO app_users(username, password_hash, role_code)
  VALUES (TRIM(p_username), p_password_hash, p_role_code);

  SELECT LAST_INSERT_ID() AS user_id;
END$$

DROP PROCEDURE IF EXISTS sp_update_app_user$$
CREATE PROCEDURE sp_update_app_user(
  IN p_user_id BIGINT UNSIGNED,
  IN p_role_code VARCHAR(40),
  IN p_is_active TINYINT
)
BEGIN
  IF p_role_code NOT IN ('NAIVE_USER', 'APP_DEVELOPER', 'DBA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid application role; must be NAIVE_USER, APP_DEVELOPER, or DBA';
  END IF;

  UPDATE app_users
     SET role_code = p_role_code,
         is_active = p_is_active
   WHERE user_id = p_user_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'App user not found or unchanged';
  END IF;

  SELECT p_user_id AS user_id, 'App user updated successfully' AS status;
END$$

DROP PROCEDURE IF EXISTS sp_delete_app_user$$
CREATE PROCEDURE sp_delete_app_user(IN p_user_id BIGINT UNSIGNED)
BEGIN
  DELETE FROM app_users WHERE user_id = p_user_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'App user not found';
  END IF;

  SELECT p_user_id AS user_id, 'App user deleted successfully' AS status;
END$$

DELIMITER ;
