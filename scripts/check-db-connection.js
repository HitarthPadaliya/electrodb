const { pool } = require('../src/db');
const { config } = require('../src/config');

async function main() {
  console.log('Testing ElectroDB MySQL Database Connection...');
  console.log(`Target: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}`);

  try {
    const health = await pool.checkHealth();
    console.log(' Connection SUCCESSFUL!');
    console.log('Server Details:', health);

    const [tables] = await pool.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables/views in database:`);
    tables.forEach(t => console.log(` - ${Object.values(t)[0]}`));

    const [counts] = await pool.query(
      `SELECT 'categories' AS tbl, COUNT(*) AS count FROM categories
       UNION ALL SELECT 'components', COUNT(*) FROM components
       UNION ALL SELECT 'component_content', COUNT(*) FROM component_content
       UNION ALL SELECT 'component_diagrams', COUNT(*) FROM component_diagrams
       UNION ALL SELECT 'specifications', COUNT(*) FROM specifications
       UNION ALL SELECT 'tags', COUNT(*) FROM tags`
    );

    console.log('\nRow Counts:');
    counts.forEach(c => console.log(` - ${c.tbl.padEnd(25)}: ${c.count}`));

  } catch (err) {
    console.error(' Connection FAILED:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.closePool();
  }
}

main();
