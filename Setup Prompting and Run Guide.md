# ElectroDB — Prompting, Installation, Setup, and Run Guide

This guide explains how to work on ElectroDB with an AI coding assistant, install the project prerequisites, configure the database and backend, run the frontend, and verify the assignment features.

> **Database decision:** ElectroDB uses MySQL 8.0-compatible stored procedures, functions, cursors, and row-level triggers. These are MySQL stored programs, not Oracle PL/SQL. MySQL does not support statement-level triggers; the name-normalization row triggers are the closest functional equivalent. Confirm with the instructor if the rubric literally requires Oracle PL/SQL or a statement-level trigger. Do not mix Oracle syntax with the MySQL scripts.

---

## 1. Recommended technology stack

- **Database:** MySQL 8.0/8.4 (or the course-approved compatible version).
- **Stored programs:** MySQL procedures, functions, cursors, and triggers.
- **Backend:** Node.js LTS + Express.
- **MySQL driver:** `mysql2` for Node.js.
- **Frontend:** HTML, CSS, vanilla JavaScript; a framework is optional, not required.
- **Diagrams:** SVG files.
- **Equations:** LaTeX source rendered in the browser with KaTeX or MathJax.
- **Version control:** Git.
- **API testing:** browser/devtools and an API client such as Postman or Bruno.
- **Database testing:** SQL Developer or the SQL tool approved by your course.

Do not add a frontend framework, ORM, authentication framework, or build system unless it provides a concrete benefit. A small project is easier to explain and demonstrate when the stack stays simple.

## 2. Prerequisites

Install and verify:
1. Git.
2. A supported Node.js LTS release and npm.
3. MySQL Server or the MySQL environment supplied by the institution.
4. MySQL Workbench or the MySQL command-line client.
5. No MySQL Instant Client is required for `mysql2`.
6. A code editor.
7. A modern browser.

Verify Node/npm and MySQL client:

```bash
node --version
npm --version
git --version
```

Install MySQL Server for your operating system or use the college-provided server. Confirm host, port, database name, username, and privileges with the administrator. Common local MySQL installations use port 3306, but verify your own configuration.

## 3. Open the project

Clone the repository if needed, then run commands from the repository root. This project already includes its Express backend, static frontend, SQL, and package manifest. Do not run `npm init` or create a second package in `server/`.

```bash
npm install
```

Commit source files and SQL scripts, but never commit `.env`, passwords, private keys, or real user data.

## 4. Project structure and scripts

- `server/src/` — Express app, MySQL pool, API routes, catalogue services, and XML serializer.
- `public/` — responsive HTML/CSS/JavaScript frontend and SVG assets.
- `database/` — assignment demos, least-privilege roles, and the timing-report template.
- `electrodb.sql` — consolidated schema, seed data, stored programs, views, and triggers.

Available root scripts are `npm start`, `npm run dev`, `npm test`, `npm run check`, and `node scripts/check-assets.js`.

## 5. Configure environment variables

Copy `.env.example` to `.env` in the repository root and set your local MySQL values:

```dotenv
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=electrodb
DB_USER=electrodb_app
DB_PASSWORD=replace_me_locally
DB_CONNECTION_LIMIT=10
ENABLE_LAB_CONSOLE=true
```

These are placeholders. Replace the connection string and credentials with values provided by your MySQL setup. Do not paste real secrets into a public chat or commit `.env`.

Create `.env.example` with fake placeholders and commit that file. Add `.env` to `.gitignore`.

## 6. Set up MySQL database objects

**Important:** `electrodb.sql` is the consolidated fresh-install script and drops/recreates the database named `electrodb`. Back up data and verify the active MySQL connection/schema before importing. Run it only against a disposable local/development database—not a shared course or production database.

After the schema exists, an administrator may run `database/00_create_users_and_roles.sql` to create least-privilege MySQL roles. That file intentionally contains no account passwords. Create local accounts and assign roles manually using the institution's credential policy. The Node.js runtime should use the narrowest necessary account, not the DBA role.

Then run the non-destructive demonstrations as needed:

1. `database/03_views.sql` — inspect the joined views.
2. `database/08_assignment10_demo.sql` — exercise stored procedures and cursors.
3. `database/09_assignment11_queries.sql` — eight SQL demonstrations; data-changing examples are commented out by default.
4. `database/10_query_timing_results.md` — record real measurements after benchmarking.

`electrodb.sql` includes schema, constraints, indexes, views, stored programs, triggers, and 45 component seed records in a single import. Check every import error before continuing. This MySQL script does not create Oracle objects; do not use Oracle `USER_ERRORS` diagnostics.

## 7. Verify the MySQL connection pool

The implemented pool in `server/src/db/pool.js` reads environment variables, initializes once when configured, uses parameterized queries, and is closed during graceful shutdown. It does not log credentials. Verify the database connection by visiting:

```text
http://localhost:3000/api/health
```

The route reports success only after `SELECT 1` succeeds. If it fails, verify MySQL host/database, port, user privileges, network access, and the `.env` values. `mysql2` does not require Oracle Instant Client.

## 8. Start the backend

From the repository root:

```bash
npm run dev
```

or for a normal start:

```bash
npm start
```

Expected result: the console indicates that the API server is listening. It should not print credentials.

If the port is occupied, change `PORT` in the root `.env`; do not hardcode the port in multiple files.

## 9. Serve the frontend

For the simplest setup, Express can serve static files from `public/`. Configure a static directory and load the homepage from:

```text
http://localhost:3000/
```

This keeps frontend and API on one origin and avoids unnecessary CORS complexity during local development. If the frontend is hosted separately, configure the exact allowed origin in the backend; do not enable unrestricted CORS by default.

Do not open the HTML file with `file://` and expect API routing to behave exactly as it does under a web server.

## 10. Verify the implemented project

The repository already implements the catalogue API and responsive frontend, content renderers, safe lab CRUD/query templates, XML outputs for Assignment 11 queries 1/3/4, dashboard, views/procedure/trigger demo, and 45 seed components. After configuring MySQL:

1. Import `electrodb.sql` into a disposable development database.
2. Run `npm test`, `npm run check`, and `npm run check:assets`.
3. Start from the repository root with `npm run dev`.
4. Verify `/api/health`, category browsing, search, component details, and `/lab`.
5. Exercise the lab CRUD, query, login-data, view/audit, dashboard, and XML tools.
6. Capture real before/after index timings in `database/10_query_timing_results.md`.

A server start without a working database is only a frontend/API boot check; it does not verify SQL imports, stored programs, triggers, or timings.

## 11. Figma handoff workflow

For each Figma page/frame:
1. Identify the page type: home, category, search, component detail, not found, or lab console.
2. Identify shared elements: header, search, breadcrumb, category card, component card, table, equation block, SVG diagram panel, specification row, alert, pagination, empty/loading/error states.
3. Map each displayed value to an API field.
4. Mark which content is optional.
5. Identify responsive breakpoints and keyboard/focus behavior.
6. Implement the reusable component first.
7. Use actual API data or a clearly labelled mock response during layout work.
8. Replace mock data with API responses before acceptance testing.

A Figma frame for a particular leaf category is a design reference, not a reason to hardcode a special HTML page for that category. Production pages should use the same category/detail templates with backend-driven content.

## 12. How to prompt an AI coding assistant effectively

Give the assistant the system design, change log, frontend requirements, current SQL files, and the specific task. Ask for one bounded change at a time.

### Recommended project context prompt

```text
You are the senior developer for ElectroDB, an electronic-components
reference catalogue and DBMS practical-assignment project.

Follow the attached design guideline and change log as the project
contract. Before changing files, inspect the existing code and SQL.
Do not invent existing schema details; verify them in the files.

The project uses MySQL stored programs; it is not Oracle PL/SQL. MySQL only supports row-level triggers, so document the uppercase normalization trigger as the closest equivalent to the rubric's statement-trigger wording. Do not mix Oracle syntax into MySQL scripts. The frontend must fetch catalogue data from the Node.js
API, not hardcode the catalogue. Store equations as LaTeX source.
Keep characteristic tables and equations separate. All diagrams, including state-machine diagrams, are stored in `component_diagrams` and use the same SVG renderer. Diagram type is not stored; use the title/caption to identify the diagram for readers.
Do not add public login, shopping, reviews, or other out-of-scope
features.

For this task:
[one specific task]

Before finishing:
- list changed files;
- explain design decisions and assumptions;
- provide exact commands to run/test;
- report tests actually executed and their results;
- flag unresolved issues instead of guessing.
```

### Good task prompts

**Database schema**
```text
Inspect the current database scripts and design guideline. Implement
only the MySQL DDL for categories, components, content_types,
category_content_types, component_content, specifications,
component_specifications, and application_audit_log. Add primary keys,
foreign keys, checks, and useful indexes. Do not seed data yet. Ensure
the script does not drop existing objects silently. Explain how to run
it and report any MySQL-version assumptions.
```

**MySQL stored programs procedures**
```text
Inspect the actual schema first. Implement separate MySQL stored
procedures for component insert, update, and delete. Use the real
column names, validate input, define transaction/error behavior, and
provide a SQL test script for success and failure cases. Do not claim
tests passed unless they were executed.
```

**API endpoint**
```text
Implement GET /api/components/:componentId using the existing Express
structure and MySQL connection pool. Return component, category,
ordered content sections, and specifications in the documented JSON
contract. Use bind variables, release connections safely, and return
404 for an unknown ID. Do not change unrelated files.
```

**Frontend component**
```text
Implement the component detail page using the existing API client and
design tokens. Render only content sections returned by the API.
Support TEXT, TABLE, EQUATION, DIAGRAM, GRAPH, and
DOCUMENT. Equations are LaTeX strings; tables may contain JSON; all
diagrams use SVG assets from `component_diagrams`. Add loading, error, missing-resource, and
not-found states. Do not hardcode catalogue content.
```

**Debugging**
```text
Here is the exact error and relevant code:
[paste error and files]

Reproduce the cause from the code before proposing a fix. Identify the
root cause, make the smallest correct change, and explain how I can
verify it. Do not rewrite the whole project or assume a missing
dependency without checking package.json.
```

**Assignment benchmark**
```text
Using the existing MySQL schema, prepare the eight Assignment 11
queries and a repeatable benchmark plan. Include the exact SQL and
candidate indexes, but leave timing values blank until measured in the
actual database. Explain how to compare execution plans and record
results without fabricating numbers.
```

### Prompting practices to avoid

Avoid vague prompts such as “make the project work” or “write all the code” without giving the current repository state. Do not ask the assistant to assume a schema it has not inspected. In MySQL scripts, use MySQL `AUTO_INCREMENT` and `NEW`/`OLD` trigger references; do not paste Oracle `VARCHAR2`, `:NEW`, `DBMS_OUTPUT`, or Oracle trigger syntax into them. Do not ask it to report a successful run if no run occurred.

## 13. Assignment 10 verification checklist

- [ ] Separate insert/update/delete stored procedures.
- [ ] Database accounts/roles for naïve/end-user, application developer, and DBA.
- [ ] Login-data CRUD demonstrated without adding public login to the catalogue.
- [ ] Explicit cursor procedure without a limit.
- [ ] Explicit cursor procedure using a limit/bulk-fetch pattern.
- [ ] Paginated search without a filter.
- [ ] Paginated search with a filter.
- [ ] Sum without grouping.
- [ ] Sum with grouping.
- [ ] BEFORE trigger checks at least two integrity conditions.
- [ ] Uppercase normalization key is maintained by row-level triggers; instructor accepts the documented MySQL equivalent.
- [ ] AFTER trigger logs INSERT/UPDATE/DELETE to `application_audit_log`.
- [ ] Restricted-hours trigger blocks modifications on Monday from 2–4 pm with a clear message.

## 14. Assignment 11 verification checklist

- [ ] Full-table display query.
- [ ] Inserts into related tables preserving constraints.
- [ ] Aggregate query.
- [ ] Conditional query.
- [ ] Join query.
- [ ] Subquery across tables.
- [ ] Correlated subquery across tables.
- [ ] Update query.
- [ ] At least two indexes created and justified.
- [ ] Execution times recorded before and after indexing.
- [ ] Index impact analyzed, including no-change/regression where observed.
- [ ] View joining two tables.
- [ ] Saved procedure and trigger/view behavior demonstrated.
- [ ] Frontend CRUD menu and forms.
- [ ] HTML table for full-table display.
- [ ] Dropdown-driven aggregate and filter controls.
- [ ] Join UI with two table dropdowns and a join-type dropdown.
- [ ] Subquery and correlated-subquery controls.
- [ ] Update form and refreshed result.
- [ ] Dashboard with statistics for all relevant tables.
- [ ] XML output for query 1, query 3, and query 4.

## 15. Common problems

### API cannot connect to MySQL
- Verify the service name, host, port, username, and password.
- Check that the MySQL service is running and reachable.
- Verify that the `mysql2` driver is installed and test the credentials in MySQL Workbench or the MySQL command-line client.
- `mysql2` does not require Oracle Instant Client.
- Never “fix” a connection problem by switching to a DBA account.

### MySQL routine or trigger errors
- Read the complete MySQL error code and line number.
- Confirm that column names match the actual DDL and routines were imported after the schema.
- Use `NEW.column`/`OLD.column` only in a row trigger; MySQL has no statement-level triggers.
- Run the smallest reproducible SQL test in MySQL Workbench or the MySQL command-line client.

### Frontend page is blank
- Check browser console and network tab.
- Verify the API URL and response shape.
- Confirm the static server is running.
- Handle non-200 responses before attempting to render data.

### SVG or equation does not appear
- Confirm the path returns HTTP 200.
- Confirm SVG has a valid `viewBox` and accessible title/description.
- Verify the LaTeX string and math-renderer initialization.
- Display a fallback rather than crashing the component page.

### Insert fails due to constraints
- Inspect the full database error.
- Confirm referenced category/content/specification rows exist first.
- Insert parent records before child records.
- Do not disable foreign keys as a shortcut.

### Index did not improve a query
That is a valid result. Record the observed timings and explain selectivity, table size, optimizer plan, caching, and index overhead. Do not manipulate results to make an index appear beneficial.

## 16. Final run procedure

Once configured:
1. Start MySQL Server and verify the target service.
2. Apply database scripts in the documented order.
3. Run the database verification script.
4. Start the backend from `server/`.
5. Open `http://localhost:3000/`.
6. Test category browsing, search, and a component detail page.
7. Open the lab console and test CRUD/query/XML/dashboard demonstrations.
8. Run assignment SQL tests in the approved SQL client.
9. Capture real query timings before and after indexes.
10. Run automated tests and inspect browser console/network errors.
11. Confirm no secrets are staged in Git.
12. Update the README and change log with any deviation.

A successful server start alone does not mean the project is complete. Completion requires database objects to compile, API routes to return valid data, frontend renderers to handle optional content, and assignment demonstrations to be repeatable.
