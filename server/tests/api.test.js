const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const pool = require('../src/db/pool');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, reqOptions, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let json = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            json = JSON.parse(data);
          } catch (e) {
            // keep json null
          }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

before(async () => {
  await new Promise(resolve => {
    // Listen on port 0 for an ephemeral test port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await pool.closePool();
});

describe('ElectroDB Catalogue API Tests', () => {
  it('GET /api/health should report healthy database status', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.status, 'ok');
    assert.strictEqual(res.json.database, 'connected');
    assert.strictEqual(res.json.details.healthy, 1);
  });

  it('GET /api/categories should return top-level categories tree', async () => {
    const res = await request('/api/categories');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data));
    assert.ok(res.json.data.length >= 5);
    const digital = res.json.data.find(c => c.name === 'Digital Electronics');
    assert.ok(digital, 'Digital Electronics category should exist');
    assert.ok(Array.isArray(digital.children), 'Digital Electronics should have child subcategories');
  });

  it('GET /api/categories/:id should return category detail with components', async () => {
    const res = await request('/api/categories/6'); // 6 is Counters
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.category.name, 'Counters');
    assert.ok(Array.isArray(res.json.data.breadcrumbs));
    assert.ok(Array.isArray(res.json.data.components));
    assert.ok(res.json.data.components.length > 0);
  });

  it('GET /api/categories/:id/components should return paginated components', async () => {
    const res = await request('/api/categories/6/components?page=1&pageSize=5');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data));
    assert.strictEqual(res.json.data.length, 5);
    assert.strictEqual(res.json.pagination.page, 1);
  });

  it('GET /api/categories/:id/content-template should return expected sections', async () => {
    const res = await request('/api/categories/7/content-template'); // 7 is Flip-Flops
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data));
    const sectionKeys = res.json.data.map(s => s.section_key);
    assert.ok(sectionKeys.includes('truth_table'));
    assert.ok(sectionKeys.includes('characteristic_equation'));
  });

  it('GET /api/components/:id should return component detail with content, diagrams, and specs', async () => {
    const res = await request('/api/components/jk-flip-flop');
    assert.strictEqual(res.status, 200);
    const comp = res.json.data;
    assert.strictEqual(comp.name, 'JK Flip-Flop');
    assert.strictEqual(comp.category.name, 'Flip-Flops');
    assert.ok(Array.isArray(comp.content), 'Content sections should be array');
    assert.ok(Array.isArray(comp.diagrams), 'Diagrams should be array');

    // Verify truth_table is parsed JSON
    const truthTable = comp.content.find(c => c.sectionKey === 'truth_table');
    assert.ok(truthTable, 'Truth table section must exist');
    assert.ok(truthTable.content.columns, 'Truth table should have columns');
    assert.ok(truthTable.content.rows, 'Truth table should have rows');

    // Verify characteristic equation LaTeX
    const charEq = comp.content.find(c => c.sectionKey === 'characteristic_equation');
    assert.ok(charEq, 'Characteristic equation must exist');
    assert.ok(typeof charEq.content === 'string');
    assert.ok(charEq.content.includes('Q_{next}'));

    // Verify diagram asset path and kind
    assert.ok(comp.diagrams.length > 0);
    assert.ok(comp.diagrams[0].imagePath.endsWith('.svg'));

    const kinds = comp.diagrams.map(d => d.kind);
    assert.ok(kinds.includes('SYMBOL'), 'A pin-level symbol diagram must be present');
    assert.ok(kinds.includes('CIRCUIT'), 'A gate/device-level circuit diagram must be present');

    const circuit = comp.diagrams.find(d => d.kind === 'CIRCUIT');
    assert.ok(
      circuit.imagePath.startsWith('/assets/svg/circuits/'),
      'Circuit diagrams live under /assets/svg/circuits/'
    );

    // The design reference drawing is shipped verbatim for the JK flip-flop.
    assert.strictEqual(circuit.imagePath, '/assets/svg/circuits/jk-flip-flop-circuit.svg');

    // The IC pinout is served alongside the specifications.
    assert.ok(kinds.includes('PINOUT'), 'An IC pinout diagram must be present');
    const pinout = comp.diagrams.find(d => d.kind === 'PINOUT');
    assert.ok(
      pinout.imagePath.startsWith('/assets/svg/pinouts/'),
      'Pinouts live under /assets/svg/pinouts/'
    );
  });

  it('GET /api/components/:id should pair every logic gate with its IC pinout instead of a circuit', async () => {
    for (const slug of ['and-gate', 'nand-gate', 'xor-gate']) {
      const res = await request(`/api/components/${slug}`);
      assert.strictEqual(res.status, 200, `${slug} should resolve`);
      const kinds = res.json.data.diagrams.map(d => d.kind);

      assert.ok(!kinds.includes('CIRCUIT'), `${slug} must not ship a circuit diagram`);
      assert.ok(kinds.includes('PINOUT'), `${slug} must show its IC pinout`);
    }
  });

  it('GET /api/components/:id should not classify components with an educational tag', async () => {
    const res = await request('/api/components/jk-flip-flop');
    assert.strictEqual(res.status, 200);
    const slugs = res.json.data.tags.map(t => t.slug);
    assert.ok(!slugs.includes('educational-example'), 'The #educational-example tag was removed from the seed');
  });

  it('GET /api/components/non-existent-id should return 404 error envelope', async () => {
    const res = await request('/api/components/9999999');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.json.error.code, 'NOT_FOUND');
  });

  it('GET /api/search?q=counter should return matching search results', async () => {
    const res = await request('/api/search?q=counter');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data.items));
    assert.ok(res.json.data.items.length > 0);
  });

  it('GET /api/components should return the paginated public catalog', async () => {
    const res = await request('/api/components?page=1&pageSize=5');
    assert.strictEqual(res.status, 200);
    const { items, pagination } = res.json.data;
    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);
    assert.ok(items.length <= 5);
    assert.strictEqual(pagination.page, 1);
    assert.ok(pagination.total > 0);
    assert.ok(items[0].category_name, 'Catalog rows should include the category name');
  });

  it('GET /api/components?categoryId=6 should only return that category', async () => {
    const res = await request('/api/components?categoryId=6&pageSize=100');
    assert.strictEqual(res.status, 200);
    assert.ok(res.json.data.items.length > 0);
    assert.ok(res.json.data.items.every(item => item.category_id === 6));
  });

  it('GET /api/components?categoryId=abc should reject a malformed category filter', async () => {
    const res = await request('/api/components?categoryId=abc');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.json.error.code, 'BAD_REQUEST');
  });

  it('GET /api/tags should list tags with published component counts', async () => {
    const res = await request('/api/tags');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data));
    assert.ok(res.json.data.length > 0);
    const digital = res.json.data.find(tag => tag.slug === 'digital');
    assert.ok(digital, 'digital tag should exist');
    assert.ok(digital.component_count > 0);
  });

  it('GET /api/tags/:slug should return tagged components and a pagination envelope', async () => {
    const res = await request('/api/tags/digital?page=1&pageSize=5');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.tag.slug, 'digital');
    assert.ok(Array.isArray(res.json.data.components));
    assert.ok(res.json.data.components.length <= 5);
    assert.ok(res.json.data.pagination.total > 0);
  });

  it('GET /api/tags/non-existent-tag should return a 404 error envelope', async () => {
    const res = await request('/api/tags/not-a-real-tag');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.json.error.code, 'NOT_FOUND');
  });

  it('GET /api/components/:id should include tag pills data', async () => {
    const res = await request('/api/components/jk-flip-flop');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data.tags));
    assert.ok(res.json.data.tags.length > 0);
    assert.ok(res.json.data.tags[0].slug);
  });
});

describe('ElectroDB Assignment 10 & 11 Lab Console Tests', () => {
  it('GET /api/lab/components should return Query 1 full-table results', async () => {
    const res = await request('/api/lab/components?page=1&pageSize=10');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 1);
    assert.strictEqual(res.json.data.items.length, 10);
  });

  it('GET /api/lab/components.xml should return Query 1 XML serialization', async () => {
    const res = await request('/api/lab/components.xml?page=1&pageSize=5');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('application/xml'));
    assert.ok(res.body.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(res.body.includes('<assignment11_query1>'));
    assert.ok(res.body.includes('<component>'));
  });

  it('GET /api/lab/aggregate should return Query 3 aggregate result in JSON', async () => {
    const res = await request('/api/lab/aggregate?function=count&field=component_id');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 3);
    assert.strictEqual(res.json.data.function, 'COUNT');
    assert.ok(res.json.data.value >= 140);
  });

  it('GET /api/lab/aggregate.xml should return Query 3 aggregate in XML', async () => {
    const res = await request('/api/lab/aggregate.xml?function=count&field=component_id');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('application/xml'));
    assert.ok(res.body.includes('<assignment11_query3>'));
  });

  it('GET /api/lab/filter should return Query 4 conditional filter result in JSON', async () => {
    const res = await request('/api/lab/filter?field=category_id&operator=eq&value=6');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 4);
    assert.ok(res.json.data.items.length > 0);
  });

  it('GET /api/lab/filter.xml should return Query 4 conditional filter in XML', async () => {
    const res = await request('/api/lab/filter.xml?field=category_id&operator=eq&value=6');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('application/xml'));
    assert.ok(res.body.includes('<assignment11_query4>'));
  });

  it('GET /api/lab/join should execute Query 5 two-table join', async () => {
    const res = await request('/api/lab/join?left=components&right=categories&type=inner&pageSize=5');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 5);
    assert.ok(res.json.data.rows.length > 0);
    assert.ok(res.json.data.rows[0].joined_name);
  });

  it('GET /api/lab/subquery should execute Query 6 subquery', async () => {
    const res = await request('/api/lab/subquery');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 6);
    assert.ok(Array.isArray(res.json.data.rows));
  });

  it('GET /api/lab/correlated-query should execute Query 7 correlated query', async () => {
    const res = await request('/api/lab/correlated-query');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.queryId, 7);
    assert.ok(Array.isArray(res.json.data.rows));
  });

  it('GET /api/lab/cursors/all and /cursors/limited should execute cursor procedures', async () => {
    const allRes = await request('/api/lab/cursors/all');
    assert.strictEqual(allRes.status, 200);
    assert.ok(allRes.json.data.rowCount >= 140);

    const limRes = await request('/api/lab/cursors/limited?limit=3');
    assert.strictEqual(limRes.status, 200);
    assert.strictEqual(limRes.json.data.rowCount, 3);
  });

  it('GET /api/lab/sum should execute ungrouped and grouped sums', async () => {
    const res = await request('/api/lab/sum');
    assert.strictEqual(res.status, 200);
    assert.ok(Number(res.json.data.ungrouped.totalSum) > 0);
    assert.ok(Array.isArray(res.json.data.grouped.items));
  });

  it('GET /api/lab/dashboard should return live statistics for all 10 tables', async () => {
    const res = await request('/api/lab/dashboard');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.json.data.tables));
    const tableNames = res.json.data.tables.map(t => t.table_name);
    assert.ok(tableNames.includes('components'));
    assert.ok(tableNames.includes('categories'));
    assert.ok(tableNames.includes('component_content'));
    assert.ok(tableNames.includes('component_diagrams'));
    assert.ok(tableNames.includes('specifications'));
    assert.ok(tableNames.includes('application_audit_log'));
  });

  it('GET /api/lab/views/catalogue and /views/counts should query views', async () => {
    const catRes = await request('/api/lab/views/catalogue?pageSize=5');
    assert.strictEqual(catRes.status, 200);
    assert.ok(catRes.json.data.items.length > 0);

    const countsRes = await request('/api/lab/views/counts');
    assert.strictEqual(countsRes.status, 200);
    assert.ok(countsRes.json.data.items.length > 0);
  });

  it('Should perform component CRUD via stored procedures and log to audit log', async () => {
    // 1. Insert via SP
    const insertRes = await request('/api/lab/components', {
      method: 'POST',
      body: {
        categoryId: 8,
        name: 'Unit Test Stored Proc Gate',
        slug: 'unit-test-sp-gate',
        shortDescription: 'Gate created to test sp_insert_component'
      }
    });
    assert.strictEqual(insertRes.status, 201);
    const newId = insertRes.json.data.componentId;
    assert.ok(newId, 'New component ID should be returned');

    // 2. Update via SP
    const updateRes = await request(`/api/lab/components/${newId}`, {
      method: 'PATCH',
      body: {
        categoryId: 8,
        name: 'Updated Unit Test Gate',
        shortDescription: 'Updated description'
      }
    });
    assert.strictEqual(updateRes.status, 200);

    // 3. Delete via SP
    const deleteRes = await request(`/api/lab/components/${newId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);

    // 4. Verify audit log captured the operations
    const auditRes = await request('/api/lab/audit-log?limit=10');
    assert.strictEqual(auditRes.status, 200);
    assert.ok(Array.isArray(auditRes.json.data));
    const operations = auditRes.json.data.map(l => l.operation_type);
    assert.ok(operations.includes('DELETE') || operations.includes('INSERT') || operations.includes('UPDATE'));
  });
});
