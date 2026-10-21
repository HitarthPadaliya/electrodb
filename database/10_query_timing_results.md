# Assignment 11 — Query timing report

> Fill this report only with measurements captured from the actual MySQL database. Do not infer or invent timings. Run several comparable trials before and after index changes and note whether the cache was warm.

## Environment

- MySQL version: _record actual version_
- Host / environment: _record local or course environment; do not include credentials_
- Dataset: _record row counts for relevant tables_
- Date/time and server time zone: _record_
- Trial method: _record tool, repetitions, warm-up policy, and elapsed-time measurement method_

## Queries and measurements

| Query | SQL / script reference | Rows returned | Before index (trials) | Index added | After index (trials) | Plan observation / interpretation |
|---|---|---:|---|---|---|---|
| 1 — full table | `SELECT * FROM components` | | | | | |
| 2 — related inserts | See `electrodb.sql` demo comments | n/a | | | | |
| 3 — aggregate | `SELECT COUNT(*) FROM components` | | | | | |
| 4 — conditional | `SELECT * FROM components WHERE category_id = ?` | | | | | |
| 5 — join | components + categories | | | | | |
| 6 — subquery | categories with components | | | | | |
| 7 — correlated query | component count by category | | | | | |
| 8 — update | update one component | n/a | | | | |

## Indexes

The optional experiment script `database/11_assignment11_indexes.sql` defines two additional candidate indexes. Measure before importing/creating them, then run the script once and repeat the same queries. Document exact `CREATE INDEX` statements, target query, selectivity rationale, and write/storage cost. The base schema already contains several indexes; do not count those as newly benchmarked. Record execution-plan observations before and after each change.

## Analysis

Describe measured changes and any query that did not improve or regressed. Full scans on small datasets may be faster without an index. A result with no improvement is valid; explain the optimizer's choice and test conditions.
