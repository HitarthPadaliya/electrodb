/**
 * XML Serializer for Assignment 11 query demonstrations
 */

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Serialize an object to XML tags
 */
function objectToXml(obj, indent = '    ') {
  let xml = '';
  for (const [key, val] of Object.entries(obj)) {
    const tag = key.replace(/[^a-zA-Z0-9_]/g, '_');
    if (val === null || val === undefined) {
      xml += `${indent}<${tag}/>\n`;
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      xml += `${indent}<${tag}>\n${objectToXml(val, indent + '  ')}${indent}</${tag}>\n`;
    } else {
      xml += `${indent}<${tag}>${escapeXml(val)}</${tag}>\n`;
    }
  }
  return xml;
}

/**
 * Assignment 11 Query 1: Full-table XML representation
 */
function serializeQuery1Xml(components, totalCount) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query1>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>1</query_id>\n';
  xml += '    <title>Full-Table Display Query</title>\n';
  xml += '    <table_name>components</table_name>\n';
  xml += `    <total_records>${totalCount || components.length}</total_records>\n`;
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <components>\n';
  for (const comp of components) {
    xml += '    <component>\n';
    xml += objectToXml(comp, '      ');
    xml += '    </component>\n';
  }
  xml += '  </components>\n';
  xml += '</assignment11_query1>\n';
  return xml;
}

/**
 * Assignment 11 Query 3: Aggregate result XML representation
 */
function serializeQuery3Xml(aggregateData) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query3>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>3</query_id>\n';
  xml += '    <title>Aggregate Query</title>\n';
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <aggregate_data>\n';
  xml += objectToXml(aggregateData, '    ');
  xml += '  </aggregate_data>\n';
  xml += '</assignment11_query3>\n';
  return xml;
}

/**
 * Assignment 11 Query 4: Conditional query XML representation
 */
function serializeQuery4Xml(filterParams, items, totalCount) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<assignment11_query4>\n';
  xml += '  <query_info>\n';
  xml += '    <assignment>Practical Assignment 11</assignment>\n';
  xml += '    <query_id>4</query_id>\n';
  xml += '    <title>Conditional Query</title>\n';
  xml += `    <total_matches>${totalCount || items.length}</total_matches>\n`;
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += '  </query_info>\n';
  xml += '  <filter_condition>\n';
  xml += objectToXml(filterParams, '    ');
  xml += '  </filter_condition>\n';
  xml += '  <items>\n';
  for (const item of items) {
    xml += '    <item>\n';
    xml += objectToXml(item, '      ');
    xml += '    </item>\n';
  }
  xml += '  </items>\n';
  xml += '</assignment11_query4>\n';
  return xml;
}

module.exports = {
  escapeXml,
  serializeQuery1Xml,
  serializeQuery3Xml,
  serializeQuery4Xml
};
