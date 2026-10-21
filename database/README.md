# Database scripts

`../electrodb.sql` is the authoritative consolidated fresh-install script. It creates the MySQL database, schema, constraints, indexes, views, stored programs, triggers, and seed data. It is **destructive for the database named `electrodb`** because it drops and recreates that schema. Run only after verifying the target and backing up any data.

The numbered scripts in this directory are non-destructive assignment demonstrations to run after setup. Routine definitions are kept in the consolidated SQL file to avoid duplicate object creation.

- `00_create_users_and_roles.sql` — optional least-privilege MySQL roles; account passwords are created manually, never stored here.
- `03_views.sql` — inspect the joined catalogue views.
- `08_assignment10_demo.sql` — invoke Assignment 10 procedures/cursors.
- `09_assignment11_queries.sql` — eight query examples; write statements are commented by default.
- `10_query_timing_results.md` — blank measurement template; fill with observed timings only.
- `11_assignment11_indexes.sql` — optional two-index experiment; create only after collecting baseline timings.
