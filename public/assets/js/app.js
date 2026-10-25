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

    getHealth() {
    return this.request('/health');
  },

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

        listUsers(query = '') {
      return api.request(`/admin/users?q=${encodeURIComponent(query)}`);
    },

    updateUser(userId, payload) {
      return api.request(`/admin/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body: payload });
    }
  },

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

const account = {
  user: null,
  bookmarkIds: new Set(),

            sessionVersion: 0,

  bumpSessionVersion() {
    this.sessionVersion += 1;
    return this.sessionVersion;
  },

  async loadSession() {
    this.watchSession();
    const version = this.sessionVersion;
    try {
      const res = await api.auth.me();
      if (version === this.sessionVersion) this.applySession(res.data);
    } catch (err) {
                  if (version === this.sessionVersion) this.applySession({ user: null, bookmarkIds: [] });
    }
    return this.user;
  },

    watchFocus() {
    if (this.focusWatching) return;
    this.focusWatching = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !this.isSignedIn()) return;
      const now = Date.now();
      if (now - (this.lastCheckAt || 0) < 60000) return;
      this.lastCheckAt = now;
      api.auth
        .me()
        .then(res => {
          if (!res.data.user) this.onSessionLost();
          else this.applySession(res.data);
        })
        .catch(() => {});
    });
  },

  watchSession() {
    if (this.watching) return;
    this.watching = true;
    window.addEventListener('electrodb:unauthorized', () => this.onSessionLost());
    this.watchFocus();
  },

    isProtectedRoute(hash = window.location.hash || '') {
    return /^#\/(dashboard|bookmarks|collections|profile|admin)\b/.test(hash);
  },

    clearSession() {
    const wasSignedIn = this.isSignedIn();
    this.bumpSessionVersion();
    this.applySession({ user: null, bookmarkIds: [] });
    return wasSignedIn;
  },

  onSessionLost() {
    const wasSignedIn = this.clearSession();
    if (!wasSignedIn) return;

        const now = Date.now();
    if (now - (this.sessionLostAt || 0) < 2000) return;
    this.sessionLostAt = now;

    const next = this.currentRoute();

            if (this.isProtectedRoute()) {
      window.location.hash = this.loginHref(next);
      return;
    }
    app.openModal(
      'Your session ended',
      `<p class="modal-lead">The server no longer has this session, so the change was not saved. That happens when a session expires, when the password is changed somewhere else, or when an administrator disables the account.</p>
       <p class="modal-lead">Signing in again brings you straight back to this page.</p>
       <div class="modal-actions">
         <a class="btn btn-primary" href="${this.loginHref(next)}">Sign in again</a>
       </div>`
    );
  },

  applySession(data = {}) {
    this.user = data.user || null;
    this.lastCheckAt = Date.now();
    this.bookmarkIds = new Set((data.bookmarkIds || []).map(Number));
    this.renderNav();
    document.body.classList.toggle('is-signed-in', Boolean(this.user));
    return this.user;
  },

  isSignedIn() {
    return Boolean(this.user);
  },

  role() {
    return this.user ? this.user.role : null;
  },

  canAuthor() {
    return Boolean(this.user && this.user.permissions && this.user.permissions.canAuthorContent);
  },

  canAdminister() {
    return Boolean(this.user && this.user.permissions && this.user.permissions.canAdminister);
  },

  isBookmarked(componentId) {
    return this.bookmarkIds.has(Number(componentId));
  },

    currentRoute() {
    return window.location.hash || '#/';
  },

  loginHref(intent) {
    const next = intent || this.currentRoute();
    return `#/login?next=${encodeURIComponent(next)}`;
  },

  guard() {
    if (this.isSignedIn()) return true;
    const next = this.currentRoute();
    window.location.hash = `#/login?next=${encodeURIComponent(next)}`;
    return false;
  },

  renderNav() {
            document.querySelectorAll('[data-requires]').forEach(el => {
      const need = el.getAttribute('data-requires');
                  const visible =
        need === 'user' ? Boolean(this.user)
          : need === 'author' ? this.canAuthor()
            : need === 'admin' ? this.canAdminister()
              : true;
      el.hidden = !visible;
    });

    const host = document.getElementById('nav-account');
    if (!host) return;

    if (!this.user) {
      host.innerHTML = `
        <a class="nav-account-link" href="${this.loginHref('#/dashboard')}" data-requires-guest>Sign in</a>
        <a class="btn btn-primary btn-sm nav-cta" href="#/register">Create account</a>
      `;
      return;
    }

    const initials = this.user.username.slice(0, 2).toUpperCase();
    host.innerHTML = `
      <a class="nav-user" href="#/profile" title="Your profile">
        <span class="nav-avatar" aria-hidden="true">${app.escapeHtml(initials)}</span>
        <span class="nav-username">${app.escapeHtml(this.user.username)}</span>
        <span class="nav-role">${app.escapeHtml(this.user.role)}</span>
      </a>
      <a class="nav-account-link" href="#/dashboard">Dashboard</a>
      <a class="nav-account-link" href="#/bookmarks">Bookmarks</a>
      <button class="nav-account-link nav-signout" type="button" data-action="sign-out">Sign out</button>
    `;
  },

  async signOut() {
    try {
      await api.auth.logout();
    } catch (err) {
          }
    this.applySession({ user: null, bookmarkIds: [] });
    app.toast('Signed out.', 'success');
    window.location.hash = '#/';
  },

    bookmarkButton(componentId, { labelled = false } = {}) {
    const saved = this.isBookmarked(componentId);
    const name = this.bookmarkName(componentId);
    const label = labelled ? (saved ? 'Saved' : 'Save') : '';
    return `
      <button class="bookmark-btn${saved ? ' is-saved' : ''}" type="button"
              data-action="toggle-bookmark" data-arg="${componentId}"
              aria-pressed="${saved ? 'true' : 'false'}"
              aria-label="${saved ? 'Remove from' : 'Add to'} bookmarks${name ? `: ${app.escapeHtml(name)}` : ''}">
        ${this.bookmarkIcon()}
        ${label ? `<span class="bookmark-btn-text">${label}</span>` : ''}
      </button>
    `;
  },

  bookmarkIcon() {
    return `<svg class="bookmark-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/></svg>`;
  },

  bookmarkName(componentId) {
    const node = document.querySelector(`.component-card[data-component-id="${componentId}"] .component-card-title`);
    return node ? node.textContent.trim() : '';
  },

  async toggleBookmark(componentId, element) {
    const id = Number(componentId);
    if (!id) return;

    if (!this.isSignedIn()) {
      this.promptSignIn('bookmark');
      return;
    }

    const wasSaved = this.isBookmarked(id);
    const target = element || document.querySelector(`[data-action="toggle-bookmark"][data-arg="${id}"]`);

    try {
      if (wasSaved) {
        await api.auth.removeBookmark(id);
        this.bookmarkIds.delete(id);
      } else {
        await api.auth.addBookmark(id);
        this.bookmarkIds.add(id);
      }
      this.syncBookmarkControls(id, !wasSaved);
      app.toast(wasSaved ? 'Removed from bookmarks.' : 'Added to bookmarks.', 'success');

                  if (wasSaved && window.location.hash.startsWith('#/bookmarks')) {
        await this.renderBookmarks();
      }
    } catch (err) {
            if (err.status === 401) return;
      app.toast(err.message || 'Could not update that bookmark.', 'error');
    }

    if (target) target.blur();
  },

    syncBookmarkControls(componentId, saved) {
    document
      .querySelectorAll(`[data-action="toggle-bookmark"][data-arg="${componentId}"]`)
      .forEach(button => {
        button.classList.toggle('is-saved', saved);
        button.setAttribute('aria-pressed', saved ? 'true' : 'false');
        const label = button.querySelector('.bookmark-btn-text');
        if (label) label.textContent = saved ? 'Saved' : 'Save';
        const aria = button.getAttribute('aria-label') || '';
        button.setAttribute(
          'aria-label',
          saved ? aria.replace(/^Add to/, 'Remove from') : aria.replace(/^Remove from/, 'Add to')
        );
      });
  },

  promptSignIn(intent) {
    const message =
      intent === 'bookmark'
        ? 'Bookmarks belong to an account, so signing in is what keeps this one yours.'
        : 'Sign in to use this part of the site.';

    app.openModal(
      'Sign in to continue',
      `<p class="modal-lead">${message}</p>
       <p class="modal-lead">You will come back to this page straight after signing in.</p>
       <div class="modal-actions">
         <a class="btn btn-primary" href="${this.loginHref()}">Sign in</a>
         <a class="btn btn-secondary" href="#/register">Create an account</a>
       </div>`
    );
  },

    renderLogin(params) {
    app.setTitle('Sign in');
    const next = params.get('next') || '#/dashboard';
    const registered = params.get('registered') === '1';

    app.contentEl.innerHTML = `
      <div class="page page--narrow">
        <header class="page-header">
          <p class="page-eyebrow">Account</p>
          <h1 class="page-title">Sign in</h1>
          <p class="page-lead">Bookmarks, collections and recently viewed components are kept to your account.</p>
        </header>

        ${registered ? '<p class="form-note form-note--success" role="status">Account created. Sign in to continue.</p>' : ''}
        <div id="demo-accounts" hidden></div>

        <form class="auth-form" data-form="login" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email address</label>
            <input class="form-control" id="login-email" name="email" type="email"
                   autocomplete="email" required aria-describedby="login-error">
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input class="form-control" id="login-password" name="password" type="password"
                   autocomplete="current-password" required aria-describedby="login-error">
          </div>
          <p class="form-error" id="login-error" role="alert" hidden></p>
          <input type="hidden" name="next" value="${app.escapeHtml(next)}">
          <div class="auth-actions">
            <button class="btn btn-primary" type="submit">Sign in</button>
            <p class="auth-alt">New here? <a href="#/register">Create an account</a></p>
          </div>
        </form>
      </div>
    `;
  },

  async renderDemoAccounts() {
    const host = document.getElementById('demo-accounts');
    if (!host) return;

    let payload = null;
    try {
      const res = await api.request('/preview/demo-accounts');
      payload = res.data;
    } catch (err) {
      host.hidden = true;
      return;
    }
    if (!payload || !payload.accounts || !payload.accounts.length) return;

    host.hidden = false;
    host.innerHTML = `
      <div class="demo-accounts">
        <p class="demo-accounts-title">Demo accounts <span>(preview data only)</span></p>
        <p class="demo-accounts-password">Password for all of them: <code>${app.escapeHtml(payload.password)}</code></p>
        <div class="demo-account-list">
          ${payload.accounts
            .map(
              account => `
            <button class="demo-account" type="button" data-action="fill-demo-account"
                    data-arg="${app.escapeHtml(account.email)}">
              <span class="demo-account-role">${app.escapeHtml(account.role)}</span>
              <span class="demo-account-email">${app.escapeHtml(account.email)}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>
    `;
  },

  fillDemoAccount(email) {
    const payload = document.querySelector('.demo-accounts-password code');
    const emailField = document.getElementById('login-email');
    const passwordField = document.getElementById('login-password');
    if (!emailField || !passwordField) return;
    emailField.value = email;
    passwordField.value = payload ? payload.textContent : '';
    passwordField.focus();
  },

  renderRegister() {
    app.setTitle('Create an account');
    app.contentEl.innerHTML = `
      <div class="page page--narrow">
        <header class="page-header">
          <p class="page-eyebrow">Account</p>
          <h1 class="page-title">Create an account</h1>
          <p class="page-lead">Keep the components you use often. Browsing never needs an account.</p>
        </header>

        <form class="auth-form" data-form="register" novalidate>
          <div class="form-group">
            <label class="form-label" for="register-username">Username</label>
            <input class="form-control" id="register-username" name="username" type="text"
                   autocomplete="username" required aria-describedby="register-username-hint register-error">
            <p class="form-hint" id="register-username-hint">3-40 characters: letters, numbers, dots, underscores or hyphens.</p>
          </div>
          <div class="form-group">
            <label class="form-label" for="register-email">Email address</label>
            <input class="form-control" id="register-email" name="email" type="email"
                   autocomplete="email" required aria-describedby="register-error">
          </div>
          <div class="form-group">
            <label class="form-label" for="register-password">Password</label>
            <input class="form-control" id="register-password" name="password" type="password"
                   autocomplete="new-password" required aria-describedby="register-password-hint register-error">
            <p class="form-hint" id="register-password-hint">At least 10 characters, mixing three of: lowercase, uppercase, digits, symbols.</p>
          </div>
          <div class="form-group">
            <label class="form-label" for="register-confirm">Confirm password</label>
            <input class="form-control" id="register-confirm" name="confirmPassword" type="password"
                   autocomplete="new-password" required aria-describedby="register-error">
          </div>
          <p class="form-error" id="register-error" role="alert" hidden></p>
          <div class="auth-actions">
            <button class="btn btn-primary" type="submit">Create account</button>
            <p class="auth-alt">Already registered? <a href="#/login">Sign in</a></p>
          </div>
        </form>
      </div>
    `;
  },

    async renderProfile() {
    if (!this.guard()) return;
    app.setTitle('Your profile');
    const user = this.user;

    app.contentEl.innerHTML = `
      <div class="page">
        <header class="page-header">
          <p class="page-eyebrow">Account</p>
          <h1 class="page-title">${app.escapeHtml(user.username)}</h1>
          <p class="page-lead">Signed in as ${app.escapeHtml(user.email)} · ${app.escapeHtml(user.role)} role</p>
        </header>

        <div class="account-grid">
          <section class="account-panel">
            <h2 class="section-title">Details</h2>
            <form data-form="profile" novalidate>
              <div class="form-group">
                <label class="form-label" for="profile-username">Username</label>
                <input class="form-control" id="profile-username" name="username" type="text"
                       value="${app.escapeHtml(user.username)}" autocomplete="username" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-email">Email address</label>
                <input class="form-control" id="profile-email" name="email" type="email"
                       value="${app.escapeHtml(user.email || '')}" autocomplete="email" required>
              </div>
              <p class="form-error" id="profile-error" role="alert" hidden></p>
              <button class="btn btn-primary" type="submit">Save details</button>
            </form>
          </section>

          <section class="account-panel">
            <h2 class="section-title">Password</h2>
            <form data-form="password" novalidate>
              <div class="form-group">
                <label class="form-label" for="password-current">Current password</label>
                <input class="form-control" id="password-current" name="currentPassword" type="password"
                       autocomplete="current-password" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="password-new">New password</label>
                <input class="form-control" id="password-new" name="newPassword" type="password"
                       autocomplete="new-password" required aria-describedby="password-hint">
                <p class="form-hint" id="password-hint">At least 10 characters. Other sessions are signed out when you change it.</p>
              </div>
              <div class="form-group">
                <label class="form-label" for="password-confirm">Confirm new password</label>
                <input class="form-control" id="password-confirm" name="confirmPassword" type="password"
                       autocomplete="new-password" required>
              </div>
              <p class="form-error" id="password-error" role="alert" hidden></p>
              <button class="btn btn-primary" type="submit">Change password</button>
            </form>
          </section>
        </div>

        <section class="account-panel account-panel--wide account-panel--actions">
          <button class="btn btn-secondary" type="button" data-action="sign-out">Sign out</button>
        </section>
      </div>
    `;
  },

    async renderBookmarks() {
    if (!this.guard()) return;
    app.setTitle('Your bookmarks');
    app.renderLoading();

    try {
      const res = await api.auth.listBookmarks(1, 60);
      const items = res.data.items || [];

      app.contentEl.innerHTML = `
        <div class="page">
          <header class="page-header">
            <p class="page-eyebrow">Saved</p>
            <h1 class="page-title">Bookmarks</h1>
            <p class="page-lead">${items.length ? `${items.length} component${items.length === 1 ? '' : 's'} saved to your account.` : 'Nothing saved yet.'}</p>
          </header>
          ${
            items.length
              ? `<div class="component-grid">${items.map(item => app.componentCard(item)).join('')}</div>`
              : `<div class="empty-state">
                   <h3>No bookmarks yet</h3>
                   <p>Use the save control on any component card or component page, and it will appear here.</p>
                   <a class="btn btn-primary" href="#/catalog">Browse the catalog</a>
                 </div>`
          }
        </div>
      `;
    } catch (err) {
      if (err.status === 401) return this.guard();
      app.renderError(err);
    }
  },

    async renderCollections() {
    if (!this.guard()) return;
    app.setTitle('Your collections');
    app.renderLoading();

    try {
      const res = await api.auth.listCollections();
      const items = res.data.items || [];

      app.contentEl.innerHTML = `
        <div class="page">
          <header class="page-header">
            <p class="page-eyebrow">Organise</p>
            <h1 class="page-title">Collections</h1>
            <p class="page-lead">Group components for a topic, a lab or an exam.</p>
          </header>

          <section class="account-panel">
            <h2 class="section-title">New collection</h2>
            <form data-form="collection" novalidate>
              <div class="form-group">
                <label class="form-label" for="collection-name">Name</label>
                <input class="form-control" id="collection-name" name="name" type="text" maxlength="80" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="collection-description">Description <span class="form-optional">(optional)</span></label>
                <input class="form-control" id="collection-description" name="description" type="text" maxlength="280">
              </div>
              <p class="form-error" id="collection-error" role="alert" hidden></p>
              <button class="btn btn-primary" type="submit">Create collection</button>
            </form>
          </section>

          ${
            items.length
              ? `<div class="collection-grid">${items
                  .map(
                    collection => `
                <article class="collection-card">
                  <a class="collection-card-main" href="#/collections/${collection.collectionId}">
                    <h3 class="collection-card-name">${app.escapeHtml(collection.name)}</h3>
                    ${collection.description ? `<p class="collection-card-desc">${app.escapeHtml(collection.description)}</p>` : ''}
                    <p class="collection-card-meta">${collection.itemCount} component${collection.itemCount === 1 ? '' : 's'}</p>
                  </a>
                  <button class="btn btn-danger btn-sm" type="button"
                          data-action="delete-collection" data-arg="${collection.collectionId}">Delete</button>
                </article>`
                  )
                  .join('')}</div>`
              : `<div class="empty-state">
                   <h3>No collections yet</h3>
                   <p>A collection is a list you name yourself - handy for a syllabus or a single experiment.</p>
                 </div>`
          }
        </div>
      `;
    } catch (err) {
      if (err.status === 401) return this.guard();
      app.renderError(err);
    }
  },

  async renderCollection(collectionId) {
    if (!this.guard()) return;
    app.setTitle('Collection');
    app.renderLoading();

    try {
      const res = await api.auth.getCollection(collectionId);
      const collection = res.data;
      const items = collection.items || [];

      app.setTitle(collection.name);
      app.contentEl.innerHTML = `
        <div class="page">
          <a class="back-link" href="#/collections">
            <span class="back-link-arrow" aria-hidden="true">←</span>
            All collections
          </a>

          <header class="page-header">
            <p class="page-eyebrow">Collection</p>
            <h1 class="page-title">${app.escapeHtml(collection.name)}</h1>
            <p class="page-lead">${collection.description ? app.escapeHtml(collection.description) : `${items.length} component${items.length === 1 ? '' : 's'}.`}</p>
          </header>

          ${
            items.length
              ? `<div class="component-grid">${items
                  .map(
                    item => `
                <div class="saved-item">
                  ${app.componentCard(item)}
                  <button class="btn btn-secondary btn-sm saved-item-remove" type="button"
                          data-action="remove-from-collection"
                          data-collection="${collection.collectionId}"
                          data-arg="${item.componentId}">Remove</button>
                </div>`
                  )
                  .join('')}</div>`
              : `<div class="empty-state">
                   <h3>This collection is empty</h3>
                   <p>Open a component and add it to this collection.</p>
                   <a class="btn btn-primary" href="#/catalog">Browse the catalog</a>
                 </div>`
          }
        </div>
      `;
    } catch (err) {
      if (err.status === 401) return this.guard();
      if (err.status === 404) return app.renderNotFound('That collection does not exist, or it belongs to another account.');
      app.renderError(err);
    }
  },

  async createCollection(form) {
    const errorEl = document.getElementById('collection-error');
    const name = (this.value(form, 'name') || '').trim();
    const description = (this.value(form, 'description') || '').trim();

    if (name.length < 1) return this.showFormError(errorEl, 'Give the collection a name.');

    try {
      await api.auth.createCollection({ name, description });
      app.toast(`Collection “${name}” created.`, 'success');
      await this.renderCollections();
    } catch (err) {
      if (err.status === 401) return this.guard();
      this.showFormError(errorEl, err.message || 'Could not create that collection.');
    }
  },

  async deleteCollection(collectionId) {
    const ok = window.confirm('Delete this collection? The components themselves are not affected.');
    if (!ok) return;
    try {
      await api.auth.deleteCollection(collectionId);
      app.toast('Collection deleted.', 'success');
      await this.renderCollections();
    } catch (err) {
      if (err.status === 401) return;
      app.toast(err.message || 'Could not delete that collection.', 'error');
    }
  },

  async removeFromCollection(collectionId, componentId) {
    try {
      await api.auth.removeFromCollection(collectionId, componentId);
      app.toast('Removed from the collection.', 'success');
      await this.renderCollection(collectionId);
    } catch (err) {
      if (err.status === 401) return;
      app.toast(err.message || 'Could not update that collection.', 'error');
    }
  },

    async collectionPicker(componentId, host) {
    if (!this.isSignedIn()) {
      this.promptSignIn('collection');
      return;
    }
    try {
      const res = await api.auth.listCollections();
      const items = res.data.items || [];
      if (!items.length) {
        host.innerHTML = `<p class="account-note">You have no collections yet. <a href="#/collections">Create one</a> first.</p>`;
        return;
      }
      host.innerHTML = `
        <label class="form-label" for="collection-pick">Add to collection</label>
        <div class="picker-row">
          <select class="form-control" id="collection-pick" name="collectionId">
            ${items
              .map(item => `<option value="${item.collectionId}">${app.escapeHtml(item.name)}</option>`)
              .join('')}
          </select>
          <button class="btn btn-secondary" type="button" data-action="add-to-collection" data-arg="${componentId}">Add</button>
        </div>
      `;
    } catch (err) {
      if (err.status === 401) {
        app.closeModal();
        return;
      }
      host.innerHTML = `<p class="form-error">${app.escapeHtml(err.message || 'Could not load your collections.')}</p>`;
    }
  },

  async addToCollection(componentId) {
    const select = document.getElementById('collection-pick');
    if (!select) return;
    try {
      const res = await api.auth.addToCollection(select.value, componentId);
      app.closeModal();
      app.toast(res.data.created ? 'Added to the collection.' : 'Already in that collection.', 'success');
    } catch (err) {
      if (err.status === 401) {
        app.closeModal();
        return;
      }
      app.toast(err.message || 'Could not add that component.', 'error');
    }
  },

    async renderDashboard() {
    if (!this.guard()) return;
    app.setTitle('Dashboard');
    app.renderLoading();

    try {
      const res = await api.auth.dashboard();
      const data = res.data;
      const { counts, collections, recent } = data;

      app.contentEl.innerHTML = `
        <div class="page">
          <header class="page-header">
            <p class="page-eyebrow">Dashboard</p>
            <h1 class="page-title">Welcome back, ${app.escapeHtml(data.user.username)}</h1>
            <p class="page-lead">Everything here comes from your account: ${counts.bookmarks} bookmark${counts.bookmarks === 1 ? '' : 's'}, ${counts.collections} collection${counts.collections === 1 ? '' : 's'}, ${counts.recentlyViewed} recently viewed.</p>
          </header>

          <div class="stats-grid">
            <a class="stat-card stat-card--link" href="#/bookmarks">
              <span class="stat-value">${counts.bookmarks}</span>
              <span class="stat-label">Bookmarks</span>
            </a>
            <a class="stat-card stat-card--link" href="#/collections">
              <span class="stat-value">${counts.collections}</span>
              <span class="stat-label">Collections</span>
            </a>
            <div class="stat-card">
              <span class="stat-value">${counts.recentlyViewed}</span>
              <span class="stat-label">Recently viewed</span>
            </div>
          </div>

          <section class="account-panel account-panel--wide">
            <div class="section-head">
              <h2 class="section-title">Recently viewed</h2>
              ${recent.length ? '<button class="btn btn-secondary btn-sm" type="button" data-action="clear-recent">Clear</button>' : ''}
            </div>
            ${
              recent.length
                ? `<div class="component-grid">${recent.map(item => app.componentCard(item)).join('')}</div>`
                : `<div class="empty-state empty-state--inline">
                     <h3>Nothing viewed yet</h3>
                     <p>Components you open while signed in are listed here, newest first.</p>
                     <a class="btn btn-secondary" href="#/catalog">Browse the catalog</a>
                   </div>`
            }
          </section>

          <section class="account-panel account-panel--wide">
            <h2 class="section-title">Your collections</h2>
            ${
              collections.length
                ? `<ul class="collection-list">${collections
                    .map(
                      collection => `<li>
                        <a href="#/collections/${collection.collectionId}">${app.escapeHtml(collection.name)}</a>
                        <span class="collection-list-count">${collection.itemCount}</span>
                      </li>`
                    )
                    .join('')}</ul>`
                : `<p class="account-note">No collections yet. <a href="#/collections">Create your first one</a>.</p>`
            }
          </section>
        </div>
      `;
    } catch (err) {
      if (err.status === 401) return this.guard();
      app.renderError(err);
    }
  },

  async clearRecent() {
    try {
      await api.auth.clearRecent();
      app.toast('Recently viewed cleared.', 'success');
      await this.renderDashboard();
    } catch (err) {
      if (err.status === 401) return;
      app.toast(err.message || 'Could not clear your history.', 'error');
    }
  },

    async renderAdmin() {
    if (!this.guard()) return;
    if (!this.canAdminister()) return this.renderForbidden();
    app.setTitle('Account administration');
    app.renderLoading();

    try {
      const res = await api.auth.listUsers();
      const items = res.data.items || [];
      const roles = ['User', 'Developer', 'DBA'];

      app.contentEl.innerHTML = `
        <div class="page">
          <header class="page-header">
            <p class="page-eyebrow">DBA only</p>
            <h1 class="page-title">Account administration</h1>
            <p class="page-lead">Roles are checked on every request. Nobody can change their own role, and the last active DBA cannot be demoted or disabled.</p>
          </header>

          <div class="table-responsive">
            <table class="edu-table">
              <thead>
                <tr><th scope="col">Account</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Saved</th></tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    user => `
                  <tr>
                    <td>${app.escapeHtml(user.username)}</td>
                    <td>${app.escapeHtml(user.email || '—')}</td>
                    <td>
                      <label class="visually-hidden" for="role-${user.userId}">Role for ${app.escapeHtml(user.username)}</label>
                      <select class="form-control form-control--compact" id="role-${user.userId}"
                              data-action="admin-set-role" data-arg="${user.userId}">
                        ${roles
                          .map(role => `<option value="${role}"${role === user.role ? ' selected' : ''}>${role}</option>`)
                          .join('')}
                      </select>
                    </td>
                    <td>${user.isActive ? 'Active' : 'Disabled'}</td>
                    <td>${user.bookmarkCount ?? 0} bookmarks</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      if (err.status === 401) return this.guard();
      if (err.status === 403) return this.renderForbidden();
      app.renderError(err);
    }
  },

  async setUserRole(userId, role) {
    try {
      await api.auth.updateUser(userId, { role });
      app.toast(`Role updated to ${role}.`, 'success');
    } catch (err) {
      if (err.status === 401) return;
      app.toast(err.message || 'Could not change that role.', 'error');
    }
    await this.renderAdmin();
  },

  renderForbidden() {
    app.setTitle('Not available');
    app.contentEl.innerHTML = `
      <div class="page">
        <div class="empty-state" style="margin-top: 4rem;">
          <p class="page-eyebrow" style="color: var(--accent);">Error 403</p>
          <h3 style="font-size: 2.2rem; letter-spacing: -0.02em;">This page needs a different role</h3>
          <p>Your account is signed in, but it does not have access to this area.</p>
          <a class="btn btn-primary" href="#/">Back to home</a>
          <a class="btn btn-secondary" href="#/dashboard">Your dashboard</a>
        </div>
      </div>
    `;
  },

      value(form, name) {
    const field = form && form.elements ? form.elements.namedItem(name) : null;
    return field ? field.value : '';
  },

  showFormError(element, message) {
    if (!element) {
      app.toast(message, 'error');
      return;
    }
    element.textContent = message;
    element.hidden = false;
    element.focus({ preventScroll: false });
  },

  clearFormError(element) {
    if (!element) return;
    element.hidden = true;
    element.textContent = '';
  },

  async handleForm(kind, form) {
    if (kind === 'login') return this.submitLogin(form);
    if (kind === 'register') return this.submitRegister(form);
    if (kind === 'profile') return this.submitProfile(form);
    if (kind === 'password') return this.submitPassword(form);
    if (kind === 'collection') return this.createCollection(form);
    return undefined;
  },

  async submitLogin(form) {
    const errorEl = document.getElementById('login-error');
    this.clearFormError(errorEl);

    const email = (this.value(form, 'email') || '').trim();
    const password = this.value(form, 'password');

    if (!email) return this.showFormError(errorEl, 'Enter your email address.');
    if (!password) return this.showFormError(errorEl, 'Enter your password.');

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Signing in…';

    try {
      this.bumpSessionVersion();
      const res = await api.auth.login({ email, password });
      this.applySession(res.data);

                        const check = await api.auth.me().catch(() => null);
      if (!check || !check.data.user) {
        this.clearSession();
        this.showFormError(
          errorEl,
          'Signed in, but this browser did not keep the session cookie, so the next page would ask again. ' +
            'Allow cookies for this site (or open the page in its own tab) and try once more.'
        );
        submit.disabled = false;
        submit.textContent = 'Sign in';
        return undefined;
      }

      this.applySession(check.data);
      app.toast(`Signed in as ${check.data.user.username}.`, 'success');
      const next = this.value(form, 'next') || '#/dashboard';
      window.location.hash = next.startsWith('#/') ? next : '#/dashboard';
    } catch (err) {
      this.showFormError(errorEl, err.message || 'Could not sign you in.');
      submit.disabled = false;
      submit.textContent = 'Sign in';
    }
  },

  async submitRegister(form) {
    const errorEl = document.getElementById('register-error');
    this.clearFormError(errorEl);

    const username = (this.value(form, 'username') || '').trim();
    const email = (this.value(form, 'email') || '').trim();
    const password = this.value(form, 'password');
    const confirmPassword = this.value(form, 'confirmPassword');

    if (username.length < 3) return this.showFormError(errorEl, 'Choose a username of at least 3 characters.');
    if (!email.includes('@')) return this.showFormError(errorEl, 'Enter a valid email address.');
    if (password.length < 10) return this.showFormError(errorEl, 'Use at least 10 characters for the password.');
    if (password !== confirmPassword) return this.showFormError(errorEl, 'The two passwords do not match.');

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Creating account…';

    try {
      await api.auth.register({ username, email, password, confirmPassword });
      window.location.hash = '#/login?registered=1';
    } catch (err) {
      this.showFormError(errorEl, err.message || 'Could not create that account.');
      submit.disabled = false;
      submit.textContent = 'Create account';
    }
  },

  async submitProfile(form) {
    const errorEl = document.getElementById('profile-error');
    this.clearFormError(errorEl);

    const username = (this.value(form, 'username') || '').trim();
    const email = (this.value(form, 'email') || '').trim();
    if (!username) return this.showFormError(errorEl, 'A username is required.');
    if (!email.includes('@')) return this.showFormError(errorEl, 'Enter a valid email address.');

    try {
      const res = await api.auth.updateProfile({ username, email });
      this.applySession({ user: res.data.user, bookmarkIds: [...this.bookmarkIds] });
      app.toast('Profile updated.', 'success');
      await this.renderProfile();
    } catch (err) {
      if (err.status === 401) return this.guard();
      this.showFormError(errorEl, err.message || 'Could not save your details.');
    }
  },

  async submitPassword(form) {
    const errorEl = document.getElementById('password-error');
    this.clearFormError(errorEl);

    const currentPassword = this.value(form, 'currentPassword');
    const newPassword = this.value(form, 'newPassword');
    const confirmPassword = this.value(form, 'confirmPassword');

    if (!currentPassword) return this.showFormError(errorEl, 'Enter your current password.');
    if (newPassword.length < 10) return this.showFormError(errorEl, 'Use at least 10 characters for the new password.');
    if (newPassword !== confirmPassword) return this.showFormError(errorEl, 'The two new passwords do not match.');

    try {
      await api.auth.changePassword({ currentPassword, newPassword, confirmPassword });
      form.reset();
      app.toast('Password changed. Other sessions were signed out.', 'success');
    } catch (err) {
      if (err.status === 401) return this.guard();
      this.showFormError(errorEl, err.message || 'Could not change your password.');
    }
  }
};

const ASSET_VERSION = (() => {
  try {
    const script =
      document.currentScript ||
      Array.from(document.scripts).find(tag => /\/app\.js(\?|$)/.test(tag.src));
    const stamp = script ? new URL(script.src, window.location.href).searchParams.get('v') : null;
    return stamp || '0';
  } catch (err) {
    return '0';
  }
})();

const app = {
  contentEl: null,
  currentXml: '',

  asset(path) {
    if (!path) return path;
    const value = String(path);
    if (!value.startsWith('/')) return value;
    const separator = value.includes('?') ? '&' : '?';
    return `${value}${separator}v=${ASSET_VERSION}`;
  },

        async init() {
    this.contentEl = document.getElementById('app-content');
    this.initCursorGlow();
    this.bindEvents();
            await account.loadSession();
    this.handleRouting();
  },

  initCursorGlow() {
    const glow = document.getElementById('glow');
    if (!glow || !window.matchMedia) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer || this.prefersReducedMotion()) return;

            const position = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    const target = { ...position };
    let frame = null;
    let visible = false;

    const render = () => {
      position.x += (target.x - position.x) * 0.16;
      position.y += (target.y - position.y) * 0.16;
      glow.style.transform = `translate3d(${position.x.toFixed(2)}px, ${position.y.toFixed(2)}px, 0) translate(-50%, -50%)`;

      const settled = Math.abs(target.x - position.x) < 0.4 && Math.abs(target.y - position.y) < 0.4;
      frame = settled && !visible ? null : window.requestAnimationFrame(render);
    };

    const start = () => {
      visible = true;
      glow.classList.add('is-active');
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    document.addEventListener('mousemove', e => {
      target.x = e.clientX;
      target.y = e.clientY;
      start();
    });

    document.addEventListener('mouseleave', () => {
      visible = false;
      glow.classList.remove('is-active');
      if (frame === null) frame = window.requestAnimationFrame(render);
    });
  },

  bindEvents() {
    window.addEventListener('hashchange', () => this.handleRouting());

        const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.goToSearch(searchInput.value.trim());
        }
      });
    }

        document.addEventListener('submit', e => {
      const kind = e.target && e.target.getAttribute('data-form');

      if (kind === 'hero-search') {
        e.preventDefault();
        const input = e.target.querySelector('input[type="search"], input');
        this.goToSearch(input ? input.value.trim() : '');
      } else if (kind === 'insert-component') {
        this.handleInsertComponent(e);
      } else if (kind === 'create-user') {
        this.handleCreateUser(e);
      } else if (['login', 'register', 'profile', 'password', 'collection'].includes(kind)) {
        e.preventDefault();
        account.handleForm(kind, e.target);
      }
    });

        document.addEventListener('change', e => {
      const control = e.target.closest('[data-change]');
      if (control && control.getAttribute('data-change') === 'catalog-filter') {
        this.onCatalogFilterChange(control.value);
      }

                  const roleSelect = e.target.closest('[data-action="admin-set-role"]');
      if (roleSelect) {
        account.setUserRole(Number(roleSelect.getAttribute('data-arg')), roleSelect.value);
      }
    });

        const syncRange = input => {
      const min = Number(input.min || 0);
      const max = Number(input.max || 100);
      const value = Number(input.value);
      const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
      input.style.setProperty('--range-progress', `${pct}%`);
    };

    document.addEventListener('input', e => {
      const input = e.target;
      if (!input || input.type !== 'range') return;
      syncRange(input);
      const output = input.parentElement && input.parentElement.querySelector('.range-row-value');
      if (output) output.textContent = input.value;
    });

        const paintRanges = () => document.querySelectorAll('input[type="range"]').forEach(syncRange);
    this.paintRanges = paintRanges;

        document.addEventListener('error', e => {
      const target = e.target;
      if (target && target.tagName === 'IMG' && target.hasAttribute('data-hide-on-error')) {
        target.classList.add('no-art');
        target.removeAttribute('data-hide-on-error');
      }
    }, true);

        document.addEventListener('click', e => {
      if (e.target.matches('.modal-overlay') || e.target.closest('.modal-close-btn')) {
        this.closeModal();
        return;
      }

      const actionTrigger = e.target.closest('[data-action]');
      if (actionTrigger) {
        this.handleAction(
          actionTrigger.getAttribute('data-action'),
          actionTrigger.getAttribute('data-arg'),
          actionTrigger
        );
        return;
      }

      const imageTrigger = e.target.closest('[data-open-image]');
      if (imageTrigger) {
        this.openImageModal(
          imageTrigger.getAttribute('data-open-image'),
          imageTrigger.getAttribute('data-open-title') || 'Diagram'
        );
        return;
      }

      if (!e.target.closest('.navbar')) this.closeMobileNav();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeMobileNav();
      }

            if (e.key === '/' && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) {
        const input = document.getElementById('global-search-input');
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    });

    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const navbar = document.getElementById('site-navbar');
        const open = navbar.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    document.querySelectorAll('#nav-links a').forEach(link => {
      link.addEventListener('click', () => this.closeMobileNav());
    });
  },

  handleAction(action, arg, element) {
    switch (action) {
      case 'switch-lab-tab':
        this.switchLabTab(arg, element);
        break;
      case 'show-add-user':
        this.showAddUserModal();
        break;
      case 'load-app-users':
        this.loadAppUsers();
        break;
      case 'load-audit-log':
        this.loadAuditLog();
        break;
      case 'run-cursor-all':
        this.runCursorAll();
        break;
      case 'run-cursor-limited':
        this.runCursorLimited();
        break;
      case 'run-sum-routines':
        this.runSumRoutines();
        break;
      case 'load-timing-report':
        this.loadTimingReport();
        break;
      case 'load-dashboard':
        this.loadDashboard();
        break;
      case 'delete-user':
        this.handleDeleteUser(Number(arg));
        break;
      case 'download-xml':
        this.downloadXml(this.currentXml, arg);
        break;
      case 'retry':
        this.handleRouting();
        break;
      case 'sign-out':
        account.signOut();
        break;
      case 'fill-demo-account':
        account.fillDemoAccount(arg);
        break;
      case 'toggle-bookmark':
        account.toggleBookmark(arg, element);
        break;
      case 'open-collection-picker':
        this.openModal('Add to a collection', '<div id="collection-picker"><p class="modal-lead">Loading your collections…</p></div>');
        account.collectionPicker(Number(arg), document.getElementById('collection-picker'));
        break;
      case 'add-to-collection':
        account.addToCollection(Number(arg));
        break;
      case 'remove-from-collection':
        account.removeFromCollection(Number(element.getAttribute('data-collection')), Number(arg));
        break;
      case 'delete-collection':
        account.deleteCollection(Number(arg));
        break;
      case 'clear-recent':
        account.clearRecent();
        break;
      case 'admin-refresh':
        account.renderAdmin();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  },

  closeMobileNav() {
    const navbar = document.getElementById('site-navbar');
    const navToggle = document.getElementById('nav-toggle');
    if (navbar) navbar.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  },

  goToSearch(query) {
    if (!query) {
      window.location.hash = '#/search';
      return;
    }
    const target = `#/search?q=${encodeURIComponent(query)}`;
                if (window.location.hash === target) return;
    window.location.hash = target;
  },

        parseHash() {
    const raw = window.location.hash || '#/';
    const [rawPath, rawQuery = ''] = raw.replace(/^#/, '').split('?');
    const segments = rawPath
      .split('/')
      .filter(Boolean)
      .map(segment => {
        try {
          return decodeURIComponent(segment);
        } catch (err) {
          return segment;
        }
      });

    return {
      segments,
      params: new URLSearchParams(rawQuery),
      section: segments[0] || 'home'
    };
  },

  async handleRouting() {
    const route = this.parseHash();
    const { section } = route;

    this.updateActiveNav(section);
    this.closeMobileNav();

    const render = async () => {
      const { segments, params } = route;
      try {
        if (section === 'home') {
          await this.renderHome();
        } else if (section === 'catalog') {
          await this.renderCatalog(Number(params.get('page')) || 1, params.get('category') || '');
        } else if (section === 'categories' && segments.length === 1) {
          await this.renderCategoriesIndex();
        } else if (section === 'categories' && segments.length >= 2) {
          await this.renderCategory(segments[1], Number(params.get('page')) || 1);
        } else if (section === 'tags' && segments.length === 1) {
          await this.renderTagsIndex();
        } else if (section === 'tags' && segments.length >= 2) {
          await this.renderTagDetail(segments[1], Number(params.get('page')) || 1);
        } else if (section === 'components' && segments.length >= 2) {
          await this.renderComponentDetail(segments[1]);
        } else if (section === 'search') {
          await this.renderSearch(params.get('q') || '', Number(params.get('page')) || 1);
        } else if (section === 'login') {
          account.renderLogin(params);
          await account.renderDemoAccounts();
        } else if (section === 'register') {
          if (account.isSignedIn()) {
            window.location.hash = '#/dashboard';
            return;
          }
          account.renderRegister();
        } else if (section === 'profile') {
          await account.renderProfile();
        } else if (section === 'bookmarks') {
          await account.renderBookmarks();
        } else if (section === 'collections' && segments.length === 1) {
          await account.renderCollections();
        } else if (section === 'collections' && segments.length >= 2) {
          await account.renderCollection(segments[1]);
        } else if (section === 'dashboard') {
          await account.renderDashboard();
        } else if (section === 'admin') {
          await account.renderAdmin();
        } else if (section === 'lab') {
                              if (account.canAuthor()) {
            await this.renderLabConsole();
          } else if (account.isSignedIn()) {
            account.renderForbidden();
          } else {
            window.location.hash = `#/login?next=${encodeURIComponent('#/lab')}`;
            return;
          }
        } else {
          this.renderNotFound();
        }
      } catch (err) {
        if (err && err.status === 404) {
          this.renderNotFound(err.message);
        } else {
          this.renderError(err);
        }
      }
    };

    await render();

            this.scrollToTop();
  },

  updateActiveNav(section) {
    document.querySelectorAll('.navbar [data-route]').forEach(link => {
      const active = link.getAttribute('data-route') === section;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  },

  scrollToTop() {
    if (typeof window.scrollTo !== 'function') return;
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (err) {
      window.scrollTo(0, 0);
    }
  },

  setTitle(title) {
    document.title = title ? `${title} - ElectroDB` : 'ElectroDB - Electronic Components Reference Catalog';
  },

        prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (err) {
      return false;
    }
  },

  renderLoading() {
    this.contentEl.innerHTML = `
      <div class="loading-state" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading catalog data from the database…</p>
      </div>
    `;
  },

  renderError(err) {
    const message = this.escapeHtml((err && err.message) || 'Failed to load this page.');
    this.contentEl.innerHTML = `
      <div class="page">
        <div class="empty-state" style="margin-top: 3rem;">
          <h3>Something went wrong</h3>
          <p>${message}</p>
          <button class="btn btn-primary" type="button" data-action="retry">Try again</button>
          <a class="btn btn-secondary" href="#/">Back to home</a>
        </div>
      </div>
    `;
  },

  renderNotFound(message) {
    this.setTitle('Not found');
    this.contentEl.innerHTML = `
      <div class="page">
        <div class="empty-state" style="margin-top: 4rem;">
          <p class="page-eyebrow" style="color: var(--accent);">Error 404</p>
          <h3 style="font-size: 2.4rem; letter-spacing: -0.02em;">Page not found</h3>
          <p>${this.escapeHtml(message || 'The requested category, tag, or component could not be found.')}</p>
          <a href="#/catalog" class="btn btn-primary">Browse the catalog</a>
          <a href="#/" class="btn btn-secondary">Return home</a>
        </div>
      </div>
    `;
  },

        async renderHome() {
    this.setTitle();

    const [categoryRes, tagRes, catalogRes, statsRes] = await Promise.all([
      api.getCategories(),
      api.getTags().catch(() => ({ data: [] })),
      api.getCatalog(1, 6).catch(() => ({ data: { items: [] } })),
      api.getStats().catch(() => null)
    ]);

    const categories = categoryRes.data || [];
    const tags = (tagRes.data || []).slice(0, 8);
    const featured = (catalogRes.data && catalogRes.data.items) || [];

                    const stats = (statsRes && statsRes.data) || null;
    const counted = (value, fallback) =>
      Number.isFinite(Number(value)) && value !== null && value !== undefined
        ? Number(value)
        : fallback;

    let treeComponents = 0;
    let treeSubfamilies = 0;
    categories.forEach(cat => {
      treeComponents += Number(cat.componentCount || 0);
      (cat.children || []).forEach(child => {
        treeComponents += Number(child.component_count || 0);
        treeSubfamilies += 1;
      });
    });

    const componentCount = counted(stats && stats.components, treeComponents);
    const categoryCount = counted(stats && stats.categories, categories.length + treeSubfamilies);
    const subfamilyCount = counted(stats && stats.subfamilies, treeSubfamilies);

        const diagramCount = stats && Number.isFinite(Number(stats.diagrams))
      ? Number(stats.diagrams)
      : null;

    const heroStats = [
      { value: componentCount, label: 'Components' },
      { value: categoryCount, label: 'Categories' },
      { value: subfamilyCount, label: 'Subfamilies' }
    ];
    if (diagramCount !== null) heroStats.push({ value: diagramCount, label: 'SVG diagrams' });

    const categoryTags = categories
      .map(cat => `<a class="tag" href="#/categories/${encodeURIComponent(cat.category_id)}">${this.escapeHtml(cat.name)}</a>`)
      .join('');

    const categoryCards = categories.map(cat => this.categoryCard(cat)).join('');

    let html = `
      <div class="page">
        <section class="hero">
          <div class="hero-text">
            <h1>Electronic<br><span>Components</span></h1>
            <p class="hero-lead">
              A data-driven reference for digital logic, semiconductors, analog circuits, sensors,
              and electromechanical parts - complete with truth tables, state diagrams, timing
              waveforms, LaTeX equations, and normalized specifications.
            </p>

            <form class="hero-search" id="hero-search-form" role="search" data-form="hero-search">
              <input type="search" name="q" placeholder="Search ${componentCount} components, categories, and tags…" aria-label="Search components">
              <button type="submit">Search</button>
            </form>

            <div class="hero-tags">${categoryTags}</div>

            <div class="hero-actions">
              <a href="#/catalog" class="btn btn-primary">Browse the catalog</a>
              <a href="#/lab" class="btn btn-secondary">Open lab console</a>
            </div>

            <div class="hero-stats">
              ${heroStats.map(stat => `
                <div class="hero-stat">
                  <strong>${stat.value}</strong>
                  <span>${stat.label}</span>
                </div>`).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Component Categories</h2>
            <a href="#/categories" class="section-link">All categories <span class="link-arrow" aria-hidden="true">→</span></a>
          </div>
          <div class="categories-grid">${categoryCards}</div>
        </section>
    `;

    if (featured.length) {
      html += `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">From the Catalog</h2>
            <a href="#/catalog" class="section-link">View all components <span class="link-arrow" aria-hidden="true">→</span></a>
          </div>
          <div class="components-grid">
            ${featured.map(comp => this.componentCard(comp)).join('')}
          </div>
        </section>
      `;
    }

    if (tags.length) {
      html += `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Browse by Tag</h2>
            <a href="#/tags" class="section-link">All tags <span class="link-arrow" aria-hidden="true">→</span></a>
          </div>
          <div class="tag-cloud">
            ${tags
              .map(
                tag => `
                  <a class="tag-pill" href="#/tags/${encodeURIComponent(tag.slug)}">
                    #${this.escapeHtml(tag.name)}
                    <span>${Number(tag.component_count || 0)}</span>
                  </a>
                `
              )
              .join('')}
          </div>
        </section>
      `;
    }

    html += '</div>';
    this.contentEl.innerHTML = html;
  },

        async renderCategoriesIndex() {
    this.setTitle('Categories');

    const res = await api.getCategories();
    const categories = res.data || [];

    let subcategoryCount = 0;
    let componentCount = 0;
    categories.forEach(cat => {
      subcategoryCount += (cat.children || []).length;
      componentCount += Number(cat.componentCount || 0);
      (cat.children || []).forEach(child => {
        componentCount += Number(child.component_count || 0);
      });
    });

    this.contentEl.innerHTML = `
      <div class="page">
        ${this.breadcrumbs([{ label: 'Home', href: '#/' }, { label: 'Categories' }])}

        <header class="page-header">
          <p class="page-eyebrow">Catalog hierarchy</p>
          <h1 class="page-title">Component Categories</h1>
          <p class="page-lead">
            ${categories.length} primary families, ${subcategoryCount} subfamilies, and
            ${componentCount} published components. Every category page is generated from the
            database hierarchy rather than hard-coded records.
          </p>
        </header>

        <div class="categories-grid">
          ${categories.map(cat => this.categoryCard(cat)).join('')}
        </div>
      </div>
    `;
  },

        async renderCategory(idOrSlug, page = 1) {
    const res = await api.getCategory(idOrSlug, page, 24);
    const { category, breadcrumbs = [], children = [], components = [], pagination } = res.data;

    this.setTitle(category.name);

    const lastIndex = breadcrumbs.length - 1;
    const crumbs = [
      { label: 'Home', href: '#/' },
      ...breadcrumbs.map((crumb, index) => ({
        label: crumb.name,
        href: index === lastIndex ? undefined : `#/categories/${crumb.category_id}`
      }))
    ];
    if (!breadcrumbs.length) crumbs.push({ label: category.name });
    if (crumbs[crumbs.length - 1].label !== category.name) crumbs.push({ label: category.name });

    let html = `
      <div class="page">
        ${this.breadcrumbs(crumbs)}

        <header class="page-header">
          <p class="page-eyebrow">Category</p>
          <h1 class="page-title">${this.escapeHtml(category.name)}</h1>
          <p class="page-lead">${this.escapeHtml(category.description || 'Reference catalog collection.')}</p>
        </header>
    `;

    if (children.length) {
      html += `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Subcategories</h2>
            <span class="section-meta">${children.length} subfamilies</span>
          </div>
          <div class="subcategory-grid">
            ${children.map((child, index) => this.subcategoryCard(child, index)).join('')}
          </div>
        </section>
      `;
    }

                    if (components.length || !children.length) {
      html += `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Components</h2>
            <span class="section-meta">${pagination ? pagination.total : 0} items</span>
          </div>
      `;

      if (!components.length) {
        html += `
          <div class="empty-state">
            <h3>No components registered at this level</h3>
            <p>This category does not have any published components yet.</p>
          </div>
        `;
      } else {
        html += `<div class="components-grid">${components
          .map(comp => this.componentCard(comp))
          .join('')}</div>`;
        if (pagination && pagination.totalPages > 1) {
          html += this.renderPagination(pagination, `#/categories/${encodeURIComponent(idOrSlug)}`);
        }
      }

      html += '</section>';
    }

    html += '</div>';
    this.contentEl.innerHTML = html;
  },

        async renderCatalog(page = 1, categoryFilter = '') {
    this.setTitle('Catalog');

    const [categoryRes, catalogRes] = await Promise.all([
      api.getCategories(),
      api.getCatalog(page, 24, categoryFilter || undefined)
    ]);

    const categories = categoryRes.data || [];
    const items = (catalogRes.data && catalogRes.data.items) || [];
    const pagination = (catalogRes.data && catalogRes.data.pagination) || { page: 1, totalPages: 1, total: 0 };

    const options = [`<option value="">All categories</option>`];
    categories.forEach(cat => {
      options.push(`<option value="${cat.category_id}" ${String(categoryFilter) === String(cat.category_id) ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>`);
      (cat.children || []).forEach(child => {
        options.push(`<option value="${child.category_id}" ${String(categoryFilter) === String(child.category_id) ? 'selected' : ''}>&nbsp;&nbsp;${this.escapeHtml(child.name)}</option>`);
      });
    });

    const baseUrl = categoryFilter
      ? `#/catalog?category=${encodeURIComponent(categoryFilter)}`
      : '#/catalog';

    this.contentEl.innerHTML = `
      <div class="page">
        ${this.breadcrumbs([{ label: 'Home', href: '#/' }, { label: 'Catalog' }])}

        <header class="page-header">
          <p class="page-eyebrow">Full reference</p>
          <h1 class="page-title">Component Catalog</h1>
          <p class="page-lead">
            Browse every published component in the database. Filter by category or jump straight
            to a detail page for tables, equations, diagrams, and specifications.
          </p>
        </header>

        <div class="filter-bar">
          <label class="filter-field">
            <span class="filter-label">Filter by category</span>
            <select class="filter-select" data-change="catalog-filter">
              ${options.join('')}
            </select>
          </label>
          <span class="filter-note">${pagination.total} component${pagination.total === 1 ? '' : 's'} found</span>
        </div>

        ${
          items.length
            ? `<div class="components-grid">${items.map(comp => this.componentCard(comp)).join('')}</div>`
            : `<div class="empty-state">
                 <h3>No components in this view</h3>
                 <p>Try clearing the category filter or pick another family.</p>
                 <a class="btn btn-secondary" href="#/catalog">Clear filter</a>
               </div>`
        }

        ${items.length ? this.renderPagination(pagination, baseUrl) : ''}
      </div>
    `;
  },

  onCatalogFilterChange(value) {
    const target = value ? `#/catalog?category=${encodeURIComponent(value)}` : '#/catalog';
    if (window.location.hash === target) this.handleRouting();
    else window.location.hash = target;
  },

        async renderTagsIndex() {
    this.setTitle('Tags');

    const res = await api.getTags();
    const tags = res.data || [];
    const totalRelationships = tags.reduce((sum, tag) => sum + Number(tag.component_count || 0), 0);

    this.contentEl.innerHTML = `
      <div class="page">
        ${this.breadcrumbs([{ label: 'Home', href: '#/' }, { label: 'Tags' }])}

        <header class="page-header">
          <p class="page-eyebrow">Cross-cutting topics</p>
          <h1 class="page-title">Component Tags</h1>
          <p class="page-lead">
            ${tags.length} reusable tags connect ${totalRelationships} component assignments across
            technology families, logic styles, and application areas.
          </p>
        </header>

        ${
          tags.length
            ? `<div class="tags-grid">
                 ${tags
                   .map(
                     tag => `
                       <a class="tag-card" href="#/tags/${encodeURIComponent(tag.slug)}">
                         <span class="tag-card-name">${this.escapeHtml(tag.name)}</span>
                         <span class="tag-card-meta">${Number(tag.component_count || 0)} components</span>
                       </a>
                     `
                   )
                   .join('')}
               </div>`
            : `<div class="empty-state"><h3>No tags yet</h3><p>Tag definitions will appear here once seeded.</p></div>`
        }
      </div>
    `;
  },

  async renderTagDetail(idOrSlug, page = 1) {
    const res = await api.getTag(idOrSlug, page, 24);
    const { tag, components = [], pagination } = res.data;

    this.setTitle(`#${tag.name}`);

    this.contentEl.innerHTML = `
      <div class="page">
        ${this.breadcrumbs([
          { label: 'Home', href: '#/' },
          { label: 'Tags', href: '#/tags' },
          { label: `#${tag.name}` }
        ])}

        <header class="page-header">
          <p class="page-eyebrow">Tag</p>
          <h1 class="page-title">#${this.escapeHtml(tag.name)}</h1>
          <p class="page-lead">
            ${pagination ? pagination.total : components.length} component${(pagination ? pagination.total : components.length) === 1 ? '' : 's'} tagged
            <code>${this.escapeHtml(tag.slug)}</code>.
          </p>
        </header>

        ${
          components.length
            ? `<div class="components-grid">${components.map(comp => this.componentCard(comp)).join('')}</div>
               ${this.renderPagination(pagination, `#/tags/${encodeURIComponent(idOrSlug)}`)}`
            : `<div class="empty-state">
                 <h3>Nothing tagged yet</h3>
                 <p>No published components currently carry this tag.</p>
                 <a class="btn btn-secondary" href="#/tags">Browse all tags</a>
               </div>`
        }
      </div>
    `;
  },

        async renderSearch(query, page = 1) {
    this.setTitle(query ? `Search: ${query}` : 'Search');

    const headerInput = document.getElementById('global-search-input');
    if (headerInput) headerInput.value = query;

    if (!query) {
      this.contentEl.innerHTML = `
        <div class="page">
          ${this.breadcrumbs([{ label: 'Home', href: '#/' }, { label: 'Search' }])}
          <header class="page-header">
            <p class="page-eyebrow">Search</p>
            <h1 class="page-title">Find a Component</h1>
            <p class="page-lead">Search by component name or summary. Try “counter”, “flip-flop”, “diode”, “gate”, or “amplifier”.</p>
          </header>
          <form class="hero-search" id="hero-search-form" role="search" data-form="hero-search" style="max-width: 560px;">
            <input type="search" name="q" placeholder="Search components…" aria-label="Search components" autofocus>
            <button type="submit">Search</button>
          </form>
        </div>
      `;
      return;
    }

    const res = await api.search(query, page, 20);
    const { items = [], pagination } = res.data;

    this.contentEl.innerHTML = `
      <div class="page">
        ${this.breadcrumbs([
          { label: 'Home', href: '#/' },
          { label: 'Search', href: '#/search' },
          { label: `“${query}”` }
        ])}

        <header class="page-header">
          <p class="page-eyebrow">Search results</p>
          <h1 class="page-title">“${this.escapeHtml(query)}”</h1>
          <p class="page-lead">${pagination ? pagination.total : 0} matching component${(pagination ? pagination.total : 0) === 1 ? '' : 's'} found.</p>
        </header>

        ${
          items.length
            ? `<div class="components-grid">${items.map(comp => this.componentCard(comp)).join('')}</div>
               ${this.renderPagination(pagination, `#/search?q=${encodeURIComponent(query)}`)}`
            : `<div class="empty-state">
                 <h3>No components matched your search</h3>
                 <p>Try a broader term such as “counter”, “diode”, or “regulator”.</p>
                 <a class="btn btn-secondary" href="#/catalog">Browse the full catalog</a>
               </div>`
        }
      </div>
    `;
  },

        async renderComponentDetail(idOrSlug) {
    const res = await api.getComponent(idOrSlug);
    const comp = res.data;
    const compId = comp.componentId !== undefined ? comp.componentId : comp.component_id;

    this.setTitle(comp.name);

            if (account.isSignedIn() && compId) {
      api.auth.recordView(compId).catch(() => {});
    }

    const categoryId = comp.category ? comp.category.categoryId || comp.category.id : null;
    const categoryName = comp.category ? comp.category.name : 'Catalog';
    const tags = comp.tags || [];

    const crumbs = [
      { label: 'Home', href: '#/' },
      ...(comp.breadcrumbs || []).map(crumb => ({
        label: crumb.name,
        href: `#/categories/${crumb.category_id || crumb.categoryId}`
      })),
      { label: comp.name }
    ];

        const heroLead =
      comp.description || comp.shortDescription || '';

            const tagPills = tags
      .filter(tag => tag && tag.slug && tag.slug !== 'educational-example')
      .map(tag => `<a class="tag" href="#/tags/${encodeURIComponent(tag.slug)}">#${this.escapeHtml(tag.name)}</a>`)
      .join('');

    const diagrams = comp.diagrams || [];
    const byKind = kind => diagrams.filter(diagram => (diagram.kind || 'OTHER') === kind);
    const symbolDiagram = byKind('SYMBOL')[0];
    const circuitDiagrams = byKind('CIRCUIT');
    const extraDiagrams = diagrams.filter(
      diagram => !['SYMBOL', 'CIRCUIT', 'PINOUT'].includes(diagram.kind || 'OTHER')
    );
    const symbolPath = (symbolDiagram && symbolDiagram.imagePath) || comp.circuitSymbolPath;

    let html = `
      <div class="page">
        ${this.breadcrumbs(crumbs)}

        ${
          categoryId
            ? `<div class="crumbs-back">
                 <a class="back-link" href="#/categories/${encodeURIComponent(categoryId)}">
                   <span class="back-link-arrow" aria-hidden="true">←</span>
                   Back to ${this.escapeHtml(categoryName)}
                 </a>
               </div>`
            : ''
        }

        <section class="component-hero">
          <div class="component-hero-main">
            <h1 class="component-title">${this.escapeHtml(comp.name)}</h1>
            ${tagPills ? `<div class="hero-tags">${tagPills}</div>` : ''}
            <p class="component-hero-desc">${this.escapeHtml(heroLead)}</p>

            <div class="component-actions">
              ${compId ? account.bookmarkButton(compId, { labelled: true }) : ''}
              ${
                compId
                  ? `<button class="btn btn-secondary btn-compact" type="button" data-action="open-collection-picker" data-arg="${compId}">Add to collection</button>`
                  : ''
              }
              ${
                comp.datasheetUrl
                  ? `<a class="btn btn-primary" href="${this.escapeHtml(comp.datasheetUrl)}" target="_blank" rel="noopener noreferrer">Manufacturer datasheet</a>`
                  : ''
              }
            </div>
          </div>

          ${
            symbolPath
              ? `<figure class="component-art">
                   <img src="${this.escapeHtml(this.asset(symbolPath))}" alt="${this.escapeHtml(comp.name)} symbol" loading="lazy" data-hide-on-error>
                 </figure>`
              : `<div class="component-art component-art--empty" aria-hidden="true"><span>⚡</span></div>`
          }
        </section>
    `;

            circuitDiagrams.forEach(diagram => {
      html += `
        <section class="detail-section">
          <h2 class="section-title">Circuit Diagram</h2>
          <figure class="diagram-body">
            <img src="${this.escapeHtml(this.asset(diagram.imagePath))}" alt="${this.escapeHtml(
              diagram.altText || `Circuit diagram for ${comp.name}`
            )}" loading="lazy">
            <div class="diagram-actions">
              <button
                class="btn btn-secondary btn-sm"
                type="button"
                data-open-image="${this.escapeHtml(diagram.imagePath)}"
                data-open-title="${this.escapeHtml(diagram.title || 'Circuit diagram')}"
              >View fullscreen</button>
            </div>
          </figure>
        </section>
      `;
    });

        (comp.content || []).forEach(section => {
      if (section.sectionKey === 'overview') return;

      html += `
        <section class="detail-section">
          <h2 class="section-title">${this.escapeHtml(section.title || 'Details')}</h2>
          ${this.renderSectionBody(section)}
        </section>
      `;
    });

                extraDiagrams.forEach(diagram => {
      const kind = diagram.kind || 'OTHER';
      const isState = kind === 'STATE';
      const isTiming = kind === 'TIMING';
      const heading =
        kind === 'STATE' ? 'State Machine' : kind === 'TIMING' ? 'Timing Diagram' : diagram.title || 'Diagram';
      const sizing = isState ? ' diagram-body--compact' : isTiming ? ' diagram-body--timing' : '';
      html += `
        <section class="detail-section">
          <h2 class="section-title">${this.escapeHtml(heading)}</h2>
          <figure class="diagram-body${sizing}">
            <img src="${this.escapeHtml(this.asset(diagram.imagePath))}" alt="${this.escapeHtml(
              diagram.altText || diagram.title
            )}" loading="lazy">
            <div class="diagram-actions">
              <button
                class="btn btn-secondary btn-sm"
                type="button"
                data-open-image="${this.escapeHtml(diagram.imagePath)}"
                data-open-title="${this.escapeHtml(diagram.title)}"
              >View fullscreen</button>
            </div>
          </figure>
        </section>
      `;
    });

            const pinout = byKind('PINOUT')[0];
    if (pinout) {
      html += `
        <section class="detail-section">
          <h2 class="section-title">IC Pinout</h2>
          <figure class="diagram-body diagram-body--pinout">
            <img src="${this.escapeHtml(this.asset(pinout.imagePath))}" alt="${this.escapeHtml(
              pinout.altText || `Pinout for ${comp.name}`
            )}" loading="lazy">
            <div class="diagram-actions">
              <button
                class="btn btn-secondary btn-sm"
                type="button"
                data-open-image="${this.escapeHtml(pinout.imagePath)}"
                data-open-title="${this.escapeHtml(pinout.title || 'Pinout diagram')}"
              >View fullscreen</button>
            </div>
          </figure>
        </section>
      `;
    }

        if (comp.specifications && comp.specifications.length) {
      html += `
        <section class="detail-section">
          <h2 class="section-title">Technical Specifications</h2>
          <div class="table-responsive spec-table-wrap">
            <table class="edu-table spec-table">
              <thead>
                <tr>
                  <th>Specification</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${comp.specifications
                  .map(
                    spec => `
                      <tr>
                        <td>${this.formatCell(spec.name)}</td>
                        <td>${this.escapeHtml(spec.value || '-')}${spec.unit && !String(spec.value || '').includes(spec.unit) ? ` ${this.escapeHtml(spec.unit)}` : ''}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }

    html += '</div>';
    this.contentEl.innerHTML = html;

        this.renderMath();
  },

  renderSectionBody(section) {
    const content = section.content;

    switch ((section.type || '').toUpperCase()) {
      case 'TABLE':
        return this.renderTableContent(content);

      case 'EQUATION':
        return this.renderEquationContent(typeof content === 'string' ? content : JSON.stringify(content));

      case 'TEXT':
        return `<p class="prose">${this.escapeHtml(typeof content === 'string' ? content : JSON.stringify(content))}</p>`;

      case 'IMAGE':
      case 'DIAGRAM':
      case 'GRAPH': {
        const src = typeof content === 'string' ? content : content && (content.path || content.url);
        if (!src) return `<p class="result-text">No visual asset attached to this section.</p>`;
        return `
          <figure class="diagram-body">
            <img src="${this.escapeHtml(this.asset(src))}" alt="${this.escapeHtml(section.altText || section.title || 'Diagram')}" loading="lazy">
          </figure>
        `;
      }

      case 'DOCUMENT': {
        const href = typeof content === 'string' ? content : content && content.url;
        return href
          ? `<p style="margin-top: 1rem;"><a class="btn btn-secondary" href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Open document</a></p>`
          : `<p class="result-text">No document attached to this section.</p>`;
      }

      default:
        return `<p class="prose">${this.escapeHtml(
          typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        )}</p>`;
    }
  },

        renderTableContent(tableJson) {
    if (!tableJson || !Array.isArray(tableJson.columns) || !Array.isArray(tableJson.rows)) {
      return `<p class="result-text">No table data available for this section.</p>`;
    }

    return `
      <div class="table-responsive">
        <table class="edu-table">
          <thead>
            <tr>${tableJson.columns.map(col => `<th>${this.formatCell(col, { header: true })}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableJson.rows
              .map(row => `<tr>${row.map(cell => `<td>${this.formatCell(cell)}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  symbolToLatex(raw) {
    let tex = String(raw).trim();

        const primed = tex.match(/^([A-Z][A-Za-z0-9]*)\s*['\u2032\u0305]$/);
    if (primed) return `\\overline{${primed[1]}}`;

        tex = tex.replace(/\(next\)/gi, '_{next}');

        tex = tex.replace(/([A-Za-z])(\d+)/g, '$1_{$2}');

        tex = tex.replace(/[\u2080-\u2089]/g, ch => `_{${ch.charCodeAt(0) - 0x2080}}`);

    return tex;
  },

  looksLikeSymbol(raw) {
    const trimmed = String(raw).trim();
    if (!trimmed || trimmed.length > 14) return false;
    if (!/[A-Za-z]/.test(trimmed)) return false;
                if (/^[A-Z]\(next\)$/i.test(trimmed)) return true;
    if (!/^[A-Z][A-Z0-9()'\u2032\u0305\u2080-\u2089 ]*$/.test(trimmed)) return false;
    const hasDecoration = /[0-9()'\u2032\u0305\u2080-\u2089]/.test(trimmed);
    if (!hasDecoration && trimmed.length > 3) return false;
    return true;
  },

  formatCell(value, { header = false } = {}) {
    if (value === null || value === undefined) return '-';

    const raw = String(value);
    const latexMatch = raw.match(/^\\\(([\s\S]+?)\\\)$/);
    let tex = null;

    if (latexMatch) {
      tex = latexMatch[1];
    } else if (this.looksLikeSymbol(raw) && !/^(Hold|Toggle|Set|Reset|Operation)$/i.test(raw)) {
      tex = this.symbolToLatex(raw);
    }

    if (tex) {
                  const body = header ? `\\boldsymbol{${tex}}` : tex;
      return `<span data-katex-inline="${this.escapeHtml(body)}"${
        header ? ' class="th-math"' : ''
      }>${this.escapeHtml(raw.replace(/^\\\(|\\\)$/g, ''))}</span>`;
    }

    const highlight = ['X', 'Toggle', 'Reset', 'Set', 'Hold'].includes(raw);
    return highlight
      ? `<span class="cell-highlight">${this.escapeHtml(raw)}</span>`
      : this.escapeHtml(raw);
  },

  renderEquationContent(latex) {
            return `
      <div class="equation-block">
        <div class="equation-rendered" data-latex="${this.escapeHtml(latex)}">
          <code>${this.escapeHtml(latex)}</code>
        </div>
      </div>
    `;
  },

  renderMath() {
    if (typeof window.katex === 'undefined') return;

    document.querySelectorAll('.equation-rendered[data-latex]').forEach(el => {
      const latex = el.getAttribute('data-latex');
      if (!latex) return;
      try {
        el.innerHTML = window.katex.renderToString(latex, { throwOnError: false, displayMode: true });
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    });

    this.fitEquations();

    document.querySelectorAll('[data-katex-inline]').forEach(el => {
      const latex = el.getAttribute('data-katex-inline');
      if (!latex) return;
      try {
        el.innerHTML = window.katex.renderToString(latex, { throwOnError: false, displayMode: false });
      } catch (err) {
        console.warn('KaTeX inline render error:', err);
      }
    });
  },

  fitEquations() {
    document.querySelectorAll('.equation-block').forEach(block => {
      const katex = block.querySelector('.katex-display > .katex') || block.querySelector('.katex');
      if (!katex) return;

      katex.style.fontSize = '';
                        const styles = window.getComputedStyle(block);
      const gutter = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      const available = block.clientWidth - gutter;
      if (!available) return;

      const baseSize = parseFloat(window.getComputedStyle(katex).fontSize) || 24;
      const natural = katex.getBoundingClientRect().width;
      if (!natural) return;

                  const target = available * 0.94;
                  const ceiling = 64 / baseSize;
      let scale = target / natural;
      scale = Math.min(3.4, ceiling, Math.max(0.6, scale));
      katex.style.fontSize = `${(baseSize * scale).toFixed(2)}px`;

                  const fitted = katex.getBoundingClientRect().width;
      if (fitted > available && fitted > 0) {
        katex.style.fontSize = `${(baseSize * scale * (available / fitted) * 0.99).toFixed(2)}px`;
      }
    });
  },

        async renderLabConsole() {
    this.setTitle('Lab Console');

            const labStats = await api.getStats().catch(() => null);
    const labComponentCount = labStats && labStats.data && Number.isFinite(Number(labStats.data.components))
      ? Number(labStats.data.components)
      : null;
    const datasetLabel = labComponentCount === null
      ? 'the seeded dataset'
      : `${labComponentCount}-component seed dataset`;

    this.contentEl.innerHTML = `
      <div class="page">
        <header class="lab-header">
          <h1 class="lab-title">Lab Console</h1>
        </header>

        <div class="lab-tabs" role="tablist" aria-label="Lab console sections">
          <button class="lab-tab-btn active" type="button" role="tab" aria-selected="true" data-action="switch-lab-tab" data-arg="tab-a10">Stored Programs</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-benchmarks">Index Benchmarks</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-dashboard">Dashboard</button>
        </div>

        <!-- Tab 1: stored programs -->
        <div id="tab-a10" class="lab-panel active" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">1. Component CRUD Stored Procedures</h2>
                <p class="lab-card-desc">Execute <code>sp_insert_component</code> through the API, then review the audit trail written by the database triggers.</p>
              </div>
            </div>

            <form id="sp-component-form" data-form="insert-component">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="sp-cat-id">Category</label>
                  <select id="sp-cat-id" class="form-control" required>
                    <option value="6">Counters (ID 6)</option>
                    <option value="7">Flip-Flops (ID 7)</option>
                    <option value="8" selected>Logic Gates (ID 8)</option>
                    <option value="9">Multiplexers (ID 9)</option>
                    <option value="11">Rectifier Diodes (ID 11)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="sp-comp-name">Component name</label>
                  <input type="text" id="sp-comp-name" class="form-control" placeholder="e.g. Quad OR Gate" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sp-comp-slug">Slug</label>
                  <input type="text" id="sp-comp-slug" class="form-control" placeholder="e.g. quad-or-gate" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sp-comp-desc">Short description</label>
                  <input type="text" id="sp-comp-desc" class="form-control" placeholder="Brief summary" />
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Execute sp_insert_component</button>
            </form>
            <div id="sp-crud-result"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">2. Explicit Cursors &amp; Sum Numeric Functions</h2>
                <p class="lab-card-desc">Run cursor procedures with and without a limit, plus grouped and ungrouped numeric aggregation routines.</p>
              </div>
            </div>
            <div class="lab-actions" style="margin-bottom: 1rem;">
              <button class="btn btn-secondary" type="button" data-action="run-cursor-all">Run cursor (all rows)</button>
              <button class="btn btn-secondary" type="button" data-action="run-cursor-limited">Run cursor (limit 5)</button>
              <button class="btn btn-secondary" type="button" data-action="run-sum-routines">Run sum functions</button>
            </div>
            <div id="cursor-result"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">3. Application User Login-Data CRUD</h2>
                <p class="lab-card-desc">Demonstrates application-user management through <code>sp_insert_app_user</code>, <code>sp_update_app_user</code>, and <code>sp_delete_app_user</code> without exposing a public login.</p>
              </div>
            </div>
            <div class="lab-actions" style="margin-bottom: 1rem;">
              <button class="btn btn-primary" type="button" data-action="show-add-user">+ Add application user</button>
              <button class="btn btn-secondary" type="button" data-action="load-app-users">Refresh users</button>
            </div>
            <div id="users-table-container" class="result-text">Loading users…</div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">4. Trigger Verification &amp; Audit Log</h2>
                <p class="lab-card-desc">Review recent row-level changes recorded by <code>trg_components_audit_ai/au/ad</code> in <code>application_audit_log</code>.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="load-audit-log">Refresh audit log</button>
              </div>
            </div>
            <div id="audit-log-container" class="result-text">Loading audit logs…</div>
          </div>
        </div>

        <!-- Tab 2: Benchmarks -->
        <div id="tab-benchmarks" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Index Timing Benchmarks &amp; Analysis</h2>
                <p class="lab-card-desc">Execution times measured before and after candidate secondary indexes were applied to the ${datasetLabel}.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="load-timing-report">Refresh report</button>
              </div>
            </div>
            <div id="timing-report-container" class="result-text">Loading benchmark tables…</div>
          </div>
        </div>

        <!-- Tab 3: Dashboard -->
        <div id="tab-dashboard" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Live Database Table Statistics</h2>
                <p class="lab-card-desc">Row counts for every catalog and assignment table, plus component publication metrics.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="load-dashboard">Refresh statistics</button>
              </div>
            </div>
            <div id="dashboard-container" class="result-text">Loading statistics…</div>
          </div>
        </div>
      </div>
    `;

    this.loadAppUsers();
    this.loadAuditLog();
    this.loadTimingReport();
    this.loadDashboard();
    if (this.paintRanges) this.paintRanges();
  },

  switchLabTab(tabId, button) {
    const panel = document.getElementById(tabId);
    if (!panel) return;

    document.querySelectorAll('.lab-panel').forEach(item => {
      item.classList.toggle('active', item.id === tabId);
    });

    document.querySelectorAll('.lab-tab-btn').forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  },

        async handleInsertComponent(event) {
    event.preventDefault();

    const categoryId = document.getElementById('sp-cat-id').value;
    const name = document.getElementById('sp-comp-name').value.trim();
    const slug = document.getElementById('sp-comp-slug').value.trim();
    const description = document.getElementById('sp-comp-desc').value.trim();
    const container = document.getElementById('sp-crud-result');

    container.innerHTML = '<p class="result-text">Executing sp_insert_component…</p>';

    try {
      const res = await api.lab.createComponent({
        categoryId,
        name,
        slug,
        shortDescription: description
      });
      container.innerHTML = `
        <div class="alert alert-success">
          Stored procedure executed successfully. New component ID: <strong>${this.escapeHtml(res.data.componentId)}</strong>
        </div>
      `;
      document.getElementById('sp-comp-name').value = '';
      document.getElementById('sp-comp-slug').value = '';
      document.getElementById('sp-comp-desc').value = '';
      this.toast('Component inserted through sp_insert_component.', 'success');
      this.loadAuditLog();
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">Procedure error: ${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runCursorAll() {
    const el = document.getElementById('cursor-result');
    el.innerHTML = '<p class="result-text">Executing sp_cursor_components_all…</p>';

    try {
      const res = await api.lab.getCursorsAll();
      const rows = res.data.rows || [];
      el.innerHTML = `
        <div class="alert alert-success">
          Unbounded cursor iterated across <strong>${res.data.rowCount}</strong> rows. Showing the first 10.
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th></tr></thead>
            <tbody>
              ${rows
                .slice(0, 10)
                .map(row => `<tr><td>${this.escapeHtml(row.component_id)}</td><td>${this.escapeHtml(row.name)}</td></tr>`)
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runCursorLimited() {
    const el = document.getElementById('cursor-result');
    el.innerHTML = '<p class="result-text">Executing sp_cursor_components_limited(5)…</p>';

    try {
      const res = await api.lab.getCursorsLimited(5);
      el.innerHTML = `
        <div class="alert alert-success">Bounded cursor stopped exactly at the limit of <strong>5</strong> rows.</div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th></tr></thead>
            <tbody>
              ${(res.data.rows || [])
                .map(row => `<tr><td>${this.escapeHtml(row.component_id)}</td><td>${this.escapeHtml(row.name)}</td></tr>`)
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runSumRoutines() {
    const el = document.getElementById('cursor-result');
    el.innerHTML = '<p class="result-text">Executing sum functions…</p>';

    try {
      const res = await api.lab.getSum();
      el.innerHTML = `
        <div class="alert alert-success">
          <strong>Ungrouped sum (fn_sum_component_ids):</strong>&nbsp;${this.escapeHtml(res.data.ungrouped.totalSum)}
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead>
              <tr><th>Category ID</th><th>Category</th><th>Components</th><th>Sum of component IDs</th></tr>
            </thead>
            <tbody>
              ${res.data.grouped.items
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.category_id)}</td>
                      <td>${this.escapeHtml(row.category_name)}</td>
                      <td>${this.escapeHtml(row.component_count)}</td>
                      <td>${this.escapeHtml(row.sum_component_ids)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async loadAppUsers() {
    const container = document.getElementById('users-table-container');
    if (!container) return;

    try {
      const res = await api.lab.getAppUsers();
      if (!res.data || !res.data.length) {
        container.innerHTML = '<p class="result-text">No application users registered yet. Use “Add application user” to create one.</p>';
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead>
              <tr><th>User ID</th><th>Username</th><th>Role</th><th>Active</th><th>Created</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${res.data
                .map(
                  user => `
                    <tr>
                      <td>${this.escapeHtml(user.user_id)}</td>
                      <td><strong>${this.escapeHtml(user.username)}</strong></td>
                      <td><span class="count-pill">${this.escapeHtml(user.role_code)}</span></td>
                      <td>${user.is_active ? 'Yes' : 'No'}</td>
                      <td>${this.escapeHtml(user.created_at)}</td>
                      <td>
                        <button class="btn btn-danger btn-sm" type="button" data-action="delete-user" data-arg="${Number(user.user_id)}">Delete</button>
                      </td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  showAddUserModal() {
    const body = `
      <form id="create-user-modal-form" data-form="create-user">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="new-user-name">Username</label>
          <input type="text" id="new-user-name" class="form-control" required placeholder="e.g. lab_student" />
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="new-user-role">Role</label>
          <select id="new-user-role" class="form-control">
            <option value="NAIVE_USER">NAIVE_USER - read-only end user</option>
            <option value="APP_DEVELOPER" selected>APP_DEVELOPER - application developer</option>
            <option value="DBA">DBA - database administrator</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label" for="new-user-hash">Password hash (simulated bcrypt)</label>
          <input type="text" id="new-user-hash" class="form-control" readonly value="$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W565n8.y0fXm3wye" />
          <span class="form-hint">Stored procedures reject plaintext passwords.</span>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create app user</button>
      </form>
    `;
    this.openModal('Add Application User', body);
  },

  async handleCreateUser(event) {
    event.preventDefault();

    const username = document.getElementById('new-user-name').value.trim();
    const roleCode = document.getElementById('new-user-role').value;
    const passwordHash = document.getElementById('new-user-hash').value;

    try {
      await api.lab.createAppUser({ username, roleCode, passwordHash });
      this.closeModal();
      this.toast(`Application user “${username}” created.`, 'success');
      this.loadAppUsers();
    } catch (err) {
      this.toast(`Could not create user: ${err.message}`, 'error');
    }
  },

  async handleDeleteUser(id) {
    if (!window.confirm(`Delete application user ID ${id}?`)) return;

    try {
      await api.lab.deleteAppUser(id);
      this.toast(`Application user ${id} deleted.`, 'success');
      this.loadAppUsers();
    } catch (err) {
      this.toast(`Could not delete user: ${err.message}`, 'error');
    }
  },

  async loadAuditLog() {
    const container = document.getElementById('audit-log-container');
    if (!container) return;

    try {
      const res = await api.lab.getAuditLogs(10);
      if (!res.data || !res.data.length) {
        container.innerHTML = '<p class="result-text">The audit log is currently empty.</p>';
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead>
              <tr><th>Audit ID</th><th>Table</th><th>Operation</th><th>Row key</th><th>DB user</th><th>Changed at</th><th>Values</th></tr>
            </thead>
            <tbody>
              ${res.data
                .map(log => {
                                                                        const op = String(log.operation_type || '').toLowerCase();
                  const badgeClass = `badge-op badge-op--${['insert', 'update', 'delete'].includes(op) ? op : 'other'}`;
                  return `
                    <tr>
                      <td>${this.escapeHtml(log.audit_id)}</td>
                      <td><code>${this.escapeHtml(log.table_name)}</code></td>
                      <td><span class="${badgeClass}">${this.escapeHtml(log.operation_type)}</span></td>
                      <td>${this.escapeHtml(log.row_key)}</td>
                      <td>${this.escapeHtml(log.db_user)}</td>
                      <td>${this.escapeHtml(log.changed_at)}</td>
                      <td><pre class="cell-pre">${this.escapeHtml(JSON.stringify(log.new_values || log.old_values || ''))}</pre></td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async loadTimingReport() {
    const container = document.getElementById('timing-report-container');
    if (!container) return;

    try {
      const res = await api.lab.getTimingReport();
      const report = String(res.data.report || '');
      if (!report.trim()) {
        container.innerHTML = '<p class="result-text">No benchmark report available.</p>';
        return;
      }
      container.innerHTML = this.renderBenchmarkReport(this.parseBenchmarkReport(report));
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

    splitMarkdownRow(line) {
    return String(line)
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim().replace(/\*\*/g, '').replace(/`/g, ''));
  },

    parseMarkdownTables(markdown) {
    const lines = String(markdown).split('\n');
    const tables = [];
    let i = 0;

    while (i < lines.length) {
      const isRow = /^\s*\|/.test(lines[i]);
      const isDivider = /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '');
      if (!isRow || !isDivider) {
        i += 1;
        continue;
      }

      const header = this.splitMarkdownRow(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(this.splitMarkdownRow(lines[i]));
        i += 1;
      }
      tables.push({ header, rows });
    }

    return tables;
  },

  parseBenchmarkReport(markdown) {
    const md = String(markdown);

        const meta = [];
    const metaMatches = md.matchAll(/^\*\*([^*\n]+):\*\*\s*(.+)$/gm);
    for (const match of metaMatches) {
      const value = match[2].replace(/\s+/g, ' ').trim();
            if (!value || value.startsWith('-')) continue;
      meta.push([match[1].trim(), value]);
    }
    const datasetMatches = md.matchAll(/^-\s*`?([^`:\n]+)`?\s*table:\s*([\d,]+)\s*rows/gm);
    for (const match of datasetMatches) meta.push([`${match[1].trim()} (rows)`, match[2].trim()]);

                const queries = [];
    const lines = md.split('\n');
    lines.forEach((line, index) => {
      const heading = line.match(/^###\s+(Q\d+):\s*(.+)$/);
      if (!heading) return;

      const block = [];
      let cursor = index + 1;
      while (cursor < lines.length && !/^#{2,3}\s/.test(lines[cursor])) {
        block.push(lines[cursor]);
        cursor += 1;
      }
      const text = block.join('\n');
      const field = label => {
        const match = text.match(new RegExp(`-\\s*\\*\\*${label}:\\*\\*\\s*(.+)`));
        return match ? match[1].replace(/`/g, '').trim() : '';
      };
      const timings = text.match(
        /Before Index:\s*Avg\s*([\d.]+)\s*ms\s*\(min:\s*([\d.]+)\s*ms,\s*max:\s*([\d.]+)\s*ms\)[\s\S]*?After Index:\s*Avg\s*([\d.]+)\s*ms\s*\(min:\s*([\d.]+)\s*ms,\s*max:\s*([\d.]+)\s*ms\)/
      );

      queries.push({
        id: heading[1],
        name: heading[2].trim(),
        rows: field('Dataset / Result Rows'),
        key: field('Optimizer Key Used'),
        beforeMin: timings ? timings[2] : '',
        beforeMax: timings ? timings[3] : '',
        afterMin: timings ? timings[5] : '',
        afterMax: timings ? timings[6] : ''
      });
    });

    const tables = this.parseMarkdownTables(md);

    return { meta, summary: tables[0] || null, queries };
  },

    renderBenchmarkReport(report) {
    const parts = [];

    if (report.meta.length) {
      parts.push('<h3 class="bench-heading">Report</h3>');
      parts.push(
        this.renderBenchmarkTable(['Field', 'Value'], report.meta, {
          className: 'bench-table--meta',
          cellClass: (cell, column) => (column === 0 ? 'bench-cell-key' : 'bench-cell-value')
        })
      );
    }

    if (report.summary) {
      parts.push('<h3 class="bench-heading">Execution timing summary</h3>');
      parts.push(
        this.renderBenchmarkTable(report.summary.header, report.summary.rows, {
          className: 'bench-table--summary',
          cellClass: (cell, column) => {
            if (column === 0) return 'bench-cell-id';
            if (column === 1) return 'bench-cell-name';
            if (column === report.summary.header.length - 1) {
              return /^-/.test(cell) ? 'bench-cell-slower' : 'bench-cell-faster';
            }
            return /^-?[\d.]+( ms|%)?$/.test(cell) ? 'bench-cell-number' : '';
          }
        })
      );
    }

    if (report.queries.length) {
      parts.push('<h3 class="bench-heading">Per-query timings</h3>');
      parts.push(
        this.renderBenchmarkTable(
          ['Query', 'Name', 'Rows', 'Before min–max (ms)', 'After min–max (ms)', 'Index used'],
          report.queries.map(query => [
            query.id,
            query.name,
            query.rows || '-',
            query.beforeMin ? `${query.beforeMin} – ${query.beforeMax}` : '-',
            query.afterMin ? `${query.afterMin} – ${query.afterMax}` : '-',
            query.key || '-'
          ]),
          {
            className: 'bench-table--timings',
            cellClass: (cell, column) =>
              column === 0
                ? 'bench-cell-id'
                : column === 1
                  ? 'bench-cell-name'
                  : column >= 2 && column <= 4
                    ? 'bench-cell-number'
                    : ''
          }
        )
      );
    }

    return parts.length ? parts.join('\n') : '<p class="result-text">No benchmark report available.</p>';
  },

  renderBenchmarkTable(header, rows, { className = '', cellClass = () => '' } = {}) {
    return `
      <div class="table-responsive">
        <table class="edu-table bench-table ${className}">
          <thead>
            <tr>${header.map(cell => `<th>${this.escapeHtml(cell)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                row =>
                  `<tr>${row
                    .map((cell, column) => {
                      const extra = cellClass(cell, column);
                      return `<td${extra ? ` class="${extra}"` : ''}>${this.escapeHtml(cell)}</td>`;
                    })
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async loadDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    try {
      const res = await api.lab.getDashboard();
      const tables = res.data.tables || [];
      const metrics = res.data.componentMetrics;

      container.innerHTML = `
        <div class="stats-grid">
          ${tables
            .map(
              table => `
                <div class="stat-card">
                  <div class="stat-value">${this.escapeHtml(table.row_count)}</div>
                  <div class="stat-label">${this.escapeHtml(table.table_name)}</div>
                </div>
              `
            )
            .join('')}
        </div>
        ${
          metrics
            ? `
              <div class="metrics-note">
                <span><strong>Components:</strong> ${this.escapeHtml(metrics.published_components)}</span>
                <span><strong>With reference artwork:</strong> ${this.escapeHtml(metrics.illustrative_components)}</span>
              </div>
            `
            : ''
        }
      `;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

        categoryCard(category) {
                const children = category.children || [];
    const directCount = Number(
      category.componentCount !== undefined ? category.componentCount : category.component_count || 0
    );
    const childCount = children.reduce(
      (sum, child) =>
        sum + Number(child.component_count !== undefined ? child.component_count : child.componentCount || 0),
      0
    );

    return this.subcategoryCard({
      ...category,
      description: category.description || '',
      component_count: directCount + childCount
    });
  },

  componentCard(comp) {
    const id = comp.componentId !== undefined ? comp.componentId : comp.component_id;
    const slug = comp.slug || id;
    const name = comp.name || 'Untitled component';
    const description = comp.short_description || comp.shortDescription || '';
    const symbol = comp.circuit_symbol_path || comp.circuitSymbolPath;

                    return `
      <div class="component-card component-card--plain" data-component-id="${this.escapeHtml(id)}">
        <a class="component-card-link" href="#/components/${encodeURIComponent(slug)}">
          <div class="component-card-top">
            <h3 class="component-card-title">${this.escapeHtml(name)}</h3>
            ${
              symbol
                ? `<img class="component-card-symbol" src="${this.escapeHtml(this.asset(symbol))}" alt="" loading="lazy" data-hide-on-error>`
                : ''
            }
          </div>
          ${description ? `<p class="component-card-desc">${this.escapeHtml(description)}</p>` : '<p class="component-card-desc"></p>'}
        </a>
        <div class="component-card-foot">${account.bookmarkButton(id, { labelled: true })}</div>
      </div>
    `;
  },

  subcategoryCard(category) {
    const id = category.category_id !== undefined ? category.category_id : category.categoryId;
    const count = Number(
      category.component_count !== undefined ? category.component_count : category.componentCount || 0
    );
    const description = category.description || '';

            return `
      <a class="subcategory-card" href="#/categories/${encodeURIComponent(id)}">
        <span class="subcategory-name">${this.escapeHtml(category.name)}</span>
        ${description ? `<p class="subcategory-desc">${this.escapeHtml(description)}</p>` : ''}
        <span class="subcategory-foot">
          <span class="subcategory-foot-count"><b>${count}</b> component${count === 1 ? '' : 's'}</span>
          <span class="subcategory-arrow" aria-hidden="true">
            <svg class="subcategory-arrow-svg" viewBox="0 0 24 14" width="24" height="14" focusable="false">
              <path class="arrow-rest" d="M3 7H16.6M11.4 2.4 16.6 7l-5.2 4.6" />
              <path class="arrow-shaft" pathLength="1" d="M3 7H16.6" />
              <path class="arrow-head" pathLength="1" d="M11.4 2.4 16.6 7l-5.2 4.6" />
              <path class="arrow-core" d="M3 7H16.6M11.4 2.4 16.6 7l-5.2 4.6" />
              <path class="arrow-strike" d="M3 7H16.6M11.4 2.4 16.6 7l-5.2 4.6" />
              <g class="arrow-nib">
                <circle class="arrow-nib-halo" cx="3" cy="7" r="2.5" />
                <circle class="arrow-nib-tip" cx="3" cy="7" r="1.15" />
              </g>
            </svg>
          </span>
        </span>
      </a>
    `;
  },

  breadcrumbs(parts) {
    return `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        ${parts
          .map((part, index) => {
            const separator = index > 0 ? '<span class="breadcrumb-sep">&gt;</span>' : '';
            const label = part.href
              ? `<a href="${part.href}">${this.escapeHtml(part.label)}</a>`
              : `<span aria-current="page">${this.escapeHtml(part.label)}</span>`;
            return `${separator}${label}`;
          })
          .join('')}
      </nav>
    `;
  },

  renderPagination(pagination, baseUrl) {
    if (!pagination) return '';

    const page = Number(pagination.page) || 1;
    const totalPages = Number(pagination.totalPages) || 0;
    if (totalPages <= 1) return '';

    const separator = baseUrl.includes('?') ? '&' : '?';
    const href = target => `${baseUrl}${separator}page=${target}`;

    const pages = [];
    for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) {
      pages.push(p);
    }

    let html = '<div class="pagination-bar">';
    html +=
      page > 1
        ? `<a class="page-btn" href="${href(page - 1)}" rel="prev"><span class="page-arrow page-arrow--left" aria-hidden="true">«</span> Prev</a>`
        : '<button class="page-btn" type="button" disabled><span class="page-arrow page-arrow--left" aria-hidden="true">«</span> Prev</button>';

    if (pages[0] > 1) {
      html += `<a class="page-btn" href="${href(1)}">1</a>`;
      if (pages[0] > 2) html += '<span class="page-ellipsis">…</span>';
    }

    pages.forEach(target => {
      html +=
        target === page
          ? `<span class="page-btn active" aria-current="page">${target}</span>`
          : `<a class="page-btn" href="${href(target)}">${target}</a>`;
    });

    const lastRendered = pages[pages.length - 1];
    if (lastRendered < totalPages) {
      if (lastRendered < totalPages - 1) html += '<span class="page-ellipsis">…</span>';
      html += `<a class="page-btn" href="${href(totalPages)}">${totalPages}</a>`;
    }

    html +=
      page < totalPages
        ? `<a class="page-btn" href="${href(page + 1)}" rel="next">Next <span class="page-arrow page-arrow--right" aria-hidden="true">»</span></a>`
        : '<button class="page-btn" type="button" disabled>Next <span class="page-arrow page-arrow--right" aria-hidden="true">»</span></button>';

    html += '</div>';
    return html;
  },

        openModal(title, bodyHtml, { viewer = false } = {}) {
    const modal = document.getElementById('global-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    modal.classList.toggle('modal-overlay--viewer', viewer);
    modal.classList.add('open');
  },

  closeModal() {
    const modal = document.getElementById('global-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.classList.remove('modal-overlay--viewer');
  },

  openImageModal(src, title) {
    if (!src) return;

    const body = `
      <div class="diagram-frame">
        <img src="${this.escapeHtml(this.asset(src))}" alt="${this.escapeHtml(title || 'Diagram')}">
      </div>
    `;
    this.openModal(title || 'Diagram', body, { viewer: true });
  },

  toast(message, type = 'info') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    stack.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 220);
    }, 4200);
  },

  downloadXml(xmlContent, filename) {
    if (!xmlContent) {
      this.toast('No XML output to download yet.', 'error');
      return;
    }

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'export.xml';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    this.toast(`Downloaded ${filename || 'export.xml'}.`, 'success');
  },

  escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());

let equationResizeTimer = null;
const refitEquations = () => {
  clearTimeout(equationResizeTimer);
  equationResizeTimer = setTimeout(() => app.fitEquations(), 120);
};

window.addEventListener('resize', refitEquations);
window.addEventListener('load', refitEquations);
if (document.fonts && typeof document.fonts.ready === 'object') {
  document.fonts.ready.then(refitEquations).catch(() => {});
}
