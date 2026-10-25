# ElectroDB — Electronic Components Reference Catalogue

ElectroDB is a full-stack educational reference catalogue for electronic components and sequential logic devices.

Visitors browse a hierarchical category tree, search components, open detail pages, and view structured educational content: descriptions, truth/characteristic/excitation tables, LaTeX characteristic equations, SVG circuit symbols, timing waveforms, state machine diagrams, and normalized technical specifications.

Browsing never requires an account. A lightweight account layer adds **bookmarks**, **collections**, a **dashboard** and **recently viewed** components, with three roles — `User`, `Developer` and `DBA` — enforced by the API on every request. Passwords are hashed with `scrypt`, sessions live in an HttpOnly cookie backed by a server-side row, and the first administrator is created from the command line (`npm run bootstrap:dba`), never through the web interface. See `docs/accounts.md`.

The application also features a dedicated **Lab Console** that exercises the database layer directly: stored procedures, cursors, triggers and roles, index timing benchmarks presented as tables, and a statistics dashboard.

---

## 1. Technology Stack

- **Database Engine:** MySQL 8.0+ / MariaDB 10.4+ (bundled with XAMPP)
- **Database Driver:** `mysql2/promise` with connection pooling
- **Backend Framework:** Node.js LTS + Express
- **Security & Headers:** `helmet`, `cors`, parameterized SQL, allowlisted query templates
- **Frontend:** Semantic HTML5, CSS3 responsive design tokens, vanilla JavaScript (hash-based Single Page Architecture) themed after the `electrodb-frontend/` design reference (dark cyan/teal palette, Space Grotesk/Poppins/Lexend/Inter typography, spotlight hover effects)
- **LaTeX Math Rendering:** KaTeX
- **Vector Graphics:** Custom SVG assets generated from the catalogue (circuit symbols, gate/device circuit implementations, IC pinouts, flip-flop state machines, counter rings, timing waveforms)
- **Automated Testing:** Node.js native test runner (`node:test`)

---

## 2. Repository Layout

```text
electrodb/
├── README.md
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── electrodb.sql                             # Complete merged setup and seed script (147 components)
├── docs/
│   ├── design-guideline.md                  # Comprehensive system specification
│   ├── change-log.md                        # Design decisions and architecture log
│   └── setup-and-prompting-guide.md         # Environment setup and run guide
├── database/
│   ├── 00_create_users_and_roles.sql        # Database accounts (naive, developer, dba)
│   ├── 01_schema.sql                        # Table definitions (12 normalized tables)
│   ├── 02_constraints_indexes.sql           # Foreign keys, checks, and benchmark indexes
│   ├── 03_views.sql                         # Database views (v_component_catalogue, counts)
│   ├── 04_plsql_procedures.sql              # MySQL stored procedures (CRUD, cursors, sums)
│   ├── 05_plsql_functions.sql               # Stored functions (fn_sum_component_ids)
│   ├── 06_triggers.sql                      # Integrity, normalization, audit, restricted-hours triggers
│   ├── 07_seed_data.sql                     # Seed data for 147 components and visual assets
│   ├── 08_assignment10_demo.sql             # Executable verification script for the stored programs
│   ├── 09_assignment11_queries.sql          # Executable verification script for the SQL demonstrations
│   └── 10_query_timing_results.md           # Real measured before/after index timing report
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── app.js                           # Express application setup
│   │   ├── server.js                        # Server entry point & graceful shutdown
│   │   ├── config/index.js                  # Environment configuration
│   │   ├── db/
│   │   │   ├── pool.js                      # MySQL connection pool
│   │   │   └── repository.js                # Data access layer
│   │   ├── routes/
│   │   │   ├── catalogueRoutes.js           # Public catalogue endpoints
│   │   │   ├── authRoutes.js                # register / login / logout / me
│   │   │   ├── userRoutes.js                # profile, bookmarks, collections, dashboard
│   │   │   ├── adminRoutes.js               # DBA account administration
│   │   │   ├── contentRoutes.js             # category/tag management (Developer/DBA)
│   │   │   └── labRoutes.js                 # lab console endpoints (Developer/DBA)
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/                      # Allowlisted tables, operators, functions
│   │   ├── security/                        # Password hashing, session tokens, role mapping
│   │   ├── db/personalStore.js              # Selects the MySQL or in-memory account store
│   │   ├── serializers/xml.js               # Dedicated XML serializer (Query 1, 3, 4)
│   │   └── middleware/errorHandler.js       # Centralized error handler
│   └── tests/
│       ├── api.test.js                      # Database integration tests (needs MySQL)
│       ├── offline.test.js                  # DB-free contract and security tests
│       └── personal.test.js                 # Accounts, roles and personalization (in-memory store)
├── electrodb-frontend/                      # Static design reference used for the refit
│   ├── index.html                           # Reference layout: navbar, hero, breadcrumbs, tables
│   ├── styles.css                           # Reference palette, typography, and spacing tokens
│   └── img/                                 # Reference SVG artwork
├── public/
│   ├── index.html                           # Single Page Application shell
│   ├── favicon.svg                          # Site icon carried over from the design reference
│   ├── assets/
│   │   ├── css/styles.css                   # Refitted design system (dark cyan/teal theme)
│   │   ├── js/
│   │   │   ├── api.js                       # API client (catalogue, accounts, lab)
│   │   │   ├── account.js                   # Session, auth pages, bookmarks, collections, dashboard
│   │   │   └── app.js                       # SPA router, renderers, KaTeX, lab console
│   │   └── svg/                             # generated SVG vector assets
└── scripts/
    ├── check-db-connection.js               # Database ping & diagnostic verification
    ├── preview-server.js                    # Frontend-only preview server (seed-derived data)
    ├── generate-svg-assets.js               # Vector graphics generator
    ├── run-benchmarks.js                    # Query timing & index benchmark suite
    └── verify-install.js                    # End-to-end system verification audit
```

---

## 3. Quick Start & Installation

### Step 1: Start MySQL / MariaDB Server
Start your local MySQL Server or launch the MySQL module in the XAMPP Control Panel (default port 3306).

### Step 2: Import the Database
Import `electrodb.sql` via phpMyAdmin or command line:
```bash
mysql -u root -p < electrodb.sql
```
*(Your database will be created, seeded with 147 components, 17 tables, 2 views, stored procedures, functions, and triggers).*

### Step 3: Configure Environment Variables
Create `.env` in the repository root (or copy `.env.example`):
```dotenv
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=electrodb
DB_USER=electrodb_app
DB_PASSWORD=electrodb_app_pwd

PUBLIC_BASE_URL=http://localhost:3000
ENABLE_LAB_CONSOLE=true
```

### Step 4: Install Dependencies & Run Verification
```bash
# Install dependencies
npm install

# Verify database connection and schema
npm run check-db

# Run automated tests (30 database tests + 4 DB-free contract tests)
npm test
npm run test:offline

# Run complete system verification audit
npm run verify
```

### Step 5: Start the Web Application
```bash
# Start backend server and frontend static host
npm start
```

Open your browser and navigate to:
```text
http://localhost:3000/
```

### Frontend Routes

| Route | View |
|---|---|
| `#/` | Home — hero, category families, featured components, tag cloud |
| `#/catalog` | Paginated catalogue of all published components (optional `?category=<id>`) |
| `#/categories` | Full category hierarchy |
| `#/categories/<id-or-slug>` | Category page with breadcrumbs, subcategories, and components |
| `#/tags` | All reusable tags with component counts |
| `#/tags/<id-or-slug>` | Components carrying a tag |
| `#/components/<id-or-slug>` | Component detail: hero (title + description + symbol), circuit diagram, tables, equations, supporting diagrams, specifications |
| `#/search?q=...` | Search results |
| `#/login`, `#/register` | Sign in / create an account (supports `?next=` to return to the page you wanted) |
| `#/profile` | Your details, password change, sign out |
| `#/bookmarks` | Components you saved |
| `#/collections`, `#/collections/<id>` | Your named lists and their contents |
| `#/dashboard` | Counts, recently viewed, collections — all from the database |
| `#/admin` | Account administration (DBA only) |
| `#/lab` | Lab console (Developer & DBA only) |

The catalogue shell, navigation layout, breadcrumbs, hero treatment, data tables, colour tokens, and typography are taken from the `electrodb-frontend/` reference; loading, empty, error, 404, modal, toast, pagination, catalog, and tag views were added so the reference styling covers the complete application.

### Diagram artwork

`electrodb-frontend/img/` contributes the two reference drawings, both shipped byte-for-byte:

| Reference file | Served as | Shown |
|---|---|---|
| `jk-flip-flop.svg` | `public/assets/svg/flipflops/jk.svg` | JK Flip-Flop hero symbol |
| `jk-flip-flop_circuit.svg` | `public/assets/svg/circuits/jk-flip-flop-circuit.svg` | JK Flip-Flop circuit diagram, directly below the hero |

Every other drawing is generated from those two references:

```bash
npm run svg:restyle    # recolour existing symbol/state/timing artwork to the reference palette
npm run svg:circuits   # generate the gate/device-level circuit diagram for all 147 components
```

`component_diagrams` carries a `diagram_kind` (`SYMBOL`, `CIRCUIT`, `STATE`, `TIMING`, `OTHER`)
so the frontend can place each drawing: the pin-level **symbol** in the hero and the
gate/device-level **circuit diagram** immediately beneath it. Anything previously labelled
"Circuit / Symbol Diagram" was a pin-level block drawing, which is what the rename corrects.

### Previewing the UI without MySQL

`npm run preview` starts `scripts/preview-server.js`, which serves the real `public/` frontend
and answers the same REST routes with data parsed from `electrodb.sql`. Use it to review or
demo the interface on a machine without a database server:

```bash
npm run preview            # http://localhost:3000
PORT=4000 npm run preview  # custom port
```

It is a frontend-only stub: it has no connection pool, no stored programs, and no write
support, so the database behaviour must still be demonstrated with `npm start` against a
seeded MySQL/MariaDB database.

---

## 4. Database Demonstration Features

### Stored Programs Checklist
- [x] **Separate CRUD Stored Procedures:** `sp_insert_component`, `sp_update_component`, `sp_delete_component`.
- [x] **Database Accounts & Roles:** NAIVE_USER (read-only), APP_DEVELOPER (CRUD/procedures), DBA.
- [x] **Login-Data CRUD:** `sp_insert_app_user`, `sp_update_app_user`, `sp_delete_app_user` with hashed password enforcement.
- [x] **Explicit Cursor (Unbounded):** `sp_cursor_components_all` iterating through all components.
- [x] **Explicit Cursor (Bounded with Limit):** `sp_cursor_components_limited(limit)`.
- [x] **Paginated Search:** Without filter (`sp_search_components_page`) and with category filter (`sp_search_components_by_category`).
- [x] **Numeric Sum Functions:** Ungrouped function (`fn_sum_component_ids`) and Grouped by category (`sp_sum_component_ids_by_category`).
- [x] **BEFORE Integrity Trigger:** `trg_components_validate_bi/bu` enforcing name non-blank and short description length limits.
- [x] **Uppercase Statement Trigger:** `trg_components_uppercase_bi/bu` implementing the MySQL row equivalent.
- [x] **AFTER DML Audit Trigger:** `trg_components_audit_ai/au/ad` automatically logging inserts, updates, and deletes to `application_audit_log`.
- [x] **Restricted-Hours Trigger:** `trg_components_restricted_bi/bu/bd` blocking modifications on Mondays between 14:00 and 16:00 with `SIGNAL SQLSTATE '45000'`.

### SQL Demonstration Checklist
- [x] **Query 1 (Full-Table Display):** Paginated table display + **XML output at `/api/lab/components.xml`**.
- [x] **Query 2 (Integrity-Preserving Inserts):** Multi-table insert into `components`, `component_specifications`, and `component_diagrams` respecting foreign key constraints.
- [x] **Query 3 (Aggregate Functions):** Selectable dropdown (COUNT, SUM, AVG, MIN, MAX) on numeric fields + **XML output at `/api/lab/aggregate.xml`**.
- [x] **Query 4 (Conditional Filtering):** Selectable fields, operators (`=`, `!=`, `>`, `<`, `LIKE`), and values + **XML output at `/api/lab/filter.xml`**.
- [x] **Query 5 (Two-Table Join):** Configurable Left Table, Right Table, and Join Type (`INNER`, `LEFT`, `RIGHT`) with relational data preview.
- [x] **Query 6 (Subquery):** Subquery across multiple related tables.
- [x] **Query 7 (Correlated Subquery):** Correlated `EXISTS` subquery across tables.
- [x] **Query 8 (Update Query):** Row update with live refreshed result.
- [x] **Views:** `v_component_catalogue` (3-table join) and `v_category_component_counts` (aggregated view).
- [x] **Index Benchmarking & Performance Report:** Real measured before/after execution times across 5 trials recorded in `database/10_query_timing_results.md`.
- [x] **Live Table Dashboard:** Real-time row counts for all 10 core tables and metric cards.

---

## 4b. Accounts and roles

```bash
npm run bootstrap:dba
```

A database created from `electrodb.sql` already has everything the account features need. For a
database built from the older `database/01_schema.sql`, apply the two additive migrations first:

```bash
mysql -u <dba-user> -p electrodb < database/11_auth_and_personalization.sql
mysql -u <dba-user> -p electrodb < database/12_app_user_audit.sql
```

Registration is public and can only create a `User`. `Developer` and `DBA` are granted by an
existing DBA at `#/admin`, or by the bootstrap script. The preview server ships three demo accounts
(`dba@preview.local`, `developer@preview.local`, `user@preview.local`, password `Electrodb#2025`)
backed by an in-memory store, so the pages can be reviewed without MySQL. Full details, the API
reference and the honest testing report are in [`docs/accounts.md`](docs/accounts.md).

## 5. Verification Scripts & Commands

| Command | Purpose |
|---|---|
| `npm start` | Launches the Express API + frontend at `http://localhost:3000` (requires MySQL) |
| `npm run preview` | Frontend-only preview at `http://localhost:3000` using data derived from `electrodb.sql`; useful when MySQL is unavailable |
| `npm test` | Runs the database integration tests (needs a seeded MySQL) |
| `npm run test:offline` | Runs the 42 DB-free contract and security tests |
| `npm run test:personal` | Runs the 55 account, role and personalization tests (in-memory store, no DB) |
| `npm run bootstrap:dba` | Creates or repairs the first DBA account from `BOOTSTRAP_DBA_*` |
| `npm run svg:restyle` | Recolours catalogue artwork to the reference palette |
| `npm run svg:circuits` | Regenerates circuit diagrams for every component |
| `npm run check-db` | Tests MariaDB/MySQL connection and prints table row counts |
| `npm run benchmark` | Executes high-resolution query benchmarking before and after secondary indexes |
| `npm run verify` | Performs a 6-point system verification audit |

---

## 6. License & Credits

All component specifications and equations are curated for educational reference.
