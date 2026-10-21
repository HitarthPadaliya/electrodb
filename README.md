# ElectroDB — Electronic Components Reference Catalogue & DBMS Lab

ElectroDB is a full-stack educational reference catalogue for electronic components and sequential logic devices, developed for the **SVNIT CS203 - Database Management Systems (DBMS)** practical assignments.

Visitors browse a hierarchical category tree, search components, open detail pages, and view structured educational content: descriptions, truth/characteristic/excitation tables, LaTeX characteristic equations, SVG circuit symbols, timing waveforms, state machine diagrams, and normalized technical specifications.

The application also features a dedicated **Academic Lab Console** that fulfills all demonstration requirements for **Practical Assignment 10** (Stored Procedures, Cursors, Triggers, Roles) and **Practical Assignment 11** (Full-Table Display, XML Serialization, Joins, Subqueries, Aggregate & Filter Controls, Index Timing Benchmarks, and Dashboard).

---

## 1. Technology Stack

- **Database Engine:** MySQL 8.0+ / MariaDB 10.4+ (bundled with XAMPP)
- **Database Driver:** `mysql2/promise` with connection pooling
- **Backend Framework:** Node.js LTS + Express
- **Security & Headers:** `helmet`, `cors`, parameterized SQL, allowlisted query templates
- **Frontend:** Semantic HTML5, CSS3 responsive design tokens, vanilla JavaScript (Single Page Architecture)
- **LaTeX Math Rendering:** KaTeX
- **Vector Graphics:** Custom SVG assets (192 vector diagrams: logic gates, flip-flop state machines, decade/mod-8 counter rings, timing waveforms, circuit symbols)
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
│   ├── 08_assignment10_demo.sql             # Executable verification script for Assignment 10
│   ├── 09_assignment11_queries.sql          # Executable verification script for Assignment 11
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
│   │   │   └── labRoutes.js                 # Assignment 10 & 11 lab endpoints
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/                      # Allowlisted tables, operators, functions
│   │   ├── serializers/xml.js               # Dedicated XML serializer (Query 1, 3, 4)
│   │   └── middleware/errorHandler.js       # Centralized error handler
│   └── tests/
│       └── api.test.js                      # 22 automated unit and integration tests
├── public/
│   ├── index.html                           # Single Page Application container
│   ├── assets/
│   │   ├── css/styles.css                   # Responsive design system
│   │   ├── js/
│   │   │   ├── api.js                       # API client
│   │   │   └── app.js                       # Router, renderers, KaTeX loader, Lab Console
│   │   └── svg/                             # 192 SVG vector assets
└── scripts/
    ├── check-db-connection.js               # Database ping & diagnostic verification
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
*(The database `electrodb` will be created, seeded with 147 components, 12 tables, 2 views, stored procedures, functions, and triggers).*

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

# Run automated tests (22/22 passing)
npm test

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

---

## 4. Academic Demonstration Features

### Practical Assignment 10 Checklist
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

### Practical Assignment 11 Checklist
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

## 5. Verification Scripts & Commands

| Command | Purpose |
|---|---|
| `npm start` | Launches the server at `http://localhost:3000` |
| `npm test` | Runs the 22 automated integration tests via Node test runner |
| `npm run check-db` | Tests MariaDB/MySQL connection and prints table row counts |
| `npm run benchmark` | Executes high-resolution query benchmarking before and after secondary indexes |
| `npm run verify` | Performs a 6-point system verification audit |

---

## 6. License & Credits

Developed for academic coursework in SVNIT CS203 - Database Management Systems.
All component specifications and equations are curated for educational reference.
