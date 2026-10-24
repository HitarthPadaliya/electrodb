/**
 * In-memory implementation of the personalization store.
 *
 * Two consumers:
 *   - `scripts/preview-server.js`, so the whole account feature can be reviewed
 *     on a machine without MySQL (the preview server is a UI fixture);
 *   - `server/tests/personal.test.js`, which drives the real Express routes,
 *     middleware and services against it.
 *
 * It follows the same contract as `personalMysqlStore.js` exactly; nothing in
 * the services or controllers knows which one is mounted.
 */

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString().replace('T', ' ').slice(0, 19);
}

function createMemoryStore() {
  const state = {
    users: [],
    sessions: [],
    bookmarks: [],
    collections: [],
    collectionItems: [],
    recent: [],
    components: new Map(),
    sequences: { users: 0, sessions: 0, bookmarks: 0, collections: 0, recent: 0 }
  };

  const nextId = key => {
    state.sequences[key] += 1;
    return state.sequences[key];
  };

  const publicUser = user => (user ? {
    userId: user.userId,
    username: user.username,
    email: user.email,
    roleCode: user.roleCode,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt
  } : null);

  const summary = componentId => {
    const component = state.components.get(Number(componentId));
    if (!component) return null;
    return {
      componentId: component.component_id,
      name: component.name,
      slug: component.slug,
      shortDescription: component.short_description || null,
      categoryId: component.category_id || null,
      categoryName: component.category_name || null,
      categorySlug: component.category_slug || null,
      circuitSymbolPath: component.circuit_symbol_path || null,
      mainImagePath: component.main_image_path || null
    };
  };

  return {
    kind: 'memory',

    /** Catalogue wiring: the store needs to know which components exist. */
    components: {
      seed(list = []) {
        state.components.clear();
        list.forEach(component => {
          const id = Number(component.component_id ?? component.componentId);
          if (!Number.isInteger(id)) return;
          state.components.set(id, {
            component_id: id,
            name: component.name,
            slug: component.slug,
            short_description: component.short_description ?? component.shortDescription ?? null,
            category_id: Number(component.category_id ?? component.categoryId) || null,
            category_name: component.category_name ?? component.categoryName ?? null,
            category_slug: component.category_slug ?? component.categorySlug ?? null,
            circuit_symbol_path: component.circuit_symbol_path ?? component.circuitSymbolPath ?? null,
            main_image_path: component.main_image_path ?? component.mainImagePath ?? null
          });
        });
      },
      async exists(componentId) {
        return state.components.has(Number(componentId));
      },
      async summary(componentId) {
        return summary(componentId);
      }
    },

    users: {
      async findByEmail(email) {
        return publicUser(state.users.find(u => u.email === String(email).toLowerCase()) || null);
      },
      async findByUsername(username) {
        const needle = String(username).toLowerCase();
        return publicUser(state.users.find(u => u.username.toLowerCase() === needle) || null);
      },
      async findById(userId) {
        return publicUser(state.users.find(u => u.userId === Number(userId)) || null);
      },
      async create({ username, email, passwordHash, roleCode }) {
        const user = {
          userId: nextId('users'),
          username,
          email: String(email).toLowerCase(),
          passwordHash,
          roleCode,
          isActive: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          lastLoginAt: null
        };
        state.users.push(user);
        return publicUser(user);
      },
      async updateProfile(userId, patch) {
        const user = state.users.find(u => u.userId === Number(userId));
        if (!user) return null;
        if (patch.username !== undefined) user.username = patch.username;
        if (patch.email !== undefined) user.email = String(patch.email).toLowerCase();
        user.updatedAt = nowIso();
        return publicUser(user);
      },
      async updatePassword(userId, passwordHash) {
        const user = state.users.find(u => u.userId === Number(userId));
        if (!user) return null;
        user.passwordHash = passwordHash;
        user.updatedAt = nowIso();
        return true;
      },
      async touchLogin(userId) {
        const user = state.users.find(u => u.userId === Number(userId));
        if (user) user.lastLoginAt = nowIso();
        return true;
      },
      async setRoleAndStatus(userId, { roleCode, isActive }) {
        const user = state.users.find(u => u.userId === Number(userId));
        if (!user) return null;
        if (roleCode !== undefined) user.roleCode = roleCode;
        if (isActive !== undefined) user.isActive = Boolean(isActive);
        user.updatedAt = nowIso();
        return publicUser(user);
      },
      async list({ limit = 50, offset = 0, query = '' } = {}) {
        const needle = String(query || '').trim().toLowerCase();
        const filtered = state.users
          .filter(u => !needle || u.username.toLowerCase().includes(needle) || u.email.includes(needle))
          .sort((a, b) => b.userId - a.userId);
        return {
          items: filtered.slice(offset, offset + limit).map(user => ({
            ...publicUser(user),
            bookmarkCount: state.bookmarks.filter(b => b.userId === user.userId).length,
            collectionCount: state.collections.filter(c => c.userId === user.userId).length
          })),
          total: filtered.length
        };
      },
      async passwordHash(userId) {
        const user = state.users.find(u => u.userId === Number(userId));
        return user ? user.passwordHash : null;
      },
      async countActiveByRole(roleCode, excludeUserId = null) {
        return state.users.filter(
          u => u.roleCode === roleCode && u.isActive && u.userId !== Number(excludeUserId)
        ).length;
      }
    },

    sessions: {
      async create({ userId, tokenHash, expiresAt }) {
        const session = {
          sessionId: nextId('sessions'),
          userId: Number(userId),
          tokenHash,
          createdAt: nowIso(),
          lastSeenAt: nowIso(),
          expiresAt
        };
        state.sessions.push(session);
        return session.sessionId;
      },
      async findWithUser(tokenHash) {
        const session = state.sessions.find(s => s.tokenHash === tokenHash);
        if (!session) return null;
        const user = state.users.find(u => u.userId === session.userId);
        if (!user) return null;
        return { session, user: publicUser(user) };
      },
      async touch(sessionId, { lastSeenAt, expiresAt }) {
        const session = state.sessions.find(s => s.sessionId === Number(sessionId));
        if (!session) return;
        if (lastSeenAt) session.lastSeenAt = lastSeenAt;
        if (expiresAt) session.expiresAt = expiresAt;
      },
      async deleteByTokenHash(tokenHash) {
        state.sessions = state.sessions.filter(s => s.tokenHash !== tokenHash);
        return true;
      },
      async deleteForUser(userId, { keepTokenHash = null } = {}) {
        state.sessions = state.sessions.filter(
          s => s.userId !== Number(userId) || (keepTokenHash && s.tokenHash === keepTokenHash)
        );
        return true;
      }
    },

    bookmarks: {
      async add(userId, componentId) {
        const exists = state.bookmarks.some(
          b => b.userId === Number(userId) && b.componentId === Number(componentId)
        );
        if (exists) return { created: false };
        const bookmark = {
          bookmarkId: nextId('bookmarks'),
          userId: Number(userId),
          componentId: Number(componentId),
          createdAt: nowIso()
        };
        state.bookmarks.push(bookmark);
        return { created: true };
      },
      async remove(userId, componentId) {
        const before = state.bookmarks.length;
        state.bookmarks = state.bookmarks.filter(
          b => !(b.userId === Number(userId) && b.componentId === Number(componentId))
        );
        return state.bookmarks.length < before;
      },
      async list(userId, { limit = 100, offset = 0 } = {}) {
        const rows = state.bookmarks
          .filter(b => b.userId === Number(userId))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.bookmarkId - a.bookmarkId));
        const items = rows
          .slice(offset, offset + limit)
          .map(b => ({ ...summary(b.componentId), bookmarkedAt: b.createdAt }))
          .filter(Boolean);
        return { items, total: rows.length };
      },
      async ids(userId) {
        return state.bookmarks.filter(b => b.userId === Number(userId)).map(b => b.componentId);
      },
      async count(userId) {
        return state.bookmarks.filter(b => b.userId === Number(userId)).length;
      }
    },

    collections: {
      async list(userId) {
        return state.collections
          .filter(c => c.userId === Number(userId))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.collectionId - a.collectionId))
          .map(collection => ({
            ...collection,
            itemCount: state.collectionItems.filter(i => i.collectionId === collection.collectionId).length
          }));
      },
      async create(userId, { name, description = null }) {
        const collection = {
          collectionId: nextId('collections'),
          userId: Number(userId),
          name,
          description,
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        state.collections.push(collection);
        return { ...collection, itemCount: 0 };
      },
      async find(userId, collectionId) {
        const collection = state.collections.find(
          c => c.collectionId === Number(collectionId) && c.userId === Number(userId)
        );
        return collection ? { ...collection } : null;
      },
      async update(userId, collectionId, patch) {
        const collection = state.collections.find(
          c => c.collectionId === Number(collectionId) && c.userId === Number(userId)
        );
        if (!collection) return null;
        if (patch.name !== undefined) collection.name = patch.name;
        if (patch.description !== undefined) collection.description = patch.description;
        collection.updatedAt = nowIso();
        return { ...collection };
      },
      async remove(userId, collectionId) {
        const before = state.collections.length;
        state.collections = state.collections.filter(
          c => !(c.collectionId === Number(collectionId) && c.userId === Number(userId))
        );
        if (state.collections.length === before) return false;
        state.collectionItems = state.collectionItems.filter(i => i.collectionId !== Number(collectionId));
        return true;
      },
      async items(userId, collectionId) {
        const collection = state.collections.find(
          c => c.collectionId === Number(collectionId) && c.userId === Number(userId)
        );
        if (!collection) return null;
        return state.collectionItems
          .filter(i => i.collectionId === collection.collectionId)
          .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
          .map(i => ({ ...summary(i.componentId), addedAt: i.addedAt }))
          .filter(Boolean);
      },
      async addItem(userId, collectionId, componentId) {
        const collection = state.collections.find(
          c => c.collectionId === Number(collectionId) && c.userId === Number(userId)
        );
        if (!collection) return { found: false, created: false };
        const exists = state.collectionItems.some(
          i => i.collectionId === collection.collectionId && i.componentId === Number(componentId)
        );
        if (exists) return { found: true, created: false };
        state.collectionItems.push({
          collectionId: collection.collectionId,
          componentId: Number(componentId),
          addedAt: nowIso()
        });
        collection.updatedAt = nowIso();
        return { found: true, created: true };
      },
      async removeItem(userId, collectionId, componentId) {
        const collection = state.collections.find(
          c => c.collectionId === Number(collectionId) && c.userId === Number(userId)
        );
        if (!collection) return { found: false, removed: false };
        const before = state.collectionItems.length;
        state.collectionItems = state.collectionItems.filter(
          i => !(i.collectionId === collection.collectionId && i.componentId === Number(componentId))
        );
        return { found: true, removed: state.collectionItems.length < before };
      },
      async count(userId) {
        return state.collections.filter(c => c.userId === Number(userId)).length;
      }
    },

    recent: {
      async record(userId, componentId) {
        const existing = state.recent.find(
          r => r.userId === Number(userId) && r.componentId === Number(componentId)
        );
        if (existing) {
          existing.lastViewedAt = nowIso();
          existing.seq = nextId('recent');
          return;
        }
        state.recent.push({
          userId: Number(userId),
          componentId: Number(componentId),
          lastViewedAt: nowIso(),
          // Monotonic counter: two views inside the same second still have a
          // definite order, exactly what DATETIME(6) gives the SQL store.
          seq: nextId('recent')
        });
      },
      async list(userId, limit = 10) {
        return state.recent
          .filter(r => r.userId === Number(userId))
          .sort((a, b) => b.seq - a.seq)
          .slice(0, limit)
          .map(r => ({ ...summary(r.componentId), viewedAt: r.lastViewedAt }))
          .filter(Boolean);
      },
      async clear(userId) {
        state.recent = state.recent.filter(r => r.userId !== Number(userId));
        return true;
      },
      async count(userId) {
        return state.recent.filter(r => r.userId === Number(userId)).length;
      }
    }
  };
}

module.exports = { createMemoryStore };
