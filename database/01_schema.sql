-- ================================================================
-- ElectroDB - 01_schema.sql
-- Core catalogue, assignment demo, and audit log tables
-- Target: MySQL 8.0+ / MariaDB 10.4+
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS electrodb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE electrodb;

-- ------------------------------
-- 1. Hierarchical category tree
-- ------------------------------
CREATE TABLE IF NOT EXISTS categories (
  category_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_category_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent_order (parent_category_id, display_order),
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_categories_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 2. Tags
-- ------------------------------
CREATE TABLE IF NOT EXISTS tags (
  tag_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  PRIMARY KEY (tag_id),
  UNIQUE KEY uq_tags_name (name),
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB;

-- ------------------------------
-- 3. Components
-- ------------------------------
CREATE TABLE IF NOT EXISTS components (
  component_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  short_description VARCHAR(1000) NULL,
  description TEXT NULL,
  main_image_path VARCHAR(500) NULL,
  circuit_symbol_path VARCHAR(500) NULL,
  datasheet_url VARCHAR(1000) NULL,
  is_illustrative TINYINT(1) NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (component_id),
  UNIQUE KEY uq_components_slug (slug),
  KEY idx_components_category (category_id),
  KEY idx_components_published_category (is_published, category_id),
  KEY idx_components_name (name),
  CONSTRAINT fk_components_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_components_illustrative CHECK (is_illustrative IN (0,1)),
  CONSTRAINT chk_components_published CHECK (is_published IN (0,1)),
  CONSTRAINT chk_components_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS component_tags (
  component_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (component_id, tag_id),
  KEY idx_component_tags_tag (tag_id),
  CONSTRAINT fk_component_tags_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------
-- 4. Content types and category templates
-- ------------------------------
CREATE TABLE IF NOT EXISTS content_types (
  content_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  label VARCHAR(100) NOT NULL,
  render_kind VARCHAR(30) NOT NULL,
  description VARCHAR(500) NULL,
  PRIMARY KEY (content_type_id),
  UNIQUE KEY uq_content_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS category_content_types (
  category_id BIGINT UNSIGNED NOT NULL,
  content_type_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(80) NOT NULL,
  section_label VARCHAR(120) NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, section_key),
  KEY idx_category_content_type (content_type_id),
  CONSTRAINT fk_cct_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cct_content_type
    FOREIGN KEY (content_type_id) REFERENCES content_types(content_type_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_cct_required CHECK (is_required IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 5. Component educational content
-- ------------------------------
CREATE TABLE IF NOT EXISTS component_content (
  component_content_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  component_id BIGINT UNSIGNED NOT NULL,
  content_type_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  alt_text VARCHAR(500) NULL,
  caption VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (component_content_id),
  UNIQUE KEY uq_component_content_section (component_id, section_key),
  KEY idx_component_content_order (component_id, display_order),
  KEY idx_component_content_type (content_type_id),
  CONSTRAINT fk_component_content_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_content_type
    FOREIGN KEY (content_type_id) REFERENCES content_types(content_type_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------
-- 5A. Component diagrams (generic SVG model)
-- ------------------------------
CREATE TABLE IF NOT EXISTS component_diagrams (
  diagram_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  component_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  -- Distinguishes a pin-level symbol from a gate/transistor-level circuit
  -- diagram, and from state/timing artwork, so the UI can place each one.
  diagram_kind ENUM('SYMBOL','CIRCUIT','PINOUT','STATE','TIMING','OTHER') NOT NULL DEFAULT 'OTHER',
  image_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(500) NULL,
  caption VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (diagram_id),
  KEY idx_component_diagrams_order (component_id, display_order),
  KEY idx_component_diagrams_kind (component_id, diagram_kind),
  CONSTRAINT fk_component_diagrams_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------
-- 6. Specifications
-- ------------------------------
CREATE TABLE IF NOT EXISTS specifications (
  specification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(40) NULL,
  value_kind ENUM('NUMBER','TEXT','RANGE') NOT NULL DEFAULT 'TEXT',
  description VARCHAR(500) NULL,
  PRIMARY KEY (specification_id),
  UNIQUE KEY uq_specifications_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS component_specifications (
  component_id BIGINT UNSIGNED NOT NULL,
  specification_id BIGINT UNSIGNED NOT NULL,
  numeric_value DECIMAL(18,6) NULL,
  text_value VARCHAR(300) NULL,
  range_min DECIMAL(18,6) NULL,
  range_max DECIMAL(18,6) NULL,
  unit_override VARCHAR(40) NULL,
  source_note VARCHAR(500) NULL,
  PRIMARY KEY (component_id, specification_id),
  KEY idx_component_specs_spec (specification_id),
  CONSTRAINT fk_component_specs_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_specs_spec
    FOREIGN KEY (specification_id) REFERENCES specifications(specification_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_component_spec_range CHECK (
    range_min IS NULL OR range_max IS NULL OR range_min <= range_max
  )
) ENGINE=InnoDB;

-- ------------------------------
-- 7. Assignment-specific application users
-- ------------------------------
CREATE TABLE IF NOT EXISTS app_users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_code ENUM('NAIVE_USER','APP_DEVELOPER','DBA') NOT NULL DEFAULT 'NAIVE_USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_app_users_username (username),
  CONSTRAINT chk_app_users_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 8. Audit log
-- ------------------------------
CREATE TABLE IF NOT EXISTS application_audit_log (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(128) NOT NULL,
  operation_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  row_key VARCHAR(128) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  db_user VARCHAR(288) NOT NULL,
  application_user VARCHAR(100) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  PRIMARY KEY (audit_id),
  KEY idx_audit_table_time (table_name, changed_at),
  KEY idx_audit_operation_time (operation_type, changed_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
