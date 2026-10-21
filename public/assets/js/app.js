/**
 * ElectroDB Frontend Application
 */

const app = {
  contentEl: null,

  init() {
    this.contentEl = document.getElementById('app-content');
    this.bindEvents();
    this.handleRouting();
  },

  bindEvents() {
    window.addEventListener('hashchange', () => this.handleRouting());

    // Search input enter handler
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) {
            window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
          }
        }
      });
    }

    // Modal close
    document.addEventListener('click', e => {
      if (e.target.matches('.modal-overlay') || e.target.closest('.modal-close-btn')) {
        this.closeModal();
      }
    });
  },

  // ----------------------------------------------------------------
  // Routing
  // ----------------------------------------------------------------
  async handleRouting() {
    const hash = window.location.hash || '#/';
    this.updateActiveNav(hash);

    try {
      this.renderLoading();

      if (hash === '#/' || hash === '#' || hash === '') {
        await this.renderHome();
      } else if (hash.startsWith('#/categories/')) {
        const id = hash.replace('#/categories/', '').split('?')[0];
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const page = parseInt(params.get('page') || '1', 10);
        await this.renderCategory(id, page);
      } else if (hash.startsWith('#/components/')) {
        const id = hash.replace('#/components/', '').split('?')[0];
        await this.renderComponentDetail(id);
      } else if (hash.startsWith('#/search')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const q = params.get('q') || '';
        const page = parseInt(params.get('page') || '1', 10);
        await this.renderSearch(q, page);
      } else if (hash.startsWith('#/lab')) {
        await this.renderLabConsole();
      } else {
        this.renderNotFound();
      }
    } catch (err) {
      this.renderError(err);
    }
  },

  updateActiveNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash || (hash.startsWith('#/lab') && href === '#/lab') || (hash === '#/' && href === '#/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  renderLoading() {
    this.contentEl.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #64748b; font-size: 0.9rem;">Loading catalogue data from database...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  renderError(err) {
    this.contentEl.innerHTML = `
      <div class="alert alert-error" style="margin-top: 2rem;">
        <strong>Error:</strong> ${this.escapeHtml(err.message || 'Failed to load page.')}
      </div>
      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="#/" class="btn btn-primary">Return to Catalogue Home</a>
      </div>
    `;
  },

  renderNotFound() {
    this.contentEl.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <h2 style="font-size: 3rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">404</h2>
        <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 2rem;">The requested category or component could not be found.</p>
        <a href="#/" class="btn btn-primary">Browse Catalogue</a>
      </div>
    `;
  },

  // ----------------------------------------------------------------
  // Home View
  // ----------------------------------------------------------------
  async renderHome() {
    const categoriesRes = await api.getCategories();
    const categories = categoriesRes.data;

    let html = `
      <div class="hero-banner">
        <h2 class="hero-title">Electronic Components Reference Catalogue</h2>
        <p class="hero-subtitle">
          Comprehensive reference for digital logic, semiconductors, analog circuits, and sensors with truth tables, state machine diagrams, timing waveforms, and LaTeX equations.
        </p>
        <div class="hero-badges">
          <span class="hero-badge"><span>⚡</span> SVNIT CS203 DBMS Project</span>
          <span class="hero-badge"><span>📚</span> 147 Components Seeded</span>
          <span class="hero-badge"><span>📐</span> 192 SVG Vector Diagrams</span>
          <span class="hero-badge"><span>🧪</span> Academic Lab Console</span>
        </div>
      </div>

      <div class="section-header">
        <h3 class="section-title">Component Categories</h3>
        <span style="font-size: 0.85rem; color: #64748b;">${categories.length} Primary Families</span>
      </div>

      <div class="categories-grid">
    `;

    categories.forEach(cat => {
      html += `
        <a href="#/categories/${cat.category_id}" class="category-card">
          <div>
            <div class="category-header">
              <span class="category-title">${this.escapeHtml(cat.name)}</span>
              <span class="count-pill">${cat.componentCount} items</span>
            </div>
            <p class="category-desc">${this.escapeHtml(cat.description || '')}</p>
          </div>
          <div class="subcategories-list">
            ${cat.children.map(ch => `
              <span class="subcat-pill">${this.escapeHtml(ch.name)} (${ch.component_count})</span>
            `).join('')}
          </div>
        </a>
      `;
    });

    html += `</div>`;
    this.contentEl.innerHTML = html;
  },

  // ----------------------------------------------------------------
  // Category View
  // ----------------------------------------------------------------
  async renderCategory(idOrSlug, page = 1) {
    const res = await api.getCategory(idOrSlug, page, 24);
    const { category, breadcrumbs, children, components, pagination } = res.data;

    let html = `
      <nav class="breadcrumbs">
        <a href="#/">Home</a>
        ${breadcrumbs.map(b => `
          <span class="breadcrumb-sep">/</span>
          <a href="#/categories/${b.category_id}">${this.escapeHtml(b.name)}</a>
        `).join('')}
      </nav>

      <div style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
          ${this.escapeHtml(category.name)}
        </h2>
        <p style="color: #64748b; font-size: 1rem; max-width: 800px;">
          ${this.escapeHtml(category.description || 'Reference catalogue collection.')}
        </p>
      </div>
    `;

    // Subcategories (if any)
    if (children && children.length > 0) {
      html += `
        <div class="section-header">
          <h3 class="section-title">Subcategories</h3>
          <span style="font-size: 0.85rem; color: #64748b;">${children.length} subfamilies</span>
        </div>
        <div class="categories-grid" style="margin-bottom: 2.5rem;">
          ${children.map(ch => `
            <a href="#/categories/${ch.category_id}" class="category-card">
              <div class="category-header">
                <span class="category-title">${this.escapeHtml(ch.name)}</span>
                <span class="count-pill">${ch.component_count} items</span>
              </div>
              <p class="category-desc">${this.escapeHtml(ch.description || '')}</p>
            </a>
          `).join('')}
        </div>
      `;
    }

    // Components in this category
    html += `
      <div class="section-header">
        <h3 class="section-title">Components (${pagination.total})</h3>
        <span style="font-size: 0.85rem; color: #64748b;">Page ${pagination.page} of ${pagination.totalPages}</span>
      </div>
    `;

    if (!components || components.length === 0) {
      html += `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 2.5rem; text-align: center; color: #64748b;">
          <p>No direct components registered in this category level.</p>
          ${children.length > 0 ? '<p style="margin-top: 0.5rem; font-size: 0.85rem;">Select one of the subcategories above to explore specific components.</p>' : ''}
        </div>
      `;
    } else {
      html += `<div class="components-grid">`;
      components.forEach(comp => {
        html += `
          <a href="#/components/${comp.slug || comp.component_id}" class="component-card">
            <span class="component-card-title">${this.escapeHtml(comp.name)}</span>
            ${comp.is_illustrative ? '<span class="component-card-badge" style="color: #d97706;">Illustrative Model</span>' : ''}
            <p class="component-card-desc">${this.escapeHtml(comp.short_description || '')}</p>
          </a>
        `;
      });
      html += `</div>`;

      // Pagination
      if (pagination.totalPages > 1) {
        html += this.renderPagination(pagination, `#/categories/${idOrSlug}`);
      }
    }

    this.contentEl.innerHTML = html;
  },

  // ----------------------------------------------------------------
  // Component Detail View
  // ----------------------------------------------------------------
  async renderComponentDetail(idOrSlug) {
    const res = await api.getComponent(idOrSlug);
    const comp = res.data;

    let html = `
      <nav class="breadcrumbs">
        <a href="#/">Home</a>
        ${comp.breadcrumbs.map(b => `
          <span class="breadcrumb-sep">/</span>
          <a href="#/categories/${b.category_id}">${this.escapeHtml(b.name)}</a>
        `).join('')}
        <span class="breadcrumb-sep">/</span>
        <span>${this.escapeHtml(comp.name)}</span>
      </nav>

      <!-- Hero Header -->
      <div class="component-hero">
        <div>
          <h2 class="component-hero-title">${this.escapeHtml(comp.name)}</h2>
          <div class="component-meta-tags">
            <span class="badge-tag primary">${this.escapeHtml(comp.category.name)}</span>
            ${comp.isIllustrative ? '<span class="badge-tag illustrative">Illustrative Model</span>' : ''}
            ${comp.isPublished ? '<span class="badge-tag published">Published</span>' : ''}
          </div>
          <p class="component-hero-desc">${this.escapeHtml(comp.description || comp.shortDescription || '')}</p>
          
          ${comp.datasheetUrl ? `
            <div style="margin-top: 1.25rem;">
              <a href="${this.escapeHtml(comp.datasheetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                📄 View Manufacturer Datasheet
              </a>
            </div>
          ` : ''}
        </div>

        <!-- Circuit Symbol Card -->
        <div class="symbol-preview-card">
          ${comp.circuitSymbolPath ? `
            <img src="${this.escapeHtml(comp.circuitSymbolPath)}" alt="${this.escapeHtml(comp.name)} Symbol" class="symbol-preview-img" onerror="this.style.display='none'" />
            <span class="symbol-label">Circuit Symbol</span>
          ` : `
            <div style="font-size: 2rem; color: #94a3b8;">⚡</div>
            <span class="symbol-label">${this.escapeHtml(comp.name)}</span>
          `}
        </div>
      </div>
    `;

    // Educational Content Sections (Structured Tables, LaTeX Equations, Prose)
    if (comp.content && comp.content.length > 0) {
      comp.content.forEach(sec => {
        if (sec.sectionKey === 'overview') return; // already in hero

        html += `
          <section class="detail-section">
            <h3 class="detail-section-title">${this.escapeHtml(sec.title)}</h3>
        `;

        if (sec.type === 'TABLE' && sec.content) {
          html += this.renderTableContent(sec.content);
        } else if (sec.type === 'EQUATION' && sec.content) {
          html += this.renderEquationContent(sec.content);
        } else if (sec.type === 'TEXT') {
          html += `<p style="line-height: 1.7; color: #334155;">${this.escapeHtml(sec.content)}</p>`;
        } else if (sec.type === 'DOCUMENT') {
          html += `<p><a href="${this.escapeHtml(sec.content)}" target="_blank" class="btn btn-secondary">Open Document</a></p>`;
        } else {
          html += `<p>${this.escapeHtml(typeof sec.content === 'string' ? sec.content : JSON.stringify(sec.content))}</p>`;
        }

        if (sec.caption) {
          html += `<p class="table-caption">${this.escapeHtml(sec.caption)}</p>`;
        }

        html += `</section>`;
      });
    }

    // Component Diagrams (State diagrams, timing diagrams, circuit diagrams)
    if (comp.diagrams && comp.diagrams.length > 0) {
      html += `
        <section class="detail-section">
          <h3 class="detail-section-title">Diagrams & Visual Assets</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
            ${comp.diagrams.map(diag => `
              <div class="diagram-container">
                <div class="diagram-svg-wrapper">
                  <img src="${this.escapeHtml(diag.imagePath)}" alt="${this.escapeHtml(diag.altText || diag.title)}" style="max-height: 260px;" />
                </div>
                <strong style="margin-top: 0.75rem; color: #0f172a; font-size: 0.95rem;">${this.escapeHtml(diag.title)}</strong>
                ${diag.caption ? `<p class="diagram-caption">${this.escapeHtml(diag.caption)}</p>` : ''}
                <button class="btn btn-secondary btn-sm" style="margin-top: 0.75rem;" onclick="app.openImageModal('${this.escapeHtml(diag.imagePath)}', '${this.escapeHtml(diag.title)}')">
                  🔍 View Fullscreen
                </button>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    }

    // Normalized Specifications Table
    if (comp.specifications && comp.specifications.length > 0) {
      html += `
        <section class="detail-section">
          <h3 class="detail-section-title">Technical Specifications</h3>
          <div class="table-responsive">
            <table class="edu-table spec-table">
              <thead>
                <tr>
                  <th>Specification</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${comp.specifications.map(sp => `
                  <tr>
                    <td><strong>${this.escapeHtml(sp.name)}</strong></td>
                    <td>${this.escapeHtml(sp.value || '—')}</td>
                    <td>${this.escapeHtml(sp.unit || '—')}</td>
                    <td>
                      ${sp.sourceNote ? `<span class="spec-source-note">${this.escapeHtml(sp.sourceNote)}</span>` : '—'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }

    this.contentEl.innerHTML = html;

    // Trigger math rendering
    this.renderMath();
  },

  // ----------------------------------------------------------------
  // Search View
  // ----------------------------------------------------------------
  async renderSearch(queryStr, page = 1) {
    const res = await api.search(queryStr, page, 20);
    const { query, items, pagination } = res.data;

    let html = `
      <div style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
          Search Results for "${this.escapeHtml(query)}"
        </h2>
        <p style="color: #64748b; font-size: 0.95rem;">
          Found ${pagination.total} matching components
        </p>
      </div>
    `;

    if (items.length === 0) {
      html += `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 3rem; text-align: center; color: #64748b;">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No components matched your search query.</p>
          <p style="font-size: 0.85rem;">Try searching for generic terms like "counter", "flip-flop", "diode", "gate", or "amplifier".</p>
        </div>
      `;
    } else {
      html += `<div class="components-grid">`;
      items.forEach(comp => {
        html += `
          <a href="#/components/${comp.slug || comp.component_id}" class="component-card">
            <span class="component-card-title">${this.escapeHtml(comp.name)}</span>
            <span class="component-card-badge">${this.escapeHtml(comp.category_name)}</span>
            <p class="component-card-desc">${this.escapeHtml(comp.short_description || '')}</p>
          </a>
        `;
      });
      html += `</div>`;

      if (pagination.totalPages > 1) {
        html += this.renderPagination(pagination, `#/search?q=${encodeURIComponent(query)}`);
      }
    }

    this.contentEl.innerHTML = html;
  },

  // ----------------------------------------------------------------
  // Educational Content Renderers
  // ----------------------------------------------------------------
  renderTableContent(tableJson) {
    if (!tableJson || !tableJson.columns || !tableJson.rows) {
      return `<p style="color: #64748b;">No table data available.</p>`;
    }

    let html = `
      <div class="table-responsive">
        <table class="edu-table">
          <thead>
            <tr>
              ${tableJson.columns.map(col => `<th>${this.escapeHtml(String(col))}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    tableJson.rows.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => {
        const val = cell === null || cell === undefined ? '—' : String(cell);
        const isHighlight = val === 'X' || val === 'Toggle' || val === 'Reset' || val === 'Set';
        html += `<td>${isHighlight ? `<span style="font-weight: 700; color: #2563eb;">${this.escapeHtml(val)}</span>` : this.escapeHtml(val)}</td>`;
      });
      html += `</tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    return html;
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
    if (typeof window.katex !== 'undefined') {
      document.querySelectorAll('.equation-rendered').forEach(el => {
        const latex = el.getAttribute('data-latex');
        if (latex) {
          try {
            el.innerHTML = window.katex.renderToString(latex, { throwOnError: false, displayMode: true });
          } catch (e) {
            console.warn('KaTeX render error:', e);
          }
        }
      });
    }
  },

  // ----------------------------------------------------------------
  // Lab Console View
  // ----------------------------------------------------------------
  async renderLabConsole() {
    let html = `
      <div class="lab-banner">
        <div>
          <h2>Academic DBMS Lab Console</h2>
          <p>Practical Assignment 10 & 11 Demonstration Suite (SVNIT CS203 - Database Management Systems)</p>
        </div>
        <span class="count-pill" style="background: rgba(255,255,255,0.2); color: white; border: none;">Demo Mode</span>
      </div>

      <div class="lab-tabs">
        <button class="lab-tab-btn active" onclick="app.switchLabTab('tab-a10')">Assignment 10: Stored Programs</button>
        <button class="lab-tab-btn" onclick="app.switchLabTab('tab-a11')">Assignment 11: SQL Demonstrations</button>
        <button class="lab-tab-btn" onclick="app.switchLabTab('tab-views')">Views</button>
        <button class="lab-tab-btn" onclick="app.switchLabTab('tab-benchmarks')">Index Timing Benchmarks</button>
        <button class="lab-tab-btn" onclick="app.switchLabTab('tab-dashboard')">Database Dashboard</button>
      </div>

      <!-- Tab 1: Assignment 10 Stored Programs -->
      <div id="tab-a10" class="lab-panel active">
        <div class="lab-card">
          <h4 class="lab-card-title">1. Component CRUD Stored Procedures</h4>
          <p class="lab-card-desc">Execute <code>sp_insert_component</code>, <code>sp_update_component</code>, and <code>sp_delete_component</code>.</p>
          
          <form id="sp-component-form" onsubmit="app.handleInsertComponent(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="sp-cat-id" class="form-control" required>
                  <option value="6">Counters (ID 6)</option>
                  <option value="7">Flip-Flops (ID 7)</option>
                  <option value="8" selected>Logic Gates (ID 8)</option>
                  <option value="9">Multiplexers (ID 9)</option>
                  <option value="11">Rectifier Diodes (ID 11)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Component Name</label>
                <input type="text" id="sp-comp-name" class="form-control" placeholder="e.g. Quad OR Gate" required />
              </div>
              <div class="form-group">
                <label class="form-label">Slug</label>
                <input type="text" id="sp-comp-slug" class="form-control" placeholder="e.g. quad-or-gate" />
              </div>
              <div class="form-group">
                <label class="form-label">Short Description</label>
                <input type="text" id="sp-comp-desc" class="form-control" placeholder="Brief summary" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Execute sp_insert_component</button>
          </form>
          <div id="sp-crud-result" style="margin-top: 1rem;"></div>
        </div>

        <div class="lab-card">
          <h4 class="lab-card-title">2. Explicit Cursors & Sum Numeric Functions</h4>
          <p class="lab-card-desc">Execute cursor procedures and numeric aggregation routines.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="app.runCursorAll()">Run Cursor All (sp_cursor_components_all)</button>
            <button class="btn btn-secondary" onclick="app.runCursorLimited()">Run Cursor Limited (sp_cursor_components_limited)</button>
            <button class="btn btn-secondary" onclick="app.runSumRoutines()">Run Sum Functions (fn_sum & sp_sum)</button>
          </div>
          <div id="cursor-result"></div>
        </div>

        <div class="lab-card">
          <h4 class="lab-card-title">3. Application User Login-Data CRUD</h4>
          <p class="lab-card-desc">Demonstrates application user management via <code>sp_insert_app_user</code>, <code>sp_update_app_user</code>, and <code>sp_delete_app_user</code> without adding public login to the catalogue.</p>
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
            <button class="btn btn-primary" onclick="app.showAddUserModal()">+ Add New App User</button>
            <button class="btn btn-secondary" onclick="app.loadAppUsers()">Refresh Users List</button>
          </div>
          <div id="users-table-container">Loading users...</div>
        </div>

        <div class="lab-card">
          <h4 class="lab-card-title">4. Triggers Verification & Audit Log</h4>
          <p class="lab-card-desc">View recent row-level changes automatically recorded by <code>trg_components_audit_ai/au/ad</code> in <code>application_audit_log</code>.</p>
          <button class="btn btn-secondary btn-sm" onclick="app.loadAuditLog()" style="margin-bottom: 1rem;">Refresh Audit Log</button>
          <div id="audit-log-container">Loading audit logs...</div>
        </div>
      </div>

      <!-- Tab 2: Assignment 11 SQL Demonstrations -->
      <div id="tab-a11" class="lab-panel">
        <!-- Query 1 -->
        <div class="lab-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="lab-card-title">Query 1: Full-Table Display (with XML output)</h4>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="app.loadQuery1(false)">View HTML Table</button>
              <button class="btn btn-primary btn-sm" onclick="app.loadQuery1Xml()">View XML Output</button>
            </div>
          </div>
          <p class="lab-card-desc">Displays all rows from the primary <code>components</code> table.</p>
          <div id="query1-container"></div>
        </div>

        <!-- Query 3 -->
        <div class="lab-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="lab-card-title">Query 3: Aggregate Query (with XML output)</h4>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="app.runQuery3(false)">Run Aggregate</button>
              <button class="btn btn-primary btn-sm" onclick="app.runQuery3(true)">View XML Output</button>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Function</label>
              <select id="q3-fn" class="form-control">
                <option value="COUNT" selected>COUNT</option>
                <option value="SUM">SUM</option>
                <option value="AVG">AVG</option>
                <option value="MIN">MIN</option>
                <option value="MAX">MAX</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Field</label>
              <select id="q3-field" class="form-control">
                <option value="component_id" selected>component_id</option>
                <option value="category_id">category_id</option>
              </select>
            </div>
          </div>
          <div id="query3-container"></div>
        </div>

        <!-- Query 4 -->
        <div class="lab-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="lab-card-title">Query 4: Conditional Query (with XML output)</h4>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="app.runQuery4(false)">Filter Table</button>
              <button class="btn btn-primary btn-sm" onclick="app.runQuery4(true)">View XML Output</button>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Field</label>
              <select id="q4-field" class="form-control">
                <option value="category_id" selected>category_id</option>
                <option value="is_published">is_published</option>
                <option value="is_illustrative">is_illustrative</option>
                <option value="name">name</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Operator</label>
              <select id="q4-op" class="form-control">
                <option value="eq" selected>= (Equals)</option>
                <option value="neq">!= (Not Equals)</option>
                <option value="gt">&gt; (Greater Than)</option>
                <option value="lt">&lt; (Less Than)</option>
                <option value="like">LIKE (Contains)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Value</label>
              <input type="text" id="q4-val" class="form-control" value="6" />
            </div>
          </div>
          <div id="query4-container"></div>
        </div>

        <!-- Query 5: Join -->
        <div class="lab-card">
          <h4 class="lab-card-title">Query 5: Two-Table Join Query</h4>
          <p class="lab-card-desc">Select two tables and join type to view relational data.</p>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Left Table</label>
              <select id="q5-left" class="form-control">
                <option value="components" selected>components</option>
                <option value="categories">categories</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Right Table</label>
              <select id="q5-right" class="form-control">
                <option value="categories" selected>categories</option>
                <option value="component_diagrams">component_diagrams</option>
                <option value="component_specifications">component_specifications</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Join Type</label>
              <select id="q5-type" class="form-control">
                <option value="inner" selected>INNER JOIN</option>
                <option value="left">LEFT JOIN</option>
                <option value="right">RIGHT JOIN</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" onclick="app.runQuery5()">Execute Join Query</button>
          <div id="query5-container" style="margin-top: 1rem;"></div>
        </div>

        <!-- Query 6 & 7: Subqueries -->
        <div class="lab-card">
          <h4 class="lab-card-title">Query 6 & 7: Subquery and Correlated Subquery</h4>
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="app.runSubquery()">Execute Subquery (Query 6)</button>
            <button class="btn btn-secondary" onclick="app.runCorrelatedQuery()">Execute Correlated Subquery (Query 7)</button>
          </div>
          <div id="subquery-container"></div>
        </div>
      </div>

      <!-- Tab 3: Views -->
      <div id="tab-views" class="lab-panel">
        <div class="lab-card">
          <h4 class="lab-card-title">View: v_component_catalogue</h4>
          <p class="lab-card-desc">Joins <code>components</code>, <code>categories</code>, and parent categories.</p>
          <button class="btn btn-secondary btn-sm" onclick="app.loadViewCatalogue()" style="margin-bottom: 1rem;">Load Catalogue View</button>
          <div id="view-catalogue-container"></div>
        </div>

        <div class="lab-card">
          <h4 class="lab-card-title">View: v_category_component_counts</h4>
          <p class="lab-card-desc">Aggregated view displaying component counts per category.</p>
          <button class="btn btn-secondary btn-sm" onclick="app.loadViewCounts()" style="margin-bottom: 1rem;">Load Counts View</button>
          <div id="view-counts-container"></div>
        </div>
      </div>

      <!-- Tab 4: Benchmarks -->
      <div id="tab-benchmarks" class="lab-panel">
        <div class="lab-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h4 class="lab-card-title">Index Timing Benchmarks & Analysis</h4>
              <p class="lab-card-desc">Execution times measured before and after candidate secondary indexes on 147 components.</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="app.loadTimingReport()">Refresh Timing Report</button>
          </div>
          <div id="timing-report-container" style="line-height: 1.7;">Loading report...</div>
        </div>
      </div>

      <!-- Tab 5: Dashboard -->
      <div id="tab-dashboard" class="lab-panel">
        <div class="lab-card">
          <h4 class="lab-card-title">Live Database Table Statistics</h4>
          <div id="dashboard-container">Loading statistics...</div>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Load initial tab data
    this.loadAppUsers();
    this.loadAuditLog();
    this.loadTimingReport();
    this.loadDashboard();
  },

  switchLabTab(tabId) {
    document.querySelectorAll('.lab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.lab-tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (window.event && window.event.target) {
      window.event.target.classList.add('active');
    }
  },

  // ----------------------------------------------------------------
  // Lab Actions
  // ----------------------------------------------------------------
  async handleInsertComponent(e) {
    e.preventDefault();
    const catId = document.getElementById('sp-cat-id').value;
    const name = document.getElementById('sp-comp-name').value.trim();
    const slug = document.getElementById('sp-comp-slug').value.trim();
    const desc = document.getElementById('sp-comp-desc').value.trim();

    const resContainer = document.getElementById('sp-crud-result');
    resContainer.innerHTML = '<p style="color: #64748b;">Executing sp_insert_component...</p>';

    try {
      const res = await api.lab.createComponent({ categoryId: catId, name, slug, shortDescription: desc });
      resContainer.innerHTML = `
        <div class="alert alert-success">
          ✓ Stored procedure executed successfully! New Component ID: <strong>${res.data.componentId}</strong>
        </div>
      `;
      document.getElementById('sp-comp-name').value = '';
      this.loadAuditLog();
    } catch (err) {
      resContainer.innerHTML = `
        <div class="alert alert-error">
          ✕ Procedure Error: ${this.escapeHtml(err.message)}
        </div>
      `;
    }
  },

  async runCursorAll() {
    const el = document.getElementById('cursor-result');
    el.innerHTML = '<p>Executing sp_cursor_components_all...</p>';
    try {
      const res = await api.lab.getCursorsAll();
      el.innerHTML = `
        <div class="alert alert-success">
          ✓ Unbounded cursor iterated across ${res.data.rowCount} rows. Displaying first 10 rows:
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th></tr></thead>
            <tbody>
              ${res.data.rows.slice(0, 10).map(r => `<tr><td>${r.component_id}</td><td>${this.escapeHtml(r.name)}</td></tr>`).join('')}
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
    el.innerHTML = '<p>Executing sp_cursor_components_limited(5)...</p>';
    try {
      const res = await api.lab.getCursorsLimited(5);
      el.innerHTML = `
        <div class="alert alert-success">
          ✓ Bounded cursor stopped exactly at limit = 5 rows:
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th></tr></thead>
            <tbody>
              ${res.data.rows.map(r => `<tr><td>${r.component_id}</td><td>${this.escapeHtml(r.name)}</td></tr>`).join('')}
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
    el.innerHTML = '<p>Executing sum functions...</p>';
    try {
      const res = await api.lab.getSum();
      el.innerHTML = `
        <div class="alert alert-success">
          ✓ <strong>Ungrouped Sum (fn_sum_component_ids):</strong> ${res.data.ungrouped.totalSum}
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Category ID</th><th>Category Name</th><th>Component Count</th><th>Sum Component IDs</th></tr></thead>
            <tbody>
              ${res.data.grouped.items.map(r => `
                <tr>
                  <td>${r.category_id}</td>
                  <td>${this.escapeHtml(r.category_name)}</td>
                  <td>${r.component_count}</td>
                  <td>${r.sum_component_ids}</td>
                </tr>
              `).join('')}
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
      if (!res.data || res.data.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No application users registered yet. Click "Add New App User" to create one.</p>';
        return;
      }
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead>
              <tr><th>User ID</th><th>Username</th><th>Role</th><th>Active</th><th>Created At</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${res.data.map(u => `
                <tr>
                  <td>${u.user_id}</td>
                  <td><strong>${this.escapeHtml(u.username)}</strong></td>
                  <td><span class="count-pill">${this.escapeHtml(u.role_code)}</span></td>
                  <td>${u.is_active ? 'Yes' : 'No'}</td>
                  <td>${u.created_at}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="app.handleDeleteUser(${u.user_id})">Delete</button>
                  </td>
                </tr>
              `).join('')}
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
      <form id="create-user-modal-form" onsubmit="app.handleCreateUser(event)">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Username</label>
          <input type="text" id="new-user-name" class="form-control" required placeholder="e.g. lab_student" />
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Role</label>
          <select id="new-user-role" class="form-control">
            <option value="NAIVE_USER">NAIVE_USER (End-user read-only)</option>
            <option value="APP_DEVELOPER" selected>APP_DEVELOPER (Application developer)</option>
            <option value="DBA">DBA (Database administrator)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label">Password Hash (Simulated application bcrypt hash)</label>
          <input type="text" id="new-user-hash" class="form-control" readonly value="$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6W565n8.y0fXm3wye" />
          <span style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">Stored procedures strictly reject plaintext passwords.</span>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Create App User via sp_insert_app_user</button>
      </form>
    `;
    this.openModal('Add New Application User (Assignment 10)', body);
  },

  async handleCreateUser(e) {
    e.preventDefault();
    const username = document.getElementById('new-user-name').value.trim();
    const roleCode = document.getElementById('new-user-role').value;
    const passwordHash = document.getElementById('new-user-hash').value;

    try {
      await api.lab.createAppUser({ username, roleCode, passwordHash });
      this.closeModal();
      this.loadAppUsers();
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  },

  async handleDeleteUser(id) {
    if (!confirm(`Delete application user ID ${id}?`)) return;
    try {
      await api.lab.deleteAppUser(id);
      this.loadAppUsers();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  },

  async loadAuditLog() {
    const container = document.getElementById('audit-log-container');
    if (!container) return;

    try {
      const res = await api.lab.getAuditLogs(10);
      if (!res.data || res.data.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">Audit log is currently empty.</p>';
        return;
      }
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead>
              <tr><th>Audit ID</th><th>Table</th><th>Operation</th><th>Row Key</th><th>DB User</th><th>Changed At</th><th>Values</th></tr>
            </thead>
            <tbody>
              ${res.data.map(l => `
                <tr>
                  <td>${l.audit_id}</td>
                  <td><code>${this.escapeHtml(l.table_name)}</code></td>
                  <td><span class="count-pill" style="color: ${l.operation_type === 'DELETE' ? '#dc2626' : l.operation_type === 'INSERT' ? '#16a34a' : '#d97706'}">${l.operation_type}</span></td>
                  <td>${this.escapeHtml(l.row_key)}</td>
                  <td>${this.escapeHtml(l.db_user)}</td>
                  <td>${l.changed_at}</td>
                  <td><pre style="font-size: 0.75rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(JSON.stringify(l.new_values || l.old_values || ''))}</pre></td>
                </tr>
              `).join('')}
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
    container.innerHTML = '<p>Loading full-table components...</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getComponentsXml(1, 10);
        container.innerHTML = `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="app.downloadXml(app.currentXml, 'query1_components.xml')">💾 Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
        this.currentXml = xml;
      } else {
        const res = await api.lab.getComponents(1, 10);
        container.innerHTML = `
          <div class="table-responsive">
            <table class="edu-table">
              <thead><tr><th>ID</th><th>Category ID</th><th>Name</th><th>Slug</th><th>Short Description</th></tr></thead>
              <tbody>
                ${res.data.items.map(c => `<tr><td>${c.component_id}</td><td>${c.category_id}</td><td><strong>${this.escapeHtml(c.name)}</strong></td><td>${this.escapeHtml(c.slug)}</td><td>${this.escapeHtml(c.short_description || '')}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  loadQuery1Xml() {
    this.loadQuery1(true);
  },

  async runQuery3(isXml = false) {
    const fn = document.getElementById('q3-fn').value;
    const field = document.getElementById('q3-field').value;
    const container = document.getElementById('query3-container');
    container.innerHTML = '<p>Executing aggregate...</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getAggregateXml(fn, field);
        container.innerHTML = `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="app.downloadXml(app.currentXml, 'query3_aggregate.xml')">💾 Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
        this.currentXml = xml;
      } else {
        const res = await api.lab.getAggregate(fn, field);
        container.innerHTML = `
          <div class="alert alert-success">
            <strong>Aggregate Result:</strong> ${res.data.function}(${res.data.field}) = <span style="font-size: 1.25rem; font-weight: bold;">${res.data.value}</span>
            <span style="margin-left: 1rem; color: #64748b;">(Evaluated across ${res.data.rowCount} rows)</span>
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
    const val = document.getElementById('q4-val').value.trim();
    const container = document.getElementById('query4-container');
    container.innerHTML = '<p>Executing conditional query...</p>';

    try {
      if (isXml) {
        const xml = await api.lab.getFilterXml(field, op, val);
        container.innerHTML = `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="app.downloadXml(app.currentXml, 'query4_conditional.xml')">💾 Download XML</button>
          </div>
          <div class="code-viewer">${this.escapeHtml(xml)}</div>
        `;
        this.currentXml = xml;
      } else {
        const res = await api.lab.getFilter(field, op, val, 1, 10);
        container.innerHTML = `
          <div class="alert alert-success">
            Matched <strong>${res.data.total}</strong> components where <code>${res.data.filter.field} ${res.data.filter.operator} ${res.data.filter.value}</code>
          </div>
          <div class="table-responsive">
            <table class="edu-table">
              <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Slug</th></tr></thead>
              <tbody>
                ${res.data.items.map(r => `<tr><td>${r.component_id}</td><td><strong>${this.escapeHtml(r.name)}</strong></td><td>${r.category_id}</td><td>${this.escapeHtml(r.slug)}</td></tr>`).join('')}
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
    container.innerHTML = '<p>Executing join query...</p>';

    try {
      const res = await api.lab.getJoin(left, right, type, 1, 10);
      container.innerHTML = `
        <div class="alert alert-info">
          Condition: <code>${this.escapeHtml(res.data.joinCondition)}</code> (${res.data.joinType})
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>ID</th><th>Name</th><th>Joined Resource</th></tr></thead>
            <tbody>
              ${res.data.rows.map(r => `<tr><td>${r.component_id || r.category_id}</td><td><strong>${this.escapeHtml(r.name || '')}</strong></td><td>${this.escapeHtml(r.joined_name || r.title || '')}</td></tr>`).join('')}
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
    container.innerHTML = '<p>Executing subquery across tables...</p>';
    try {
      const res = await api.lab.getSubquery('categories_in_digital');
      container.innerHTML = `
        <div class="alert alert-info">
          <strong>${this.escapeHtml(res.data.description)}</strong>
          <pre style="margin-top: 0.5rem; font-size: 0.8rem;">${this.escapeHtml(res.data.sql)}</pre>
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Component ID</th><th>Name</th><th>Category ID</th><th>Slug</th></tr></thead>
            <tbody>
              ${res.data.rows.slice(0, 10).map(r => `<tr><td>${r.component_id}</td><td>${this.escapeHtml(r.name)}</td><td>${r.category_id}</td><td>${this.escapeHtml(r.slug)}</td></tr>`).join('')}
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
    container.innerHTML = '<p>Executing correlated subquery across tables...</p>';
    try {
      const res = await api.lab.getCorrelated('categories_with_components');
      container.innerHTML = `
        <div class="alert alert-info">
          <strong>${this.escapeHtml(res.data.description)}</strong>
          <pre style="margin-top: 0.5rem; font-size: 0.8rem;">${this.escapeHtml(res.data.sql)}</pre>
        </div>
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Category ID</th><th>Name</th><th>Slug</th></tr></thead>
            <tbody>
              ${res.data.rows.map(r => `<tr><td>${r.category_id}</td><td>${this.escapeHtml(r.name)}</td><td>${this.escapeHtml(r.slug)}</td></tr>`).join('')}
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
    container.innerHTML = '<p>Loading v_component_catalogue...</p>';
    try {
      const res = await api.lab.getViewCatalogue(1, 10);
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>ID</th><th>Component</th><th>Category</th><th>Parent Category</th></tr></thead>
            <tbody>
              ${res.data.items.map(r => `<tr><td>${r.component_id}</td><td><strong>${this.escapeHtml(r.component_name)}</strong></td><td>${this.escapeHtml(r.category_name)}</td><td>${this.escapeHtml(r.parent_category_name || '—')}</td></tr>`).join('')}
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
    container.innerHTML = '<p>Loading v_category_component_counts...</p>';
    try {
      const res = await api.lab.getViewCounts();
      container.innerHTML = `
        <div class="table-responsive">
          <table class="edu-table">
            <thead><tr><th>Category ID</th><th>Name</th><th>Slug</th><th>Component Count</th></tr></thead>
            <tbody>
              ${res.data.items.map(r => `<tr><td>${r.category_id}</td><td><strong>${this.escapeHtml(r.category_name)}</strong></td><td>${this.escapeHtml(r.category_slug)}</td><td>${r.component_count}</td></tr>`).join('')}
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
      const reportMarkdown = res.data.report;
      // Convert markdown to clean HTML
      container.innerHTML = `<div style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px;">${this.escapeHtml(reportMarkdown)}</div>`;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  async loadDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    try {
      const res = await api.lab.getDashboard();
      const tables = res.data.tables;
      const metrics = res.data.componentMetrics;

      let html = `
        <div class="stats-grid">
          ${tables.map(t => `
            <div class="stat-card">
              <div class="stat-value">${t.row_count}</div>
              <div class="stat-label">${this.escapeHtml(t.table_name)}</div>
            </div>
          `).join('')}
        </div>
      `;

      if (metrics) {
        html += `
          <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 8px; font-size: 0.9rem;">
            <strong>Component Classification:</strong> Published: ${metrics.published_components} | Illustrative Educational Models: ${metrics.illustrative_components}
          </div>
        `;
      }

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${this.escapeHtml(err.message)}</div>`;
    }
  },

  // ----------------------------------------------------------------
  // Modal & Utilities
  // ----------------------------------------------------------------
  openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('global-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('global-modal').classList.remove('open');
  },

  openImageModal(src, title) {
    const body = `
      <div style="text-align: center;">
        <img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(title)}" style="max-width: 100%; max-height: 70vh; object-fit: contain;" />
      </div>
    `;
    this.openModal(title, body);
  },

  downloadXml(xmlContent, filename) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  renderPagination(pagination, baseUrl) {
    const { page, totalPages } = pagination;
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const sep = baseUrl.includes('?') ? '&' : '?';

    let html = `<div class="pagination-bar">`;
    if (prevPage) {
      html += `<a href="${baseUrl}${sep}page=${prevPage}" class="page-btn">« Previous</a>`;
    } else {
      html += `<button class="page-btn" disabled>« Previous</button>`;
    }

    // Numbered pages (window around current)
    for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
      html += `<a href="${baseUrl}${sep}page=${p}" class="page-btn ${p === page ? 'active' : ''}">${p}</a>`;
    }

    if (nextPage) {
      html += `<a href="${baseUrl}${sep}page=${nextPage}" class="page-btn">Next »</a>`;
    } else {
      html += `<button class="page-btn" disabled>Next »</button>`;
    }
    html += `</div>`;
    return html;
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());
