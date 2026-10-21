function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
}
function toXml(root, rows) {
  const body = rows.map(row => `  <row>${Object.entries(row).map(([key, value]) => `\n    <${key.replace(/[^A-Za-z0-9_.-]/g, '_')}>${escapeXml(value)}</${key.replace(/[^A-Za-z0-9_.-]/g, '_')}>`).join('')}\n  </row>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${body}\n</${root}>`;
}
module.exports = { escapeXml, toXml };
