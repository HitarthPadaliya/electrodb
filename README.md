# ElectroDB

ElectroDB is an electronic-components reference catalogue and DBMS practical-assignment project for SVNIT CS203. Visitors explore the category tree, search for components, and read educational content, equations, diagrams, and specifications. The separate `/lab` console demonstrates the Assignment 11 query and CRUD controls.

## Stack

- Node.js + Express API
- MySQL 8.0/8.4 via `mysql2`
- Semantic HTML, CSS, and vanilla JavaScript
- KaTeX for LaTeX equations; reviewed SVGs for diagrams

The stored programs are **MySQL stored procedures/functions/triggers**, not Oracle PL/SQL. MySQL triggers are row-level and cannot be attached directly to views; the uppercase normalization implementation is explicitly a row-trigger equivalent. Confirm these dialect differences with the instructor where the rubric says PL/SQL, statement-level trigger, or view trigger.

## Start locally

Requirements: Node.js 20+ and a MySQL server supported by the course.

```sh
npm install
cp .env.example .env
# Set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in .env
```

Import `electrodb.sql` into a disposable development MySQL instance. **It drops and recreates the database named `electrodb`**; back up existing data and verify the target connection before running it. It seeds 45 component records, categories, educational sections, specifications, and assignment objects. Optionally run `database/00_create_users_and_roles.sql` afterward to configure schema-scoped roles; create account passwords manually and securely.

```sh
npm run dev
```

Open `http://localhost:3000/` (catalogue) or `http://localhost:3000/#/lab` (assignment console). Set `ENABLE_LAB_CONSOLE=false` to disable the lab routes. They default off when `NODE_ENV=production` and on in development; do not expose the unauthenticated demo lab in production. The app can start without MySQL configured, but catalogue API calls will return a clear database-unavailable response; no catalogue records are hardcoded in the browser.

## API overview

- `GET /api/health`, `/api/categories`, `/api/categories/:id`
- `GET /api/categories/slug/:slug`, `/api/categories/:id/components`
- `GET /api/components/:id`, `/api/components/slug/:slug`
- `GET /api/search?q=&page=&pageSize=`
- `/api/lab/*` — guarded, allowlisted CRUD, aggregate, filter, join, subquery, dashboard, and XML demonstrations

The normal catalogue is read-only. Lab writes call the schema's component stored procedures. API errors use `{ "error": { "code", "message" } }`; database stacks and credentials are not returned to the client.

## Checks

```sh
npm test
npm run check
node scripts/check-assets.js
```

Timing values for the Assignment 11 index comparison must be measured against the actual target database and recorded in the submission. No benchmark timings are fabricated or included here.

## Design and setup documents

- `Design Guideline.md` — product, data, API, and acceptance specification.
- `Design Decisions and Changes.md` — implementation decisions and unresolved instructor confirmations.
- `Setup Prompting and Run Guide.md` — install, run, and assignment checklist.
- `electrodb.sql` — consolidated MySQL schema, routines, triggers, views, and seed data.
