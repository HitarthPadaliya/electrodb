/**
 * ElectroDB Frontend Application
 * Hash-based SPA router + catalogue renderers + academic lab console.
 */

const app = {
  contentEl: null,
  currentXml: '',

  // ----------------------------------------------------------------
  // Bootstrapping
  // ----------------------------------------------------------------
  init() {
    this.contentEl = document.getElementById('app-content');
    this.initCursorGlow();
    this.bindEvents();
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
      }
    });

    // Delegated select changes
    document.addEventListener('change', e => {
      const control = e.target.closest('[data-change]');
      if (control && control.getAttribute('data-change') === 'catalog-filter') {
        this.onCatalogFilterChange(control.value);
      }
    });

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
      case 'load-query-1':
        this.loadQuery1(arg === 'true');
        break;
      case 'run-query-3':
        this.runQuery3(arg === 'true');
        break;
      case 'run-query-4':
        this.runQuery4(arg === 'true');
        break;
      case 'run-query-5':
        this.runQuery5();
        break;
      case 'run-subquery':
        this.runSubquery();
        break;
      case 'run-correlated':
        this.runCorrelatedQuery();
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
      case 'load-view-catalogue':
        this.loadViewCatalogue();
        break;
      case 'load-view-counts':
        this.loadViewCounts();
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
    if (window.location.hash === target) {
      this.handleRouting();
    } else {
      window.location.hash = target;
    }
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
    this.scrollToTop();

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
        } else if (section === 'lab') {
          await this.renderLabConsole();
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
    document.title = title ? `${title} — ElectroDB` : 'ElectroDB — Electronic Components Reference Catalogue';
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
        <p>Loading catalogue data from the database…</p>
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
          <a href="#/catalog" class="btn btn-primary">Browse the catalogue</a>
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

    const [categoryRes, tagRes, catalogRes] = await Promise.all([
      api.getCategories(),
      api.getTags().catch(() => ({ data: [] })),
      api.getCatalog(1, 6).catch(() => ({ data: { items: [] } }))
    ]);

    const categories = categoryRes.data || [];
    const tags = (tagRes.data || []).slice(0, 8);
    const featured = (catalogRes.data && catalogRes.data.items) || [];

    let totalComponents = 0;
    let subcategoryCount = 0;
    categories.forEach(cat => {
      totalComponents += Number(cat.componentCount || 0);
      (cat.children || []).forEach(child => {
        totalComponents += Number(child.component_count || 0);
        subcategoryCount += 1;
      });
    });

    const categoryTags = categories
      .map(cat => `<a class="tag" href="#/categories/${encodeURIComponent(cat.category_id)}">${this.escapeHtml(cat.name)}</a>`)
      .join('');

    const categoryCards = categories.map(cat => this.categoryCard(cat)).join('');

    let html = `
      <div class="page">
        <section class="hero">
          <div class="hero-text">
            <p class="eyebrow">SVNIT CS203 · Database Systems Project</p>
            <h1>Electronic<br><span>Components</span></h1>
            <p class="hero-lead">
              A data-driven reference for digital logic, semiconductors, analog circuits, sensors,
              and electromechanical parts — complete with truth tables, state diagrams, timing
              waveforms, LaTeX equations, and normalized specifications.
            </p>

            <form class="hero-search" id="hero-search-form" role="search" data-form="hero-search">
              <input type="search" name="q" placeholder="Search ${totalComponents} components, categories, and tags…" aria-label="Search components">
              <button type="submit">Search</button>
            </form>

            <div class="hero-tags">${categoryTags}</div>

            <div class="hero-actions">
              <a href="#/catalog" class="btn btn-primary">Browse the catalogue</a>
              <a href="#/lab" class="btn btn-secondary">Open lab console</a>
            </div>

            <div class="hero-stats">
              <div class="hero-stat">
                <strong>${totalComponents}</strong>
                <span>Components</span>
              </div>
              <div class="hero-stat">
                <strong>${categories.length}</strong>
                <span>Categories</span>
              </div>
              <div class="hero-stat">
                <strong>${subcategoryCount}</strong>
                <span>Subfamilies</span>
              </div>
              <div class="hero-stat">
                <strong>192</strong>
                <span>SVG diagrams</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Component Categories</h2>
            <a href="#/categories" class="section-link">All categories →</a>
          </div>
          <div class="categories-grid">${categoryCards}</div>
        </section>
    `;

    if (featured.length) {
      html += `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">From the Catalogue</h2>
            <a href="#/catalog" class="section-link">View all components →</a>
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
            <a href="#/tags" class="section-link">All tags →</a>
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
          <p class="page-eyebrow">Catalogue hierarchy</p>
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
          <p class="page-lead">${this.escapeHtml(category.description || 'Reference catalogue collection.')}</p>
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
          <p>${children.length ? 'Choose one of the subcategories above to explore its components.' : 'This category does not have any published components yet.'}</p>
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

    html += '</section></div>';
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

    this.setTitle(comp.name);

    const categoryId = comp.category ? comp.category.categoryId || comp.category.id : null;
    const categoryName = comp.category ? comp.category.name : 'Catalogue';
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
    const extraDiagrams = diagrams.filter(diagram => !['SYMBOL', 'CIRCUIT'].includes(diagram.kind || 'OTHER'));
    const symbolPath = (symbolDiagram && symbolDiagram.imagePath) || comp.circuitSymbolPath;

    let html = `
      <div class="page">
        ${this.breadcrumbs(crumbs)}

        <section class="component-hero">
          <div class="component-hero-main">
            <h1 class="component-title">${this.escapeHtml(comp.name)}</h1>
            <p class="component-hero-desc">${this.escapeHtml(heroLead)}</p>
            ${tagPills ? `<div class="hero-tags">${tagPills}</div>` : ''}

            <div class="component-actions">
              ${
                comp.datasheetUrl
                  ? `<a class="btn btn-primary" href="${this.escapeHtml(comp.datasheetUrl)}" target="_blank" rel="noopener noreferrer">Manufacturer datasheet</a>`
                  : ''
              }
              ${
                categoryId
                  ? `<a class="back-link" href="#/categories/${encodeURIComponent(categoryId)}">
                       <span class="back-link-arrow" aria-hidden="true">←</span>
                       Back to ${this.escapeHtml(categoryName)}
                     </a>`
                  : ''
              }
            </div>
          </div>

          ${
            symbolPath
              ? `<figure class="component-art">
                   <img src="${this.escapeHtml(symbolPath)}" alt="${this.escapeHtml(comp.name)} symbol" loading="lazy" data-hide-on-error>
                   <figcaption>Symbol</figcaption>
                 </figure>`
              : `<div class="component-art component-art--empty" aria-hidden="true"><span>⚡</span></div>`
          }
        </section>
    `;

    // Circuit diagram, immediately after the hero — this is the gate- and
    // device-level schematic, not the pin-level block symbol above.
    circuitDiagrams.forEach(diagram => {
      html += `
        <section class="detail-section circuit-section">
          <div class="section-head">
            <h2 class="section-title">Circuit Diagram</h2>
          </div>
          <figure class="circuit-figure">
            <img src="${this.escapeHtml(diagram.imagePath)}" alt="${this.escapeHtml(
              diagram.altText || `Circuit diagram for ${comp.name}`
            )}" loading="lazy">
            ${diagram.caption ? `<figcaption>${this.escapeHtml(diagram.caption)}</figcaption>` : ''}
          </figure>
          <div class="circuit-actions">
            <button
              class="btn btn-secondary btn-sm"
              type="button"
              data-open-image="${this.escapeHtml(diagram.imagePath)}"
              data-open-title="${this.escapeHtml(diagram.title || 'Circuit diagram')}"
            >View fullscreen</button>
          </div>
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
          ${section.caption ? `<p class="table-caption">${this.escapeHtml(section.caption)}</p>` : ''}
        </section>
      `;
    });

    // Supporting artwork (state, timing, …). The symbol and the circuit
    // diagram are already displayed above, so they are not repeated here.
    if (extraDiagrams.length) {
      html += `
        <section class="detail-section">
          <div class="section-head">
            <h2 class="section-title">Diagrams &amp; Visual Assets</h2>
            <span class="section-meta">${extraDiagrams.length} assets</span>
          </div>
          <div class="diagram-grid">
            ${extraDiagrams
              .map(
                diagram => `
                  <article class="diagram-card">
                    <div class="diagram-frame">
                      <img src="${this.escapeHtml(diagram.imagePath)}" alt="${this.escapeHtml(diagram.altText || diagram.title)}" loading="lazy">
                    </div>
                    <h3 class="diagram-title">${this.escapeHtml(diagram.title)}</h3>
                    ${diagram.caption ? `<p class="diagram-caption">${this.escapeHtml(diagram.caption)}</p>` : ''}
                    <div class="diagram-actions">
                      <button
                        class="btn btn-secondary btn-sm"
                        type="button"
                        data-open-image="${this.escapeHtml(diagram.imagePath)}"
                        data-open-title="${this.escapeHtml(diagram.title)}"
                      >View fullscreen</button>
                    </div>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
      `;
    }

    // Specifications
    if (comp.specifications && comp.specifications.length) {
      html += `
        <section class="detail-section">
          <h2 class="section-title">Technical Specifications</h2>
          <div class="table-responsive" style="margin-top: 1.25rem;">
            <table class="edu-table spec-table">
              <thead>
                <tr>
                  <th>Specification</th>
                  <th>Value</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${comp.specifications
                  .map(
                    spec => `
                      <tr>
                        <td><strong>${this.escapeHtml(spec.name)}</strong></td>
                        <td>${this.escapeHtml(spec.value || '—')}${spec.unit && !String(spec.value || '').includes(spec.unit) ? ` ${this.escapeHtml(spec.unit)}` : ''}</td>
                        <td>${spec.sourceNote ? `<span class="spec-source-note">${this.escapeHtml(spec.sourceNote)}</span>` : '—'}</td>
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
          <div class="diagram-frame" style="margin-top: 1.25rem;">
            <img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(section.altText || section.title || 'Diagram')}" loading="lazy">
          </div>
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
      <div class="table-responsive" style="margin-top: 1.25rem;">
        <table class="edu-table">
          <thead>
            <tr>${tableJson.columns.map(col => `<th>${this.formatCell(col)}</th>`).join('')}</tr>
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

  formatCell(value) {
    if (value === null || value === undefined) return '—';

    const raw = String(value);
    const latexMatch = raw.match(/^\\\(([\s\S]+?)\\\)$/);

    if (latexMatch) {
      return `<span data-katex-inline="${this.escapeHtml(latexMatch[1])}">${this.escapeHtml(raw)}</span>`;
    }

    const highlight = ['X', 'Toggle', 'Reset', 'Set', 'Hold'].includes(raw);
    return highlight
      ? `<span class="cell-highlight">${this.escapeHtml(raw)}</span>`
      : this.escapeHtml(raw);
  },

  renderEquationContent(latex) {
    return `
      <div class="equation-card">
        <div class="equation-rendered" data-latex="${this.escapeHtml(latex)}">
          <code>${this.escapeHtml(latex)}</code>
        </div>
        <div class="equation-raw">LaTeX: ${this.escapeHtml(latex)}</div>
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

  // ----------------------------------------------------------------
  // Lab console
  // ----------------------------------------------------------------
  async renderLabConsole() {
    this.setTitle('Lab Console');

    this.contentEl.innerHTML = `
      <div class="page">
        <section class="lab-banner">
          <div class="lab-banner-text">
            <p class="eyebrow">SVNIT CS203 · Assignment 10 &amp; 11</p>
            <h1 class="lab-title">Academic Lab Console</h1>
            <p>Stored procedures, cursors, triggers, indexed query timing, views, XML serialization, and live table statistics for the ElectroDB schema.</p>
          </div>
          <span class="lab-badge"><span aria-hidden="true">●</span> Demo mode</span>
        </section>

        <div class="lab-tabs" role="tablist" aria-label="Lab console sections">
          <button class="lab-tab-btn active" type="button" role="tab" aria-selected="true" data-action="switch-lab-tab" data-arg="tab-a10">Assignment 10 · Stored Programs</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-a11">Assignment 11 · SQL Demos</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-views">Views</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-benchmarks">Index Benchmarks</button>
          <button class="lab-tab-btn" type="button" role="tab" aria-selected="false" data-action="switch-lab-tab" data-arg="tab-dashboard">Dashboard</button>
        </div>

        <!-- Tab 1: Assignment 10 stored programs -->
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

        <!-- Tab 2: Assignment 11 SQL demonstrations -->
        <div id="tab-a11" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Query 1: Full-Table Display (with XML output)</h2>
                <p class="lab-card-desc">Displays rows from the primary <code>components</code> table, or serializes the first page as XML.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="load-query-1" data-arg="false">HTML table</button>
                <button class="btn btn-primary btn-sm" type="button" data-action="load-query-1" data-arg="true">XML output</button>
              </div>
            </div>
            <div id="query1-container"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Query 3: Aggregate Query (with XML output)</h2>
                <p class="lab-card-desc">Run an allowlisted aggregate function against an allowlisted column.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="run-query-3" data-arg="false">Run aggregate</button>
                <button class="btn btn-primary btn-sm" type="button" data-action="run-query-3" data-arg="true">XML output</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="q3-fn">Function</label>
                <select id="q3-fn" class="form-control">
                  <option value="COUNT" selected>COUNT</option>
                  <option value="SUM">SUM</option>
                  <option value="AVG">AVG</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="q3-field">Field</label>
                <select id="q3-field" class="form-control">
                  <option value="component_id" selected>component_id</option>
                  <option value="category_id">category_id</option>
                </select>
              </div>
            </div>
            <div id="query3-container"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Query 4: Conditional Query (with XML output)</h2>
                <p class="lab-card-desc">Filter the table using an allowlisted field, operator, and value.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="run-query-4" data-arg="false">Filter table</button>
                <button class="btn btn-primary btn-sm" type="button" data-action="run-query-4" data-arg="true">XML output</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="q4-field">Field</label>
                <select id="q4-field" class="form-control">
                  <option value="category_id" selected>category_id</option>
                  <option value="is_published">is_published</option>
                  <option value="is_illustrative">is_illustrative</option>
                  <option value="name">name</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="q4-op">Operator</label>
                <select id="q4-op" class="form-control">
                  <option value="eq" selected>= (equals)</option>
                  <option value="neq">!= (not equals)</option>
                  <option value="gt">&gt; (greater than)</option>
                  <option value="lt">&lt; (less than)</option>
                  <option value="like">LIKE (contains)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="q4-val">Value</label>
                <input type="text" id="q4-val" class="form-control" value="6" />
              </div>
            </div>
            <div id="query4-container"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Query 5: Two-Table Join Query</h2>
                <p class="lab-card-desc">Choose two allowlisted tables and a join type; the server maps the selection to a safe join condition.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="run-query-5">Execute join</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="q5-left">Left table</label>
                <select id="q5-left" class="form-control">
                  <option value="components" selected>components</option>
                  <option value="categories">categories</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="q5-right">Right table</label>
                <select id="q5-right" class="form-control">
                  <option value="categories" selected>categories</option>
                  <option value="component_diagrams">component_diagrams</option>
                  <option value="component_specifications">component_specifications</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="q5-type">Join type</label>
                <select id="q5-type" class="form-control">
                  <option value="inner" selected>INNER JOIN</option>
                  <option value="left">LEFT JOIN</option>
                  <option value="right">RIGHT JOIN</option>
                </select>
              </div>
            </div>
            <div id="query5-container"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Query 6 &amp; 7: Subquery and Correlated Subquery</h2>
                <p class="lab-card-desc">Run a nested subquery or a correlated existence query, including the server-side SQL template.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="run-subquery">Subquery (Q6)</button>
                <button class="btn btn-secondary btn-sm" type="button" data-action="run-correlated">Correlated (Q7)</button>
              </div>
            </div>
            <div id="subquery-container"></div>
          </div>
        </div>

        <!-- Tab 3: Views -->
        <div id="tab-views" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">View: v_component_catalogue</h2>
                <p class="lab-card-desc">Joins <code>components</code>, <code>categories</code>, and parent categories into one display-ready view.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="load-view-catalogue">Load catalogue view</button>
              </div>
            </div>
            <div id="view-catalogue-container"></div>
          </div>

          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">View: v_category_component_counts</h2>
                <p class="lab-card-desc">Aggregated view describing how many components belong to each category.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="load-view-counts">Load counts view</button>
              </div>
            </div>
            <div id="view-counts-container"></div>
          </div>
        </div>

        <!-- Tab 4: Benchmarks -->
        <div id="tab-benchmarks" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Index Timing Benchmarks &amp; Analysis</h2>
                <p class="lab-card-desc">Execution times measured before and after candidate secondary indexes were applied to the 147-component seed dataset.</p>
              </div>
              <div class="lab-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="load-timing-report">Refresh report</button>
              </div>
            </div>
            <div id="timing-report-container" class="result-text">Loading report…</div>
          </div>
        </div>

        <!-- Tab 5: Dashboard -->
        <div id="tab-dashboard" class="lab-panel" role="tabpanel">
          <div class="lab-card">
            <div class="lab-card-head">
              <div>
                <h2 class="lab-card-title">Live Database Table Statistics</h2>
                <p class="lab-card-desc">Row counts for every catalogue and assignment table, plus component publication metrics.</p>
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
            <option value="NAIVE_USER">NAIVE_USER — read-only end user</option>
            <option value="APP_DEVELOPER" selected>APP_DEVELOPER — application developer</option>
            <option value="DBA">DBA — database administrator</option>
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
    this.openModal('Add Application User (Assignment 10)', body);
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

  async loadQuery1(isXml = false) {
    const container = document.getElementById('query1-container');
    container.innerHTML = '<p class="result-text">Loading full-table components…</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getComponentsXml(1, 10);
        this.currentXml = xml;
        container.innerHTML = `
          <div class="data-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-action="download-xml" data-arg="query1_components.xml">Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
      } else {
        const res = await api.lab.getComponents(1, 10);
        container.innerHTML = `
          <div class="table-responsive">
            <table class="edu-table">
              <thead><tr><th>ID</th><th>Category</th><th>Name</th><th>Slug</th><th>Short description</th></tr></thead>
              <tbody>
                ${res.data.items
                  .map(
                    comp => `
                      <tr>
                        <td>${this.escapeHtml(comp.component_id)}</td>
                        <td>${this.escapeHtml(comp.category_id)}</td>
                        <td><strong>${this.escapeHtml(comp.name)}</strong></td>
                        <td>${this.escapeHtml(comp.slug)}</td>
                        <td>${this.escapeHtml(comp.short_description || '')}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runQuery3(isXml = false) {
    const fn = document.getElementById('q3-fn').value;
    const field = document.getElementById('q3-field').value;
    const container = document.getElementById('query3-container');
    container.innerHTML = '<p class="result-text">Executing aggregate…</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getAggregateXml(fn, field);
        this.currentXml = xml;
        container.innerHTML = `
          <div class="data-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-action="download-xml" data-arg="query3_aggregate.xml">Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
      } else {
        const res = await api.lab.getAggregate(fn, field);
        container.innerHTML = `
          <div class="alert alert-success">
            <strong>${this.escapeHtml(res.data.function)}(${this.escapeHtml(res.data.field)})</strong>
            = <span style="font-size: 1.2rem; font-weight: 700; color: var(--accent-hover);">${this.escapeHtml(res.data.value)}</span>
            <span style="margin-left: 1rem; color: var(--muted);">evaluated across ${this.escapeHtml(res.data.rowCount)} rows</span>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runQuery4(isXml = false) {
    const field = document.getElementById('q4-field').value;
    const op = document.getElementById('q4-op').value;
    const value = document.getElementById('q4-val').value.trim();
    const container = document.getElementById('query4-container');
    container.innerHTML = '<p class="result-text">Executing conditional query…</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getFilterXml(field, op, value);
        this.currentXml = xml;
        container.innerHTML = `
          <div class="data-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-action="download-xml" data-arg="query4_conditional.xml">Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
      } else {
        const res = await api.lab.getFilter(field, op, value, 1, 10);
        container.innerHTML = `
          <div class="alert alert-success">
            Matched <strong>${this.escapeHtml(res.data.total)}</strong> components where
            <code>${this.escapeHtml(res.data.filter.field)} ${this.escapeHtml(res.data.filter.operator)} ${this.escapeHtml(res.data.filter.value)}</code>
          </div>
          <div class="table-responsive">
            <table class="edu-table">
              <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Slug</th></tr></thead>
              <tbody>
                ${res.data.items
                  .map(
                    row => `
                      <tr>
                        <td>${this.escapeHtml(row.component_id)}</td>
                        <td><strong>${this.escapeHtml(row.name)}</strong></td>
                        <td>${this.escapeHtml(row.category_id)}</td>
                        <td>${this.escapeHtml(row.slug)}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async runQuery5() {
    const left = document.getElementById('q5-left').value;
    const right = document.getElementById('q5-right').value;
    const type = document.getElementById('q5-type').value;
    const container = document.getElementById('query5-container');
    container.innerHTML = '<p class="result-text">Executing join query…</p>';

    try {
      const res = await api.lab.getJoin(left, right, type, 1, 10);
      container.innerHTML = `
        <div class="alert alert-info">
          Join condition: <code>${this.escapeHtml(res.data.joinCondition)}</code>
          <span style="margin-left: 0.5rem; color: var(--muted);">${this.escapeHtml(res.data.joinType)}</span>
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>ID</th><th>Name</th><th>Joined resource</th></tr></thead>
            <tbody>
              ${res.data.rows
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.component_id || row.category_id)}</td>
                      <td><strong>${this.escapeHtml(row.name || '')}</strong></td>
                      <td>${this.escapeHtml(row.joined_name || row.title || '')}</td>
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

  async runSubquery() {
    const container = document.getElementById('subquery-container');
    container.innerHTML = '<p class="result-text">Executing subquery across tables…</p>';

    try {
      const res = await api.lab.getSubquery('categories_in_digital');
      container.innerHTML = `
        <div class="alert alert-info">
          <strong>${this.escapeHtml(res.data.description)}</strong>
          <pre class="sql-block">${this.escapeHtml(res.data.sql)}</pre>
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th><th>Category</th><th>Slug</th></tr></thead>
            <tbody>
              ${res.data.rows
                .slice(0, 10)
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.component_id)}</td>
                      <td>${this.escapeHtml(row.name)}</td>
                      <td>${this.escapeHtml(row.category_id)}</td>
                      <td>${this.escapeHtml(row.slug)}</td>
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

  async runCorrelatedQuery() {
    const container = document.getElementById('subquery-container');
    container.innerHTML = '<p class="result-text">Executing correlated subquery across tables…</p>';

    try {
      const res = await api.lab.getCorrelated('categories_with_components');
      container.innerHTML = `
        <div class="alert alert-info">
          <strong>${this.escapeHtml(res.data.description)}</strong>
          <pre class="sql-block">${this.escapeHtml(res.data.sql)}</pre>
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Category ID</th><th>Name</th><th>Slug</th></tr></thead>
            <tbody>
              ${res.data.rows
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.category_id)}</td>
                      <td>${this.escapeHtml(row.name)}</td>
                      <td>${this.escapeHtml(row.slug)}</td>
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

  async loadViewCatalogue() {
    const container = document.getElementById('view-catalogue-container');
    container.innerHTML = '<p class="result-text">Loading v_component_catalogue…</p>';

    try {
      const res = await api.lab.getViewCatalogue(1, 10);
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>ID</th><th>Component</th><th>Category</th><th>Parent category</th></tr></thead>
            <tbody>
              ${res.data.items
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.component_id)}</td>
                      <td><strong>${this.escapeHtml(row.component_name)}</strong></td>
                      <td>${this.escapeHtml(row.category_name)}</td>
                      <td>${this.escapeHtml(row.parent_category_name || '—')}</td>
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

  async loadViewCounts() {
    const container = document.getElementById('view-counts-container');
    container.innerHTML = '<p class="result-text">Loading v_category_component_counts…</p>';

    try {
      const res = await api.lab.getViewCounts();
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Category ID</th><th>Name</th><th>Slug</th><th>Components</th></tr></thead>
            <tbody>
              ${res.data.items
                .map(
                  row => `
                    <tr>
                      <td>${this.escapeHtml(row.category_id)}</td>
                      <td><strong>${this.escapeHtml(row.category_name)}</strong></td>
                      <td>${this.escapeHtml(row.category_slug)}</td>
                      <td>${this.escapeHtml(row.component_count)}</td>
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

  async loadTimingReport() {
    const container = document.getElementById('timing-report-container');
    if (!container) return;

    try {
      const res = await api.lab.getTimingReport();
      container.innerHTML = '<div class="report-viewer"></div>';
      container.firstElementChild.textContent = res.data.report || 'No report available.';
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
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
                <span><strong>Published:</strong> ${this.escapeHtml(metrics.published_components)}</span>
                <span><strong>Illustrative educational models:</strong> ${this.escapeHtml(metrics.illustrative_components)}</span>
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
  categoryCard(category, showChildren = true) {
    const id = category.category_id !== undefined ? category.category_id : category.categoryId;
    const children = category.children || [];
    const directCount = Number(
      category.componentCount !== undefined ? category.componentCount : category.component_count || 0
    );
    const childCount = children.reduce(
      (sum, child) => sum + Number(child.component_count !== undefined ? child.component_count : child.componentCount || 0),
      0
    );
    const total = directCount + childCount;

    const childPills = children
      .slice(0, 6)
      .map(child => {
        const count = child.component_count !== undefined ? child.component_count : child.componentCount || 0;
        return `<span class="subcat-pill">${this.escapeHtml(child.name)} (${Number(count)})</span>`;
      })
      .join('');
    const morePill =
      children.length > 6 ? `<span class="subcat-pill">+${children.length - 6} more</span>` : '';

    return `
      <a class="category-card" href="#/categories/${encodeURIComponent(id)}">
        <div class="category-card-head">
          <h3 class="category-title">${this.escapeHtml(category.name)}</h3>
          <span class="count-pill">${total} items</span>
        </div>
        <p class="category-desc">${this.escapeHtml(category.description || 'Reference catalogue collection.')}</p>
        ${showChildren && children.length ? `<div class="pill-row">${childPills}${morePill}</div>` : ''}
      </a>
    `;
  },

  componentCard(comp) {
    const slug = comp.slug || comp.component_id || comp.componentId;
    const name = comp.name || 'Untitled component';
    const description = comp.short_description || comp.shortDescription || '';
    const symbol = comp.circuit_symbol_path || comp.circuitSymbolPath;

    // Cards stay deliberately minimal: name, symbol, summary. Category and
    // "illustrative" badges only appear on the component's own page.
    return `
      <a class="component-card component-card--plain" href="#/components/${encodeURIComponent(slug)}">
        <div class="component-card-top">
          <h3 class="component-card-title">${this.escapeHtml(name)}</h3>
          ${
            symbol
              ? `<img class="component-card-symbol" src="${this.escapeHtml(symbol)}" alt="" loading="lazy" data-hide-on-error>`
              : ''
          }
        </div>
        ${description ? `<p class="component-card-desc">${this.escapeHtml(description)}</p>` : '<p class="component-card-desc"></p>'}
      </a>
    `;
  },

  /**
   * Subcategory button: card-like (as before) but compact and distinct from
   * both the parent category cards and the component cards.
   */
  subcategoryCard(category, index = 0) {
    const id = category.category_id !== undefined ? category.category_id : category.categoryId;
    const count = Number(
      category.component_count !== undefined ? category.component_count : category.componentCount || 0
    );
    const ordinal = String(index + 1).padStart(2, '0');

    return `
      <a class="subcategory-card" href="#/categories/${encodeURIComponent(id)}">
        <span class="subcategory-index" aria-hidden="true">${ordinal}</span>
        <span class="subcategory-count">${count}</span>
        <span class="subcategory-name">${this.escapeHtml(category.name)}</span>
        <span class="subcategory-foot">
          <span class="subcategory-meta">component${count === 1 ? '' : 's'}</span>
          <span class="subcategory-arrow" aria-hidden="true">→</span>
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
        ? `<a class="page-btn" href="${href(page - 1)}" rel="prev">« Prev</a>`
        : '<button class="page-btn" type="button" disabled>« Prev</button>';

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
        ? `<a class="page-btn" href="${href(page + 1)}" rel="next">Next »</a>`
        : '<button class="page-btn" type="button" disabled>Next »</button>';

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
        <img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(title || 'Diagram')}" style="max-height: 70vh;">
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
