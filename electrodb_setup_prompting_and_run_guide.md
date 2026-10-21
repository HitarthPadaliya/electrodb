# ElectroDB — Prompting, Installation, Setup, and Run Guide

This guide explains how to work on ElectroDB with an AI coding assistant, install the project prerequisites, configure the database and backend, run the frontend, and verify the assignment features.

> **Database decision:** ElectroDB will use MySQL. Assignment 10 explicitly says MySQL stored programs, which is MySQL-specific. This guide uses MySQL stored procedures, functions, cursors, and triggers as equivalents. Confirm with the instructor that the MySQL implementation is acceptable if the rubric literally requires MySQL MySQL stored programs. Do not mix MySQL syntax with MySQL scripts.

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

## 3. Create/open the project

If a repository already exists:

```bash
git clone <your-repository-url>
cd electrodb
```

If starting from a folder:

```bash
mkdir electrodb
cd electrodb
git init
```

Create the directories from the system design document. Commit source files and SQL scripts, but never commit `.env`, passwords, wallet files, private keys, or real user data.

## 4. Initialize the Node.js backend

From the repository root, create the server package if one does not already exist:

```bash
mkdir -p server
cd server
npm init -y
npm install express dotenv cors helmet
npm install mysql2
npm install --save-dev nodemon
```

On Windows PowerShell, `mkdir` can also create directories, but the `-p` flag may not behave like a Unix shell. Create the folder manually or use `New-Item -ItemType Directory -Force server`.

Add scripts to `server/package.json`, adjusting filenames to match the project:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "node --test"
  }
}
```

Do not replace an existing `package.json` wholesale if it already contains dependencies or scripts. Merge the required entries.

## 5. Configure environment variables

Create `server/.env` locally:

```dotenv
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=electrodb
DB_USER=electrodb_app
DB_PASSWORD=replace_me_locally

PUBLIC_BASE_URL=http://localhost:3000
ENABLE_LAB_CONSOLE=true
```

These are placeholders. Replace the connection string and credentials with values provided by your MySQL setup. Do not paste real secrets into a public chat or commit `.env`.

Create `.env.example` with fake placeholders and commit that file. Add `.env` to `.gitignore`.

## 6. Set up MySQL database objects

Create the `electrodb` database and a least-privilege application user. Use an administrative account only for initial database/user setup, not for the runtime Node.js connection.

Run the scripts in the documented order, using the schema owner/admin connection only for tasks that require it:

1. `00_create_users_and_roles.sql` — database roles/accounts, only if your environment permits and the assignment requires them.
2. `01_schema.sql` — catalogue and assignment tables.
3. `02_constraints_indexes.sql` — keys, checks, and initial indexes.
4. `03_views.sql` — views.
5. `04_plsql_procedures.sql` — CRUD and cursor procedures.
6. `05_plsql_functions.sql` — paginated search and aggregate functions.
7. `06_triggers.sql` — validation, uppercase, audit, restricted-hours triggers.
8. `07_seed_data.sql` — categories, components, content, specifications.
9. `08_assignment10_demo.sql` — demonstrations for Assignment 10.
10. `09_assignment11_queries.sql` — eight query demonstrations and view/index exercises.

Check every compilation error. Do not proceed while a procedure, function, or trigger is invalid. In MySQL, inspect compilation errors with the SQL tool's error view or the relevant `USER_ERRORS` query.

### Important database safety notes

- A setup script should not silently delete existing tables/data.
- Keep any destructive reset script separate and clearly named.
- Execute the reset script only against a disposable development schema after checking the current connection/schema.
- Never use a production or shared course database for destructive experimentation.
- Store the real execution timings in `database/10_query_timing_results.md`; do not estimate them.

## 7. Implement and verify the MySQL connection pool

Create a small database module that:
- Reads credentials from environment variables.
- Initializes a connection pool once at server startup.
- Exposes functions to execute parameterized queries and call stored procedures.
- Closes connections in `finally` blocks.
- Closes the pool during graceful shutdown.
- Does not print passwords or connection strings to logs.

For the first test, create a minimal health route that executes a harmless query such as `SELECT 1`. Start the server and visit:

```text
http://localhost:3000/api/health
```

The route should report success only if the database query succeeds. If it fails, check the MySQL host/database, host/port, credentials, network access, and driver/Instant Client requirements.

## 8. Start the backend

From `server/`:

```bash
npm run dev
```

or for a normal start:

```bash
npm start
```

Expected result: the console indicates that the API server is listening. It should not print credentials.

If the port is occupied, change `PORT` in `.env`. Do not hardcode a port in multiple files; read it from configuration.

## 9. Serve the frontend

For the simplest setup, Express can serve static files from `public/`. Configure a static directory and load the homepage from:

```text
http://localhost:3000/
```

This keeps frontend and API on one origin and avoids unnecessary CORS complexity during local development. If the frontend is hosted separately, configure the exact allowed origin in the backend; do not enable unrestricted CORS by default.

Do not open the HTML file with `file://` and expect API routing to behave exactly as it does under a web server.

## 10. Implement in a safe sequence

Build the project in small, testable increments:

1. `/api/health` and MySQL connection.
2. `GET /api/categories`.
3. `GET /api/categories/:id` with children/components.
4. `GET /api/components/:id` with ordered content and specifications.
5. `GET /api/search`.
6. Home/category/search/detail pages using API data.
7. Renderers for `TEXT`, `TABLE`, `EQUATION`, `DIAGRAM`, `TIMING_DIAGRAM`, `GRAPH`, and `DOCUMENT`.
8. CRUD procedures and corresponding lab routes.
9. Filter/aggregate/join/subquery/correlated-subquery routes using allowlisted templates.
10. XML serializers/routes for assignment query 1, 3, and 4.
11. Dashboard statistics.
12. Views, triggers, indexes, and measured timing report.
13. Seed 40–50 components and validate all resources.

At every step, test the API independently before connecting it to the UI.

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

The assignment requires MySQL MySQL stored programs. Do not mix MySQL syntax with
MySQL syntax. The frontend must fetch catalogue data from the Node.js
API, not hardcode the catalogue. Store equations as LaTeX source.
Keep characteristic tables and equations separate. All diagrams,
including state-machine diagrams, use the shared SVG asset model.
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
Inspect the actual schema first. Implement separate MySQL MySQL stored programs
insert, update, and delete procedures for components. Use the real
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
Support TEXT, TABLE, EQUATION, DIAGRAM, TIMING_DIAGRAM, GRAPH, and
DOCUMENT. Equations are LaTeX strings; tables may contain JSON; all
diagrams use SVG assets. Add loading, error, missing-resource, and
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

Avoid vague prompts such as “make the project work” or “write all the code” without giving the current repository state. Do not ask the assistant to assume a schema it has not inspected. Do not accept code that uses MySQL `AUTO_INCREMENT` in MySQL scripts, or MySQL `:NEW` trigger syntax in MySQL. Do not ask it to report a successful run if no run occurred.

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
- [ ] Statement-trigger uppercase requirement implemented validly for MySQL.
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
- Verify driver and Instant Client requirements.
- Test the same credentials in SQL Developer first.
- Never “fix” a connection problem by switching to a DBA account.

### `ORA-` compilation/runtime errors
- Read the complete error and line number.
- Inspect object validity and compiler errors.
- Confirm that column names match the actual DDL.
- Check trigger timing/level and whether `:NEW`/`:OLD` is legal in that trigger.
- Run the smallest reproducible SQL test.

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
