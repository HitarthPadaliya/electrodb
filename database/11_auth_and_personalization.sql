USE electrodb;

DROP PROCEDURE IF EXISTS sp_migrate_app_users_email$$

DELIMITER $$
CREATE PROCEDURE sp_migrate_app_users_email()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'app_users'
       AND COLUMN_NAME = 'email'
  ) THEN
    ALTER TABLE app_users
      ADD COLUMN email VARCHAR(255) NULL AFTER username;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'app_users'
       AND INDEX_NAME = 'uq_app_users_email'
  ) THEN

    ALTER TABLE app_users
      ADD UNIQUE KEY uq_app_users_email (email);
  END IF;
END$$
DELIMITER ;

CALL sp_migrate_app_users_email();
DROP PROCEDURE sp_migrate_app_users_email;

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (session_id),
  UNIQUE KEY uq_user_sessions_token (token_hash),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expiry (expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  component_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bookmark_id),
  UNIQUE KEY uq_bookmarks_user_component (user_id, component_id),
  KEY idx_bookmarks_user_created (user_id, created_at),
  CONSTRAINT fk_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bookmarks_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collections (
  collection_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(280) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id),
  UNIQUE KEY uq_collections_user_name (user_id, name),
  KEY idx_collections_user (user_id),
  CONSTRAINT fk_collections_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_collections_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collection_components (
  collection_id BIGINT UNSIGNED NOT NULL,
  component_id BIGINT UNSIGNED NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, component_id),
  KEY idx_collection_components_component (component_id),
  CONSTRAINT fk_collection_components_collection
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_collection_components_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id BIGINT UNSIGNED NOT NULL,
  component_id BIGINT UNSIGNED NOT NULL,
  last_viewed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, component_id),
  KEY idx_recently_viewed_user_time (user_id, last_viewed_at),
  CONSTRAINT fk_recently_viewed_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recently_viewed_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
