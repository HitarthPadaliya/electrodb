const { configured, query, closePool } = require('../server/src/db/pool');
(async () => {
  if (!configured()) {
    console.error('Database is not configured. Copy .env.example to .env and set MySQL values.');
    process.exitCode = 1;
    return;
  }
  try {
    const rows = await query(`SELECT 'categories' AS table_name,COUNT(*) AS row_count FROM categories
      UNION ALL SELECT 'components',COUNT(*) FROM components
      UNION ALL SELECT 'component_content',COUNT(*) FROM component_content
      UNION ALL SELECT 'component_diagrams',COUNT(*) FROM component_diagrams`);
    console.table(rows);
  } catch (error) {
    console.error(`Database verification failed: ${error.message}`);
    process.exitCode = 1;
  } finally { await closePool(); }
})();
