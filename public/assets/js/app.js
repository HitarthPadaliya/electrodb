/**
 * ElectroDB Frontend Application
 * Hash-based SPA router + catalog renderers + database lab console.
 */

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

  /**
   * Append the build stamp to an asset URL. Artwork is regenerated in place, so
   * without this a browser or proxy can keep showing the previous drawing.
   */
  asset(path) {
    if (!path) return path;
    const value = String(path);
    if (!value.startsWith('/')) return value;
    const separator = value.includes('?') ? '&' : '?';
    return `${value}${separator}v=${ASSET_VERSION}`;
  },

  // ----------------------------------------------------------------
  // Bootstrapping
  // ----------------------------------------------------------------
  async init() {
    this.contentEl = document.getElementById('app-content');
    this.initCursorGlow();
    this.bindEvents();
    // The session has to be known before the first paint so the header and any
    // bookmark control render in the right state.
    await account.loadSession();
    this.handleRouting();
  },

  initCursorGlow() {
    const glow = document.getElementById('glow');
    if (!glow || !window.matchMedia) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer || this.prefersReducedMotion()) return;

    // Follow the pointer with a lerp on a composited transform instead of
    // writing left/top on every mousemove, which keeps the glow smooth.
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

    // Header search → search route
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.goToSearch(searchInput.value.trim());
        }
      });
    }

    // Delegated form submissions (all forms are rendered dynamically)
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

    // Delegated select changes
    document.addEventListener('change', e => {
      const control = e.target.closest('[data-change]');
      if (control && control.getAttribute('data-change') === 'catalog-filter') {
        this.onCatalogFilterChange(control.value);
      }

      // Administration: a role change is applied through the API, which is the
      // only place the decision is actually made.
      const roleSelect = e.target.closest('[data-action="admin-set-role"]');
      if (roleSelect) {
        account.setUserRole(Number(roleSelect.getAttribute('data-arg')), roleSelect.value);
      }
    });

    // Delegated range sliders: paint the filled part of the track and react.
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

    // Paint any sliders that rendered with the markup.
    const paintRanges = () => document.querySelectorAll('input[type="range"]').forEach(syncRange);
    this.paintRanges = paintRanges;

    // Hide images that fail to load (delegated error handler; CSP-safe)
    document.addEventListener('error', e => {
      const target = e.target;
      if (target && target.tagName === 'IMG' && target.hasAttribute('data-hide-on-error')) {
        target.classList.add('no-art');
        target.removeAttribute('data-hide-on-error');
      }
    }, true);

    // Delegated clicks: modal, image previews, mobile nav
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

      // "/" focuses the header search when not already typing
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
    // Already showing this result set: re-rendering would replay the page
    // animation for a click that changed nothing, which is exactly the kind of
    // flicker worth avoiding.
    if (window.location.hash === target) return;
    window.location.hash = target;
  },

  // ----------------------------------------------------------------
  // Routing
  // ----------------------------------------------------------------
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
          // The Lab Console is an internal tool. Hiding the link is a courtesy;
          // the API refuses these routes to anyone who is not Developer or DBA.
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

    // Reset the scroll position together with the new markup, in the same task
    // as the render, so the reader never sees the old page jump first.
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

  // ----------------------------------------------------------------
  // Shared states
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Home
  // ----------------------------------------------------------------
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

    // The summary figures come from the API, which counts the rows it serves.
    // If the counts call fails the page still works: components and categories
    // fall back to what the category tree already reports, and any figure that
    // cannot be counted (the diagram total) is left out rather than invented.
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

    // Only rendered when it was counted; there is no fallback number.
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

  // ----------------------------------------------------------------
  // Category index
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Category detail
  // ----------------------------------------------------------------
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

    // A branch category holds components only inside its subcategories, so the
    // "Components" heading is not printed when there is nothing under it. The
    // section only appears when there is something to read - either components,
    // or an empty leaf that deserves an explanation.
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

  // ----------------------------------------------------------------
  // Catalog
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Tags
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Search
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Component detail
  // ----------------------------------------------------------------
  async renderComponentDetail(idOrSlug) {
    const res = await api.getComponent(idOrSlug);
    const comp = res.data;
    const compId = comp.componentId !== undefined ? comp.componentId : comp.component_id;

    this.setTitle(comp.name);

    // Recently viewed is the signed-in user's own history, so it is recorded
    // here and only here; the API decides whose history that is.
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

    // The description lives in the hero, directly beneath the title.
    const heroLead =
      comp.description || comp.shortDescription || '';

    // Tags carry the classification; the category itself is already in the
    // breadcrumb, so it is not repeated as a pill here.
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

    // Circuit diagram, immediately after the hero. Logic gates are excluded:
    // their implementation is the IC pinout shown with the specifications.
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

    // Structured educational sections
    (comp.content || []).forEach(section => {
      if (section.sectionKey === 'overview') return;

      html += `
        <section class="detail-section">
          <h2 class="section-title">${this.escapeHtml(section.title || 'Details')}</h2>
          ${this.renderSectionBody(section)}
        </section>
      `;
    });

    // Supporting artwork. Each drawing becomes its own titled section, exactly
    // like Truth Table or Equation - no grid of cards, no asset counter, no
    // footnotes.
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

    // The IC pinout is a drawing, so it is its own section rather than being
    // folded into the specifications table.
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

    // Technical specifications, on their own.
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

    // Typeset the table signals and equations once the markup exists.
    this.renderMath();
  },

  // ----------------------------------------------------------------
  // Educational content renderers
  // ----------------------------------------------------------------

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

  // ----------------------------------------------------------------
  // Educational content renderers
  // ----------------------------------------------------------------
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

  /**
   * Signal symbols (J, K, Q, Q(next), S0, Q3Q2Q1Q0 ...) are typeset as maths so
   * subscripts and overbars read correctly. Words, numbers and binary strings
   * stay as plain text.
   */
  symbolToLatex(raw) {
    let tex = String(raw).trim();

    // Q' / Q' with overbar -> \overline{Q}
    const primed = tex.match(/^([A-Z][A-Za-z0-9]*)\s*['\u2032\u0305]$/);
    if (primed) return `\\overline{${primed[1]}}`;

    // Q(next) -> Q_{next}
    tex = tex.replace(/\(next\)/gi, '_{next}');

    // letter followed by one or more digits -> subscript
    tex = tex.replace(/([A-Za-z])(\d+)/g, '$1_{$2}');

    // unicode subscripts used by the seed data
    tex = tex.replace(/[\u2080-\u2089]/g, ch => `_{${ch.charCodeAt(0) - 0x2080}}`);

    return tex;
  },

  looksLikeSymbol(raw) {
    const trimmed = String(raw).trim();
    if (!trimmed || trimmed.length > 14) return false;
    if (!/[A-Za-z]/.test(trimmed)) return false;
    // Signal names only: a capitalised token, optionally carrying digits,
    // primes, "(next)" or unicode subscripts. Plain English words such as
    // "Decimal" or "Modulus" are left as text.
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
      // Headers are set in bold maths (\boldsymbol); cells keep the normal
      // weight so the two never read as the same emphasis.
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
    // Rendered maths only - the source LaTeX used to be printed underneath as a
    // footnote and is now dropped.
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

  /**
   * Scale each rendered equation so it fills its column instead of being
   * clipped into a horizontal scroller. Short equations grow up to a ceiling;
   * an unusually long one is shrunk just enough to fit.
   */
  fitEquations() {
    document.querySelectorAll('.equation-block').forEach(block => {
      const katex = block.querySelector('.katex-display > .katex') || block.querySelector('.katex');
      if (!katex) return;

      katex.style.fontSize = '';
      // The column width, minus the block's own horizontal padding: the
      // equation is fitted to the space that actually exists, so the page
      // never grows a horizontal scrollbar (no slider under the maths).
      const styles = window.getComputedStyle(block);
      const gutter = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      const available = block.clientWidth - gutter;
      if (!available) return; // no layout (e.g. headless DOM): keep the CSS size

      const baseSize = parseFloat(window.getComputedStyle(katex).fontSize) || 24;
      const natural = katex.getBoundingClientRect().width;
      if (!natural) return;

      // Fill ~94% of the column; short equations are allowed to grow well past
      // their 1.5rem base size, long ones shrink until they fit.
      const target = available * 0.94;
      // Grow well past the 1.7rem base, but stop at a readable ceiling so a
      // two-symbol equation does not become a poster.
      const ceiling = 64 / baseSize;
      let scale = target / natural;
      scale = Math.min(3.4, ceiling, Math.max(0.6, scale));
      katex.style.fontSize = `${(baseSize * scale).toFixed(2)}px`;

      // One correction pass in case rounding or font fallback changed the
      // measured width. This is what guarantees "no slider".
      const fitted = katex.getBoundingClientRect().width;
      if (fitted > available && fitted > 0) {
        katex.style.fontSize = `${(baseSize * scale * (available / fitted) * 0.99).toFixed(2)}px`;
      }
    });
  },

  // ----------------------------------------------------------------
  // Lab console
  // ----------------------------------------------------------------
  async renderLabConsole() {
    this.setTitle('Lab Console');

    // The benchmark note names the dataset it was measured on; the size comes
    // from the API so it cannot drift from the seeded catalogue.
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

  // ----------------------------------------------------------------
  // Lab actions
  // ----------------------------------------------------------------
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
                  // Audit operations get their own badge classes; reusing the
                  // component badge classes here was confusing and made the
                  // removed "Illustrative"/"Published" styling look alive.
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

  /* ----------------------------------------------------------------
     Index benchmark report: markdown in, tables out.
     ---------------------------------------------------------------- */

  /** One `| a | b |` row -> trimmed cells with the markdown noise removed. */
  splitMarkdownRow(line) {
    return String(line)
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim().replace(/\*\*/g, '').replace(/`/g, ''));
  },

  /** Every GitHub-style table in a markdown document, in reading order. */
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

  /**
   * Pull the report's header facts, the summary table and the per-query timing
   * ranges out of the markdown.
   *
   * Only those three views are kept: the candidate-index list, the per-query
   * execution plans and the closing methodology notes stay in the markdown
   * source instead of being repeated on screen.
   */
  parseBenchmarkReport(markdown) {
    const md = String(markdown);

    // Header bullets: "**Database Engine:** ..." plus the dataset line items.
    const meta = [];
    const metaMatches = md.matchAll(/^\*\*([^*\n]+):\*\*\s*(.+)$/gm);
    for (const match of metaMatches) {
      const value = match[2].replace(/\s+/g, ' ').trim();
      // "Dataset Size:" only introduces a list; the list items follow below.
      if (!value || value.startsWith('-')) continue;
      meta.push([match[1].trim(), value]);
    }
    const datasetMatches = md.matchAll(/^-\s*`?([^`:\n]+)`?\s*table:\s*([\d,]+)\s*rows/gm);
    for (const match of datasetMatches) meta.push([`${match[1].trim()} (rows)`, match[2].trim()]);

    // "### Q1: Full-table display query" sections. Each one contributes a row
    // to the per-query table: name, rows returned, index used, and the min/max
    // behind every average.
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

  /** Render the parsed report as three labelled tables. */
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

  // ----------------------------------------------------------------
  // Shared markup helpers
  // ----------------------------------------------------------------
  categoryCard(category) {
    // Parent categories use exactly the same tile as subcategories: name,
    // summary, then "<n> components ->". The count includes nested children so
    // a top-level category reports everything underneath it.
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

    // Cards stay deliberately minimal: name, symbol, summary, and one quiet
    // save control. Category and status badges only appear on the component's
    // own page. The link and the button are siblings because a button inside a
    // link is neither valid markup nor usable with a keyboard.
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

  /**
   * Subcategory button: card-like (as before) but compact and distinct from
   * both the parent category cards and the component cards.
   */
  subcategoryCard(category) {
    const id = category.category_id !== undefined ? category.category_id : category.categoryId;
    const count = Number(
      category.component_count !== undefined ? category.component_count : category.componentCount || 0
    );
    const description = category.description || '';

    // The count lives in the footer next to the arrow so both read as one
    // sentence: "5 components ->". No ordinal, no floating chip.
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

  // ----------------------------------------------------------------
  // Modal, toasts, downloads, utilities
  // ----------------------------------------------------------------
  openModal(title, bodyHtml) {
    const modal = document.getElementById('global-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    modal.classList.add('open');
  },

  closeModal() {
    const modal = document.getElementById('global-modal');
    if (modal) modal.classList.remove('open');
  },

  openImageModal(src, title) {
    if (!src) return;

    const body = `
      <div class="diagram-frame" style="min-height: 0;">
        <img src="${this.escapeHtml(this.asset(src))}" alt="${this.escapeHtml(title || 'Diagram')}" style="max-height: 70vh;">
      </div>
    `;
    this.openModal(title || 'Diagram', body);
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

// Equations are sized to the column, so they must be re-fitted whenever the
// column or the font metrics change - otherwise a late webfont can push a
// scaled equation past the edge and bring back the horizontal scrollbar.
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
