const fs = require('fs');
const path = require('path');
const http = require('http');
const pool = require('../server/src/db/pool');
const app = require('../server/src/app');

async function testHttp(port, path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('====================================================');
  console.log(' ElectroDB System Verification Suite');
  console.log('====================================================\n');

  let errors = 0;

  // 1. Check database connectivity
  process.stdout.write('1. Checking MySQL/MariaDB database connection... ');
  try {
    const health = await pool.checkHealth();
    console.log(`[PASS] (${health.db_version})`);
  } catch (e) {
    console.log(`[FAIL] (${e.message})`);
    errors++;
  }

  // 2. Check required tables and views
  process.stdout.write('2. Checking database schema tables & views... ');
  const expectedTables = [
    'categories', 'tags', 'components', 'component_tags', 'content_types',
    'category_content_types', 'component_content', 'component_diagrams',
    'specifications', 'component_specifications', 'app_users', 'application_audit_log',
    'v_component_catalogue', 'v_category_component_counts'
  ];

  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = new Set(tables.map(t => Object.values(t)[0]));
    const missing = expectedTables.filter(t => !tableNames.has(t));
    if (missing.length === 0) {
      console.log(`[PASS] (All ${expectedTables.length} tables/views present)`);
    } else {
      console.log(`[FAIL] (Missing: ${missing.join(', ')})`);
      errors++;
    }
  } catch (e) {
    console.log(`[FAIL] (${e.message})`);
    errors++;
  }

  // 3. Check stored procedures
  process.stdout.write('3. Checking stored procedures & functions... ');
  const expectedProcedures = [
    'sp_insert_component', 'sp_update_component', 'sp_delete_component',
    'sp_cursor_components_all', 'sp_cursor_components_limited',
    'sp_search_components_page', 'sp_search_components_by_category',
    'sp_sum_component_ids_by_category', 'sp_insert_app_user',
    'sp_update_app_user', 'sp_delete_app_user'
  ];

  try {
    const [procs] = await pool.query("SHOW PROCEDURE STATUS WHERE Db='electrodb'");
    const procNames = new Set(procs.map(p => p.Name));
    const missingProcs = expectedProcedures.filter(p => !procNames.has(p));
    if (missingProcs.length === 0) {
      console.log(`[PASS] (All ${expectedProcedures.length} procedures present)`);
    } else {
      console.log(`[FAIL] (Missing: ${missingProcs.join(', ')})`);
      errors++;
    }
  } catch (e) {
    console.log(`[FAIL] (${e.message})`);
    errors++;
  }

  // 4. Check triggers
  process.stdout.write('4. Checking database triggers... ');
  try {
    const [trigs] = await pool.query("SHOW TRIGGERS FROM electrodb");
    if (trigs.length >= 7) {
      console.log(`[PASS] (${trigs.length} triggers active)`);
    } else {
      console.log(`[WARN] (${trigs.length} triggers found)`);
    }
  } catch (e) {
    console.log(`[FAIL] (${e.message})`);
    errors++;
  }

  // 5. Check static assets
  process.stdout.write('5. Checking SVG diagrams and web assets... ');
  const keyFiles = [
    'public/index.html',
    'public/assets/css/styles.css',
    'public/assets/js/api.js',
    'public/assets/js/app.js',
    'public/assets/svg/counters/decade-counter-state.svg',
    'public/assets/svg/counters/mod8-up-counter-state.svg',
    'public/assets/svg/flipflops/jk-flip-flop-state.svg',
    'public/assets/svg/gates/and.svg',
    'database/10_query_timing_results.md'
  ];

  const missingFiles = keyFiles.filter(f => !fs.existsSync(path.resolve(__dirname, '..', f)));
  if (missingFiles.length === 0) {
    console.log('[PASS] (All key files present)');
  } else {
    console.log(`[FAIL] (Missing files: ${missingFiles.join(', ')})`);
    errors++;
  }

  // 6. Test Express HTTP server & API endpoints
  process.stdout.write('6. Testing HTTP Server & API endpoints... ');
  let server;
  try {
    await new Promise(resolve => {
      server = app.listen(0, resolve);
    });
    const port = server.address().port;

    const health = await testHttp(port, '/api/health');
    if (health.status !== 200) throw new Error(`Health status ${health.status}`);

    const categories = await testHttp(port, '/api/categories');
    if (categories.status !== 200) throw new Error(`Categories status ${categories.status}`);

    const xml = await testHttp(port, '/api/lab/components.xml');
    if (xml.status !== 200 || !xml.data.includes('<assignment11_query1>')) {
      throw new Error('XML serialization failed');
    }

    console.log('[PASS] (HTTP 200 on /health, /categories, /lab/components.xml)');
  } catch (e) {
    console.log(`[FAIL] (${e.message})`);
    errors++;
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.closePool();
  }

  console.log('\n====================================================');
  if (errors === 0) {
    console.log(' All ElectroDB system verification checks PASSED!');
    console.log(' Project is complete, verified, and ready to run.');
    console.log('====================================================');
  } else {
    console.log(` Verification completed with ${errors} error(s).`);
    console.log('====================================================');
    process.exit(1);
  }
}

verify();
