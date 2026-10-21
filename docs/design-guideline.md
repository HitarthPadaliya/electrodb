# ElectroDB — Detailed System Design Guideline

**Document type:** Implementation specification  
**Project:** ElectroDB — Electronic Components Reference Website  
**Audience:** Student developer, backend developer, database developer, UI developer  
**Status:** Proposed baseline; verify schema and SQL dialect decisions before implementation.

---

## 1. Purpose and governing requirements

ElectroDB is an educational reference catalogue for electronic components and circuit concepts. Visitors browse a hierarchical category tree, search the catalogue, open component detail pages, and read structured educational material: descriptions, truth/state/characteristic/excitation tables, equations, diagrams, graphs, specifications, and datasheets.

This guideline consolidates the project decisions discussed so far and the uploaded SVNIT CS203 practical assignments.

### 1.1 Assignment requirements that must be demonstrated

**Practical Assignment 10** requires individual insert/update/delete stored procedures; database users representing naïve/end-user, application developer, and DBA roles; login-data CRUD; explicit-cursor procedures with and without a limit; paginated search with and without filtering; numeric sum functions with and without grouping; a BEFORE trigger checking at least two integrity conditions; a statement trigger for uppercasing character data; an AFTER trigger that logs INSERT/UPDATE/DELETE to `application_audit_log`; and a trigger that blocks modifications during the stipulated restricted period (Monday, 2–4 pm for the implementation). The trigger must provide a meaningful message. See the assignment's requirements on page 1 and page 2. fileciteturn0file0L17-L40 fileciteturn0file0L47-L51

**Practical Assignment 11** requires eight SQL demonstrations: full-table display, integrity-preserving inserts, one aggregate, conditional query, join, subquery, correlated subquery, and update. Record execution times before and after creating at least two appropriate indexes and analyze the impact. Create a view joining two tables, demonstrate a saved procedure and a trigger around the view, and build a frontend with CRUD navigation, HTML table output, insert/update forms, selectable aggregate and filter options, configurable joins, subquery/correlated-subquery options, a dashboard with statistics for all tables, and XML output specifically for query 1, query 3, and query 4. fileciteturn0file1L17-L45 fileciteturn0file1L53-L59

These academic requirements add a database-lab/demo surface to the public catalogue. They do **not** mean that public visitors need accounts or that the public-facing product should gain profiles, shopping, reviews, or administrative editing. The existing frontend requirements explicitly exclude those product features. Keep the assignment demo tools separate from the ordinary catalogue navigation.

## 2. Technology decision: MySQL with equivalent stored programs

**Decision: ElectroDB will use MySQL.** The earlier frontend specification already describes a Node.js backend and MySQL database. Assignment 10 calls its procedural requirements “stored-program”, but the project will implement the closest equivalent using MySQL stored procedures, stored functions, cursors, and triggers. These are MySQL stored programs, not MySQL stored programs; document this distinction in the submission and confirm with the instructor if literal MySQL stored programs is mandatory.

Use one consistent MySQL version (preferably a current supported MySQL 8.0/8.4 release) and test scripts against that version. Use the MySQL Node.js driver, such as `mysql2`, with a connection pool. Do not mix MySQL-only syntax (`VARCHAR2`, `NEW`, `DBMS_OUTPUT`, `DUAL` assumptions, stored-program blocks) into MySQL scripts. MySQL uses `AUTO_INCREMENT`, `DELIMITER` in command-line scripts, `NEW.column`/`OLD.column` in triggers, and `SIGNAL SQLSTATE` for deliberate errors.

**Transaction note:** MySQL triggers cannot issue transaction-control statements such as `COMMIT` or `ROLLBACK`; transaction boundaries belong to the application/service or calling procedure where supported. Stored procedures can use MySQL control flow and handlers, but functions and triggers have additional restrictions. Check each object against the chosen MySQL version.

## 3. Architecture overview

Use a small, layered, maintainable application:

1. **Browser UI** — semantic HTML, CSS, and JavaScript. It renders catalogue pages and assignment demonstration tools.
2. **HTTP API** — Node.js with Express. It validates request data, calls service functions, executes parameterized SQL or approved stored routines, and returns JSON or XML.
3. **Service/repository layer** — separates route handling from query and database details.
4. **MySQL database** — normalized catalogue tables, constraints, indexes, views, stored-program procedures/functions, and triggers.
5. **Static resources** — SVG diagrams and image/document resources served through a predictable path.
6. **Tests and scripts** — schema creation, seed data, stored-program demonstrations, query timing records, and API/UI tests.

```text
Browser
  ├── Catalogue: Home / Categories / Search / Component detail
  └── Lab Console: CRUD / Query demonstrations / Dashboard / XML
                 │ HTTPS/HTTP + JSON (XML for required lab outputs)
                 ▼
             Express API
  ├── Routes and request validation
  ├── Catalogue services
  ├── Lab/query services
  ├── XML serialization
  └── Repository / MySQL connection pool
                 │ bind variables / stored procedure calls
                 ▼
             MySQL
  ├── Catalogue tables + constraints + indexes
  ├── Views
  ├── stored-program procedures and functions
  ├── Integrity / audit / schedule triggers
  └── application_audit_log
```

### 3.1 Separation of concerns

- Routes should not contain large SQL strings or rendering logic.
- Database credentials must never be sent to the browser.
- Frontend JavaScript must never connect directly to MySQL.
- Database results should be transformed into a stable API response contract.
- Use bind variables for values. Whitelist identifiers such as sort columns, table names, and join types; identifiers cannot be safely parameterized like values.
- A public catalogue read endpoint must not expose database usernames, hashes, audit details, or internal error stacks.
- A lab-only endpoint can expose selected query demonstrations, but it must still use allowlisted SQL templates rather than executing arbitrary SQL supplied by the browser.

## 4. Repository layout

Suggested structure:

```text
electrodb/
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── docs/
│   ├── design-guideline.md
│   ├── change-log.md
│   └── setup-and-prompting-guide.md
├── database/
│   ├── 00_create_users_and_roles.sql
│   ├── 01_schema.sql
│   ├── 02_constraints_indexes.sql
│   ├── 03_views.sql
│   ├── 04_plsql_procedures.sql
│   ├── 05_plsql_functions.sql
│   ├── 06_triggers.sql
│   ├── 07_seed_data.sql
│   ├── 08_assignment10_demo.sql
│   ├── 09_assignment11_queries.sql
│   └── 10_query_timing_results.md
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── db/
│   │   │   ├── pool.js
│   │   │   └── repository.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── serializers/
│   │   │   └── xml.js
│   │   └── middleware/
│   └── tests/
├── public/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── svg/
│   └── images/
└── scripts/
    ├── check-db-connection.js
    └── verify-install.js
```

Keep SQL scripts idempotent where practical, or make the README state the order and whether a script is destructive. Do not put `DROP TABLE` commands in the normal setup script. Put reset/drop commands in a clearly named development-only script.

## 5. Database model

### 5.1 Design principles

- Use numeric primary keys and explicit foreign keys.
- Use a self-referencing category relationship to support an arbitrary category depth.
- Each component belongs to exactly one category.
- Model content sections separately because a flip-flop, a diode, a counter, and a motor do not share the same technical sections.
- Keep category content templates separate from the component's actual content.
- Keep specifications normalized so multiple components can reuse specification definitions.
- Keep characteristic tables and equations as separate content records, especially for flip-flops and other sequential components. Do not merge a table and an equation into a single opaque field.
- Store equations as LaTeX strings suitable for frontend math rendering. The API should return the string; the frontend renders it with a math renderer and a safe plain-text fallback.
- Diagram families should share a single representation: `SVG`/`SVG_PATH` content. A state machine, logic circuit, block diagram, and other diagram are all diagrams differentiated by a subtype/label, not separate schema tables.
- Use `LONGTEXT` for potentially long text and `JSON` for validated structured payloads where appropriate. Use `VARCHAR`, `TEXT`, `DECIMAL`, `DATETIME`/`TIMESTAMP`, and `AUTO_INCREMENT` according to the chosen MySQL version.
- Store only known specifications. A missing voltage or timing value is absent, not zero.
- Mark educational/illustrative ratings clearly. Do not present illustrative values as manufacturer-verified values.

### 5.2 Core catalogue tables

The following is the logical schema. Exact MySQL DDL should define lengths, AUTO_INCREMENT columns, foreign keys, and check constraints explicitly.

#### `categories`

| Column | Suggested type | Purpose |
|---|---|---|
| `category_id` | BIGINT AUTO_INCREMENT, PK | Stable category identifier |
| `parent_category_id` | BIGINT, nullable FK to categories | Parent node; null for top-level |
| `name` | VARCHAR(120), required | Display name |
| `slug` | VARCHAR(160), unique | URL-friendly stable slug |
| `description` | LONGTEXT, nullable | Category overview |
| `display_order` | INT default 0 | Sibling ordering |
| `is_active` | CHAR(1) default 'Y' | Publication flag |
| `created_at` | TIMESTAMP default current timestamp | Creation time |
| `updated_at` | TIMESTAMP | Last change |

Constraints: primary key; unique slug; parent foreign key; `is_active IN ('Y','N')`; prevent self-parenting. Application/service validation should also prevent longer category cycles.

#### `components`

| Column | Suggested type | Purpose |
|---|---|---|
| `component_id` | BIGINT AUTO_INCREMENT, PK | Stable identifier |
| `category_id` | BIGINT, required FK | Exactly one category |
| `name` | VARCHAR(180), required | Component/concept name |
| `slug` | VARCHAR(200), unique | Optional readable route segment |
| `short_description` | VARCHAR(1000) | Search/result summary |
| `description` | LONGTEXT | Detailed description |
| `main_image_path` | VARCHAR(500) | Optional media path |
| `circuit_symbol_path` | VARCHAR(500) | Optional symbol SVG path |
| `datasheet_url` | VARCHAR(1000) | Optional verified document URL |
| `is_illustrative` | CHAR(1) default 'N' | Indicates illustrative sample data |
| `is_published` | CHAR(1) default 'Y' | Catalogue visibility |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last change |

Use foreign keys and non-empty-name checks. Search across `name` and `short_description`; add full-text/search indexes only if supported and justified by the chosen MySQL configuration.

#### `content_types`

| Column | Suggested type | Purpose |
|---|---|---|
| `content_type_id` | BIGINT AUTO_INCREMENT, PK | Identifier |
| `code` | VARCHAR(40), unique | Stable code |
| `label` | VARCHAR(100) | Human label |
| `render_kind` | VARCHAR(30) | Frontend rendering family |
| `description` | VARCHAR(500) | Expected payload |

Recommended codes/render kinds:
- `TEXT` → prose
- `IMAGE` → image resource
- `TABLE` → structured table JSON
- `EQUATION` → LaTeX equation
- Diagram assets → `component_diagrams` rows with SVG paths
- `GRAPH` → graph resource or structured data
- `DOCUMENT` → datasheet/document URL

All diagrams are stored in `component_diagrams` with an SVG asset path. The database does not store diagram type; a title such as “Timing Diagram” or “State Diagram” is sufficient for display and accessibility.

#### `category_content_types`

| Column | Suggested type | Purpose |
|---|---|---|
| `category_id` | BIGINT FK | Category |
| `content_type_id` | BIGINT FK | Expected content type |
| `section_key` | VARCHAR(80) | Stable section identifier |
| `section_label` | VARCHAR(120) | Display heading |
| `is_required` | CHAR(1) | Required/optional |
| `display_order` | DECIMAL(18,6) | Section order |

Use composite primary key such as `(category_id, section_key)` and unique `(category_id, content_type_id, section_key)` as appropriate. Templates define expected sections; they do not create fake empty content on component pages.

#### `component_content`

| Column | Suggested type | Purpose |
|---|---|---|
| `component_content_id` | BIGINT AUTO_INCREMENT, PK | Content record |
| `component_id` | BIGINT FK | Owning component |
| `content_type_id` | BIGINT FK | Content type |
| `section_key` | VARCHAR(80) | Template key / stable identity |
| `title` | VARCHAR(180) | Section title |
| `content` | LONGTEXT | Text, JSON, LaTeX, or resource path |
| `alt_text` | VARCHAR(500) | Accessible description |
| `caption` | VARCHAR(500) | Optional caption |
| `display_order` | DECIMAL(18,6) | Per-component order |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last change |

Recommended unique key: `(component_id, section_key)` unless the design intentionally allows multiple records under one section key. Validate the payload according to `content_type`; do not blindly parse all content as JSON. Diagram assets belong in `component_diagrams.image_path`, which should contain a controlled resource path. Avoid injecting arbitrary inline SVG from the database into the DOM.

#### `specifications`

| Column | Suggested type | Purpose |
|---|---|---|
| `specification_id` | BIGINT AUTO_INCREMENT, PK | Specification definition |
| `name` | VARCHAR(120), unique | Example: Propagation Delay |
| `unit` | VARCHAR(40), nullable | Example: ns, V, °C |
| `value_kind` | VARCHAR(20) | `DECIMAL(18,6)`, `TEXT`, `RANGE` |
| `description` | VARCHAR(500) | Meaning |

Examples include Number of States, Number of Bits, Supply Voltage, Maximum Clock Frequency, Propagation Delay, Forward Voltage, Maximum Forward Current, Zener Voltage, Collector Current, Drain-Source Voltage, Gate Threshold Voltage, Voltage Gain, Output Voltage, Measurement Range, Resolution, Memory Capacity, Coil Voltage, Rated Voltage, No-Load Speed, and Contact Configuration. Add correctly named definitions such as Number of Inputs, Number of Data Inputs, Number of Select Lines, and Number of Outputs when needed; do not use “Number of Bits” as a synonym for input/output count.

#### `component_specifications`

| Column | Suggested type | Purpose |
|---|---|---|
| `component_id` | BIGINT FK | Component |
| `specification_id` | BIGINT FK | Specification |
| `numeric_value` | DECIMAL(18,6), nullable | Numeric measurement |
| `text_value` | VARCHAR(300), nullable | Textual value such as SPDT |
| `range_min` / `range_max` | DECIMAL(18,6), nullable | Optional numeric range |
| `unit_override` | VARCHAR(40), nullable | Only if genuinely necessary |
| `source_note` | VARCHAR(500) | Source/illustrative note |

Use composite primary key `(component_id, specification_id)`. Enforce a consistent representation for each value kind. The API should return a normalized display value plus unit and source note.

### 5.3 Assignment-specific tables

#### `app_users` (or a clearly documented `login_data` table)

The assignment requires login data CRUD and separate database accounts/roles. These are different concerns:

- **Database accounts/roles** are MySQL security principals used by administrators and the application connection.
- **Application login records** are rows in an application table. They do not need to be exposed to catalogue visitors.

Suggested columns: `user_id`, `username` (unique), `password_hash`, `role_code`, `is_active`, `created_at`, `updated_at`, `last_login_at`. Never store plaintext passwords. Do not add login to the public catalogue unless a supervisor explicitly changes the scope. Use this table for the assignment demonstration only if required.

Suggested application roles: `NAIVE_USER` (end-user/read-only), `APP_DEVELOPER` (permitted CRUD/demo operations), and `DBA` (database administration). In MySQL, create least-privilege database roles/accounts separately. Do not use a shared DBA account from Node.js.

#### `application_audit_log`

Required by Assignment 10.

Suggested columns: `audit_id` PK, `table_name`, `operation_type` (`INSERT`/`UPDATE`/`DELETE`), `row_key`, `changed_at`, `db_user`, `application_user` nullable, `old_values` LONGTEXT nullable, `new_values` LONGTEXT nullable, `transaction_id` nullable. Keep audit payloads minimal and avoid passwords/secrets. The audit trigger should not recursively audit its own log table.

#### Optional lab execution records

For reproducible Assignment 11 reporting, keep timing measurements in a Markdown report or a dedicated `query_benchmark_results` table with query identifier, run number, index state, elapsed time, row count, test notes, and date. Avoid treating one timing measurement as conclusive; run several times under comparable conditions and report the method.

## 6. Data relationships and integrity

Logical relationships:

- `categories.parent_category_id` → `categories.category_id` (self-reference).
- `components.category_id` → `categories.category_id`.
- `category_content_types.category_id` → `categories.category_id`.
- `category_content_types.content_type_id` → `content_types.content_type_id`.
- `component_content.component_id` → `components.component_id`.
- `component_content.content_type_id` → `content_types.content_type_id`.
- `component_specifications.component_id` → `components.component_id`.
- `component_specifications.specification_id` → `specifications.specification_id`.

Use foreign keys and unique constraints in the database rather than relying only on frontend checks. Suitable validation examples for the BEFORE trigger include:
1. `name` must not be null/blank after trimming.
2. A numeric specification value must be non-negative where the specification's domain requires non-negativity, or an illustrative/range-specific rule is documented.
3. Component category must exist (normally already enforced by FK).
4. A content section key must be valid and unique for the component.
5. A component's name/slug must meet the agreed uniqueness rule.

Choose two meaningful constraints for the required trigger and also create ordinary declarative constraints where possible. Triggers complement constraints; they should not replace a simple `NOT NULL`, `CHECK`, `UNIQUE`, or FK constraint.

## 7. stored-program objects required by Assignment 10

Keep objects named consistently and document their parameters and transaction behavior.

### 7.1 CRUD procedures

Create individual procedures such as:
- `sp_insert_component(...)`
- `sp_update_component(...)`
- `sp_delete_component(p_component_id ...)`

Each procedure should validate required fields, perform the intended DML, and return a clear status through output parameters or a documented exception strategy. Do not swallow exceptions. Decide whether commit/rollback belongs to the caller or procedure; for service applications, prefer a documented transaction boundary and do not commit after every individual SQL statement by habit.

For the assignment's login-data CRUD, create a separate family of procedures such as `sp_insert_app_user`, `sp_update_app_user`, and `sp_delete_app_user`, with access restricted to the lab/application role. Password changes must accept a hash generated by the application or use a reviewed password-handling flow; never log hashes or plaintext passwords.

### 7.2 Explicit-cursor procedures

Demonstrate:
- One procedure opening an explicit cursor and iterating through all qualifying rows without a limit.
- A second procedure that processes a bounded batch using a limit/bulk-fetch pattern appropriate to the chosen MySQL version.

In MySQL, demonstrate an explicit cursor with `DECLARE cursor_name CURSOR FOR SELECT ...`, `OPEN`, `FETCH`, and `CLOSE`, plus a `NOT FOUND` handler. For the bounded example, use a counter/condition to stop after N fetched rows, or use a limited cursor query (`LIMIT n`) if that clearly satisfies the instructor's meaning of “with limit”. MySQL does not provide MySQL's `BULK COLLECT ... LIMIT` syntax.

### 7.3 Paginated search functions/procedures

Provide search with and without filters. A page request must validate page number and page size and use deterministic ordering. For MySQL versions supporting it, `OFFSET ... FETCH NEXT ... ROWS ONLY` is a straightforward approach. For older versions, use an appropriate `ROW_DECIMAL(18,6)()` wrapper. Return total count separately if the UI needs page counts.

Filtering must be parameterized. Dynamic identifiers must be allowlisted. Do not concatenate untrusted text into SQL.

### 7.4 Sum functions with and without grouping

- Ungrouped function: return `SUM` for a chosen numeric field, with a fixed allowlist of eligible columns.
- Grouped function/query: return a sum grouped by a dimension, such as components per category or numeric specifications by specification type.

A scalar stored-program function naturally returns one scalar; a grouped result is usually better represented as a query, pipelined function, ref cursor, or procedure returning a cursor. Document the chosen form instead of claiming one scalar function returns an arbitrary multirow result.

### 7.5 Triggers

1. **BEFORE row trigger:** validate at least two integrity rules. Keep expensive queries out of row triggers where possible.
2. **Uppercase statement trigger:** Assignment 10 says “statement trigger”. MySQL does not support MySQL-style statement-level triggers: MySQL triggers execute once per affected row. Implement a `BEFORE INSERT` and/or `BEFORE UPDATE` row trigger to normalize selected text with `SET NEW.column_name = UPPER(NEW.column_name)`, and document this as the closest MySQL equivalent. Do not falsely label it a statement-level trigger; confirm with the instructor whether the row-level equivalent is accepted.
3. **AFTER DML audit trigger:** MySQL allows one trigger for each table/event/timing combination (subject to version features). Implement `AFTER INSERT`, `AFTER UPDATE`, and `AFTER DELETE` triggers on the chosen table, inserting the operation, row key, timestamp, database user, and safe old/new values into `application_audit_log`. Use `NEW` for insert/update and `OLD` for delete/update as appropriate. Do not audit modifications to the audit table itself.
4. **Restricted-hours trigger:** block modifications to one selected project table on Monday between 14:00 and 16:00 using `DAYOFWEEK(CURRENT_TIMESTAMP)` (Monday is 2 in MySQL) and `TIME(CURRENT_TIMESTAMP)`, with `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '...'`. Decide which database/server time zone is authoritative and test boundary times. This is an intentionally artificial assignment rule, not a production security mechanism.

MySQL triggers are row-level only and cannot contain transaction-control statements. Avoid recursive trigger designs and avoid querying the same table in ways that create mutating/consistency problems. Trigger DDL uses `DELIMITER` in command-line clients so the client does not split a compound body at the first semicolon; `DELIMITER` is a client command, not SQL sent through the Node.js driver.

## 7.1 MySQL implementation patterns (illustrative)

These examples show the equivalent MySQL syntax; adapt table/column names to the final DDL. Run trigger/procedure scripts in a client that supports `DELIMITER` (such as the MySQL command-line client or Workbench script runner). `DELIMITER` is not sent as a SQL statement by application code.

### Procedure with validation and error signaling

```sql
DELIMITER //

CREATE PROCEDURE sp_insert_component(
    IN p_category_id BIGINT,
    IN p_name VARCHAR(180),
    IN p_short_description VARCHAR(1000)
)
BEGIN
    IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Component name is required';
    END IF;

    INSERT INTO components (category_id, name, short_description)
    VALUES (p_category_id, TRIM(p_name), p_short_description);
END//

DELIMITER ;
```

The foreign key should validate `p_category_id`. Decide whether transaction ownership belongs to the caller or procedure; do not add commits indiscriminately.

### Explicit cursor with a limit

```sql
DELIMITER //

CREATE PROCEDURE sp_list_components_limited(IN p_limit INT)
BEGIN
    DECLARE v_done BOOLEAN DEFAULT FALSE;
    DECLARE v_id BIGINT;
    DECLARE v_name VARCHAR(180);
    DECLARE v_count INT DEFAULT 0;

    DECLARE component_cursor CURSOR FOR
        SELECT component_id, name
        FROM components
        ORDER BY component_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    IF p_limit IS NULL OR p_limit < 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Limit must be a positive integer';
    END IF;

    OPEN component_cursor;

    read_loop: LOOP
        FETCH component_cursor INTO v_id, v_name;
        IF v_done OR v_count >= p_limit THEN
            LEAVE read_loop;
        END IF;

        -- Replace this comment with the required processing/output mechanism.
        SET v_count = v_count + 1;
    END LOOP;

    CLOSE component_cursor;
END//

DELIMITER ;
```

For a true bounded result set, it is usually simpler and more efficient to put `LIMIT p_limit` in the cursor's SELECT, but MySQL cursor declarations have restrictions around dynamic values; use a fixed/approved query or a loop over a prepared result only if needed. If the assignment specifically expects a cursor loop that stops after N rows, the counter approach demonstrates that behavior. A result-returning procedure can use a normal `SELECT` rather than expecting `DBMS_OUTPUT`.

### Row trigger to uppercase a field

```sql
DELIMITER //

CREATE TRIGGER trg_components_uppercase_bi
BEFORE INSERT ON components
FOR EACH ROW
BEGIN
    SET NEW.name = UPPER(TRIM(NEW.name));
END//

CREATE TRIGGER trg_components_uppercase_bu
BEFORE UPDATE ON components
FOR EACH ROW
BEGIN
    SET NEW.name = UPPER(TRIM(NEW.name));
END//

DELIMITER ;
```

This is a **row-level** trigger because MySQL does not support statement-level triggers. It is the closest functional equivalent for the normalization requirement.

### Audit trigger pattern

Create separate triggers for each operation, and keep `application_audit_log` outside the set of audited tables.

```sql
DELIMITER //

CREATE TRIGGER trg_components_audit_ai
AFTER INSERT ON components
FOR EACH ROW
BEGIN
    INSERT INTO application_audit_log
        (table_name, operation_type, row_key, changed_at, db_user, new_values)
    VALUES
        ('components', 'INSERT', CAST(NEW.component_id AS CHAR),
         CURRENT_TIMESTAMP, CURRENT_USER(),
         JSON_OBJECT('name', NEW.name, 'category_id', NEW.category_id));
END//

CREATE TRIGGER trg_components_audit_ad
AFTER DELETE ON components
FOR EACH ROW
BEGIN
    INSERT INTO application_audit_log
        (table_name, operation_type, row_key, changed_at, db_user, old_values)
    VALUES
        ('components', 'DELETE', CAST(OLD.component_id AS CHAR),
         CURRENT_TIMESTAMP, CURRENT_USER(),
         JSON_OBJECT('name', OLD.name, 'category_id', OLD.category_id));
END//

DELIMITER ;
```

Add an `AFTER UPDATE` trigger storing both old and new values. Ensure audit columns and JSON payloads match the actual DDL. Do not include secrets or password data.

### Restricted-hours trigger pattern

```sql
DELIMITER //

CREATE TRIGGER trg_components_restricted_hours_bu
BEFORE UPDATE ON components
FOR EACH ROW
BEGIN
    IF DAYOFWEEK(CURRENT_TIMESTAMP) = 2
       AND TIME(CURRENT_TIMESTAMP) >= '14:00:00'
       AND TIME(CURRENT_TIMESTAMP) < '16:00:00' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Updates to components are disabled on Monday from 2 PM to 4 PM';
    END IF;
END//

DELIMITER ;
```

Create equivalent `BEFORE INSERT` and `BEFORE DELETE` triggers if “any modifications” must cover all three operations. Test using a controlled test strategy; do not change a shared server's clock. This sample uses server time and a half-open interval `[14:00, 16:00)`.

## 8. Views and query demonstrations

Create at least one view joining two tables, for example:
- `v_component_catalogue`: component + category summary.
- `v_component_content_summary`: component + category + content section counts.

Choose a view that has a meaningful condition (for example, published components in a category or a particular category branch). Test whether the view is updatable; joins and aggregates often make views non-updatable. If inserting through a view is required, use an `INSTEAD OF` trigger where appropriate or call the stored procedure explicitly. The assignment asks to execute a saved procedure and trigger around/for a view; explain precisely what is being tested.

Assignment 11 query catalogue:
1. Display all rows from one main table (for example `components`).
2. Insert rows into multiple related tables while preserving FK integrity.
3. One aggregate result (e.g., `COUNT(*)` or `AVG` of a numeric field).
4. Conditional query (e.g., a chosen category or published flag).
5. Join two tables; UI has two table selectors and a join-operation selector, but the server maps these selections to approved joins.
6. Subquery over more than one table.
7. Correlated subquery over more than one table.
8. Update a row and display the updated result.

For every query, save:
- Query ID and purpose.
- Exact SQL used.
- Test dataset size and environment.
- Execution time before indexes.
- Indexes added and why.
- Execution time after indexes.
- Result row count and interpretation.

Do not invent timing numbers. Measure them in the actual SQL tool/database. Explain that an index can help selective filters/joins but can make inserts/updates/deletes slower and may not improve a full-table scan.

## 9. Index strategy

Create at least two justified indexes, then benchmark. Candidate examples (choose after inspecting query plans):
- `components(category_id)` for category filtering and category/component joins.
- `components(is_published, category_id)` if workload commonly filters published rows by category.
- `component_content(component_id, display_order)` for detail-page sections.
- `component_specifications(component_id)` for detail-page specifications.
- `categories(parent_category_id, display_order)` for hierarchical browsing.
- A function-based index only if a query's expression and MySQL configuration justify it.

Do not create every candidate blindly. Primary/unique keys generally already have supporting indexes. Use the database's explain-plan facilities and representative data; include both timing and plan observations.

## 10. Backend API contract

Choose endpoint names once and keep them stable. Suggested REST endpoints:

### Public catalogue
- `GET /api/health`
- `GET /api/categories` — top-level categories.
- `GET /api/categories/:categoryId` — category metadata, breadcrumb/parent, children, assigned components.
- `GET /api/components/:componentId` — component fields, category, ordered content sections, specifications.
- `GET /api/search?q=...&page=1&pageSize=20` — search with pagination.
- `GET /api/categories/:categoryId/components?page=1&pageSize=20`
- `GET /api/categories/:categoryId/content-template` — optional template endpoint.

### Lab/assignment endpoints
- `GET /api/lab/components` — full-table output with bounded pagination by default; a dedicated assignment route can demonstrate all rows on a small seed dataset.
- `POST /api/lab/components` — insert through stored procedure.
- `PATCH /api/lab/components/:id` — update through stored procedure.
- `DELETE /api/lab/components/:id` — delete through stored procedure.
- `GET /api/lab/aggregate?function=count&field=component_id` — allowlisted aggregate.
- `GET /api/lab/filter?field=category_id&operator=eq&value=...` — allowlisted field/operator.
- `GET /api/lab/join?left=components&right=categories&type=inner` — allowlisted tables and join kinds.
- `GET /api/lab/subquery?kind=...` — server-selected query templates.
- `GET /api/lab/correlated-query?kind=...`
- `GET /api/lab/dashboard` — counts/statistics for every relevant table.
- `GET /api/lab/components.xml` — XML form for query 1.
- `GET /api/lab/aggregate.xml?...` — XML form for query 3.
- `GET /api/lab/filter.xml?...` — XML form for query 4.

These lab endpoints should be disabled or protected in production if they expose write operations or assignment-only capabilities. Do not create arbitrary `POST /api/sql` endpoints.

### 10.1 Example JSON response

```json
{
  "data": {
    "componentId": 17,
    "name": "JK Flip-Flop",
    "category": {"categoryId": 4, "name": "Flip-Flops"},
    "content": [
      {
        "sectionKey": "truth_table",
        "title": "Truth Table",
        "type": "TABLE",
        "content": {"columns": ["J", "K", "Q", "Q(next)"], "rows": []}
      },
      {
        "sectionKey": "characteristic_equation",
        "title": "Characteristic Equation",
        "type": "EQUATION",
        "content": "Q_{next}=J\\overline{Q}+\\overline{K}Q"
      },
      {
        "sectionKey": "state_diagram",
        "title": "State Diagram",
        "type": "DIAGRAM",
        "diagramKind": "STATE_MACHINE",
        "content": "/assets/svg/jk-flip-flop-state.svg"
      }
    ],
    "specifications": []
  }
}
```

This is an example contract, not an assertion that the current database already contains these records. Keep characteristic table and characteristic equation in separate records.

### 10.2 Status and errors

Use standard HTTP status codes:
- `200` success.
- `201` created.
- `400` malformed/invalid input.
- `404` unknown resource.
- `409` uniqueness/conflict.
- `422` domain validation failure where useful.
- `500` unexpected server/database failure.

Return a consistent error body such as `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`. Never expose stack traces, credentials, raw SQL, or MySQL connection details to a public client.

## 11. Frontend page and component design

The UI should be data-driven, responsive, keyboard accessible, and visually coherent. Exact colors, typography, spacing, and component styling can be defined in Figma later; do not hardcode catalogue data into the UI.

### 11.1 Required pages

1. **Home**
   - Site title and purpose.
   - Search field.
   - Top-level categories.
   - Optional featured/recent records only if the API returns them.
2. **Category**
   - Breadcrumb path.
   - Category title/description.
   - Child categories.
   - Assigned components.
   - Empty state where appropriate.
   - Must handle arbitrary depth and categories that have both child categories and components.
3. **Search results**
   - Name, summary, category, optional image, detail link.
   - Loading, empty, error, and pagination states.
4. **Component detail**
   - Name, short description, category/breadcrumb, main image, circuit symbol, and detailed description.
   - Category-appropriate sections in configured order.
   - Specifications table.
   - Applications, advantages, limitations, datasheet, and related items only when data exists.
5. **Not found**
   - Invalid category/component IDs should produce a useful not-found page.
6. **Lab Console** (assignment-only)
   - Tabs/menu for CRUD, query demonstrations, indexes/timing report, view, XML output, and dashboard.
   - Keep it visibly separate from the visitor-facing catalogue.

### 11.2 Component detail renderer

Render by content type:
- `TEXT`: paragraphs and lists.
- `IMAGE`: image with alt text and caption.
- `TABLE`: validate the JSON structure before rendering.
- `EQUATION`: render LaTeX through a math renderer such as KaTeX or MathJax; show plain text if rendering fails.
- `DIAGRAM`: resolve and render an SVG resource.
- `GRAPH`: image or structured graph data if supported.
- `DOCUMENT`: safe external/open-document link.
- Any unknown type: show a safe fallback instead of crashing.

Do not show empty placeholder sections. If a required section is missing, development logging can flag it while the page remains usable.

### 11.3 Sequential-logic tables

For flip-flops, show separate sections:
- Truth table.
- Characteristic table.
- Characteristic equation.
- Excitation table.
- Timing diagram.
- State-machine diagram where useful.

Use `Q` for current output and `Q(next)` for output after the active clock event. Explain `X` as “don't care” where it appears. For counters, show current state, next state, output-bit labels, and wraparound. For a decade counter show 0–9 then return to 0; for Mod-8 show `000` through `111` then `000`.

### 11.4 Shared SVG diagram system

All diagram types should be handled as SVG assets. Keep one reusable `SvgDiagram` UI component that accepts:
- `src` or approved inline SVG.
- `kind` (`STATE_MACHINE`, `LOGIC_CIRCUIT`, `BLOCK_DIAGRAM`, `PINOUT`, `TIMING`, `GRAPH`, etc.).
- `title`, `altText`, `caption`.
- Optional aspect ratio/viewBox metadata.

Use separate SVG files for separate figures, but do not create a separate database table or renderer implementation for each diagram family. Sanitize/validate inline SVG or prefer controlled static files. SVG can contain active content; do not inject untrusted SVG from a database directly into the DOM.

## 12. State-machine diagram requirements

Add a state-machine SVG when it meaningfully explains sequential behavior, especially:
- Decade counter: ten states `0 → 1 → … → 9 → 0`.
- Mod-8 counter: eight states `000 → 001 → … → 111 → 000`.
- Flip-flops: compact state-transition diagram for output state `Q=0` and `Q=1`, with transitions labelled by inputs.
- FSM-like controllers or sequential devices when their states and transitions are explicitly defined.

Not every analogue or passive component needs a state-machine diagram. For diodes, resistors, transistors in general operating modes, op-amp configurations, motors, and regulators, prefer circuit/block diagrams and characteristic graphs unless there is a genuine finite-state model.

Each state-machine SVG should:
- Label all states clearly.
- Show directed transitions and transition conditions.
- Indicate reset/initial state if relevant.
- Avoid overlapping labels/edges.
- Include a text/table alternative where practical.
- Have a unique resource path and accessible description.
- Be stored in `component_diagrams` with a descriptive title such as “State Diagram”.

## 13. SVG and equation content conventions

### 13.1 SVG paths

Use stable paths, for example:
- `/assets/svg/counters/decade-counter-state.svg`
- `/assets/svg/counters/mod8-up-counter-state.svg`
- `/assets/svg/flipflops/jk-flip-flop-state.svg`
- `/assets/svg/logic-gates/and-gate.svg`
- `/assets/svg/diodes/led-series-resistor.svg`

These paths are examples. Verify each file exists before publishing the record. Missing media should yield a graceful placeholder message, not a broken-image icon.

### 13.2 LaTeX

Store equation strings as LaTeX source, not as screenshots. Keep equations in their own content records, separate from characteristic/truth/excitation tables. Examples:
- JK flip-flop characteristic equation: `Q_{next}=J\\overline{Q}+\\overline{K}Q`
- Counter state relationship: `N_{next}=(N+1)\\bmod M`

These are examples; verify equations against the intended component/logic convention before seeding. Do not put Markdown delimiters or HTML in the stored equation field unless the API contract explicitly requires them.

## 14. Security, transactions, and operational quality

- Keep `.env` out of version control; provide `.env.example` without real credentials.
- Use a least-privilege application database account.
- Separate schema owner/DBA access from the runtime application account.
- Use password hashing for application login data; never store plaintext passwords.
- Use parameterized SQL for all data values.
- Whitelist filter fields, sort fields, table names, join types, and aggregate functions.
- Validate and normalize data on the server, then enforce integrity in the database.
- Use transaction boundaries for operations that insert/update related rows.
- Use a connection pool and release connections in `finally` blocks.
- Add request-size limits, safe error handling, and rate limits if exposed publicly.
- Serve static resources with correct content types and safe paths.
- Log operational errors without logging credentials, passwords, or sensitive payloads.
- Add tests for invalid IDs, empty results, malformed JSON table content, unavailable SVGs, invalid LaTeX fallback, SQL injection attempts, and trigger exceptions.

## 15. Acceptance checklist

### Catalogue
- [ ] Category tree supports arbitrary depth.
- [ ] Category pages show children and assigned components together when both exist.
- [ ] Search uses backend data and pagination.
- [ ] Detail page loads common fields and only present content sections.
- [ ] Tables, LaTeX equations, SVG diagrams, timing diagrams, graphs, documents, and specs render safely.
- [ ] Characteristic table and equation remain separate.
- [ ] State-machine diagrams are included for relevant sequential components.
- [ ] Missing data and bad IDs do not crash the application.

### Database and Assignment 10
- [ ] CRUD procedures exist separately.
- [ ] Database accounts/roles are documented and least-privilege.
- [ ] Login-data CRUD is demonstrated separately from public catalogue behavior.
- [ ] Explicit cursor examples: unbounded and limited/bulk-fetch.
- [ ] Paginated search exists with and without filtering.
- [ ] Sum example exists without grouping and with grouping.
- [ ] BEFORE trigger tests at least two integrity rules.
- [ ] Uppercase statement-trigger requirement is implemented validly for MySQL and tested.
- [ ] AFTER DML audit trigger logs insert/update/delete.
- [ ] Restricted-hours trigger blocks modifications Monday 14:00–16:00 and gives a clear message.

### Assignment 11
- [ ] Eight required query demonstrations are saved.
- [ ] At least two indexes are justified and created.
- [ ] Before/after execution timings are measured and analyzed.
- [ ] A view joins two tables and its behavior is demonstrated.
- [ ] Procedure/trigger interaction with the view is explained and tested.
- [ ] Frontend has CRUD navigation and forms.
- [ ] Aggregate/filter controls execute approved query templates.
- [ ] Join selectors include two table selectors and a join type.
- [ ] Subquery and correlated-subquery demonstrations work.
- [ ] Dashboard reports statistics for all relevant tables.
- [ ] XML output exists for query 1, query 3, and query 4 only, as specified.

### Engineering
- [ ] Setup instructions work from a clean checkout.
- [ ] No secrets are committed.
- [ ] Database scripts execute in documented order.
- [ ] API and frontend tests pass.
- [ ] Figma handoff is mapped to reusable components and data states.
- [ ] Any deviations from this guideline are recorded in the change log.
