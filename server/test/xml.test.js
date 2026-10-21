const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeXml, toXml } = require('../src/serializers/xml');

test('XML escaping protects text and attribute-like characters', () => {
  assert.equal(escapeXml(`<tag a="b">'&</tag>`), '&lt;tag a=&quot;b&quot;&gt;&apos;&amp;&lt;/tag&gt;');
});

test('XML serializer emits rows with safe element names', () => {
  const xml = toXml('components', [{ 'component name': '<Gate & chip>', id: 3 }]);
  assert.match(xml, /<component_name>&lt;Gate &amp; chip&gt;<\/component_name>/);
  assert.match(xml, /<id>3<\/id>/);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
});
