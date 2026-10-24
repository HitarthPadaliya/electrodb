const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '../public');

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeSvg(relPath, svgContent) {
  const fullPath = path.join(PUBLIC_DIR, relPath);
  ensureDirForFile(fullPath);
  fs.writeFileSync(fullPath, svgContent.trim() + '\n', 'utf8');
}

// ----------------------------------------------------------------
// 1. Logic Gates SVGs
// ----------------------------------------------------------------
const AND_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>AND Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <!-- Inputs -->
  <line x1="20" y1="35" x2="60" y2="35" class="wire" />
  <line x1="20" y1="65" x2="60" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <!-- Gate Body -->
  <path d="M 60,20 L 100,20 A 30,30 0 0,1 100,80 L 60,80 Z" class="body" />
  <!-- Output -->
  <line x1="130" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = A·B</text>
</svg>`;

const OR_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>OR Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="35" x2="65" y2="35" class="wire" />
  <line x1="20" y1="65" x2="65" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <path d="M 55,20 Q 80,50 55,80 Q 110,80 135,50 Q 110,20 55,20 Z" class="body" />
  <line x1="135" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = A+B</text>
</svg>`;

const NOT_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>NOT Gate (Inverter)</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="50" x2="65" y2="50" class="wire" />
  <text x="10" y="55" class="label">A</text>
  <polygon points="65,25 125,50 65,75" class="body" />
  <circle cx="131" cy="50" r="6" class="body" />
  <line x1="137" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = A'</text>
</svg>`;

const NAND_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>NAND Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="35" x2="60" y2="35" class="wire" />
  <line x1="20" y1="65" x2="60" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <path d="M 60,20 L 100,20 A 30,30 0 0,1 100,80 L 60,80 Z" class="body" />
  <circle cx="136" cy="50" r="6" class="body" />
  <line x1="142" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = (A·B)'</text>
</svg>`;

const NOR_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>NOR Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="35" x2="65" y2="35" class="wire" />
  <line x1="20" y1="65" x2="65" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <path d="M 55,20 Q 80,50 55,80 Q 110,80 135,50 Q 110,20 55,20 Z" class="body" />
  <circle cx="141" cy="50" r="6" class="body" />
  <line x1="147" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = (A+B)'</text>
</svg>`;

const XOR_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>XOR Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="35" x2="65" y2="35" class="wire" />
  <line x1="20" y1="65" x2="65" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <path d="M 45,20 Q 70,50 45,80" class="wire" />
  <path d="M 55,20 Q 80,50 55,80 Q 110,80 135,50 Q 110,20 55,20 Z" class="body" />
  <line x1="135" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = A⊕B</text>
</svg>`;

const XNOR_GATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>XNOR Gate</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 3; fill: #eff6ff; }
      .label { font-family: Consolas; font-size: 13px; fill: #1e293b; font-weight: 600; }
    </style>
  </defs>
  <line x1="20" y1="35" x2="65" y2="35" class="wire" />
  <line x1="20" y1="65" x2="65" y2="65" class="wire" />
  <text x="10" y="40" class="label">A</text>
  <text x="10" y="70" class="label">B</text>
  <path d="M 45,20 Q 70,50 45,80" class="wire" />
  <path d="M 55,20 Q 80,50 55,80 Q 110,80 135,50 Q 110,20 55,20 Z" class="body" />
  <circle cx="141" cy="50" r="6" class="body" />
  <line x1="147" y1="50" x2="175" y2="50" class="wire" />
  <text x="180" y="55" class="label">Y = (A⊕B)'</text>
</svg>`;

// ----------------------------------------------------------------
// 2. Flip-Flop Circuit Symbols & State Diagrams
// ----------------------------------------------------------------
function createFlipFlopSymbol(name, inputs, outputs = ['Q', "Q'"]) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 180" width="100%" height="100%">
  <title>${name} Symbol</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; stroke-linecap: round; }
      .body { stroke: #1e293b; stroke-width: 2.5; fill: #f8fafc; }
      .text-title { font-family: Consolas; font-size: 14px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .text-pin { font-family: Consolas; font-size: 12px; font-weight: bold; fill: #1e293b; }
      .clk-tri { stroke: #1e293b; stroke-width: 2; fill: none; }
    </style>
  </defs>
  <rect x="60" y="20" width="100" height="140" rx="4" class="body" />
  <text x="110" y="45" class="text-title">${name}</text>
  
  <!-- Inputs -->
  ${inputs.map((pin, i) => {
    const y = 60 + i * 35;
    return `
      <line x1="20" y1="${y}" x2="60" y2="${y}" class="wire" />
      <text x="68" y="${y + 4}" class="text-pin">${pin}</text>
    `;
  }).join('')}
  
  <!-- Clock Input -->
  <line x1="20" y1="130" x2="60" y2="130" class="wire" />
  <path d="M 60,123 L 70,130 L 60,137" class="clk-tri" />
  <text x="10" y="134" class="text-pin">CLK</text>
  
  <!-- Outputs -->
  ${outputs.map((pin, i) => {
    const y = 60 + i * 50;
    return `
      <line x1="160" y1="${y}" x2="200" y2="${y}" class="wire" />
      <text x="142" y="${y + 4}" class="text-pin">${pin}</text>
    `;
  }).join('')}
</svg>`;
}

function createFlipFlopStateDiagram(name, label00, label01, label10, label11) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 180" width="100%" height="100%">
  <title>${name} State Diagram</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
    </marker>
    <style>
      .state { fill: #eff6ff; stroke: #2563eb; stroke-width: 3; }
      .state-txt { font-family: Consolas; font-size: 16px; font-weight: bold; fill: #1e293b; text-anchor: middle; dominant-baseline: middle; }
      .trans { stroke: #2563eb; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
      .trans-label { font-family: Consolas; font-size: 12px; font-weight: 600; fill: #0f172a; text-anchor: middle; background: white; }
    </style>
  </defs>

  <!-- State Q=0 -->
  <circle cx="80" cy="90" r="32" class="state" />
  <text x="80" y="90" class="state-txt">Q = 0</text>

  <!-- State Q=1 -->
  <circle cx="260" cy="90" r="32" class="state" />
  <text x="260" y="90" class="state-txt">Q = 1</text>

  <!-- Self-loops -->
  <!-- Loop on 0 -->
  <path d="M 60,65 C 30,10 130,10 100,65" class="trans" />
  <text x="80" y="24" class="trans-label">${label00}</text>

  <!-- Loop on 1 -->
  <path d="M 240,65 C 210,10 310,10 280,65" class="trans" />
  <text x="260" y="24" class="trans-label">${label11}</text>

  <!-- Transition 0 -> 1 -->
  <path d="M 112,80 C 150,55 190,55 228,80" class="trans" />
  <text x="170" y="62" class="trans-label">${label01}</text>

  <!-- Transition 1 -> 0 -->
  <path d="M 228,100 C 190,125 150,125 112,100" class="trans" />
  <text x="170" y="138" class="trans-label">${label10}</text>
</svg>`;
}

// ----------------------------------------------------------------
// 3. Counter State Machine Diagrams & Timing Waveforms
// ----------------------------------------------------------------
function createDecadeCounterStateDiagram() {
  const cx = 200, cy = 160, r = 100;
  const states = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const bcd = ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001'];

  const coords = states.map((s, i) => {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    return {
      s,
      bcd: bcd[i],
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <title>Decade Counter (Mod-10) State Diagram</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
    </marker>
    <style>
      .state { fill: #f0fdf4; stroke: #16a34a; stroke-width: 2.5; }
      .state-txt { font-family: Consolas; font-size: 11px; font-weight: bold; fill: #166534; text-anchor: middle; dominant-baseline: middle; }
      .state-dec { font-family: Consolas; font-size: 10px; fill: #475569; text-anchor: middle; }
      .trans { stroke: #2563eb; stroke-width: 2; fill: none; marker-end: url(#arrow); }
      .center-lbl { font-family: Consolas; font-size: 13px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
    </style>
  </defs>

  <text x="200" y="155" class="center-lbl">Mod-10 Decade</text>
  <text x="200" y="172" class="center-lbl" style="font-size: 11px; font-weight: normal; fill: #64748b;">Sequence: 0 → 9 → 0</text>

  <!-- Directed transitions between consecutive states -->
  ${coords.map((c, i) => {
    const next = coords[(i + 1) % 10];
    const dx = next.x - c.x;
    const dy = next.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const startX = c.x + (dx / dist) * 22;
    const startY = c.y + (dy / dist) * 22;
    const endX = next.x - (dx / dist) * 24;
    const endY = next.y - (dy / dist) * 24;
    return `<line x1="${startX.toFixed(1)}" y1="${startY.toFixed(1)}" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" class="trans" />`;
  }).join('\n  ')}

  <!-- States -->
  ${coords.map(c => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="20" class="state" />
    <text x="${c.x.toFixed(1)}" y="${(c.y - 4).toFixed(1)}" class="state-txt">${c.bcd}</text>
    <text x="${c.x.toFixed(1)}" y="${(c.y + 9).toFixed(1)}" class="state-dec">${c.s}</text>
  `).join('\n  ')}
</svg>`;
}

function createMod8CounterStateDiagram(direction = 'up') {
  const cx = 180, cy = 150, r = 90;
  const states = direction === 'up'
    ? [0, 1, 2, 3, 4, 5, 6, 7]
    : [7, 6, 5, 4, 3, 2, 1, 0];
  const bcd = ['000', '001', '010', '011', '100', '101', '110', '111'];

  const coords = states.map((s, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    return {
      s,
      bcd: bcd[s],
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" width="100%" height="100%">
  <title>Mod-8 ${direction === 'up' ? 'Up' : 'Down'} Counter State Diagram</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
    </marker>
    <style>
      .state { fill: #eff6ff; stroke: #2563eb; stroke-width: 2.5; }
      .state-txt { font-family: Consolas; font-size: 12px; font-weight: bold; fill: #1e3a8a; text-anchor: middle; dominant-baseline: middle; }
      .trans { stroke: #2563eb; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
      .center-lbl { font-family: Consolas; font-size: 13px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
    </style>
  </defs>

  <text x="180" y="145" class="center-lbl">Mod-8 (${direction.toUpperCase()})</text>
  <text x="180" y="162" class="center-lbl" style="font-size: 11px; font-weight: normal; fill: #64748b;">3-Bit State Ring</text>

  ${coords.map((c, i) => {
    const next = coords[(i + 1) % 8];
    const dx = next.x - c.x;
    const dy = next.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const startX = c.x + (dx / dist) * 22;
    const startY = c.y + (dy / dist) * 22;
    const endX = next.x - (dx / dist) * 25;
    const endY = next.y - (dy / dist) * 25;
    return `<line x1="${startX.toFixed(1)}" y1="${startY.toFixed(1)}" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" class="trans" />`;
  }).join('\n  ')}

  ${coords.map(c => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="22" class="state" />
    <text x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" class="state-txt">${c.bcd}</text>
  `).join('\n  ')}
</svg>`;
}

function createCounterTimingDiagram(name = 'Counter') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="100%" height="100%">
  <title>${name} Timing Diagram</title>
  <defs>
    <style>
      .clk-wave { stroke: #0284c7; stroke-width: 2.5; fill: none; }
      .q0-wave { stroke: #16a34a; stroke-width: 2.5; fill: none; }
      .q1-wave { stroke: #d97706; stroke-width: 2.5; fill: none; }
      .q2-wave { stroke: #dc2626; stroke-width: 2.5; fill: none; }
      .grid { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 4; }
      .lbl { font-family: Consolas; font-size: 12px; font-weight: bold; fill: #334155; }
      .state-lbl { font-family: Consolas; font-size: 11px; fill: #64748b; text-anchor: middle; }
    </style>
  </defs>

  <!-- Labels -->
  <text x="15" y="45" class="lbl">CLK</text>
  <text x="15" y="95" class="lbl">Q0</text>
  <text x="15" y="145" class="lbl">Q1</text>
  <text x="15" y="195" class="lbl">Q2</text>

  <!-- Grid lines -->
  ${[60, 110, 160, 210, 260, 310, 360, 410, 460].map(x => `<line x1="${x}" y1="20" x2="${x}" y2="210" class="grid" />`).join('\n  ')}

  <!-- States at top -->
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((s, i) => `<text x="${85 + i * 50}" y="20" class="state-lbl">${s}</text>`).join('\n  ')}

  <!-- CLK Waveform -->
  <path d="M 60,50 L 85,50 L 85,30 L 110,30 L 110,50 L 135,50 L 135,30 L 160,30 L 160,50 L 185,50 L 185,30 L 210,30 L 210,50 L 235,50 L 235,30 L 260,30 L 260,50 L 285,50 L 285,30 L 310,30 L 310,50 L 335,50 L 335,30 L 360,30 L 360,50 L 385,50 L 385,30 L 410,30 L 410,50 L 435,50 L 435,30 L 460,30" class="clk-wave" />

  <!-- Q0 Waveform (toggles on every cycle) -->
  <path d="M 60,100 L 110,100 L 110,80 L 160,80 L 160,100 L 210,100 L 210,80 L 260,80 L 260,100 L 310,100 L 310,80 L 360,80 L 360,100 L 410,100 L 410,80 L 460,80" class="q0-wave" />

  <!-- Q1 Waveform (toggles every 2 cycles) -->
  <path d="M 60,150 L 160,150 L 160,130 L 260,130 L 260,150 L 360,150 L 360,130 L 460,130" class="q1-wave" />

  <!-- Q2 Waveform (toggles every 4 cycles) -->
  <path d="M 60,200 L 260,200 L 260,180 L 460,180" class="q2-wave" />
</svg>`;
}

// ----------------------------------------------------------------
// 4. Multiplexers & Encoders
// ----------------------------------------------------------------
function createMuxSymbol(name = '2:1 MUX', inputs = ['D0', 'D1'], selects = ['S']) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="100%" height="100%">
  <title>${name}</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; }
      .body { stroke: #1e293b; stroke-width: 2.5; fill: #eff6ff; }
      .lbl { font-family: Consolas; font-size: 11px; font-weight: bold; fill: #1e293b; }
      .title { font-family: Consolas; font-size: 13px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
    </style>
  </defs>
  <!-- Trapezoid Body -->
  <polygon points="60,20 140,40 140,120 60,140" class="body" />
  <text x="100" y="85" class="title">${name}</text>

  <!-- Inputs -->
  ${inputs.map((inLbl, i) => {
    const y = 45 + i * (70 / (inputs.length - 1 || 1));
    return `
      <line x1="20" y1="${y}" x2="60" y2="${y}" class="wire" />
      <text x="65" y="${y + 4}" class="lbl">${inLbl}</text>
    `;
  }).join('')}

  <!-- Output -->
  <line x1="140" y1="80" x2="180" y2="80" class="wire" />
  <text x="145" y="84" class="lbl" style="text-anchor: end;">Y</text>

  <!-- Select lines (bottom) -->
  ${selects.map((sLbl, i) => {
    const x = 85 + i * 30;
    return `
      <line x1="${x}" y1="130" x2="${x}" y2="155" class="wire" />
      <text x="${x}" y="125" class="lbl" style="text-anchor: middle;">${sLbl}</text>
    `;
  }).join('')}
</svg>`;
}

// ----------------------------------------------------------------
// 5. Discrete Components (Diodes, Transistors, Op-Amps, etc.)
// ----------------------------------------------------------------
function createDiodeSymbol(name = 'Diode', type = 'rectifier') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="100%" height="100%">
  <title>${name}</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; }
      .body { stroke: #1e293b; stroke-width: 2.5; fill: #3b82f6; }
      .bar { stroke: #1e293b; stroke-width: 3; stroke-linecap: round; }
      .lbl { font-family: Consolas; font-size: 12px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
    </style>
  </defs>
  <!-- Leads -->
  <line x1="20" y1="50" x2="80" y2="50" class="wire" />
  <line x1="120" y1="50" x2="180" y2="50" class="wire" />
  <!-- Anode Triangle -->
  <polygon points="80,30 80,70 120,50" class="body" />
  <!-- Cathode Bar -->
  ${type === 'zener'
    ? '<path d="M 115,30 L 120,30 L 120,70 L 125,70" class="bar" fill="none" />'
    : type === 'schottky'
    ? '<path d="M 115,30 L 120,30 L 120,70 L 115,70" class="bar" fill="none" />'
    : '<line x1="120" y1="30" x2="120" y2="70" class="bar" />'
  }
  ${type === 'led'
    ? `
      <line x1="100" y1="28" x2="120" y2="12" class="wire" stroke="#ef4444" marker-end="url(#arrow)" />
      <line x1="110" y1="33" x2="130" y2="17" class="wire" stroke="#ef4444" />
    `
    : ''}
  <text x="50" y="42" class="lbl">A</text>
  <text x="150" y="42" class="lbl">K</text>
  <text x="100" y="90" class="lbl">${name}</text>
</svg>`;
}

function createTransistorSymbol(name = 'NPN BJT', type = 'npn') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" width="100%" height="100%">
  <title>${name}</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; }
      .body { stroke: #1e293b; stroke-width: 2.5; stroke-linecap: round; }
      .lbl { font-family: Consolas; font-size: 12px; font-weight: bold; fill: #1e293b; }
      .circle { stroke: #cbd5e1; stroke-width: 2; fill: #f8fafc; }
    </style>
  </defs>
  <circle cx="100" cy="90" r="55" class="circle" />
  <!-- Base lead -->
  <line x1="20" y1="90" x2="80" y2="90" class="wire" />
  <line x1="80" y1="60" x2="80" y2="120" class="body" stroke-width="4" />
  <text x="35" y="82" class="lbl">B</text>

  <!-- Collector -->
  <line x1="80" y1="75" x2="135" y2="45" class="body" />
  <line x1="135" y1="45" x2="135" y2="20" class="wire" />
  <text x="145" y="35" class="lbl">C</text>

  <!-- Emitter with Arrow -->
  <line x1="80" y1="105" x2="135" y2="135" class="body" />
  ${type === 'npn'
    ? '<polygon points="122,128 135,135 127,120" fill="#1e293b" />'
    : '<polygon points="98,96 85,89 93,104" fill="#1e293b" />'
  }
  <line x1="135" y1="135" x2="135" y2="160" class="wire" />
  <text x="145" y="155" class="lbl">E</text>

  <text x="100" y="175" class="lbl" style="text-anchor: middle;">${name}</text>
</svg>`;
}

function createOpAmpSymbol(name = 'Op-Amp') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140" width="100%" height="100%">
  <title>${name}</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; }
      .body { stroke: #1e293b; stroke-width: 2.5; fill: #f0fdf4; }
      .lbl { font-family: Consolas; font-size: 13px; font-weight: bold; fill: #1e293b; }
      .sign { font-family: Consolas; font-size: 16px; font-weight: bold; fill: #1e293b; }
    </style>
  </defs>
  <!-- Inputs -->
  <line x1="20" y1="45" x2="60" y2="45" class="wire" />
  <line x1="20" y1="95" x2="60" y2="95" class="wire" />
  <text x="10" y="50" class="lbl">V-</text>
  <text x="10" y="100" class="lbl">V+</text>

  <!-- Triangle Body -->
  <polygon points="60,20 160,70 60,120" class="body" />
  <text x="70" y="50" class="sign">-</text>
  <text x="70" y="100" class="sign">+</text>

  <!-- Output -->
  <line x1="160" y1="70" x2="200" y2="70" class="wire" />
  <text x="205" y="75" class="lbl">Vout</text>
  <text x="110" y="135" class="lbl" style="text-anchor: middle;">${name}</text>
</svg>`;
}

function createGenericBlockSymbol(name, category = 'Component') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140" width="100%" height="100%">
  <title>${name}</title>
  <defs>
    <style>
      .wire { stroke: #2563eb; stroke-width: 2.5; fill: none; }
      .body { stroke: #1e293b; stroke-width: 2.5; fill: #f8fafc; }
      .lbl-title { font-family: Consolas; font-size: 13px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .lbl-sub { font-family: Consolas; font-size: 11px; fill: #64748b; text-anchor: middle; }
      .pin { stroke: #3b82f6; stroke-width: 2; fill: none; }
    </style>
  </defs>
  <!-- IC Box -->
  <rect x="50" y="25" width="120" height="90" rx="6" class="body" />
  <text x="110" y="65" class="lbl-title">${name}</text>
  <text x="110" y="85" class="lbl-sub">${category}</text>

  <!-- Pins -->
  <line x1="20" y1="50" x2="50" y2="50" class="pin" />
  <line x1="20" y1="75" x2="50" y2="75" class="pin" />
  <line x1="20" y1="100" x2="50" y2="100" class="pin" />

  <line x1="170" y1="50" x2="200" y2="50" class="pin" />
  <line x1="170" y1="75" x2="200" y2="75" class="pin" />
  <line x1="170" y1="100" x2="200" y2="100" class="pin" />
</svg>`;
}

// ----------------------------------------------------------------
// Generator execution
// ----------------------------------------------------------------
console.log('Generating SVG vector assets for ElectroDB...');

// Logic gates
writeSvg('assets/svg/gates/and.svg', AND_GATE);
writeSvg('assets/svg/gates/or.svg', OR_GATE);
writeSvg('assets/svg/gates/not.svg', NOT_GATE);
writeSvg('assets/svg/gates/nand.svg', NAND_GATE);
writeSvg('assets/svg/gates/nor.svg', NOR_GATE);
writeSvg('assets/svg/gates/xor.svg', XOR_GATE);
writeSvg('assets/svg/gates/xnor.svg', XNOR_GATE);

// Flip-Flops
writeSvg('assets/svg/flipflops/sr.svg', createFlipFlopSymbol('SR Flip-Flop', ['S', 'R']));
writeSvg('assets/svg/flipflops/jk.svg', createFlipFlopSymbol('JK Flip-Flop', ['J', 'K']));
writeSvg('assets/svg/flipflops/d.svg', createFlipFlopSymbol('D Flip-Flop', ['D']));
writeSvg('assets/svg/flipflops/t.svg', createFlipFlopSymbol('T Flip-Flop', ['T']));
writeSvg('assets/svg/flipflops/master-slave-jk.svg', createFlipFlopSymbol('MS-JK Flip-Flop', ['J', 'K']));

// Flip-Flop State Diagrams
writeSvg('assets/svg/flipflops/jk-flip-flop-state.svg', createFlipFlopStateDiagram('JK Flip-Flop', 'J=0, K=X', 'J=1, K=X', 'J=X, K=1', 'J=X, K=0'));
writeSvg('assets/svg/flipflops/d-flip-flop-state.svg', createFlipFlopStateDiagram('D Flip-Flop', 'D=0', 'D=1', 'D=0', 'D=1'));
writeSvg('assets/svg/flipflops/t-flip-flop-state.svg', createFlipFlopStateDiagram('T Flip-Flop', 'T=0 (Hold)', 'T=1 (Toggle)', 'T=1 (Toggle)', 'T=0 (Hold)'));
writeSvg('assets/svg/flipflops/sr-flip-flop-state.svg', createFlipFlopStateDiagram('SR Flip-Flop', 'S=0, R=X', 'S=1, R=0', 'S=0, R=1', 'S=X, R=0'));

// Counters
writeSvg('assets/svg/counters/decade-counter-symbol.svg', createGenericBlockSymbol('74LS90', 'Decade Counter'));
writeSvg('assets/svg/counters/decade-counter-state.svg', createDecadeCounterStateDiagram());
writeSvg('assets/svg/counters/decade-counter-timing.svg', createCounterTimingDiagram('Decade Counter'));

writeSvg('assets/svg/counters/mod8-symbol.svg', createGenericBlockSymbol('Mod-8 Up', 'Binary Counter'));
writeSvg('assets/svg/counters/mod8-up-counter-state.svg', createMod8CounterStateDiagram('up'));
writeSvg('assets/svg/counters/mod8-up-counter-timing.svg', createCounterTimingDiagram('Mod-8 Up Counter'));

writeSvg('assets/svg/counters/mod8-down-symbol.svg', createGenericBlockSymbol('Mod-8 Down', 'Binary Counter'));
writeSvg('assets/svg/counters/mod8-down-counter-state.svg', createMod8CounterStateDiagram('down'));
writeSvg('assets/svg/counters/mod8-down-counter-timing.svg', createCounterTimingDiagram('Mod-8 Down Counter'));

writeSvg('assets/svg/counters/binary-counter.svg', createGenericBlockSymbol('Binary Counter', 'Sequential Logic'));
writeSvg('assets/svg/counters/ripple-counter.svg', createGenericBlockSymbol('Ripple Counter', 'Asynchronous Logic'));

// Mux & Encoders
writeSvg('assets/svg/mux/2to1.svg', createMuxSymbol('2:1 MUX', ['D0', 'D1'], ['S']));
writeSvg('assets/svg/mux/4to1.svg', createMuxSymbol('4:1 MUX', ['D0', 'D1', 'D2', 'D3'], ['S0', 'S1']));
writeSvg('assets/svg/encoders/decoder2to4.svg', createGenericBlockSymbol('2:4 Decoder', 'Combinational Logic'));
writeSvg('assets/svg/encoders/encoder4to2.svg', createGenericBlockSymbol('4:2 Encoder', 'Combinational Logic'));

// Diodes
writeSvg('assets/svg/diodes/diode.svg', createDiodeSymbol('Rectifier Diode', 'rectifier'));
writeSvg('assets/svg/diodes/zener.svg', createDiodeSymbol('Zener Diode', 'zener'));
writeSvg('assets/svg/diodes/schottky.svg', createDiodeSymbol('Schottky Diode', 'schottky'));
writeSvg('assets/svg/diodes/led.svg', createDiodeSymbol('LED', 'led'));

// Transistors
writeSvg('assets/svg/transistors/npn.svg', createTransistorSymbol('NPN BJT', 'npn'));
writeSvg('assets/svg/transistors/pnp.svg', createTransistorSymbol('PNP BJT', 'pnp'));
writeSvg('assets/svg/transistors/nmos.svg', createGenericBlockSymbol('N-Ch MOSFET', 'Transistor'));
writeSvg('assets/svg/transistors/pmos.svg', createGenericBlockSymbol('P-Ch MOSFET', 'Transistor'));

// Op-Amps & Regulators
writeSvg('assets/svg/opamps/inverting.svg', createOpAmpSymbol('Inverting Op-Amp'));
writeSvg('assets/svg/opamps/non-inverting.svg', createOpAmpSymbol('Non-Inverting Op-Amp'));
writeSvg('assets/svg/opamps/follower.svg', createOpAmpSymbol('Voltage Follower'));
writeSvg('assets/svg/regulators/linear.svg', createGenericBlockSymbol('Linear Regulator', 'Power IC'));
writeSvg('assets/svg/regulators/buck.svg', createGenericBlockSymbol('Buck Converter', 'Switching Regulator'));

// Sensors & Converters
writeSvg('assets/svg/sensors/temperature-sensor.svg', createGenericBlockSymbol('Temp Sensor', 'Analog Sensor'));
writeSvg('assets/svg/sensors/analog-temperature.svg', createGenericBlockSymbol('Analog Temp', 'Sensors'));
writeSvg('assets/svg/adcs/sar-adc.svg', createGenericBlockSymbol('SAR ADC', 'Data Converter'));
writeSvg('assets/svg/adcs/flash-adc.svg', createGenericBlockSymbol('Flash ADC', 'Data Converter'));

// Memory & Electromechanical
writeSvg('assets/svg/memory/eeprom-block.svg', createGenericBlockSymbol('EEPROM', 'Non-Volatile Memory'));
writeSvg('assets/svg/memory/memory-block.svg', createGenericBlockSymbol('SRAM', 'Volatile Memory'));
writeSvg('assets/svg/relays/spdt-relay.svg', createGenericBlockSymbol('SPDT Relay', 'Electromechanical'));
writeSvg('assets/svg/relays/solid-state-relay.svg', createGenericBlockSymbol('Solid State Relay', 'Relay'));
writeSvg('assets/svg/motors/dc-motor.svg', createGenericBlockSymbol('DC Motor', 'Motor'));

// All remaining paths queried from DB
const pool = require('../server/src/db/pool');

async function createAllDbReferencedSvgs() {
  const [rows] = await pool.query(
    `SELECT DISTINCT circuit_symbol_path AS path FROM components WHERE circuit_symbol_path IS NOT NULL
     UNION SELECT DISTINCT image_path AS path FROM component_diagrams`
  );

  for (const r of rows) {
    if (!r.path || !r.path.endsWith('.svg')) continue;
    const relPath = r.path.startsWith('/') ? r.path.slice(1) : r.path;
    const fullPath = path.join(PUBLIC_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      const baseName = path.basename(relPath, '.svg');
      const title = baseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const content = relPath.includes('state')
        ? createFlipFlopStateDiagram(title, '0', '1', '0', '1')
        : relPath.includes('timing')
        ? createCounterTimingDiagram(title)
        : createGenericBlockSymbol(title, 'Reference Asset');
      writeSvg(relPath, content);
    }
  }

  await pool.closePool();
  console.log('All SVG assets generated successfully!');
}

createAllDbReferencedSvgs();
