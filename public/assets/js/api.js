/**
 * ElectroDB API Client
 */
const api = {
  baseUrl: '/api',

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...options.headers };

    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      // The session is an HttpOnly cookie: every request must carry it, and no
      // token is ever stored in JavaScript.
      const res = await fetch(url, { credentials: 'same-origin', ...options, headers });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP error ${res.status}`);
        return text;
      }

      const json = await res.json();
      if (!res.ok) {
        const errMsg = json.error ? json.error.message : `HTTP error ${res.status}`;
        const err = new Error(errMsg);
        err.status = res.status;
        err.code = json.error ? json.error.code : 'API_ERROR';

        // A 401 outside the auth endpoints means the server-side session is
        // gone: it expired, was revoked, or the account was disabled elsewhere.
        // The page may still be holding a signed-in header from a minute ago,
        // so tell the app to reconcile rather than letting each caller decide.
        // Credential failures on /auth/* are ordinary form errors, not this.
        if (res.status === 401 && !/^\/auth\//.test(path) && typeof window !== 'undefined') {
          window.dispatchEvent(new window.CustomEvent('electrodb:unauthorized', { detail: { path } }));
        }

        throw err;
      }
      return json;
    } catch (err) {
      console.error(`[API Error] ${path}:`, err);
      throw err;
    }
  },

  // Catalog
  getHealth() {
    return this.request('/health');
  },

  // Catalogue-wide counts (components, categories, tags, diagrams...), computed
  // by the API from the database so no page has to carry its own numbers.
  getStats() {
    return this.request('/stats');
  },

  getCategories() {
    return this.request('/categories');
  },

  getCategory(idOrSlug, page = 1, pageSize = 20) {
    return this.request(`/categories/${encodeURIComponent(idOrSlug)}?page=${page}&pageSize=${pageSize}`);
  },

  getCatalog(page = 1, pageSize = 24, categoryId = null) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (categoryId) params.set('categoryId', String(categoryId));
    return this.request(`/components?${params.toString()}`);
  },

  getTags() {
    return this.request('/tags');
  },

  getTag(idOrSlug, page = 1, pageSize = 24) {
    return this.request(`/tags/${encodeURIComponent(idOrSlug)}?page=${page}&pageSize=${pageSize}`);
  },

  getComponent(idOrSlug) {
    return this.request(`/components/${encodeURIComponent(idOrSlug)}`);
  },

  search(q, page = 1, pageSize = 20) {
    return this.request(`/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`);
  },

  // ---------------------------------------------------------------- Accounts
  // All of these rely on the HttpOnly session cookie; the client never holds a
  // token and never sends a user id of its own.
  auth: {
    me() {
      return api.request('/auth/me');
    },

    register(payload) {
      return api.request('/auth/register', { method: 'POST', body: payload });
    },

    login(payload) {
      return api.request('/auth/login', { method: 'POST', body: payload });
    },

    logout() {
      return api.request('/auth/logout', { method: 'POST' });
    },

    changePassword(payload) {
      return api.request('/auth/change-password', { method: 'POST', body: payload });
    },

    updateProfile(payload) {
      return api.request('/users/me', { method: 'PATCH', body: payload });
    },

    listBookmarks(page = 1, pageSize = 24) {
      return api.request(`/users/me/bookmarks?page=${page}&pageSize=${pageSize}`);
    },

    addBookmark(componentId) {
      return api.request('/users/me/bookmarks', { method: 'POST', body: { componentId } });
    },

    removeBookmark(componentId) {
      return api.request(`/users/me/bookmarks/${encodeURIComponent(componentId)}`, { method: 'DELETE' });
    },

    listCollections() {
      return api.request('/users/me/collections');
    },

    createCollection(payload) {
      return api.request('/users/me/collections', { method: 'POST', body: payload });
    },

    updateCollection(collectionId, payload) {
      return api.request(`/users/me/collections/${encodeURIComponent(collectionId)}`, {
        method: 'PATCH',
        body: payload
      });
    },

    deleteCollection(collectionId) {
      return api.request(`/users/me/collections/${encodeURIComponent(collectionId)}`, { method: 'DELETE' });
    },

    getCollection(collectionId) {
      return api.request(`/users/me/collections/${encodeURIComponent(collectionId)}`);
    },

    addToCollection(collectionId, componentId) {
      return api.request(`/users/me/collections/${encodeURIComponent(collectionId)}/components`, {
        method: 'POST',
        body: { componentId }
      });
    },

    removeFromCollection(collectionId, componentId) {
      return api.request(
        `/users/me/collections/${encodeURIComponent(collectionId)}/components/${encodeURIComponent(componentId)}`,
        { method: 'DELETE' }
      );
    },

    recent(limit = 8) {
      return api.request(`/users/me/recently-viewed?limit=${limit}`);
    },

    recordView(componentId) {
      return api.request('/users/me/recently-viewed', { method: 'POST', body: { componentId } });
    },

    clearRecent() {
      return api.request('/users/me/recently-viewed', { method: 'DELETE' });
    },

    dashboard() {
      return api.request('/users/me/dashboard');
    },

    // Administration (DBA only; the server enforces the role)
    listUsers(query = '') {
      return api.request(`/admin/users?q=${encodeURIComponent(query)}`);
    },

    updateUser(userId, payload) {
      return api.request(`/admin/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body: payload });
    }
  },

  // Lab Console
  lab: {
    getComponents(page = 1, pageSize = 50, bounded = true) {
      return api.request(`/lab/components?page=${page}&pageSize=${pageSize}&bounded=${bounded}`);
    },

    getComponentsXml(page = 1, pageSize = 50) {
      return api.request(`/lab/components.xml?page=${page}&pageSize=${pageSize}`);
    },

    createComponent(payload) {
      return api.request('/lab/components', { method: 'POST', body: payload });
    },

    updateComponent(id, payload) {
      return api.request(`/lab/components/${id}`, { method: 'PATCH', body: payload });
    },

    deleteComponent(id) {
      return api.request(`/lab/components/${id}`, { method: 'DELETE' });
    },

    getAggregate(fn = 'COUNT', field = 'component_id', table = 'components') {
      return api.request(`/lab/aggregate?function=${encodeURIComponent(fn)}&field=${encodeURIComponent(field)}&table=${encodeURIComponent(table)}`);
    },

    getAggregateXml(fn = 'COUNT', field = 'component_id', table = 'components') {
      return api.request(`/lab/aggregate.xml?function=${encodeURIComponent(fn)}&field=${encodeURIComponent(field)}&table=${encodeURIComponent(table)}`);
    },

    getFilter(field = 'category_id', op = 'eq', value = '6', page = 1, pageSize = 50) {
      return api.request(`/lab/filter?field=${encodeURIComponent(field)}&operator=${encodeURIComponent(op)}&value=${encodeURIComponent(value)}&page=${page}&pageSize=${pageSize}`);
    },

    getFilterXml(field = 'category_id', op = 'eq', value = '6') {
      return api.request(`/lab/filter.xml?field=${encodeURIComponent(field)}&operator=${encodeURIComponent(op)}&value=${encodeURIComponent(value)}`);
    },

    getJoin(left = 'components', right = 'categories', type = 'inner', page = 1, pageSize = 25) {
      return api.request(`/lab/join?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}&type=${encodeURIComponent(type)}&page=${page}&pageSize=${pageSize}`);
    },

    getSubquery(kind = 'categories_in_digital') {
      return api.request(`/lab/subquery?kind=${encodeURIComponent(kind)}`);
    },

    getCorrelated(kind = 'categories_with_components') {
      return api.request(`/lab/correlated-query?kind=${encodeURIComponent(kind)}`);
    },

    getCursorsAll() {
      return api.request('/lab/cursors/all');
    },

    getCursorsLimited(limit = 10) {
      return api.request(`/lab/cursors/limited?limit=${limit}`);
    },

    getSum() {
      return api.request('/lab/sum');
    },

    getAppUsers() {
      return api.request('/lab/users');
    },

    createAppUser(payload) {
      return api.request('/lab/users', { method: 'POST', body: payload });
    },

    updateAppUser(id, payload) {
      return api.request(`/lab/users/${id}`, { method: 'PATCH', body: payload });
    },

    deleteAppUser(id) {
      return api.request(`/lab/users/${id}`, { method: 'DELETE' });
    },

    getAuditLogs(limit = 50) {
      return api.request(`/lab/audit-log?limit=${limit}`);
    },

    getViewCatalogue(page = 1, pageSize = 25) {
      return api.request(`/lab/views/catalogue?page=${page}&pageSize=${pageSize}`);
    },

    getViewCounts() {
      return api.request('/lab/views/counts');
    },

    getDashboard() {
      return api.request('/lab/dashboard');
    },

    getTimingReport() {
      return api.request('/lab/timing-report');
    }
  }
};
