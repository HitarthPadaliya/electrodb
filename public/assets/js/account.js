/**
 * ElectroDB - accounts, bookmarks, collections, dashboard and administration.
 *
 * This module owns the session in the browser and renders every page that
 * needs one. It is a convenience layer only: each page assumes the server has
 * already enforced the rule, and every request that changes something is
 * answered by the API's authorization checks, not by anything here.
 */
const account = {
  user: null,
  bookmarkIds: new Set(),

  // ---------------------------------------------------------------- session
  // Incremented whenever the identity changes under the app's own control. A
  // session probe that started before that change must not apply its (now
  // stale) answer - that is how a slow /auth/me could sign a visitor back out
  // immediately after a successful sign-in.
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
      // A failed session probe is not an error worth showing: the site works
      // signed out.
      if (version === this.sessionVersion) this.applySession({ user: null, bookmarkIds: [] });
    }
    return this.user;
  },

  /** Re-check a live session when the tab comes back into focus. */
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

  /**
   * Listen for a 401 from any personal endpoint. The API emits the event
   * because a session can end *after* the page loaded - it expires, it is
   * revoked by a password change or an administrator, or a dev server restarts
   * and loses it. Without this the header keeps claiming the visitor is signed
   * in while Save asks them to sign in, which reads like a bug in the save.
   */
  watchSession() {
    if (this.watching) return;
    this.watching = true;
    window.addEventListener('electrodb:unauthorized', () => this.onSessionLost());
    this.watchFocus();
  },

  /** Routes that cannot render at all without a session. */
  isProtectedRoute(hash = window.location.hash || '') {
    return /^#\/(dashboard|bookmarks|collections|profile|admin)\b/.test(hash);
  },

  /** Forget the local session. Returns true if the visitor looked signed in. */
  clearSession() {
    const wasSignedIn = this.isSignedIn();
    this.bumpSessionVersion();
    this.applySession({ user: null, bookmarkIds: [] });
    return wasSignedIn;
  },

  onSessionLost() {
    const wasSignedIn = this.clearSession();
    if (!wasSignedIn) return;

    // Several requests can fail together; react once.
    const now = Date.now();
    if (now - (this.sessionLostAt || 0) < 2000) return;
    this.sessionLostAt = now;

    const next = this.currentRoute();

    // A guarded page cannot exist without a session, so hand over to the sign-in
    // page with a way back rather than showing a dialog over an empty page.
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

  /** Where to come back to after signing in. */
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
    // The Lab Console is an internal tool: it is only offered to accounts that
    // can author content. Hiding it here is presentation; the API refuses it.
    document.querySelectorAll('[data-requires]').forEach(el => {
      const need = el.getAttribute('data-requires');
      // Presentation only. Every one of these routes is refused by the API to
      // an account without the role, whatever the browser shows.
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
      /* the cookie is cleared server-side even if the call failed */
    }
    this.applySession({ user: null, bookmarkIds: [] });
    app.toast('Signed out.', 'success');
    window.location.hash = '#/';
  },

  // ------------------------------------------------------- bookmark control
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

      // The bookmarks page is a list of exactly these components, so a removal
      // there has to take the card with it.
      if (wasSaved && window.location.hash.startsWith('#/bookmarks')) {
        await this.renderBookmarks();
      }
    } catch (err) {
      // onSessionLost() has already reset the header and explained the 401.
      if (err.status === 401) return;
      app.toast(err.message || 'Could not update that bookmark.', 'error');
    }

    if (target) target.blur();
  },

  /** Keep every copy of the control for one component in step. */
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

  // -------------------------------------------------------------- auth pages
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

  /**
   * The preview server exposes its demo accounts; the real application does not
   * have that endpoint, in which case nothing is rendered.
   */
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

  // ------------------------------------------------------------ profile
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

        <section class="account-panel account-panel--wide">
          <h2 class="section-title">Session</h2>
          <p class="account-note">Your sign-in is held in an HttpOnly cookie. Signing out deletes the session on the server, not just the cookie in this browser.</p>
          <button class="btn btn-secondary" type="button" data-action="sign-out">Sign out</button>
        </section>
      </div>
    `;
  },

  // ------------------------------------------------------------ bookmarks
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

  // ---------------------------------------------------------- collections
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

  /** The picker shown on a component page. */
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

  // ------------------------------------------------------------ dashboard
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

  // -------------------------------------------------------- administration
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

  // ------------------------------------------------------------ form handling
  /** Read a field by name. Named access on the form is not portable. */
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

      // Prove the browser kept the session cookie. If it did not - a blocked or
      // cross-site cookie, or a proxy stripping it - the next page would load
      // signed out and the visitor would be back here with no explanation.
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
