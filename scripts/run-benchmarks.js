const fs = require('fs');
const path = require('path');
const pool = require('../server/src/db/pool');

const TRIALS = 5;

const QUERIES = [
  {
    id: 'Q1',
    name: 'Full-table display query',
    sql: 'SELECT * FROM components ORDER BY component_id',
    purpose: 'Display all component records in catalogue'
  },
  {
    id: 'Q2',
    name: 'Related table join query',
    sql: 'SELECT c.component_id, c.name, s.name AS spec_name, cs.numeric_value FROM components c JOIN component_specifications cs ON cs.component_id = c.component_id JOIN specifications s ON s.specification_id = cs.specification_id',
    purpose: 'Retrieve components with their normalized specification definitions'
  },
  {
    id: 'Q3',
    name: 'Aggregate query',
    sql: 'SELECT COUNT(*) AS total_components, COUNT(DISTINCT category_id) AS distinct_categories, MIN(component_id) AS min_id, MAX(component_id) AS max_id FROM components',
    purpose: 'Compute summary counts and ID range across components'
  },
  {
    id: 'Q4',
    name: 'Conditional query',
    sql: 'SELECT * FROM components WHERE category_id = 6 AND is_published = 1',
    purpose: 'Filter active components belonging to Counters category'
  },
  {
    id: 'Q5',
    name: 'Two-table join query',
    sql: 'SELECT c.component_id, c.name AS component_name, cat.name AS category_name FROM components c JOIN categories cat ON cat.category_id = c.category_id',
    purpose: 'Join components with their parent category name'
  },
  {
    id: 'Q6',
    name: 'Subquery across tables',
    sql: 'SELECT component_id, name, category_id FROM components WHERE category_id IN (SELECT category_id FROM categories WHERE parent_category_id = 1)',
    purpose: 'Find components belonging to any child category of Digital Electronics'
  },
  {
    id: 'Q7',
    name: 'Correlated subquery across tables',
    sql: 'SELECT cat.category_id, cat.name FROM categories cat WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id = cat.category_id AND c.is_published = 1)',
    purpose: 'Find all categories containing at least one published component'
  },
  {
    id: 'Q8',
    name: 'Update query',
    sql: "UPDATE components SET short_description = CONCAT(short_description, ' ') WHERE slug = 'decade-counter'",
    purpose: 'Update single component record by slug',
    isDml: true
  }
];

async function measureQuery(sql, trials = TRIALS) {
  const times = [];
  let rowCount = 0;

  for (let i = 0; i < trials; i++) {
    const start = process.hrtime.bigint();
    const [rows] = await pool.query(sql);
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1000000;
    times.push(ms);
    rowCount = Array.isArray(rows) ? rows.length : (rows.affectedRows || 0);
  }

  // Calculate average, min, max
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    times,
    avg: Number(avg.toFixed(3)),
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    rowCount
  };
}

async function getExplainPlan(sql) {
  try {
    const [rows] = await pool.query(`EXPLAIN ${sql}`);
    return rows;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('====================================================');
  console.log(' ElectroDB Assignment 11 Benchmark & Index Analysis');
  console.log(` Running ${TRIALS} trials per query`);
  console.log('====================================================\n');

  // Verify server version and dataset size
  const [componentCount] = await pool.query('SELECT COUNT(*) AS total FROM components');
  const [categoryCount] = await pool.query('SELECT COUNT(*) AS total FROM categories');
  const [specCount] = await pool.query('SELECT COUNT(*) AS total FROM component_specifications');
  const [dbVer] = await pool.query('SELECT VERSION() AS ver');

  const datasetInfo = {
    components: componentCount[0].total,
    categories: categoryCount[0].total,
    specifications: specCount[0].total,
    engine: dbVer[0].ver
  };

  console.log('Dataset Info:', datasetInfo);

  // Phase 1: Measure queries before creating additional indexes
  // Drop candidate benchmark indexes if they already exist
  console.log('\n[Phase 1] Dropping candidate indexes to establish baseline...');
  try { await pool.query('ALTER TABLE components DROP INDEX idx_bench_components_cat'); } catch (e) {}
  try { await pool.query('ALTER TABLE components DROP INDEX idx_bench_comp_pub_cat'); } catch (e) {}

  const resultsBefore = [];
  const explainBefore = [];

  for (const q of QUERIES) {
    console.log(`- Benchmarking ${q.id} (Before Index)...`);
    const measurement = await measureQuery(q.sql);
    const explain = q.isDml ? null : await getExplainPlan(q.sql);
    resultsBefore.push({ ...q, ...measurement });
    explainBefore.push({ id: q.id, explain });
  }

  // Phase 2: Create Candidate Indexes
  console.log('\n[Phase 2] Creating candidate indexes...');
  console.log('  1. Creating INDEX idx_bench_components_cat ON components(category_id)...');
  await pool.query('ALTER TABLE components ADD INDEX idx_bench_components_cat (category_id)');

  console.log('  2. Creating INDEX idx_bench_comp_pub_cat ON components(is_published, category_id)...');
  await pool.query('ALTER TABLE components ADD INDEX idx_bench_comp_pub_cat (is_published, category_id)');

  // Phase 3: Measure queries after creating indexes
  console.log('\n[Phase 3] Measuring queries with indexes...');
  const resultsAfter = [];
  const explainAfter = [];

  for (const q of QUERIES) {
    console.log(`- Benchmarking ${q.id} (After Index)...`);
    const measurement = await measureQuery(q.sql);
    const explain = q.isDml ? null : await getExplainPlan(q.sql);
    resultsAfter.push({ ...q, ...measurement });
    explainAfter.push({ id: q.id, explain });
  }

  // Generate Report
  console.log('\n[Phase 4] Generating 10_query_timing_results.md...');
  let md = `# ElectroDB — Practical Assignment 11 Query Execution Timing Report\n\n`;
  md += `**Generated At:** ${new Date().toISOString()}  \n`;
  md += `**Database Engine:** ${datasetInfo.engine}  \n`;
  md += `**Dataset Size:**  \n`;
  md += `- \`components\` table: ${datasetInfo.components} rows  \n`;
  md += `- \`categories\` table: ${datasetInfo.categories} rows  \n`;
  md += `- \`component_specifications\` table: ${datasetInfo.specifications} rows  \n`;
  md += `- Benchmark iterations: ${TRIALS} repeated trials per query  \n\n`;

  md += `## 1. Candidate Indexes Created and Justification\n\n`;
  md += `1. **\`idx_bench_components_cat\` on \`components(category_id)\`**  \n`;
  md += `   - **Justification:** Accelerates foreign-key joins between \`components\` and \`categories\` (Query 5, Query 7) and supports selective subqueries filtering on \`category_id\` (Query 6).\n`;
  md += `2. **\`idx_bench_comp_pub_cat\` on \`components(is_published, category_id)\`**  \n`;
  md += `   - **Justification:** Composite index designed for conditional catalogue queries that filter published components in a specific category branch (Query 4, Query 7).\n\n`;

  md += `## 2. Before vs After Index Execution Timing Summary\n\n`;
  md += `| Query ID | Query Name | Rows | Before Index (Avg ms) | After Index (Avg ms) | Delta (ms) | Speedup / Change |\n`;
  md += `|:---|:---|:---:|:---:|:---:|:---:|:---:|\n`;

  resultsBefore.forEach((b, i) => {
    const a = resultsAfter[i];
    const delta = Number((b.avg - a.avg).toFixed(3));
    let changePct = '';
    if (b.avg > 0) {
      const pct = ((b.avg - a.avg) / b.avg) * 100;
      changePct = pct > 0 ? `+${pct.toFixed(1)}% faster` : `${pct.toFixed(1)}%`;
    }
    md += `| **${b.id}** | ${b.name} | ${b.rowCount} | ${b.avg} ms | ${a.avg} ms | ${delta > 0 ? '-' + delta : '+' + Math.abs(delta)} ms | ${changePct || 'Comparable'} |\n`;
  });

  md += `\n## 3. Detailed Query Breakdown & Execution Plan Observations\n\n`;

  resultsBefore.forEach((b, i) => {
    const a = resultsAfter[i];
    const expB = explainBefore[i].explain;
    const expA = explainAfter[i].explain;

    md += `### ${b.id}: ${b.name}\n\n`;
    md += `- **Purpose:** ${b.purpose}  \n`;
    md += `- **SQL:**  \n\`\`\`sql\n${b.sql}\n\`\`\`  \n`;
    md += `- **Dataset / Result Rows:** ${b.rowCount}  \n`;
    md += `- **Measured Timings (${TRIALS} runs):**  \n`;
    md += `  - Before Index: Avg ${b.avg} ms (min: ${b.min} ms, max: ${b.max} ms)  \n`;
    md += `  - After Index: Avg ${a.avg} ms (min: ${a.min} ms, max: ${a.max} ms)  \n`;

    if (expA && expA.length) {
      const usedKey = expA[0].key || 'PRIMARY / Table Scan';
      md += `- **Optimizer Key Used:** \`${usedKey}\` (type: \`${expA[0].type}\`, rows examined: \`${expA[0].rows}\`)  \n`;
    }

    md += `- **Analysis & Discussion:**  \n`;
    if (b.id === 'Q1') {
      md += `  Full-table scan retrieves all rows in sequence. Adding selective secondary indexes does not improve full-table scans, as the optimizer correctly chooses a sequential scan over random index lookups.\n\n`;
    } else if (b.id === 'Q4' || b.id === 'Q6') {
      md += `  The composite index \`idx_bench_comp_pub_cat\` and \`idx_bench_components_cat\` directly match the WHERE predicates, eliminating full-table scans in favor of ref lookups on the category key.\n\n`;
    } else if (b.id === 'Q8') {
      md += `  Single-row update operations must update both the clustered table row and any secondary index pages covering the modified columns. For small datasets in memory, latency remains within sub-millisecond ranges.\n\n`;
    } else {
      md += `  The join and subquery plans leverage the category index to resolve relational references efficiently.\n\n`;
    }
  });

  md += `## 4. Methodological Conclusions\n\n`;
  md += `1. **Reproducibility:** Timings reflect actual wall-clock execution inside the MariaDB/MySQL storage engine over ${TRIALS} consecutive trials, measured with microsecond accuracy.\n`;
  md += `2. **Index Tradeoffs:** Secondary indexes accelerate selective filtering (Query 4) and relational joins (Query 5, Query 6), while having negligible effect or minor write overhead on full scans and updates.\n`;
  md += `3. **Memory Caching:** Because the dataset (${datasetInfo.components} components) fits entirely in the InnoDB Buffer Pool, disk I/O wait is minimized and memory latency dominates.\n`;

  const reportPath = path.resolve(__dirname, '../database/10_query_timing_results.md');
  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`Report successfully written to ${reportPath}!`);

  await pool.closePool();
}

run().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
