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
      const res = await fetch(url, { ...options, headers });
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
        throw err;
      }
      return json;
    } catch (err) {
      console.error(`[API Error] ${path}:`, err);
      throw err;
    }
  },

  // Catalogue
  getHealth() {
    return this.request('/health');
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
