# ElectroDB — Design Decisions, Improvements, and Change Log

This document records proposed changes and the rationale behind them. It distinguishes established project requirements from implementation recommendations. Update this file whenever a decision changes.

## 1. Baseline carried forward

The existing frontend specification describes:
- An informational electronic-components catalogue.
- Node.js backend and MySQL database in its original technology assumptions.
- Hierarchical categories and data-driven component pages.
- Core tables: `categories`, `components`, `content_types`, `category_content_types`, `component_content`, `specifications`, `component_specifications`.
- Content types for text, image, table, equation, generic diagram, graph, and document; diagram assets now use a dedicated table.
- Category-specific educational sections, including state/next-state tables for counters and truth/characteristic/excitation tables plus equations and timing diagrams for flip-flops.
- No public login, profiles, cart, payment, ratings, reviews, or administrative editing.
- Backend API as the source of catalogue data, not hardcoded UI records.

The recent project requests additionally specify:
- LaTeX source for equations so the frontend can render them.
- Separate characteristic table and characteristic equation records, including flip-flops and other relevant components.
- Data for roughly 40–50 components in the seed dataset, with relevant tags requested in a prior project conversation.
- A page per category leaf as a useful implementation approach, but pages must still be generated from category IDs/data rather than hardcoded per-category data.
- SVG paths as the common representation for all diagrams, with no database-level diagram subtype.
- State-machine diagrams for relevant components.
- A static website was previously requested for design reference; that static prototype should not be confused with the final data-driven frontend.

## 2. Confirmed decision: keep MySQL and use equivalent stored programs

**Decision: MySQL remains the database engine.** The backend will use Node.js with a MySQL driver such as `mysql2`. Assignment 10 calls for PL/SQL, which is Oracle-specific; implement the closest equivalents using MySQL stored procedures, stored functions, cursors, and triggers, and clearly disclose this dialect difference. If the instructor requires literal MySQL stored programs, this is a grading risk that must be confirmed; do not mislabel MySQL routines as PL/SQL.

Implementation effect:
1. Use MySQL-compatible DDL and stored-program syntax throughout.
2. Use `AUTO_INCREMENT`, `DELIMITER` in supported SQL clients, `NEW`/`OLD` in triggers, `SIGNAL SQLSTATE '45000'` for deliberate validation errors, and `LIMIT` for pagination.
3. Use the `mysql2` Node.js connection pool.
4. Keep API/frontend responsibilities independent of database-specific syntax where practical.
5. Document the statement-trigger mismatch: MySQL supports row-level triggers, not Oracle-style statement-level triggers. Use row-level normalization triggers as the closest functional equivalent and ask whether the instructor accepts it.

## 3. Added academic lab console without expanding the public product

**Change proposed: add a separate Lab Console route.**

Why:
- Assignment 11 requires forms and controls for CRUD, aggregate functions, filtering, joins, subqueries, correlated subqueries, XML output, timing/index analysis, views, and a dashboard.
- The original public catalogue specification excludes administrative editing and login.

Implementation:
- Public routes remain Home, Category, Search, Component detail, and Not found.
- Lab-only tools live under a separate `/lab` section.
- Lab routes are development/demo functionality and can be disabled or protected in production.
- Never expose an arbitrary SQL execution box. Use pre-approved query templates and allowlisted table/column/operator/function options.

## 4. Confirmed decision: one generic diagram model

**Decision: store every diagram in a dedicated `component_diagrams` table, without a diagram-type column.**

The table stores `diagram_id`, `component_id`, `title`, `image_path`, `alt_text`, `caption`, `display_order`, and timestamps. Titles such as “Circuit Diagram”, “Timing Diagram”, and “State Diagram” are human-facing labels, not database classifications.

Benefits:
- One storage model and one frontend renderer for all diagram assets.
- Adding a new diagram does not require a new type or enum value.
- Multiple diagrams per component are straightforward.
- Captions, accessibility text, and display order remain available.

Implementation consequence: remove `diagram_kind` from `component_content`; diagram assets belong in `component_diagrams`. Keep tables, equations, prose, specifications, and documents distinct because they have different structures and rendering requirements.

## 5. Separate equations from tables

**Change proposed: one content record per distinct educational artifact.**

Examples for a JK flip-flop:
- `truth_table` → `TABLE`
- `characteristic_table` → `TABLE`
- `characteristic_equation` → `EQUATION` with LaTeX source
- `excitation_table` → `TABLE`
- `component_diagrams` row titled “Timing Diagram” referencing an SVG
- `component_diagrams` row titled “State Diagram”

Rationale:
- Easier to validate and render each artifact.
- Equations can use KaTeX/MathJax and fallback text.
- Tables remain accessible, sortable if desired, and independently editable.
- Required/optional content is controlled through category templates.

## 6. Add explicit specification value semantics

**Change proposed: model value kind and provenance.**

Specification values can be numeric, textual, or ranges. Avoid forcing values such as `SPDT` into a numeric column. Store units explicitly and add a source note or illustrative flag where values are examples rather than manufacturer-confirmed values.

Add correct names for input/output quantities when needed (`Number of Inputs`, `Number of Data Inputs`, `Number of Select Lines`, `Number of Outputs`). Do not misuse `Number of Bits`.

## 7. Improve API safety and consistency

**Change proposed: stable REST API with centralized service/repository layers.**

- Routes validate input and delegate.
- Services implement domain behavior.
- Repository functions handle database access.
- XML serialization is a dedicated layer.
- Use bind variables and whitelists.
- Avoid a general-purpose endpoint that executes arbitrary SQL from the browser.
- Keep errors in a consistent structure and do not expose SQL stacks or credentials.

This is an implementation improvement and does not alter the public product scope.

## 8. Assignment trigger nuance

**Change proposed: explicitly test the Oracle statement-trigger requirement instead of writing a row-trigger example and calling it a statement trigger.**

In Oracle, a statement-level trigger cannot use `:NEW`/`:OLD` row values. The uppercase requirement therefore needs a valid implementation pattern (for example, a carefully designed compound trigger or a statement-level operation with recursion prevention). Keep a test script and explain the semantics. This is a technical clarification, not a relaxation of the assignment requirement.

## 9. Views and transaction behavior

**Change proposed: define the view's updateability before attempting writes through it.**

A join view may not support direct inserts or updates. For the assignment demo:
- Create a meaningful two-table view.
- Execute a saved procedure that reads or inserts the underlying records.
- If a write through the view itself is explicitly required, use an appropriate `INSTEAD OF` trigger where supported and document what is being tested.
- Do not claim that a normal joined view is automatically insertable.

## 10. Index benchmarking methodology

**Change proposed: make timing evidence reproducible.**

For each Assignment 11 query:
1. Record the exact SQL and dataset size.
2. Run multiple trials before indexing.
3. Record timings and row counts.
4. Create at least two indexes chosen for actual filter/join paths.
5. Repeat under comparable conditions.
6. Include execution-plan observations.
7. Explain any regression or lack of improvement.

Do not invent timings or promise that indexes always speed up queries. They may add write overhead and may not help full-table scans.

## 11. Data seeding and educational accuracy

**Change proposed: seed 40–50 catalogue components only after the schema/content contract is stable.**

- Use categories and tags consistently; if tags are implemented, normalize them using `tags` and `component_tags` rather than comma-separated strings.
- Seed all component-specific content as separate content records.
- Ensure every diagram path points to a real SVG before marking it published.
- Store equations as LaTeX source.
- Label illustrative specifications clearly and do not imply they are verified datasheet ratings.
- Do not infer absent specifications.

The tag tables are an optional schema extension based on the prior seed-data request; they are not part of the seven-table core schema in the frontend requirements. Add them only if tag-based browsing/search is actually included.

## 12. Category pages and Figma

**Change proposed: implement reusable page templates, not a bespoke hardcoded page per category.**

Figma can have a page/frame for each category family or category leaf to communicate visual differences, but the production implementation should reuse:
- Category page template.
- Component detail template.
- Shared content renderers.
- Shared tables/equations/SVG panels.
- Shared loading/empty/error states.

Use category ID and backend-provided content to choose what to render. If a category contains both child categories and components, display both.

## 13. Proposed implementation order

1. Confirm Oracle versus MySQL with the course/instructor.
2. Freeze logical schema and API response contracts.
3. Write Oracle DDL, constraints, indexes, and seed scripts.
4. Implement required PL/SQL procedures/functions/triggers and test scripts.
5. Implement the Node.js database pool and health check.
6. Implement catalogue read APIs.
7. Build the reusable frontend shell and catalogue pages.
8. Add content renderers for tables, LaTeX, SVG, graphs, and documents.
9. Add the isolated Assignment 11 Lab Console and XML routes.
10. Benchmark the required queries and document results.
11. Add 40–50 component seed records and validate each content artifact.
12. Apply Figma styling and responsive/accessibility review.
13. Run acceptance tests and update this change log.

## 14. Decisions still requiring confirmation

- [ ] MySQL is approved as the implementation engine for the PL/SQL assignment.
- [ ] The exact Oracle version and local setup method are known.
- [ ] Whether the lab console is development-only or must be demonstrable in the final deployment.
- [ ] Whether tags are required in the final catalogue schema or only in seed-data classification.
- [ ] Whether diagrams are stored only as static SVG files or whether vetted inline SVG is permitted.
- [ ] Exact route naming and JSON response envelopes are agreed before parallel frontend/backend implementation.
- [ ] Assignment timing measurements are captured from the real database rather than estimated.

## 15. Frontend refit to the `electrodb-frontend` design reference

**Change implemented: the main public frontend now uses the layout, styling, and colours of the static `electrodb-frontend/` prototype.**

What was carried over:

- Dark palette (`#05070E` page, `#0D1117` surfaces, `#00a7da` accent, `#00dfc1` secondary) and the existing table tokens (`#1b5797a1` header, `#21262dbb` even rows, `#0c2744` row hover).
- Sticky translucent navbar with logo, wordmark, uppercase spaced navigation links, and the moving cursor spotlight.
- Space Grotesk / Poppins / Lexend / Inter typography, the oversized uppercase hero heading, pill tags with the teal border, and the underlined uppercase section headings.
- Breadcrumb separators, centred data tables, and the light artwork panel used for component symbols.

What was added so the styling covers the whole application:

- Hash routes for a full component catalog and for tags (`#/catalog`, `#/tags`, `#/tags/<slug>`), backed by new read endpoints `GET /api/components`, `GET /api/tags`, and `GET /api/tags/:tagId`.
- Tags on component detail responses, rendered as tag pills that link into the tag browser.
- Home hero search, header search, footer, 404 page, loading/empty/error states, pagination, modal image viewer, toast notifications, and a responsive mobile navigation drawer.
- CSP-safe event handling: all previously inline `onclick`/`onsubmit`/`onchange`/`onerror` handlers were replaced with delegated `data-action`, `data-form`, and `data-change` listeners. This matters because Helmet sends `script-src-attr 'none'`, which silently blocked every lab-console button before the refit.
- Helmet CSP now permits Google Fonts stylesheets and font files while keeping inline script execution disabled.

Catalogue data is still loaded exclusively from the API; the refit adds no hard-coded component records to the frontend.

## 16. Frontend-only preview server

**Change implemented: `npm run preview` (`scripts/preview-server.js`).**

The submitted environment for review does not always have MySQL/MariaDB available. Running
`npm start` in that state serves the shell but returns `500` for every catalogue call, which
makes the interface impossible to review or demo.

The preview script serves the same `public/` assets and answers the REST contract from data
parsed out of `electrodb.sql` at boot (147 components, 23 categories, 13 tags, derived tags,
diagrams and specifications). It deliberately does **not** replace the application backend:
there is no connection pool, no stored-procedure execution, and no write support, and it is
not wired into `server/src/` or the automated tests. Assignment 10/11 database behaviour is
still demonstrated through `npm start` against a seeded database.

## 17. Interface refinement pass

**Change implemented: the detail, category, and home screens now follow the design
reference much more closely, and motion across the app was reworked for consistency.**

- Site footer removed, along with the home-page JK flip-flop logic symbol and the
  "Circuit Diagram Reference" spotlight; the hero is now a single text column.
- Component detail hero rebuilt: an oversized uppercase title (up to `5rem`), the description
  directly beneath it, one combined tag/badge row, and the circuit symbol floating on the
  page background instead of inside a white panel.
- All catalogue artwork is now inverted (`filter: invert(1) hue-rotate(180deg)`) so the
  line diagrams read as light-on-dark directly on the page; the light `.symbol-card`,
  `.diagram-spotlight-art`, and white `.diagram-frame` fills were removed.
- "Back to <category>" is an inline text link with a sliding arrow and underline, not a button.
- Category pages list subcategories as a distinct row-style `.category-tile` (marker, name,
  count, sliding arrow), clearly different from `.component-card`.
- Component cards everywhere (catalog, search, tag, category, and home listings) now show only
  the name, symbol, and summary — the category tag and the "Illustrative" badge were removed
  from the card face and appear only on the component's own page.
- Motion system: shared `--ease-out` / `--ease-in-out` curves and `--dur-1..3` durations in
  `:root`; every `transition: all` and ad-hoc timing replaced, gradients swapped for an
  animatable `filter: brightness()` on primary buttons, the navbar underline now animates
  `transform: scaleX()` instead of `width`, the cursor spotlight lerps on a composited
  `translate3d` instead of writing `left`/`top` per mousemove, and page transitions are a
  150–240 ms fade/rise rather than a long slide.
- Header search, mobile navigation, modal, toasts, and lab tabs all honour
  `prefers-reduced-motion`, and all icon imagery keeps an accessible fallback when a
  symbol fails to load.

## 18. Diagram model, detail-page layout, and catalogue visual refresh

**Change implemented: the detail page now follows the design reference exactly, the drawings
are separated into symbols and real circuits, and every asset was redrawn in the reference
palette.**

Detail page
- Hero order is now title → description → tags → actions → symbol, matching the reference.
  The long description moved up out of a separate "Overview" section.
- Removed from the detail page: the "Illustrative model" badge, the "Published" badge, the
  category pill (the breadcrumb already states it), and the `#educational-example` tag.
- The **circuit diagram now sits immediately below the hero**, before the tables. It opens
  full screen with the existing modal.

Diagrams vs. symbols
- Most artwork previously titled "Circuit / Symbol Diagram" was a pin-level block drawing.
  `component_diagrams` gained `diagram_kind` (`SYMBOL` / `CIRCUIT` / `STATE` / `TIMING` /
  `OTHER`); the pin-level drawing is now titled **Symbol Diagram** and appears in the hero,
  while a separate **Circuit Diagram** row holds the gate/device-level schematic.
- `GET /api/components/:slug` returns `kind` on every diagram so the client can place them.

Artwork
- The two reference drawings from `electrodb-frontend/img/` are shipped verbatim:
  `jk-flip-flop.svg` → `public/assets/svg/flipflops/jk.svg`,
  `jk-flip-flop_circuit.svg` → `public/assets/svg/circuits/jk-flip-flop-circuit.svg`.
- `scripts/restyle-svgs.js` recolours the remaining 191 symbol/state/timing drawings to the
  reference palette (`#0d1117` bodies, `#21262d` borders, `#00a7da` inputs, `#00dfc1` outputs,
  `#8a8d93` dashed controls, Consolas labels) and widens any viewBox that clipped a label.
  Because the artwork is now natively dark, the CSS `invert(1) hue-rotate(180deg)` hack was
  removed.
- `scripts/build-circuit-diagrams.js` generates a gate/device-level schematic for all 147
  components from a small schematic DSL (gates, MOSFETs, diodes, resistors, block stages),
  using the same colours and typography — so "circuit diagram" now means a circuit.

Layout and tables
- Category pages show subcategories as numbered `.subcategory-card` buttons: still card-like
  as before, but compact, teal-tinted, with an ordinal, a count chip and a sliding arrow, and
  clearly distinct from component cards and parent category cards.
- Every component card (home, catalog, search, tag, category) shows only name, symbol and
  summary — no category or "Illustrative" badges anywhere.
- Tables were rebuilt: sticky-feeling gradient headers with uppercase tracked column labels,
  hairline column separators, zebra rows, an accent edge on hover, tabular numerals, and a
  monospace value column. Specification tables stay left-aligned and read like a definition list.

Database / backend / tests
- `database/01_schema.sql` and `electrodb.sql`: `component_diagrams.diagram_kind` enum plus an
  index; seed inserts for SYMBOL / CIRCUIT / STATE / TIMING rows.
- `repository.getComponentDiagrams` selects `diagram_kind`; the service maps it to `kind`.
- The `educational-example` tag was removed from the tag seed, from the derived tag assignment,
  and from the preview server.
- `server/tests/api.test.js` asserts the symbol/circuit pair and the reference circuit path;
  `server/tests/offline.test.js` (new, `npm run test:offline`) covers the diagram mapping and
  the SVG restyle pipeline without a database.
