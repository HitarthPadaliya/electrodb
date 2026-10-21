(() => {
  const main = document.querySelector('#main');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const assetPath = value => typeof value === 'string' && value.startsWith('/assets/') && !value.includes('..') ? value : '';
  const externalUrl = value => { try { const parsed = new URL(value); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
  const documentUrl = value => { const asset = assetPath(value); return asset.startsWith('/assets/documents/') ? asset : externalUrl(value); };
  const url = (route, params = {}) => `/api${route}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''}`;
  async function api(route, options = {}) {
    const response = await fetch(url(route, options.params), { method: options.method || 'GET', headers: options.body ? { 'Content-Type': 'application/json' } : {}, body: options.body ? JSON.stringify(options.body) : undefined });
    const type = response.headers.get('content-type') || '';
    if (!response.ok) {
      const payload = type.includes('json') ? await response.json() : { error: { message: await response.text() } };
      throw new Error(payload.error?.message || 'Request failed.');
    }
    return type.includes('json') ? response.json().then(value => value.data) : response.text();
  }
  const icon = name => ({
    chip: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="11" width="26" height="26" rx="5"/><path d="M18 18h12v12H18zM17 4v7m7-7v7m7-7v7M17 37v7m7-7v7m7-7v7M4 17h7m-7 7h7m-7 7h7m26-14h7m-7 7h7m-7 7h7"/></svg>',
    wave: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 25h8l5-14 9 27 6-18 4 5h8"/></svg>',
    search: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>',
    arrow: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>'
  })[name];
  const errorPanel = (error, action = 'Try again') => `<section class="notice notice-error"><span class="notice-icon">!</span><div><strong>We couldn't load that just now.</strong><p>${esc(error.message)}</p><button class="text-button" data-action="retry">${action} ↗</button></div></section>`;
  const configNotice = `<section class="notice config-notice"><span class="notice-icon">i</span><div><strong>Catalogue data is waiting for its database.</strong><p>Configure MySQL using <code>.env.example</code>, then import <code>electrodb.sql</code>. The interface is ready; no sample catalogue data is hardcoded into the site.</p><span class="text-button">See “Setup Prompting and Run Guide.md” in the project root.</span></div></section>`;
  function shell(kicker, title, subtitle, body) {
    return `<div class="page-shell"><div class="page-intro"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p></div>${body}</div>`;
  }
  function componentCard(item) {
    return `<a class="component-card" href="#/component/${encodeURIComponent(item.slug)}"><span class="card-symbol">${icon('chip')}</span><span class="card-copy"><span class="card-category">${esc(item.categoryName || 'Component')}</span><strong>${esc(item.name)}</strong><span>${esc(item.shortDescription || 'Open the component reference for details.')}</span></span>${icon('arrow')}</a>`;
  }
  function categoryCard(item) {
    return `<a class="category-card" href="#/category/${encodeURIComponent(item.slug)}"><span class="category-icon">${icon('wave')}</span><span><strong>${esc(item.name)}</strong><small>${esc(item.description || 'Browse components and learning material.')}</small></span><span class="category-arrow">↗</span></a>`;
  }
  function searchBox(value = '') {
    return `<form class="search-form" id="search-form"><label class="sr-only" for="site-search">Search components</label>${icon('search')}<input id="site-search" name="q" type="search" value="${esc(value)}" placeholder="Try “flip-flop”, “diode”, or “counter”…" autocomplete="off"><button type="submit">Search <span>↗</span></button></form>`;
  }
  function breadcrumbMarkup(items = [], includeCurrent = true) {
    return `<a href="#/">Home</a>${items.map((item, index) => `<span>/</span>${includeCurrent && index === items.length - 1 ? `<span>${esc(item.name)}</span>` : `<a href="#/category/${encodeURIComponent(item.slug)}">${esc(item.name)}</a>`}`).join('')}`;
  }
  async function home() {
    try {
      const categories = await api('/categories');
      const top = categories.filter(category => category.parentCategoryId == null).slice(0, 6);
      main.innerHTML = `<section class="hero"><div class="hero-grid"></div><div class="hero-content"><span class="eyebrow"><span class="pulse"></span> A living reference for curious minds</span><h1>Understand the<br><em>building blocks</em><br>of electronics.</h1><p>From logic gates to sensors, explore the components and ideas that make circuits work.</p>${searchBox()}<div class="hero-meta"><span>One clear place to learn</span><span class="meta-line"></span><span>Built for engineering students</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="hero-chip"><div class="chip-inner">E<span>·</span></div><i class="pin p1"></i><i class="pin p2"></i><i class="pin p3"></i><i class="pin p4"></i><i class="pin p5"></i><i class="pin p6"></i><i class="pin p7"></i><i class="pin p8"></i></div><span class="art-label label-a">IN · 01</span><span class="art-label label-b">VCC 3.3V</span><span class="art-label label-c">OUT ↗</span><span class="art-node node-a"></span><span class="art-node node-b"></span></div></section><div class="home-content"><section class="section-block"><div class="section-heading"><div><span class="eyebrow">Start somewhere</span><h2>Explore the catalogue</h2></div><a class="subtle-link" href="#/categories">All categories <span>↗</span></a></div>${top.length ? `<div class="category-grid">${top.map(categoryCard).join('')}</div>` : '<div class="empty-state">No categories have been published yet.</div>'}</section><section class="study-strip"><div class="study-icon">${icon('wave')}</div><div><span class="eyebrow">Learn by connection</span><h2>Concepts, tables, and diagrams — together.</h2><p>Move from a component’s purpose to its logic, equations, and practical specifications.</p></div><a href="#/categories" class="round-link" aria-label="Browse categories">↗</a></section><section class="closing-note"><span class="eyebrow">A better way to revise</span><p>Designed to make complex electronics feel a little more <em>connected.</em></p></section></div>`;
      bindSearch();
    } catch (error) { main.innerHTML = `<section class="hero hero-compact"><div class="hero-content"><span class="eyebrow">ElectroDB · component reference</span><h1>Electronics,<br><em>made clearer.</em></h1><p>Browse components, understand how they work, and connect the ideas behind every circuit.</p>${searchBox()}</div></section><div class="home-content">${error.message.includes('Database') || error.message.includes('database') ? configNotice : errorPanel(error)}</div>`; bindSearch(); }
  }
  function bindSearch() {
    document.querySelector('#search-form')?.addEventListener('submit', event => { event.preventDefault(); const q = new FormData(event.currentTarget).get('q').trim(); location.hash = `#/search?q=${encodeURIComponent(q)}`; });
  }
  async function allCategories() {
    try {
      const categories = await api('/categories');
      const roots = categories.filter(item => item.parentCategoryId == null);
      const body = roots.map(root => `<section class="category-family"><div class="family-heading"><span class="family-index">${String(root.displayOrder || 1).padStart(2, '0')}</span><div><h2>${esc(root.name)}</h2><p>${esc(root.description || '')}</p></div></div><div class="category-grid">${categoryCard(root)}${categories.filter(child => child.parentCategoryId === root.categoryId).map(categoryCard).join('')}</div></section>`).join('');
      main.innerHTML = shell('Browse by subject', 'Categories', 'A map of the electronic ideas and components in the catalogue.', body || '<div class="empty-state">No categories have been published yet.</div>');
    } catch (error) { main.innerHTML = shell('Browse by subject', 'Categories', 'Explore the ElectroDB catalogue.', error.message.toLowerCase().includes('database') ? configNotice : errorPanel(error)); }
  }
  async function categoryPage(slug) {
    try {
      const category = (await api(`/categories/slug/${encodeURIComponent(slug)}`));
      const childCards = (category.children || []).map(categoryCard).join('');
      const components = (category.components || []).map(componentCard).join('');
      const body = `${childCards ? `<section class="content-section"><div class="section-heading"><div><span class="eyebrow">Continue exploring</span><h2>Subcategories</h2></div></div><div class="category-grid">${childCards}</div></section>` : ''}<section class="content-section"><div class="section-heading"><div><span class="eyebrow">In this collection</span><h2>Components <span class="count-pill">${category.components?.length || 0}</span></h2></div></div>${components ? `<div class="component-list">${components}</div>` : '<div class="empty-state">There are no published components in this category yet.</div>'}</section>`;
      main.innerHTML = `<div class="page-shell"><div class="breadcrumbs">${breadcrumbMarkup(category.breadcrumb || [category])}</div><div class="category-cover"><span class="eyebrow">${category.parentCategoryId ? 'Collection' : 'Subject'}</span><h1>${esc(category.name)}</h1><p>${esc(category.description || '')}</p></div>${body}</div>`;
    } catch (error) { main.innerHTML = shell('Category', 'We couldn’t open this category.', '', error.message.toLowerCase().includes('database') ? configNotice : errorPanel(error)); }
  }
  async function searchPage(q, page = 1) {
    try {
      const result = await api('/search', { params: { q, page, pageSize: 24 } });
      const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
      const pager = pageCount > 1 ? `<div class="pagination"><button data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>← Previous</button><span>Page ${page} of ${pageCount}</span><button data-page="${page + 1}" ${page >= pageCount ? 'disabled' : ''}>Next →</button></div>` : '';
      main.innerHTML = shell('Search the catalogue', `Results for “${esc(q)}”`, `${result.total} ${result.total === 1 ? 'match' : 'matches'} in the component library.`, `${searchBox(q)}${result.items.length ? `<div class="component-list search-results">${result.items.map(componentCard).join('')}</div>${pager}` : '<div class="empty-state"><strong>No matches yet.</strong><p>Try a component name, type, or category.</p></div>'}`);
      bindSearch();
      document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { location.hash = `#/search?q=${encodeURIComponent(q)}&page=${button.dataset.page}`; }));
    } catch (error) { main.innerHTML = shell('Search the catalogue', 'Find a component', 'Search across names, summaries, and categories.', error.message.toLowerCase().includes('database') ? configNotice : errorPanel(error)); bindSearch(); }
  }
  function makeTable(table) {
    if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return '<div class="notice">This table could not be displayed.</div>';
    return `<div class="table-scroll"><table><thead><tr>${table.columns.map(col => `<th scope="col">${esc(col)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${table.columns.map((_, i) => `<td>${esc(Array.isArray(row) ? row[i] : '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderContent(section) {
    if (section.type === 'TABLE') return makeTable(section.content);
    if (section.type === 'EQUATION') return `<div class="equation-box"><span class="equation-fallback">${esc(section.content)}</span><span class="equation-source">LaTeX</span></div>`;
    if (section.type === 'TEXT') return `<div class="prose">${String(section.content || '').split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
    if (section.type === 'IMAGE') return `<figure class="media-figure"><img src="${esc(assetPath(section.content))}" alt="${esc(section.altText || section.title)}" loading="lazy">${section.caption ? `<figcaption>${esc(section.caption)}</figcaption>` : ''}</figure>`;
    if (section.type === 'DOCUMENT') { const href = documentUrl(section.content); return href ? `<a class="document-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Open document ↗</a>` : '<div class="media-missing">Document link is unavailable.</div>'; }
    if (section.type === 'GRAPH') return typeof section.content === 'string' ? `<img class="diagram-image" src="${esc(assetPath(section.content))}" alt="${esc(section.altText || section.title)}">` : makeTable(section.content);
    return `<div class="media-missing">This content type is not supported yet.</div>`;
  }
  async function componentPage(slug) {
    try {
      const component = await api(`/components/slug/${encodeURIComponent(slug)}`);
      const specRows = (component.specifications || []).map(spec => {
        let value = spec.textValue;
        if (value == null && spec.rangeMin != null) value = `${spec.rangeMin}–${spec.rangeMax}`;
        if (value == null) value = spec.numericValue;
        return `<tr><th scope="row">${esc(spec.name)}</th><td>${esc(value)} ${esc(spec.displayUnit || '')}</td><td>${esc(spec.sourceNote || '')}</td></tr>`;
      }).join('');
      const content = (component.content || []).map(section => `<section class="detail-section"><div class="detail-section-title"><span class="section-mark"></span><h2>${esc(section.title)}</h2></div>${renderContent(section)}${section.caption && section.type !== 'TABLE' ? `<p class="caption">${esc(section.caption)}</p>` : ''}</section>`).join('');
      const diagrams = (component.diagrams || []).map(diagram => `<figure class="diagram-card"><div class="diagram-frame"><img src="${esc(assetPath(diagram.imagePath))}" alt="${esc(diagram.altText || diagram.title)}" loading="lazy"></div><figcaption><strong>${esc(diagram.title)}</strong>${diagram.caption ? `<span>${esc(diagram.caption)}</span>` : ''}</figcaption></figure>`).join('');
      main.innerHTML = `<div class="page-shell detail-page"><div class="breadcrumbs">${breadcrumbMarkup(component.category.breadcrumb || [{ name: component.category.name, slug: component.category.slug }], false)}<span>/</span><span>${esc(component.name)}</span></div><div class="detail-hero"><div><span class="eyebrow">${esc(component.category.name)} ${component.isIllustrative ? '· illustrative example' : ''}</span><h1>${esc(component.name)}</h1><p class="lead">${esc(component.shortDescription || '')}</p></div><div class="detail-chip">${icon('chip')}<span>COMPONENT<br>REFERENCE</span></div></div><div class="detail-layout"><article class="detail-main">${component.description ? `<section class="detail-section intro-copy"><div class="detail-section-title"><span class="section-mark"></span><h2>Overview</h2></div><div class="prose"><p>${esc(component.description)}</p></div></section>` : ''}${content}${diagrams ? `<section class="detail-section"><div class="detail-section-title"><span class="section-mark"></span><h2>Diagrams</h2></div><div class="diagram-grid">${diagrams}</div></section>` : ''}${specRows ? `<section class="detail-section"><div class="detail-section-title"><span class="section-mark"></span><h2>Specifications</h2></div><div class="table-scroll"><table class="spec-table"><thead><tr><th>Property</th><th>Value</th><th>Notes</th></tr></thead><tbody>${specRows}</tbody></table></div></section>` : ''}${externalUrl(component.datasheetUrl) ? `<a class="document-link" href="${esc(externalUrl(component.datasheetUrl))}" target="_blank" rel="noopener noreferrer">View datasheet ↗</a>` : ''}</article><aside class="detail-aside"><span class="eyebrow">Quick reference</span><div class="aside-item"><small>Category</small><a href="#/category/${encodeURIComponent(component.category.slug)}">${esc(component.category.name)} ↗</a></div><div class="aside-item"><small>Content sections</small><strong>${component.content.length} topics</strong></div><div class="aside-note">${component.isIllustrative ? 'Illustrative educational data. Check a manufacturer datasheet for verified component ratings.' : 'Technical values and behavior depend on the exact component part and operating conditions.'}</div></aside></div></div>`;
      main.querySelectorAll('img').forEach(image => image.addEventListener('error', () => {
        const fallback = document.createElement('span'); fallback.className = 'media-missing';
        fallback.textContent = 'Diagram or image resource is not available.'; image.replaceWith(fallback);
      }, { once: true }));
      if (window.katex) document.querySelectorAll('.equation-fallback').forEach(node => { const latex = node.textContent; try { window.katex.render(latex, node, { throwOnError: false, output: 'html' }); } catch { /* visible source remains as fallback */ } });
    } catch (error) { main.innerHTML = shell('Component reference', 'This component isn’t available.', '', error.message.toLowerCase().includes('database') ? configNotice : errorPanel(error)); }
  }
  const labTabs = [
    ['full-table', 'Full table'], ['crud', 'CRUD'], ['aggregate', 'Aggregate'], ['filter', 'Filter'], ['join', 'Join'], ['subquery', 'Subqueries'], ['views', 'Views'], ['dashboard', 'Dashboard'], ['xml', 'XML output']
  ];
  function labFrame() {
    main.innerHTML = `<div class="page-shell lab-page"><div class="lab-heading"><div><span class="eyebrow">Assignment 11 · practical console</span><h1>Database lab</h1><p>Run guided demonstrations against the catalogue database. Every control maps to an approved query template.</p></div><span class="lab-badge"><i></i> DEMO ENVIRONMENT</span></div><div class="lab-layout"><nav class="lab-sidebar" aria-label="Lab tools">${labTabs.map(([id, label], i) => `<button class="lab-tab ${i === 0 ? 'active' : ''}" data-tab="${id}" type="button"><span class="tab-number">0${i + 1}</span>${label}</button>`).join('')}<div class="sidebar-note"><strong>Safe by design</strong><p>No arbitrary SQL box. Table and field choices are allowlisted by the API.</p></div></nav><section class="lab-workspace" id="lab-workspace" aria-live="polite"></section></div></div>`;
    document.querySelectorAll('.lab-tab').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.lab-tab').forEach(tab => tab.classList.toggle('active', tab === button));
      renderLabTab(button.dataset.tab);
    }));
    renderLabTab('crud');
  }
  const panelHeading = (eyebrow, title, text) => `<div class="panel-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${text}</p></div>`;
  function renderLabTab(tab) {
    const work = document.querySelector('#lab-workspace'); if (!work) return;
    const panels = {
      'full-table': `${panelHeading('Query 01 · full-table display', 'Component records', 'A bounded HTML-table view of every component column in the assignment dataset.') }<button class="button button-primary" data-action="refresh-full-table">Refresh table ↻</button><div id="lab-results" class="results-slot"><div class="loading-inline"><span class="spinner"></span> Loading all component columns…</div></div>`,
      crud: `${panelHeading('Create · read · update · delete', 'Component records', 'Demonstrate integrity-aware component edits through stored procedures.') }<div class="lab-toolbar"><button class="button button-primary" data-action="new-component">＋ New component</button><button class="button button-quiet" data-action="refresh-components">↻ Refresh components</button><button class="button button-quiet" data-action="show-users">Login-data CRUD</button></div><div id="crud-form-slot"></div><div id="lab-results" class="results-slot"><div class="loading-inline"><span class="spinner"></span> Loading records…</div></div>`,
      aggregate: `${panelHeading('Query 03 · aggregate', 'Measure a collection', 'Choose an approved aggregate and optionally group the result by category.') }<form class="control-card" id="aggregate-form"><label>Aggregate<select name="function"><option value="count">Count</option><option value="sum">Sum</option><option value="average">Average</option><option value="min">Minimum</option><option value="max">Maximum</option></select></label><label>Numeric field<select name="field"><option value="component_id">Component ID</option><option value="category_id">Category ID</option><option value="is_published">Published flag</option></select></label><label>Group by<select name="groupBy"><option value="">No grouping</option><option value="category_id">Category</option></select></label><button class="button button-primary">Run aggregate ↗</button></form><div id="lab-results" class="results-slot"><div class="empty-state">Choose options and run the query.</div></div>`,
      filter: `${panelHeading('Conditional query', 'Filter components', 'Filter fields and operators are selected from a server-side allowlist.') }<form class="control-card" id="filter-form"><label>Field<select name="field"><option value="category_id">Category ID</option><option value="name">Component name</option><option value="is_published">Published</option><option value="is_illustrative">Illustrative</option></select></label><label>Condition<select name="operator"><option value="eq">Equals</option><option value="neq">Does not equal</option><option value="contains">Contains</option><option value="gt">Greater than</option><option value="lt">Less than</option></select></label><label>Value<input name="value" required placeholder="Enter a value"></label><button class="button button-primary">Apply filter ↗</button></form><div id="lab-results" class="results-slot"><div class="empty-state">Set a field and value to get started.</div></div>`,
      join: `${panelHeading('Join query', 'Relate two tables', 'Explore how components connect to their category records.') }<form class="control-card" id="join-form"><label>First table<select name="left"><option value="components">Components</option><option value="categories">Categories</option></select></label><label>Join type<select name="type"><option value="inner">Inner join</option><option value="left">Left join</option><option value="right">Right join</option></select></label><label>Second table<select name="right"><option value="categories">Categories</option><option value="components">Components</option></select></label><button class="button button-primary">Run join ↗</button></form><div id="lab-results" class="results-slot"><div class="empty-state">Choose the table relationship to view the joined rows.</div></div>`,
      subquery: `${panelHeading('Nested queries', 'Look beyond a single table', 'Compare a subquery with a correlated query that checks component presence per category.') }<div class="query-cards"><button class="query-card" data-action="subquery"><span class="eyebrow">Query 06</span><strong>Categories with published components</strong><small>Subquery · IN</small><span class="query-arrow">↗</span></button><button class="query-card" data-action="correlated"><span class="eyebrow">Query 07</span><strong>Count components in each category</strong><small>Correlated subquery · EXISTS</small><span class="query-arrow">↗</span></button></div><div id="lab-results" class="results-slot"><div class="empty-state">Select a query to inspect its results.</div></div>`,
      views: `${panelHeading('Joined view · procedure · trigger', 'See the view in action', 'MySQL does not support triggers directly on views. This demo calls the component insert procedure, checks the joined catalogue view, and verifies the base-table audit trigger.') }<div class="lab-toolbar"><button class="button button-primary" data-action="run-view-demo">Run procedure + trigger demo ↗</button><button class="button button-quiet" data-action="refresh-view">Refresh joined view</button></div><div id="lab-results" class="results-slot"><div class="loading-inline"><span class="spinner"></span> Loading the joined view…</div></div>`,
      dashboard: `${panelHeading('Database overview', 'At a glance', 'Live row counts across catalogue and assignment tables.') }<button class="button button-primary" data-action="dashboard">Refresh statistics ↻</button><div id="lab-results" class="results-slot"><div class="loading-inline"><span class="spinner"></span> Loading statistics…</div></div>`,
      xml: `${panelHeading('XML serialization', 'Same data, another format', 'View the XML outputs for Assignment 11 queries 1, 3, and 4.') }<div class="xml-actions"><button class="button button-quiet" data-action="xml-components">Query 1 · Full table</button><button class="button button-quiet" data-action="xml-aggregate">Query 3 · Aggregate</button><label class="xml-filter">Query 4 · Category ID<input type="number" min="1" value="6" id="xml-category"></label><button class="button button-quiet" data-action="xml-filter">Generate filtered XML</button></div><div id="lab-results" class="results-slot"><div class="empty-state">Choose a query to view its XML serialization.</div></div>`
    };
    work.innerHTML = panels[tab] || panels.crud;
    bindLabActions(tab);
  }
  async function showResult(promise, format = 'table') {
    const slot = document.querySelector('#lab-results'); if (!slot) return;
    slot.innerHTML = '<div class="loading-inline"><span class="spinner"></span> Running approved query…</div>';
    try {
      const data = await promise;
      if (format === 'xml') { slot.innerHTML = `<pre class="xml-output"><code>${esc(data)}</code></pre>`; return; }
      let rows = Array.isArray(data) ? data : data.items || [];
      if (format === 'dashboard') { slot.innerHTML = `<div class="stats-grid">${rows.map(item => `<div class="stat-card"><span>${esc(item.table.replaceAll('_', ' '))}</span><strong>${Number(item.total).toLocaleString()}</strong><small>rows</small></div>`).join('')}</div>`; return; }
      if (format === 'crud') { slot.innerHTML = crudTable(rows); attachCrudButtons(); return; }
      if (!rows.length) { slot.innerHTML = '<div class="empty-state">The query returned no rows.</div>'; return; }
      slot.innerHTML = data.total != null ? `<p class="result-summary">${data.total} records · page ${data.page}</p>${dataTable(rows)}` : dataTable(rows);
    } catch (error) { slot.innerHTML = errorPanel(error); }
  }
  function dataTable(rows) {
    const keys = Object.keys(rows[0] || {});
    return `<div class="table-scroll lab-table-scroll"><table><thead><tr>${keys.map(key => `<th>${esc(key.replaceAll(/([A-Z])/g, ' $1').replaceAll('_', ' '))}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${keys.map(key => `<td>${esc(typeof row[key] === 'object' && row[key] !== null ? JSON.stringify(row[key]) : row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function crudTable(rows) {
    const body = rows.map(row => `<tr><td>${row.componentId}</td><td><strong>${esc(row.name)}</strong><small class="table-sub">${esc(row.slug)}</small></td><td>${row.categoryId}</td><td>${esc(row.shortDescription || '—')}</td><td><div class="row-actions"><button data-action="edit-component" data-id="${row.componentId}" data-name="${esc(row.name)}" data-category="${row.categoryId}" data-description="${esc(row.shortDescription || '')}">Edit</button><button class="danger-action" data-action="delete-component" data-id="${row.componentId}">Delete</button></div></td></tr>`).join('');
    return `<div class="table-scroll lab-table-scroll"><table><thead><tr><th>ID</th><th>Component</th><th>Category</th><th>Summary</th><th>Actions</th></tr></thead><tbody>${body || '<tr><td colspan="5">No components found.</td></tr>'}</tbody></table></div>`;
  }
  function attachCrudButtons() {
    document.querySelectorAll('[data-action="edit-component"]').forEach(button => button.addEventListener('click', () => openComponentForm({ id: button.dataset.id, name: button.dataset.name, category: button.dataset.category, description: button.dataset.description })));
  }
  async function openComponentForm(record = {}) {
    const slot = document.querySelector('#crud-form-slot');
    let categories;
    try { categories = await api('/categories'); }
    catch (error) { slot.innerHTML = `<div class="form-error">Could not load category options: ${esc(error.message)}</div>`; return; }
    slot.innerHTML = `<form class="control-card crud-form" id="crud-form"><div class="form-heading"><strong>${record.id ? 'Update component' : 'Add a component'}</strong><button type="button" class="text-button" data-action="close-form">Close ×</button></div><input type="hidden" name="id" value="${esc(record.id || '')}"><label>Component name<input name="name" required maxlength="180" value="${esc(record.name || '')}" placeholder="e.g. Logic probe"></label><label>Category<select name="categoryId" required><option value="">Choose a category</option>${categories.map(category => `<option value="${category.categoryId}" ${String(category.categoryId) === String(record.category || '') ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}</select></label><label>Short description<input name="shortDescription" maxlength="1000" value="${esc(record.description || '')}" placeholder="A concise summary"></label><button class="button button-primary">${record.id ? 'Save changes' : 'Create component'} ↗</button></form>`;
    slot.querySelector('[data-action="close-form"]').addEventListener('click', () => { slot.innerHTML = ''; });
    slot.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const id = form.get('id');
      const body = { name: form.get('name'), categoryId: Number(form.get('categoryId')), shortDescription: form.get('shortDescription') };
      try { await api(`/lab/components${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body }); slot.innerHTML = ''; await loadCrud(); }
      catch (error) { slot.insertAdjacentHTML('beforeend', `<p class="form-error">${esc(error.message)}</p>`); }
    });
  }
  async function loadCrud() { showResult(api('/lab/components?page=1&pageSize=100'), 'crud'); }
  async function loadUsers() {
    const slot = document.querySelector('#lab-results'); if (!slot) return;
    slot.innerHTML = '<div class="loading-inline"><span class="spinner"></span> Loading login records…</div>';
    try {
      const users = await api('/lab/app-users');
      slot.innerHTML = `<p class="result-summary">${users.length} lab-only login records · password hashes are not exposed</p><div class="table-scroll lab-table-scroll"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead><tbody>${users.map(user => `<tr><td>${user.userId}</td><td>${esc(user.username)}</td><td>${esc(user.roleCode)}</td><td>${user.isActive ? 'Yes' : 'No'}</td><td><div class="row-actions"><button data-action="edit-user" data-id="${user.userId}" data-username="${esc(user.username)}" data-role="${esc(user.roleCode)}" data-active="${user.isActive}">Edit</button><button class="danger-action" data-action="delete-user" data-id="${user.userId}">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="5">No lab login records.</td></tr>'}</tbody></table></div>`;
      slot.querySelectorAll('[data-action="edit-user"]').forEach(button => button.addEventListener('click', () => openUserForm({ id: button.dataset.id, username: button.dataset.username, role: button.dataset.role, active: button.dataset.active })));
    } catch (error) { slot.innerHTML = errorPanel(error); }
  }
  async function openUserForm(record = {}) {
    const slot = document.querySelector('#crud-form-slot');
    slot.innerHTML = `<form class="control-card crud-form" id="user-form"><div class="form-heading"><strong>${record.id ? 'Update lab login record' : 'Add lab login record'}</strong><button type="button" class="text-button" data-action="close-form">Close ×</button></div><input type="hidden" name="id" value="${esc(record.id || '')}"><label>Username<input name="username" required minlength="2" maxlength="100" pattern="[A-Za-z0-9_.-]+" value="${esc(record.username || '')}" ${record.id ? 'readonly' : ''}></label>${record.id ? '' : '<label>Initial password<input name="password" type="password" required minlength="12" maxlength="200" autocomplete="new-password"><small class="field-help">12+ characters; only a salted scrypt hash is stored.</small></label>'}<label>Role<select name="roleCode"><option value="NAIVE_USER" ${record.role === 'NAIVE_USER' ? 'selected' : ''}>Naïve / read-only</option><option value="APP_DEVELOPER" ${record.role === 'APP_DEVELOPER' ? 'selected' : ''}>Application developer</option><option value="DBA" ${record.role === 'DBA' ? 'selected' : ''}>DBA demo role</option></select></label>${record.id ? `<label>Active<select name="isActive"><option value="1" ${String(record.active) === '1' ? 'selected' : ''}>Yes</option><option value="0" ${String(record.active) === '0' ? 'selected' : ''}>No</option></select></label>` : ''}<button class="button button-primary">${record.id ? 'Save changes' : 'Create login record'} ↗</button></form>`;
    slot.querySelector('[data-action="close-form"]').addEventListener('click', () => { slot.innerHTML = ''; });
    slot.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const id = form.get('id');
      const body = { username: form.get('username'), password: form.get('password'), roleCode: form.get('roleCode'), isActive: Number(form.get('isActive')) };
      try { await api(`/lab/app-users${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body }); slot.innerHTML = ''; await loadUsers(); }
      catch (error) { slot.insertAdjacentHTML('beforeend', `<p class="form-error">${esc(error.message)}</p>`); }
    });
  }
  async function runViewDemo() {
    const slot = document.querySelector('#lab-results'); if (!slot) return;
    slot.innerHTML = '<div class="loading-inline"><span class="spinner"></span> Calling the stored procedure and checking trigger/view effects…</div>';
    try {
      const result = await api('/lab/view-demo', { method: 'POST', body: {} });
      slot.innerHTML = `<div class="notice view-demo-notice"><span class="notice-icon">✓</span><div><strong>${esc(result.message)}</strong><p>Component ${esc(result.componentId)} was written to the base table.</p></div></div><h3 class="result-subhead">Joined view row</h3>${dataTable([result.viewRow])}<h3 class="result-subhead">Audit trigger row</h3>${result.auditRow ? dataTable([result.auditRow]) : '<div class="notice">No matching audit record was returned.</div>'}<button class="button button-quiet" data-action="remove-view-demo" data-id="${esc(result.componentId)}">Remove temporary demo component</button>`;
      slot.querySelector('[data-action="remove-view-demo"]')?.addEventListener('click', async event => {
        try { await api(`/lab/view-demo/${event.currentTarget.dataset.id}`, { method: 'DELETE' }); await showResult(api('/lab/views')); }
        catch (error) { slot.insertAdjacentHTML('afterbegin', `<div class="form-error">${esc(error.message)}</div>`); }
      });
    } catch (error) { slot.innerHTML = errorPanel(error); }
  }
  function bindLabActions(tab) {
    const work = document.querySelector('#lab-workspace');
    let showingUsers = false;
    if (tab === 'full-table') showResult(api('/lab/components/full-table'));
    if (tab === 'crud') loadCrud();
    if (tab === 'views') showResult(api('/lab/views'));
    if (tab === 'dashboard') showResult(api('/lab/dashboard'), 'dashboard');
    work.querySelector('[data-action="refresh-full-table"]')?.addEventListener('click', () => showResult(api('/lab/components/full-table')));
    work.querySelector('[data-action="new-component"]')?.addEventListener('click', () => showingUsers ? openUserForm() : openComponentForm());
    work.querySelector('[data-action="refresh-components"]')?.addEventListener('click', () => showingUsers ? loadUsers() : loadCrud());
    work.querySelector('[data-action="show-users"]')?.addEventListener('click', event => { showingUsers = true; document.querySelector('#crud-form-slot').innerHTML = ''; work.querySelector('[data-action="new-component"]').textContent = '＋ New login record'; work.querySelector('[data-action="refresh-components"]').textContent = '↻ Refresh login data'; event.currentTarget.classList.add('active'); loadUsers(); });
    work.querySelector('[data-action="dashboard"]')?.addEventListener('click', () => showResult(api('/lab/dashboard'), 'dashboard'));
    work.querySelector('[data-action="refresh-view"]')?.addEventListener('click', () => showResult(api('/lab/views')));
    work.querySelector('[data-action="run-view-demo"]')?.addEventListener('click', runViewDemo);
    work.querySelector('[data-action="subquery"]')?.addEventListener('click', () => showResult(api('/lab/subquery')));
    work.querySelector('[data-action="correlated"]')?.addEventListener('click', () => showResult(api('/lab/correlated-query')));
    work.querySelector('[data-action="xml-components"]')?.addEventListener('click', () => showResult(api('/lab/components.xml'), 'xml'));
    work.querySelector('[data-action="xml-aggregate"]')?.addEventListener('click', () => showResult(api('/lab/aggregate.xml'), 'xml'));
    work.querySelector('[data-action="xml-filter"]')?.addEventListener('click', () => showResult(api('/lab/filter.xml', { params: { categoryId: work.querySelector('#xml-category').value } }), 'xml'));
    work.querySelector('#aggregate-form')?.addEventListener('submit', event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); showResult(api('/lab/aggregate', { params: values })); });
    work.querySelector('#filter-form')?.addEventListener('submit', event => { event.preventDefault(); showResult(api('/lab/filter', { params: Object.fromEntries(new FormData(event.currentTarget)) })); });
    work.querySelector('#join-form')?.addEventListener('submit', event => { event.preventDefault(); const params = Object.fromEntries(new FormData(event.currentTarget)); if (params.left === params.right) { work.querySelector('#lab-results').innerHTML = '<div class="notice">Choose two different tables for this demonstration.</div>'; return; } showResult(api('/lab/join', { params })); });
    work.addEventListener('click', async event => {
      const componentButton = event.target.closest('[data-action="delete-component"]');
      const userButton = event.target.closest('[data-action="delete-user"]');
      const button = componentButton || userButton; if (!button) return;
      const noun = componentButton ? 'component' : 'lab login record';
      if (!window.confirm(`Delete ${noun} ${button.dataset.id}? This action cannot be undone.`)) return;
      try { await api(`/lab/${componentButton ? 'components' : 'app-users'}/${button.dataset.id}`, { method: 'DELETE' }); componentButton ? await loadCrud() : await loadUsers(); }
      catch (error) { const slot = document.querySelector('#lab-results'); slot.insertAdjacentHTML('afterbegin', `<div class="form-error">${esc(error.message)}</div>`); }
    });
  }
  async function render() {
    const hash = location.hash || '#/';
    document.querySelectorAll('[data-nav]').forEach(item => item.classList.toggle('current', hash.startsWith(item.getAttribute('href')) && item.getAttribute('href') !== '#/'));
    if (hash === '#/' || hash === '#') return home();
    if (hash.startsWith('#/categories')) return allCategories();
    if (hash.startsWith('#/category/')) return categoryPage(decodeURIComponent(hash.slice('#/category/'.length).split('?')[0]));
    if (hash.startsWith('#/component/')) return componentPage(decodeURIComponent(hash.slice('#/component/'.length).split('?')[0]));
    if (hash.startsWith('#/search')) { const params = new URLSearchParams(hash.split('?')[1] || ''); const page = Number.parseInt(params.get('page') || '1', 10); return searchPage(params.get('q') || '', Number.isInteger(page) && page > 0 ? page : 1); }
    if (hash.startsWith('#/lab')) {
      try { const status = await api('/status'); if (!status.labEnabled) { main.innerHTML = shell('Assignment console', 'Lab console disabled.', 'The lab routes are disabled by the server configuration.', '<a class="button button-primary" href="#/">Return to catalogue ↗</a>'); return; } }
      catch (error) { main.innerHTML = shell('Assignment console', 'Lab console unavailable.', error.message, '<a class="button button-primary" href="#/">Return to catalogue ↗</a>'); return; }
      return labFrame();
    }
    main.innerHTML = shell('Page not found', 'That path wandered off.', 'Let’s get you back to the catalogue.', '<a class="button button-primary" href="#/">Return home ↗</a>');
  }
  window.addEventListener('hashchange', render);
  api('/status').then(status => { if (!status.labEnabled) document.querySelector('.nav-lab')?.setAttribute('hidden', ''); }).catch(() => {});
  document.querySelector('.menu-toggle')?.addEventListener('click', event => {
    const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true'; event.currentTarget.setAttribute('aria-expanded', String(!expanded)); document.querySelector('.main-nav').classList.toggle('nav-open', !expanded);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.main-nav a')) { document.querySelector('.main-nav').classList.remove('nav-open'); document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false'); }
    if (event.target.closest('[data-action="retry"]')) render();
  });
  render();
})();
