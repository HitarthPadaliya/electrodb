/**
 * MySQL/MariaDB implementation of the personalization store.
 *
 * Every statement is parameterised. The tables are created by
 * database/11_auth_and_personalization.sql.
 */
const pool = require('./pool');
const { toDbDateTimeMs } = require('../utils/datetime');

const USER_COLUMNS = 'user_id, username, email, role_code, is_active, created_at, updated_at, last_login_at';

function toUser(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    username: row.username,
    email: row.email || null,
    roleCode: row.role_code,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at
  };
}

function toSummary(row) {
  if (!row) return null;
  return {
    componentId: row.component_id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description || null,
    categoryId: row.category_id || null,
    categoryName: row.category_name || null,
    categorySlug: row.category_slug || null,
    circuitSymbolPath: row.circuit_symbol_path || null,
    mainImagePath: row.main_image_path || null
  };
}

const COMPONENT_SUMMARY_SELECT = `
  SELECT c.component_id, c.name, c.slug, c.short_description, c.circuit_symbol_path,
         c.main_image_path, cat.category_id, cat.name AS category_name, cat.slug AS category_slug
    FROM components c
    LEFT JOIN categories cat ON cat.category_id = c.category_id`;

function isDuplicate(err) {
  return err && err.code === 'ER_DUP_ENTRY';
}

async function findUserById(userId) {
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM app_users WHERE user_id = ? LIMIT 1`, [userId]);
  return toUser(rows[0]);
}

async function findCollection(userId, collectionId) {
  const [rows] = await pool.query(
    `SELECT collection_id, user_id, name, description, created_at, updated_at
       FROM collections WHERE collection_id = ? AND user_id = ? LIMIT 1`,
    [collectionId, userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    collectionId: row.collection_id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  kind: 'mysql',

  components: {
    async exists(componentId) {
      const [rows] = await pool.query('SELECT 1 AS found FROM components WHERE component_id = ? LIMIT 1', [componentId]);
      return rows.length > 0;
    },
    async summary(componentId) {
      const [rows] = await pool.query(`${COMPONENT_SUMMARY_SELECT} WHERE c.component_id = ?`, [componentId]);
      return toSummary(rows[0]);
    }
  },

  users: {
    async findByEmail(email) {
      const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM app_users WHERE email = ? LIMIT 1`, [
        String(email).toLowerCase()
      ]);
      return toUser(rows[0]);
    },

    async findByUsername(username) {
      const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM app_users WHERE username = ? LIMIT 1`, [username]);
      return toUser(rows[0]);
    },

    async findById(userId) {
      const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM app_users WHERE user_id = ? LIMIT 1`, [userId]);
      return toUser(rows[0]);
    },

    async create({ username, email, passwordHash, roleCode }) {
      const [result] = await pool.query(
        `INSERT INTO app_users (username, email, password_hash, role_code) VALUES (?, ?, ?, ?)`,
        [username, String(email).toLowerCase(), passwordHash, roleCode]
      );
      return findUserById(result.insertId);
    },

    async updateProfile(userId, patch) {
      const fields = [];
      const params = [];
      if (patch.username !== undefined) {
        fields.push('username = ?');
        params.push(patch.username);
      }
      if (patch.email !== undefined) {
        fields.push('email = ?');
        params.push(String(patch.email).toLowerCase());
      }
      if (!fields.length) return findUserById(userId);
      params.push(userId);
      await pool.query(`UPDATE app_users SET ${fields.join(', ')} WHERE user_id = ?`, params);
      return findUserById(userId);
    },

    async updatePassword(userId, passwordHash) {
      await pool.query('UPDATE app_users SET password_hash = ? WHERE user_id = ?', [passwordHash, userId]);
      return true;
    },

    async touchLogin(userId) {
      await pool.query('UPDATE app_users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);
      return true;
    },

    async setRoleAndStatus(userId, { roleCode, isActive }) {
      const fields = [];
      const params = [];
      if (roleCode !== undefined) {
        fields.push('role_code = ?');
        params.push(roleCode);
      }
      if (isActive !== undefined) {
        fields.push('is_active = ?');
        params.push(isActive ? 1 : 0);
      }
      if (!fields.length) return findUserById(userId);
      params.push(userId);
      await pool.query(`UPDATE app_users SET ${fields.join(', ')} WHERE user_id = ?`, params);
      return findUserById(userId);
    },

    async list({ limit = 50, offset = 0, query = '' } = {}) {
      const needle = String(query || '').trim();
      const where = needle ? 'WHERE u.username LIKE ? OR u.email LIKE ?' : '';
      const params = needle ? [`%${needle}%`, `%${needle}%`] : [];

      const [rows] = await pool.query(
        `SELECT ${USER_COLUMNS.split(', ').map(c => `u.${c}`).join(', ')},
                (SELECT COUNT(*) FROM bookmarks b WHERE b.user_id = u.user_id) AS bookmark_count,
                (SELECT COUNT(*) FROM collections col WHERE col.user_id = u.user_id) AS collection_count
           FROM app_users u
           ${where}
          ORDER BY u.user_id DESC
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM app_users u ${where}`,
        params
      );

      return {
        items: rows.map(row => ({
          ...toUser(row),
          bookmarkCount: Number(row.bookmark_count) || 0,
          collectionCount: Number(row.collection_count) || 0
        })),
        total: Number(countRows[0].total) || 0
      };
    },

    async passwordHash(userId) {
      const [rows] = await pool.query('SELECT password_hash FROM app_users WHERE user_id = ? LIMIT 1', [userId]);
      return rows[0] ? rows[0].password_hash : null;
    },

    async countActiveByRole(roleCode, excludeUserId = null) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total FROM app_users
          WHERE role_code = ? AND is_active = 1 AND user_id <> ?`,
        [roleCode, Number(excludeUserId) || 0]
      );
      return Number(rows[0].total) || 0;
    }
  },

  sessions: {
    async create({ userId, tokenHash, expiresAt }) {
      const [result] = await pool.query(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
      );
      return result.insertId;
    },

    async findWithUser(tokenHash) {
      const [rows] = await pool.query(
        `SELECT s.session_id, s.user_id, s.token_hash, s.created_at, s.last_seen_at, s.expires_at,
                u.username, u.email, u.role_code, u.is_active, u.created_at AS user_created_at,
                u.updated_at AS user_updated_at, u.last_login_at
           FROM user_sessions s
           JOIN app_users u ON u.user_id = s.user_id
          WHERE s.token_hash = ?
          LIMIT 1`,
        [tokenHash]
      );
      const row = rows[0];
      if (!row) return null;
      return {
        session: {
          sessionId: row.session_id,
          userId: row.user_id,
          tokenHash: row.token_hash,
          createdAt: row.created_at,
          lastSeenAt: row.last_seen_at,
          expiresAt: row.expires_at
        },
        user: {
          userId: row.user_id,
          username: row.username,
          email: row.email || null,
          roleCode: row.role_code,
          isActive: Boolean(row.is_active),
          createdAt: row.user_created_at,
          updatedAt: row.user_updated_at,
          lastLoginAt: row.last_login_at
        }
      };
    },

    async touch(sessionId, { lastSeenAt, expiresAt }) {
      if (expiresAt) {
        await pool.query(
          'UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP, expires_at = ? WHERE session_id = ?',
          [expiresAt, sessionId]
        );
      } else {
        await pool.query('UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE session_id = ?', [sessionId]);
      }
    },

    async deleteByTokenHash(tokenHash) {
      await pool.query('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
      return true;
    },

    async deleteForUser(userId, { keepTokenHash = null } = {}) {
      if (keepTokenHash) {
        await pool.query('DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?', [userId, keepTokenHash]);
      } else {
        await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
      }
      return true;
    }
  },

  bookmarks: {
    async add(userId, componentId) {
      try {
        await pool.query('INSERT INTO bookmarks (user_id, component_id) VALUES (?, ?)', [userId, componentId]);
        return { created: true };
      } catch (err) {
        // The unique key is the concurrency guard: two identical requests
        // racing each other end with one row and one "already there" answer.
        if (isDuplicate(err)) return { created: false };
        throw err;
      }
    },

    async remove(userId, componentId) {
      const [result] = await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND component_id = ?', [
        userId,
        componentId
      ]);
      return result.affectedRows > 0;
    },

    async list(userId, { limit = 100, offset = 0 } = {}) {
      const [rows] = await pool.query(
        `SELECT c.component_id, c.name, c.slug, c.short_description, c.circuit_symbol_path,
                c.main_image_path, cat.category_id, cat.name AS category_name, cat.slug AS category_slug,
                b.created_at AS bookmarked_at
           FROM bookmarks b
           JOIN components c ON c.component_id = b.component_id
           LEFT JOIN categories cat ON cat.category_id = c.category_id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC, b.bookmark_id DESC
          LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?', [userId]);
      return {
        items: rows.map(row => ({ ...toSummary(row), bookmarkedAt: row.bookmarked_at })),
        total: Number(countRows[0].total) || 0
      };
    },

    async ids(userId) {
      const [rows] = await pool.query('SELECT component_id FROM bookmarks WHERE user_id = ?', [userId]);
      return rows.map(row => Number(row.component_id));
    },

    async count(userId) {
      const [rows] = await pool.query('SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?', [userId]);
      return Number(rows[0].total) || 0;
    }
  },

  collections: {
    async list(userId) {
      const [rows] = await pool.query(
        `SELECT col.collection_id, col.user_id, col.name, col.description, col.created_at, col.updated_at,
                (SELECT COUNT(*) FROM collection_components cc WHERE cc.collection_id = col.collection_id) AS item_count
           FROM collections col
          WHERE col.user_id = ?
          ORDER BY col.created_at DESC, col.collection_id DESC`,
        [userId]
      );
      return rows.map(row => ({
        collectionId: row.collection_id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        itemCount: Number(row.item_count) || 0
      }));
    },

    async create(userId, { name, description = null }) {
      const [result] = await pool.query('INSERT INTO collections (user_id, name, description) VALUES (?, ?, ?)', [
        userId,
        name,
        description
      ]);
      const collection = await findCollection(userId, result.insertId);
      return { ...collection, itemCount: 0 };
    },

    async find(userId, collectionId) {
      return findCollection(userId, collectionId);
    },

    async update(userId, collectionId, patch) {
      const fields = [];
      const params = [];
      if (patch.name !== undefined) {
        fields.push('name = ?');
        params.push(patch.name);
      }
      if (patch.description !== undefined) {
        fields.push('description = ?');
        params.push(patch.description);
      }
      if (!fields.length) return findCollection(userId, collectionId);
      params.push(collectionId, userId);
      await pool.query(`UPDATE collections SET ${fields.join(', ')} WHERE collection_id = ? AND user_id = ?`, params);
      return findCollection(userId, collectionId);
    },

    async remove(userId, collectionId) {
      // collection_components rows go with it through ON DELETE CASCADE.
      const [result] = await pool.query('DELETE FROM collections WHERE collection_id = ? AND user_id = ?', [
        collectionId,
        userId
      ]);
      return result.affectedRows > 0;
    },

    async items(userId, collectionId) {
      const collection = await findCollection(userId, collectionId);
      if (!collection) return null;
      const [rows] = await pool.query(
        `SELECT c.component_id, c.name, c.slug, c.short_description, c.circuit_symbol_path,
                c.main_image_path, cat.category_id, cat.name AS category_name, cat.slug AS category_slug,
                cc.added_at
           FROM collection_components cc
           JOIN components c ON c.component_id = cc.component_id
           LEFT JOIN categories cat ON cat.category_id = c.category_id
          WHERE cc.collection_id = ?
          ORDER BY cc.added_at DESC`,
        [collectionId]
      );
      return rows.map(row => ({ ...toSummary(row), addedAt: row.added_at }));
    },

    async addItem(userId, collectionId, componentId) {
      const collection = await findCollection(userId, collectionId);
      if (!collection) return { found: false, created: false };
      try {
        await pool.query('INSERT INTO collection_components (collection_id, component_id) VALUES (?, ?)', [
          collectionId,
          componentId
        ]);
        return { found: true, created: true };
      } catch (err) {
        if (isDuplicate(err)) return { found: true, created: false };
        throw err;
      }
    },

    async removeItem(userId, collectionId, componentId) {
      const collection = await findCollection(userId, collectionId);
      if (!collection) return { found: false, removed: false };
      const [result] = await pool.query(
        'DELETE FROM collection_components WHERE collection_id = ? AND component_id = ?',
        [collectionId, componentId]
      );
      return { found: true, removed: result.affectedRows > 0 };
    },

    async count(userId) {
      const [rows] = await pool.query('SELECT COUNT(*) AS total FROM collections WHERE user_id = ?', [userId]);
      return Number(rows[0].total) || 0;
    }
  },

  recent: {
    async record(userId, componentId) {
      // Millisecond precision keeps "most recent" unambiguous when two
      // components are opened in quick succession.
      const stamp = toDbDateTimeMs();
      await pool.query(
        `INSERT INTO recently_viewed (user_id, component_id, last_viewed_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE last_viewed_at = VALUES(last_viewed_at)`,
        [userId, componentId, stamp]
      );
    },

    async list(userId, limit = 10) {
      const [rows] = await pool.query(
        `SELECT c.component_id, c.name, c.slug, c.short_description, c.circuit_symbol_path,
                c.main_image_path, cat.category_id, cat.name AS category_name, cat.slug AS category_slug,
                rv.last_viewed_at
           FROM recently_viewed rv
           JOIN components c ON c.component_id = rv.component_id
           LEFT JOIN categories cat ON cat.category_id = c.category_id
          WHERE rv.user_id = ?
          ORDER BY rv.last_viewed_at DESC, rv.component_id DESC
          LIMIT ?`,
        [userId, limit]
      );
      return rows.map(row => ({ ...toSummary(row), viewedAt: row.last_viewed_at }));
    },

    async clear(userId) {
      await pool.query('DELETE FROM recently_viewed WHERE user_id = ?', [userId]);
      return true;
    },

    async count(userId) {
      const [rows] = await pool.query('SELECT COUNT(*) AS total FROM recently_viewed WHERE user_id = ?', [userId]);
      return Number(rows[0].total) || 0;
    }
  }
};
