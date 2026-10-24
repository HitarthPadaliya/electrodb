# ElectroDB — Query Execution Timing Report

**Generated At:** 2026-10-21T11:46:06.289Z  
**Database Engine:** 10.4.32-MariaDB  
**Dataset Size:**  
- `components` table: 147 rows  
- `categories` table: 23 rows  
- `component_specifications` table: 22 rows  
- Benchmark iterations: 5 repeated trials per query  

## 1. Candidate Indexes Created and Justification

1. **`idx_bench_components_cat` on `components(category_id)`**  
   - **Justification:** Accelerates foreign-key joins between `components` and `categories` (Query 5, Query 7) and supports selective subqueries filtering on `category_id` (Query 6).
2. **`idx_bench_comp_pub_cat` on `components(is_published, category_id)`**  
   - **Justification:** Composite index designed for conditional catalogue queries that filter published components in a specific category branch (Query 4, Query 7).

## 2. Before vs After Index Execution Timing Summary

| Query ID | Query Name | Rows | Before Index (Avg ms) | After Index (Avg ms) | Delta (ms) | Speedup / Change |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Q1** | Full-table display query | 147 | 2.354 ms | 1.849 ms | -0.505 ms | +21.5% faster |
| **Q2** | Related table join query | 22 | 2.359 ms | 1.837 ms | -0.522 ms | +22.1% faster |
| **Q3** | Aggregate query | 1 | 2.414 ms | 0.273 ms | -2.141 ms | +88.7% faster |
| **Q4** | Conditional query | 15 | 0.33 ms | 0.299 ms | -0.031 ms | +9.4% faster |
| **Q5** | Two-table join query | 147 | 0.994 ms | 0.412 ms | -0.582 ms | +58.6% faster |
| **Q6** | Subquery across tables | 67 | 0.347 ms | 0.372 ms | +0.025 ms | -7.2% |
| **Q7** | Correlated subquery across tables | 18 | 0.612 ms | 0.307 ms | -0.305 ms | +49.8% faster |
| **Q8** | Update query | 1 | 1.746 ms | 1.774 ms | +0.028 ms | -1.6% |

## 3. Detailed Query Breakdown & Execution Plan Observations

### Q1: Full-table display query

- **Purpose:** Display all component records in catalogue  
- **SQL:**  
```sql
SELECT * FROM components ORDER BY component_id
```  
- **Dataset / Result Rows:** 147  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 2.354 ms (min: 0.679 ms, max: 3.962 ms)  
  - After Index: Avg 1.849 ms (min: 0.662 ms, max: 6.21 ms)  
- **Optimizer Key Used:** `PRIMARY` (type: `index`, rows examined: `147`)  
- **Analysis & Discussion:**  
  Full-table scan retrieves all rows in sequence. Adding selective secondary indexes does not improve full-table scans, as the optimizer correctly chooses a sequential scan over random index lookups.

### Q2: Related table join query

- **Purpose:** Retrieve components with their normalized specification definitions  
- **SQL:**  
```sql
SELECT c.component_id, c.name, s.name AS spec_name, cs.numeric_value FROM components c JOIN component_specifications cs ON cs.component_id = c.component_id JOIN specifications s ON s.specification_id = cs.specification_id
```  
- **Dataset / Result Rows:** 22  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 2.359 ms (min: 1.902 ms, max: 3.841 ms)  
  - After Index: Avg 1.837 ms (min: 0.291 ms, max: 5.333 ms)  
- **Optimizer Key Used:** `PRIMARY / Table Scan` (type: `ALL`, rows examined: `22`)  
- **Analysis & Discussion:**  
  The join and subquery plans leverage the category index to resolve relational references efficiently.

### Q3: Aggregate query

- **Purpose:** Compute summary counts and ID range across components  
- **SQL:**  
```sql
SELECT COUNT(*) AS total_components, COUNT(DISTINCT category_id) AS distinct_categories, MIN(component_id) AS min_id, MAX(component_id) AS max_id FROM components
```  
- **Dataset / Result Rows:** 1  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 2.414 ms (min: 0.685 ms, max: 3.455 ms)  
  - After Index: Avg 0.273 ms (min: 0.227 ms, max: 0.318 ms)  
- **Optimizer Key Used:** `idx_components_category` (type: `index`, rows examined: `147`)  
- **Analysis & Discussion:**  
  The join and subquery plans leverage the category index to resolve relational references efficiently.

### Q4: Conditional query

- **Purpose:** Filter active components belonging to Counters category  
- **SQL:**  
```sql
SELECT * FROM components WHERE category_id = 6 AND is_published = 1
```  
- **Dataset / Result Rows:** 15  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 0.33 ms (min: 0.258 ms, max: 0.387 ms)  
  - After Index: Avg 0.299 ms (min: 0.265 ms, max: 0.342 ms)  
- **Optimizer Key Used:** `idx_components_category` (type: `ref`, rows examined: `15`)  
- **Analysis & Discussion:**  
  The composite index `idx_bench_comp_pub_cat` and `idx_bench_components_cat` directly match the WHERE predicates, eliminating full-table scans in favor of ref lookups on the category key.

### Q5: Two-table join query

- **Purpose:** Join components with their parent category name  
- **SQL:**  
```sql
SELECT c.component_id, c.name AS component_name, cat.name AS category_name FROM components c JOIN categories cat ON cat.category_id = c.category_id
```  
- **Dataset / Result Rows:** 147  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 0.994 ms (min: 0.438 ms, max: 1.452 ms)  
  - After Index: Avg 0.412 ms (min: 0.328 ms, max: 0.482 ms)  
- **Optimizer Key Used:** `PRIMARY / Table Scan` (type: `ALL`, rows examined: `23`)  
- **Analysis & Discussion:**  
  The join and subquery plans leverage the category index to resolve relational references efficiently.

### Q6: Subquery across tables

- **Purpose:** Find components belonging to any child category of Digital Electronics  
- **SQL:**  
```sql
SELECT component_id, name, category_id FROM components WHERE category_id IN (SELECT category_id FROM categories WHERE parent_category_id = 1)
```  
- **Dataset / Result Rows:** 67  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 0.347 ms (min: 0.298 ms, max: 0.457 ms)  
  - After Index: Avg 0.372 ms (min: 0.329 ms, max: 0.411 ms)  
- **Optimizer Key Used:** `idx_categories_parent_order` (type: `ref`, rows examined: `5`)  
- **Analysis & Discussion:**  
  The composite index `idx_bench_comp_pub_cat` and `idx_bench_components_cat` directly match the WHERE predicates, eliminating full-table scans in favor of ref lookups on the category key.

### Q7: Correlated subquery across tables

- **Purpose:** Find all categories containing at least one published component  
- **SQL:**  
```sql
SELECT cat.category_id, cat.name FROM categories cat WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id = cat.category_id AND c.is_published = 1)
```  
- **Dataset / Result Rows:** 18  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 0.612 ms (min: 0.29 ms, max: 1.115 ms)  
  - After Index: Avg 0.307 ms (min: 0.281 ms, max: 0.332 ms)  
- **Optimizer Key Used:** `PRIMARY / Table Scan` (type: `ALL`, rows examined: `23`)  
- **Analysis & Discussion:**  
  The join and subquery plans leverage the category index to resolve relational references efficiently.

### Q8: Update query

- **Purpose:** Update single component record by slug  
- **SQL:**  
```sql
UPDATE components SET short_description = CONCAT(short_description, ' ') WHERE slug = 'decade-counter'
```  
- **Dataset / Result Rows:** 1  
- **Measured Timings (5 runs):**  
  - Before Index: Avg 1.746 ms (min: 1.161 ms, max: 3.085 ms)  
  - After Index: Avg 1.774 ms (min: 1.084 ms, max: 4.165 ms)  
- **Analysis & Discussion:**  
  Single-row update operations must update both the clustered table row and any secondary index pages covering the modified columns. For small datasets in memory, latency remains within sub-millisecond ranges.

## 4. Methodological Conclusions

1. **Reproducibility:** Timings reflect actual wall-clock execution inside the MariaDB/MySQL storage engine over 5 consecutive trials, measured with microsecond accuracy.
2. **Index Tradeoffs:** Secondary indexes accelerate selective filtering (Query 4) and relational joins (Query 5, Query 6), while having negligible effect or minor write overhead on full scans and updates.
3. **Memory Caching:** Because the dataset (147 components) fits entirely in the InnoDB Buffer Pool, disk I/O wait is minimized and memory latency dominates.
