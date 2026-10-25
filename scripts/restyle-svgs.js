#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const SVG_ROOT = path.resolve(__dirname, '../public/assets/svg');

const PROTECTED = new Set([
  'flipflops/jk.svg',
  'flipflops/jk-flip-flop.svg',
  'circuits/jk-flip-flop-circuit.svg'
]);

const PROPERTY_MAP = {
  fill: {
    '#0f172a': '#e8eaed',
    '#1e293b': '#c5c7c9',
    '#334155': '#c5c7c9',
    '#475569': '#8a8d93',
    '#64748b': '#8a8d93',
    '#f8fafc': '#0d1117',
    '#eff6ff': '#0d1117',
    '#f0fdf4': '#0d1117',
    '#e0f2fe': '#0d1117',
    '#dbeafe': '#0d1117',
    '#e2e8f0': '#0d1117',
    '#cbd5e1': '#30363d',
    '#2563eb': '#00a7da',
    '#3b82f6': '#101f38',
    '#0284c7': '#00a7da',
    '#16a34a': '#00dfc1',
    '#166534': '#9ff3e4',
    '#dc2626': '#ff7b8a',
    '#ef4444': '#ff7b8a',
    '#d97706': '#f2b544',
    '#1e3a8a': '#101f38'
  },
  stroke: {
    '#1e293b': '#21262d',
    '#334155': '#21262d',
    '#475569': '#30363d',
    '#64748b': '#30363d',
    '#0f172a': '#21262d',
    '#f8fafc': '#21262d',
    '#eff6ff': '#21262d',
    '#e2e8f0': '#21262d',
    '#cbd5e1': '#30363d',
    '#2563eb': '#00a7da',
    '#3b82f6': '#168fe5',
    '#0284c7': '#00a7da',
    '#16a34a': '#00dfc1',
    '#166534': '#00dfc1',
    '#dc2626': '#ff7b8a',
    '#ef4444': '#ff7b8a',
    '#d97706': '#f2b544',
    '#1e3a8a': '#168fe5'
  },
  'stop-color': {}
};

const TEXT_COLOURS = {
  '#0f172a': '#e8eaed',
  '#1e293b': '#c5c7c9',
  '#334155': '#c5c7c9',
  '#475569': '#8a8d93',
  '#64748b': '#8a8d93',
  '#166534': '#9ff3e4',
  '#ffffff': '#e8eaed'
};

const FONT_RULES = [
  [/font-family\s*:\s*[^;'"]*monospace[^;'"]*/gi, 'font-family: Consolas'],
  [/font-family\s*:\s*[^;}]*(system-ui|sans-serif|Arial)[^;'"]*/gi, 'font-family: Consolas']
];

function normaliseHex(value) {
  const v = value.toLowerCase();
  if (v.length === 4) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  return v;
}

function restyleDeclarations(css) {
  return css.replace(/(fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3,6})/g, (match, property, colour) => {
    const map = PROPERTY_MAP[property] || {};
    const replacement = map[normaliseHex(colour)];
    return replacement ? `${property}: ${replacement}` : match;
  });
}

function accentiseDeviceRules(css) {
  return css.replace(/(\.[\w-]+)\s*\{([^}]*)\}/g, (rule, selector, body) => {
    const hasDarkFill = /fill\s*:\s*#(101f38|0d1117)/i.test(body);
    if (!hasDarkFill) return rule;
    if (/stroke\s*:\s*#(21262d|30363d)/i.test(body)) {
      return `${selector} {${body.replace(/stroke\s*:\s*#(21262d|30363d)/i, 'stroke: #168fe5')}}`;
    }
    return rule;
  });
}

function restyleTextNodes(svg) {

  return svg.replace(/<(text|tspan|path|polygon|line|circle|rect)\b([^>]*)>/g, (match, tag, attrs) => {
    let next = attrs;
    next = next.replace(/\bfill="(#[0-9a-fA-F]{3,6})"/g, (m, colour) => {
      const key = normaliseHex(colour);
      if (tag === 'text' || tag === 'tspan') {
        return TEXT_COLOURS[key] ? `fill="${TEXT_COLOURS[key]}"` : m;
      }
      const mapped = PROPERTY_MAP.fill[key];
      return mapped ? `fill="${mapped}"` : m;
    });
    next = next.replace(/\bstroke="(#[0-9a-fA-F]{3,6})"/g, (m, colour) => {
      const mapped = PROPERTY_MAP.stroke[normaliseHex(colour)];
      return mapped ? `stroke="${mapped}"` : m;
    });
    return `<${tag}${next}>`;
  });
}

function fitViewBox(svg) {
  const box = svg.match(/viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!box) return svg;

  const [x, y, width, height] = box.slice(1).map(Number);
  let required = width;

  const textPattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textPattern.exec(svg)) !== null) {
    const attrs = match[1];
    if (/text-anchor="(middle|end)"/.test(attrs)) continue;
    const coords = attrs.match(/\bx="(-?[\d.]+)"/);
    if (!coords) continue;
    const content = match[2].replace(/<[^>]+>/g, '');
    const fontMatch = attrs.match(/font-size="([\d.]+)"/);
    const size = fontMatch ? Number(fontMatch[1]) : 13;
    const estimated = content.length * size * 0.62;
    required = Math.max(required, Number(coords[1]) + estimated + 8);
  }

  if (required <= width + 1) return svg;
  return svg.replace(box[0], `viewBox="${x} ${y} ${Math.ceil(required)} ${height}"`);
}

function restyle(svg) {
  let out = svg;

  out = out.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (match, css) => {
    let next = restyleDeclarations(css);
    next = accentiseDeviceRules(next);
    for (const [pattern, replacement] of FONT_RULES) {
      next = next.replace(pattern, replacement);
    }
    return `<style>${next}</style>`;
  });

  out = restyleTextNodes(out);
  out = fitViewBox(out);

  out = out.replace(/<rect[^>]*fill="#(f8fafc|eff6ff|ffffff)"[^>]*\/>/gi, '');

  return out;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.svg') ? [full] : [];
  });
}

function main() {
  const check = process.argv.includes('--check');
  const files = walk(SVG_ROOT);
  let changed = 0;
  const skipped = [];

  for (const file of files) {
    const rel = path.relative(SVG_ROOT, file).split(path.sep).join('/');
    if (PROTECTED.has(rel)) {
      skipped.push(rel);
      continue;
    }

    const before = fs.readFileSync(file, 'utf8');
    const after = restyle(before);

    if (after !== before) {
      changed += 1;
      if (!check) fs.writeFileSync(file, after);
    }
  }

  console.log(`${check ? 'would restyle' : 'restyled'} ${changed}/${files.length} SVGs`);
  if (skipped.length) console.log(`preserved verbatim: ${skipped.join(', ')}`);
}

if (require.main === module) main();

module.exports = { restyle };
