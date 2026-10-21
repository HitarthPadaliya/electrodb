const fs = require('node:fs');
const path = require('node:path');
const sql = fs.readFileSync(path.resolve(__dirname, '../electrodb.sql'), 'utf8');
const paths = [...new Set([
  ...[...sql.matchAll(/'\/assets\/svg\/[^']+\.svg'/g)].map(match => match[0].slice(1, -1)),
  ...['decade-counter', 'mod8-up-counter', 'mod8-down-counter', 'binary-up-counter', 'binary-ripple-counter'].map(slug => `/assets/svg/counters/${slug}-timing.svg`),
  ...['jk-flip-flop', 'master-slave-jk-flip-flop', 'd-flip-flop', 't-flip-flop', 'sr-flip-flop'].map(slug => `/assets/svg/flipflops/${slug}-timing.svg`)
])];
const missing = paths.filter(asset => !fs.existsSync(path.resolve(__dirname, '../public', `.${asset}`)));
const seedStart = sql.indexOf('INSERT INTO components');
const seedEnd = sql.indexOf('-- 14. Component tags', seedStart);
const seedRows = seedStart >= 0 && seedEnd > seedStart
  ? (sql.slice(seedStart, seedEnd).match(/^\(\d+,\s*'[^']+',\s*'[^']+'/gm) || []).length
  : 0;
let failed = false;
if (seedRows < 40 || seedRows > 50) {
  console.error(`Expected 40–50 component seed records, found ${seedRows}.`);
  failed = true;
}
if (missing.length) {
  console.error('Missing SVG asset paths referenced by SQL:');
  missing.forEach(asset => console.error(` - ${asset}`));
  failed = true;
}
if (failed) process.exitCode = 1;
else console.log(`All ${paths.length} SVG paths referenced by SQL exist; ${seedRows} component seed records are within the required 40–50 range.`);
