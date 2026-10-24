/**
 * ElectroDB — per-component diagram specifications
 *
 * Every component declares:
 *   name     lines printed inside the box body (kept short so it never overflows)
 *   in/out   pin labels; suffix '^' = clock triangle, '*' = active-low bubble
 *   top/bot  preset/clear style pins; suffix '~' = dashed grey stub
 *   pinout   IC pinout spec ({ part, left:[[num,label,type]], right:[...] })
 *   circuit  circuit template key (see build-diagrams.js)
 *   state    state-machine spec factory key
 *
 * Labels are the *symbol* names only. No explanatory text is written into any
 * drawing.
 */

const pin = (num, label, type = 'in') => ({ num, label, type });
// inv: false marks an active-high pin that still belongs to the preset/clear
// group, so it takes the colour but is not drawn with an inversion bubble.
const p = (num, label, type = 'in', inv = true) => ({ num, label, type, ...(inv ? {} : { inv: false }) });

// ---------------------------------------------------------------- shared pinouts
const PINOUTS = {
  '7400': {
    part: '74LS00',
    left: [pin(1, '1A'), pin(2, '1B'), p(3, '1Y', 'out'), pin(4, '2A'), pin(5, '2B'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '4B'), pin(12, '4A'), p(11, '4Y', 'out'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '7402': {
    part: '74LS02',
    left: [p(1, '1Y', 'out'), pin(2, '1A'), pin(3, '1B'), p(4, '2Y', 'out'), pin(5, '2A'), pin(6, '2B'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), p(13, '4Y', 'out'), pin(12, '4B'), pin(11, '4A'), p(10, '3Y', 'out'), pin(9, '3B'), pin(8, '3A')]
  },
  '7404': {
    part: '74LS04',
    left: [pin(1, '1A'), p(2, '1Y', 'out'), pin(3, '2A'), p(4, '2Y', 'out'), pin(5, '3A'), p(6, '3Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '6A'), p(12, '6Y', 'out'), pin(11, '5A'), p(10, '5Y', 'out'), pin(9, '4A'), p(8, '4Y', 'out')]
  },
  '7407': {
    part: '74LS07',
    left: [pin(1, '1A'), p(2, '1Y', 'out'), pin(3, '2A'), p(4, '2Y', 'out'), pin(5, '3A'), p(6, '3Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '6A'), p(12, '6Y', 'out'), pin(11, '5A'), p(10, '5Y', 'out'), pin(9, '4A'), p(8, '4Y', 'out')]
  },
  '7408': {
    part: '74LS08',
    left: [pin(1, '1A'), pin(2, '1B'), p(3, '1Y', 'out'), pin(4, '2A'), pin(5, '2B'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '4B'), pin(12, '4A'), p(11, '4Y', 'out'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '7410': {
    part: '74LS10',
    left: [pin(1, '1A'), pin(2, '1B'), pin(3, '2A'), pin(4, '2B'), pin(5, '2C'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '1C'), p(12, '1Y', 'out'), pin(11, '3C'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '7414': {
    part: '74LS14',
    left: [pin(1, '1A'), p(2, '1Y', 'out'), pin(3, '2A'), p(4, '2Y', 'out'), pin(5, '3A'), p(6, '3Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '6A'), p(12, '6Y', 'out'), pin(11, '5A'), p(10, '5Y', 'out'), pin(9, '4A'), p(8, '4Y', 'out')]
  },
  '7420': {
    part: '74LS20',
    left: [pin(1, '1A'), pin(2, '1B'), pin(3, 'NC'), pin(4, '1C'), pin(5, '1D'), p(6, '1Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '2D'), pin(12, '2C'), pin(11, 'NC'), pin(10, '2B'), pin(9, '2A'), p(8, '2Y', 'out')]
  },
  '7424': {
    part: '74LS05',
    left: [pin(1, '1A'), p(2, '1Y', 'out'), pin(3, '2A'), p(4, '2Y', 'out'), pin(5, '3A'), p(6, '3Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '6A'), p(12, '6Y', 'out'), pin(11, '5A'), p(10, '5Y', 'out'), pin(9, '4A'), p(8, '4Y', 'out')]
  },
  '7432': {
    part: '74LS32',
    left: [pin(1, '1A'), pin(2, '1B'), p(3, '1Y', 'out'), pin(4, '2A'), pin(5, '2B'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '4B'), pin(12, '4A'), p(11, '4Y', 'out'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '7451': {
    part: '74LS51',
    left: [pin(1, '1A'), pin(2, '2A'), pin(3, '2B'), pin(4, '2C'), pin(5, '2D'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '1C'), pin(12, '1B'), pin(11, '1D'), pin(10, '1E'), pin(9, '1F'), p(8, '1Y', 'out')]
  },
  '7473': {
    part: '74LS73',
    left: [pin(1, 'CLK1'), p(2, 'CLR1', 'clear'), pin(3, 'K1'), p(4, 'VCC', 'power'), pin(5, 'CLK2'), p(6, 'CLR2', 'clear'), pin(7, 'J2')],
    right: [pin(14, 'J1'), p(13, 'Q1′', 'out'), p(12, 'Q1', 'out'), p(11, 'GND', 'power'), pin(10, 'K2'), p(9, 'Q2', 'out'), p(8, 'Q2′', 'out')]
  },
  '7474': {
    part: '74LS74',
    left: [p(1, '1CLR', 'clear'), pin(2, '1D'), pin(3, 'CLK1'), p(4, '1PRE', 'preset'), p(5, '1Q', 'out'), p(6, '1Q′', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), p(13, '2CLR', 'clear'), pin(12, '2D'), pin(11, 'CLK2'), p(10, '2PRE', 'preset'), p(9, '2Q', 'out'), p(8, '2Q′', 'out')]
  },
  '7486': {
    part: '74LS86',
    left: [pin(1, '1A'), pin(2, '1B'), p(3, '1Y', 'out'), pin(4, '2A'), pin(5, '2B'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '4B'), pin(12, '4A'), p(11, '4Y', 'out'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '62256': {
    part: '62256',
    left: [pin(1, 'A14'), pin(2, 'A12'), pin(3, 'A7'), pin(4, 'A6'), pin(5, 'A5'), pin(6, 'A4'), pin(7, 'A3'), pin(8, 'A2'), pin(9, 'A1'), pin(10, 'A0'), pin(11, 'D0'), pin(12, 'D1'), pin(13, 'D2'), p(14, 'GND', 'power')],
    right: [p(28, 'VCC', 'power'), p(27, 'WE', 'alow'), pin(26, 'CS2'), pin(25, 'A8'), pin(24, 'A9'), pin(23, 'A11'), p(22, 'OE', 'alow'), pin(21, 'A10'), p(20, 'CS1', 'alow'), p(19, 'D7', 'out'), p(18, 'D6', 'out'), p(17, 'D5', 'out'), p(16, 'D4', 'out'), p(15, 'D3', 'out')]
  },
  '74107': {
    part: '74LS107',
    left: [pin(1, 'J1'), p(2, 'Q1′', 'out'), p(3, 'Q1', 'out'), pin(4, 'K1'), p(5, 'Q2', 'out'), p(6, 'Q2′', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), p(13, 'CLR1', 'clear'), pin(12, 'CLK1'), pin(11, 'K2'), p(10, '2CLR', 'clear'), pin(9, '2CLK'), pin(8, 'J2')]
  },
  '74112': {
    part: '74LS112',
    left: [pin(1, 'CLK1'), pin(2, 'K1'), pin(3, 'J1'), p(4, '1PRE', 'preset'), p(5, '1Q', 'out'), p(6, '1Q′', 'out'), p(7, '2Q′', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, '1CLR', 'clear'), p(14, '2CLR', 'clear'), pin(13, 'CLK2'), pin(12, 'K2'), pin(11, 'J2'), p(10, '2PRE', 'preset'), p(9, '2Q', 'out')]
  },
  '74125': {
    part: '74LS125',
    left: [p(1, '1OE', 'alow'), pin(2, '1A'), p(3, '1Y', 'out'), p(4, '2OE', 'alow'), pin(5, '2A'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), p(13, '4OE', 'alow'), pin(12, '4A'), p(11, '4Y', 'out'), p(10, '3OE', 'alow'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '74138': {
    part: '74LS138',
    left: [pin(1, 'A'), pin(2, 'B'), pin(3, 'C'), p(4, 'G2A', 'alow'), p(5, 'G2B', 'alow'), p(6, 'G1', 'control'), p(7, 'Y7', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, 'Y0', 'out'), p(14, 'Y1', 'out'), p(13, 'Y2', 'out'), p(12, 'Y3', 'out'), p(11, 'Y4', 'out'), p(10, 'Y5', 'out'), p(9, 'Y6', 'out')]
  },
  '74139': {
    part: '74LS139',
    left: [p(1, '1G', 'alow'), pin(2, '1A'), pin(3, '1B'), p(4, '1Y0', 'out'), p(5, '1Y1', 'out'), p(6, '1Y2', 'out'), p(7, '1Y3', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, '2G', 'alow'), pin(14, '2A'), pin(13, '2B'), p(12, '2Y0', 'out'), p(11, '2Y1', 'out'), p(10, '2Y2', 'out'), p(9, '2Y3', 'out')]
  },
  '74147': {
    part: '74LS47',
    left: [pin(1, 'B'), pin(2, 'C'), p(3, 'LT', 'alow'), p(4, 'BI', 'alow'), p(5, 'RBI', 'alow'), pin(6, 'D'), pin(7, 'A'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, 'f', 'out'), p(14, 'g', 'out'), p(13, 'a', 'out'), p(12, 'b', 'out'), p(11, 'c', 'out'), p(10, 'd', 'out'), p(9, 'e', 'out')]
  },
  '74148': {
    part: '74LS148',
    left: [pin(1, 'I4'), pin(2, 'I5'), pin(3, 'I6'), pin(4, 'I7'), p(5, 'EI', 'alow'), p(6, 'A2', 'out'), p(7, 'A1', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, 'EO', 'out'), p(14, 'GS', 'out'), pin(13, 'I3'), pin(12, 'I2'), pin(11, 'I1'), pin(10, 'I0'), p(9, 'A0', 'out')]
  },
  '74150': {
    part: '74LS150',
    left: [pin(1, 'D7'), pin(2, 'D6'), pin(3, 'D5'), pin(4, 'D4'), pin(5, 'D3'), pin(6, 'D2'), pin(7, 'D1'), pin(8, 'D0'), p(9, 'STB', 'alow'), p(10, 'W', 'out'), pin(11, 'S3'), p(12, 'GND', 'power')],
    right: [p(24, 'VCC', 'power'), pin(23, 'D8'), pin(22, 'D9'), pin(21, 'D10'), pin(20, 'D11'), pin(19, 'D12'), pin(18, 'D13'), pin(17, 'D14'), pin(16, 'D15'), pin(15, 'S0'), pin(14, 'S1'), pin(13, 'S2')]
  },
  '74151': {
    part: '74LS151',
    left: [pin(1, 'D3'), pin(2, 'D2'), pin(3, 'D1'), pin(4, 'D0'), p(5, 'Y', 'out'), p(6, 'W', 'out'), p(7, 'G', 'alow'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), pin(15, 'D4'), pin(14, 'D5'), pin(13, 'D6'), pin(12, 'D7'), pin(11, 'A'), pin(10, 'B'), pin(9, 'C')]
  },
  '74153': {
    part: '74LS153',
    left: [p(1, '1G', 'alow'), pin(2, 'B'), pin(3, '1C0'), pin(4, '1C1'), pin(5, '1C2'), pin(6, '1C3'), p(7, '1Y', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, '2G', 'alow'), pin(14, 'A'), pin(13, '2C0'), pin(12, '2C1'), pin(11, '2C2'), pin(10, '2C3'), p(9, '2Y', 'out')]
  },
  '74154': {
    part: '74LS154',
    left: [p(1, 'Y0', 'out'), p(2, 'Y1', 'out'), p(3, 'Y2', 'out'), p(4, 'Y3', 'out'), p(5, 'Y4', 'out'), p(6, 'Y5', 'out'), p(7, 'Y6', 'out'), p(8, 'Y7', 'out'), p(9, 'Y8', 'out'), p(10, 'Y9', 'out'), p(11, 'Y10', 'out'), p(12, 'GND', 'power')],
    right: [p(24, 'VCC', 'power'), pin(23, 'A'), pin(22, 'B'), pin(21, 'C'), pin(20, 'D'), p(19, 'G2', 'control'), p(18, 'G1', 'control'), p(17, 'Y15', 'out'), p(16, 'Y14', 'out'), p(15, 'Y13', 'out'), p(14, 'Y12', 'out'), p(13, 'Y11', 'out')]
  },
  '74157': {
    part: '74LS157',
    left: [p(1, 'S', 'control'), pin(2, '1A'), pin(3, '1B'), p(4, '1Y', 'out'), pin(5, '2A'), pin(6, '2B'), p(7, '2Y', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, 'E', 'alow'), pin(14, '4A'), pin(13, '4B'), p(12, '4Y', 'out'), pin(11, '3A'), pin(10, '3B'), p(9, '3Y', 'out')]
  },
  '74175': {
    part: '74LS175',
    left: [p(1, 'CLR', 'clear'), p(2, '1Q', 'out'), p(3, '1Q′', 'out'), pin(4, '1D'), pin(5, '2D'), p(6, '2Q', 'out'), p(7, '2Q′', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), pin(15, 'CLK'), p(14, '4Q′', 'out'), p(13, '4Q', 'out'), pin(12, '4D'), pin(11, '3D'), p(10, '3Q', 'out'), p(9, '3Q′', 'out')]
  },
  '74260': {
    part: '74LS260',
    left: [pin(1, '1A'), pin(2, '1B'), pin(3, '1C'), pin(4, '1D'), pin(5, '1E'), p(6, '1Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '2E'), pin(12, '2D'), pin(11, '2C'), pin(10, '2B'), pin(9, '2A'), p(8, '2Y', 'out')]
  },
  '74266': {
    part: '74LS266',
    left: [pin(1, '1A'), pin(2, '1B'), p(3, '1Y', 'out'), pin(4, '2A'), pin(5, '2B'), p(6, '2Y', 'out'), p(7, 'GND', 'power')],
    right: [p(14, 'VCC', 'power'), pin(13, '4B'), pin(12, '4A'), p(11, '4Y', 'out'), pin(10, '3B'), pin(9, '3A'), p(8, '3Y', 'out')]
  },
  '74LS90': {
    part: '74LS90',
    left: [pin(1, 'CKB'), p(2, 'R0(1)', 'clear', false), p(3, 'R0(2)', 'clear', false), pin(4, 'NC'), p(5, 'VCC', 'power'), p(6, 'R9(1)', 'preset', false), p(7, 'R9(2)', 'preset', false)],
    right: [pin(14, 'CKA'), pin(13, 'NC'), p(12, 'QA', 'out'), p(11, 'QD', 'out'), p(10, 'GND', 'power'), p(9, 'QB', 'out'), p(8, 'QC', 'out')]
  },
  '74LS160': {
    part: '74LS160',
    left: [p(1, 'CLR', 'clear'), pin(2, 'CLK'), pin(3, 'A'), pin(4, 'B'), pin(5, 'C'), pin(6, 'D'), p(7, 'ENP', 'alow'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), p(15, 'RCO', 'out'), p(14, 'QA', 'out'), p(13, 'QB', 'out'), p(12, 'QC', 'out'), p(11, 'QD', 'out'), p(10, 'ENT', 'alow'), p(9, 'LOAD', 'alow')]
  },
  '74LS193': {
    part: '74LS193',
    left: [pin(1, 'B'), p(2, 'QB', 'out'), p(3, 'QA', 'out'), pin(4, 'DOWN'), pin(5, 'UP'), p(6, 'QC', 'out'), p(7, 'QD', 'out'), p(8, 'GND', 'power')],
    right: [p(16, 'VCC', 'power'), pin(15, 'A'), p(14, 'CLR', 'clear'), p(13, 'BO', 'out'), p(12, 'CO', 'out'), p(11, 'LOAD', 'alow'), pin(10, 'C'), pin(9, 'D')]
  },
  '74LS273': {
    part: '74LS273',
    left: [p(1, 'CLR', 'clear'), p(2, 'Q0', 'out'), pin(3, 'D0'), pin(4, 'D1'), p(5, 'Q1', 'out'), p(6, 'Q2', 'out'), pin(7, 'D2'), pin(8, 'D3'), p(9, 'Q3', 'out'), p(10, 'GND', 'power')],
    right: [p(20, 'VCC', 'power'), p(19, 'Q7', 'out'), pin(18, 'D7'), pin(17, 'D6'), p(16, 'Q6', 'out'), p(15, 'Q5', 'out'), pin(14, 'D5'), pin(13, 'D4'), p(12, 'Q4', 'out'), pin(11, 'CLK')]
  },
  '28C256': {
    part: '28C256',
    left: [pin(1, 'A14'), pin(2, 'A12'), pin(3, 'A7'), pin(4, 'A6'), pin(5, 'A5'), pin(6, 'A4'), pin(7, 'A3'), pin(8, 'A2'), pin(9, 'A1'), pin(10, 'A0'), pin(11, 'D0'), pin(12, 'D1'), pin(13, 'D2'), p(14, 'GND', 'power')],
    right: [p(28, 'VCC', 'power'), p(27, 'WE', 'alow'), pin(26, 'A13'), pin(25, 'A8'), pin(24, 'A9'), pin(23, 'A11'), p(22, 'OE', 'alow'), pin(21, 'A10'), p(20, 'CE', 'alow'), p(19, 'D7', 'out'), p(18, 'D6', 'out'), p(17, 'D5', 'out'), p(16, 'D4', 'out'), p(15, 'D3', 'out')]
  },
  'ADC0804': {
    part: 'ADC0804',
    left: [p(1, 'CS', 'alow'), p(2, 'RD', 'alow'), p(3, 'WR', 'alow'), pin(4, 'CLK'), p(5, 'INTR', 'out'), pin(6, 'VIN+'), pin(7, 'VIN-'), p(8, 'AGND', 'power'), pin(9, 'VREF/2'), p(10, 'DGND', 'power')],
    right: [p(20, 'VCC', 'power'), p(19, 'D7', 'out'), p(18, 'D6', 'out'), p(17, 'D5', 'out'), p(16, 'D4', 'out'), p(15, 'D3', 'out'), p(14, 'D2', 'out'), p(13, 'D1', 'out'), p(12, 'D0', 'out'), pin(11, 'CLKR')]
  },
  'LM358': {
    part: 'LM358',
    left: [p(1, '1OUT', 'out'), pin(2, '1IN-'), pin(3, '1IN+'), p(4, 'GND', 'power')],
    right: [p(8, 'VCC', 'power'), p(7, '2OUT', 'out'), pin(6, '2IN-'), pin(5, '2IN+')]
  },
  'LM741': {
    part: 'LM741',
    left: [pin(1, 'OF1'), pin(2, 'IN-'), pin(3, 'IN+'), p(4, 'V-', 'power')],
    right: [pin(8, 'NC'), p(7, 'V+', 'power'), p(6, 'OUT', 'out'), pin(5, 'OF2')]
  },
  'LM7805': {
    part: 'LM7805',
    left: [p(1, 'IN', 'power')],
    right: [p(3, 'OUT', 'out'), p(2, 'GND', 'power')]
  },
  'LM317': {
    part: 'LM317',
    left: [p(1, 'ADJ', 'control')],
    right: [p(3, 'IN', 'power'), p(2, 'OUT', 'out')]
  },
  'DS18B20': {
    part: 'DS18B20',
    left: [p(1, 'GND', 'power')],
    right: [p(3, 'VDD', 'power'), p(2, 'DQ', 'out')]
  }
};

// ---------------------------------------------------------------- specs
const SPECS = {
  // ============================== Logic gates: symbol + IC pinout, no circuit
  'and-gate': { name: ['AND', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'and', pinout: PINOUTS['7408'] },
  'or-gate': { name: ['OR', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'or', pinout: PINOUTS['7432'] },
  'not-gate': { name: ['NOT', 'GATE'], in: ['A'], out: ['Y'], gate: 'not', pinout: PINOUTS['7404'] },
  'nand-gate': { name: ['NAND', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'nand', pinout: PINOUTS['7400'] },
  'nor-gate': { name: ['NOR', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'nor', pinout: PINOUTS['7402'] },
  'xor-gate': { name: ['XOR', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'xor', pinout: PINOUTS['7486'] },
  'xnor-gate': { name: ['XNOR', 'GATE'], in: ['A', 'B'], out: ['Y'], gate: 'xnor', pinout: PINOUTS['74266'] },
  'four-input-nand-gate': { name: ['4-IN', 'NAND'], in: ['A', 'B', 'C', 'D'], out: ['Y'], gate: 'nand4', pinout: PINOUTS['7420'] },
  'four-input-nor-gate': { name: ['4-IN', 'NOR'], in: ['A', 'B', 'C', 'D'], out: ['Y'], gate: 'nor4', pinout: PINOUTS['74260'] },
  'buffer-gate': { name: ['BUFFER', 'GATE'], in: ['A'], out: ['Y'], gate: 'buffer', pinout: PINOUTS['7407'] },
  'tri-state-buffer': { name: ['3-STATE', 'BUFFER'], in: ['A', 'OE'], out: ['Y'], pinout: PINOUTS['74125'] },
  'schmitt-trigger-inverter': { name: ['SCHMITT', 'INVERTER'], in: ['A'], out: ['Y'], pinout: PINOUTS['7414'] },
  'open-collector-inverter': { name: ['OPEN-C', 'INVERTER'], in: ['A'], out: ['Y'], pinout: PINOUTS['7424'] },
  'aoi21-gate': { name: ['AOI21', 'GATE'], in: ['A', 'B', 'C'], out: ['Y'], pinout: PINOUTS['7451'] },
  'oai21-gate': { name: ['OAI21', 'GATE'], in: ['A', 'B', 'C'], out: ['Y'], pinout: PINOUTS['7451'] },
  'majority-gate': { name: ['MAJORITY', 'GATE'], in: ['A', 'B', 'C'], out: ['Y'], pinout: PINOUTS['7410'] },

  // ============================== Flip-flops
  'sr-flip-flop': {
    name: ['SR', 'FLIP-FLOP'], in: ['S', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-sr', pinout: PINOUTS['7473'], state: 'sr'
  },
  'active-low-sr-latch': {
    name: ['ACTIVE-LOW', 'SR LATCH'], in: ['S*', 'R*'], out: ['Q', "Q'*"],
    circuit: 'nand-sr-latch', state: 'sr'
  },
  'gated-sr-latch': {
    name: ['GATED', 'SR LATCH'], in: ['S', 'R', 'EN'], out: ['Q', "Q'*"],
    circuit: 'nand-sr-gated', state: 'sr'
  },
  'jk-flip-flop': {
    name: ['JK', 'FLIP-FLOP'], in: ['J', 'K', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-jk', pinout: PINOUTS['7473'], state: 'jk'
  },
  'jk-latch': {
    name: ['JK', 'LATCH'], in: ['J', 'K', 'EN'], out: ['Q', "Q'*"], circuit: 'nand-jk', state: 'jk'
  },
  'jk-preset-clear-flip-flop': {
    name: ['JK + PRE', 'AND CLR'], in: ['J', 'K', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-jk', pinout: PINOUTS['74112'], state: 'jk'
  },
  'master-slave-jk-flip-flop': {
    name: ['MASTER-SLAVE', 'JK FLIP-FLOP'], in: ['J', 'K', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-jk-ms', pinout: PINOUTS['74107'], state: 'jk'
  },
  'd-flip-flop': {
    name: ['D', 'FLIP-FLOP'], in: ['D', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-d', pinout: PINOUTS['7474'], state: 'd'
  },
  'edge-triggered-d-flip-flop': {
    name: ['EDGE', 'D FLIP-FLOP'], in: ['D', 'CLK^'], out: ['Q', "Q'*"], circuit: 'nand-d', pinout: PINOUTS['7474'], state: 'd'
  },
  'positive-edge-d-flip-flop': {
    name: ['POS-EDGE', 'D FLIP-FLOP'], in: ['D', 'CLK^'], out: ['Q', "Q'*"], circuit: 'nand-d', pinout: PINOUTS['7474'], state: 'd'
  },
  'negative-edge-d-flip-flop': {
    name: ['NEG-EDGE', 'D FLIP-FLOP'], in: ['D', 'CLK^', 'CLK'], out: ['Q', "Q'*"], circuit: 'nand-d', state: 'd'
  },
  'clearable-d-flip-flop': {
    name: ['CLEARABLE', 'D FLIP-FLOP'], in: ['D', 'CLK^'], out: ['Q', "Q'*"],
    bot: ['CLR*~'], circuit: 'nand-d', state: 'd'
  },
  'presettable-d-flip-flop': {
    name: ['PRESETTABLE', 'D FLIP-FLOP'], in: ['D', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], circuit: 'nand-d', state: 'd'
  },
  'dual-d-flip-flop': {
    name: ['DUAL', 'D FLIP-FLOP'], in: ['1D', '2D', 'CLK^'], out: ['1Q', '2Q'],
    top: ['CLR*~'], circuit: 'nand-d', pinout: PINOUTS['7474'], state: 'd'
  },
  'quad-d-flip-flop': {
    name: ['QUAD', 'D FLIP-FLOP'], in: ['D0', 'D1', 'D2', 'D3'], out: ['Q0', 'Q1', 'Q2', 'Q3'],
    bot: ['CLK^'], circuit: 'nand-d', pinout: PINOUTS['74175'], state: 'd'
  },
  't-flip-flop': {
    name: ['T', 'FLIP-FLOP'], in: ['T', 'CLK^'], out: ['Q', "Q'*"],
    top: ['PRE*~'], bot: ['CLR*~'], circuit: 'nand-t', state: 't'
  },
  'toggle-latch': {
    name: ['TOGGLE', 'LATCH'], in: ['T', 'EN'], out: ['Q', "Q'*"], circuit: 'nand-t', state: 't'
  },

  // ============================== Counters
  'asynchronous-binary-counter': { name: ['ASYNC', 'BINARY COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS90'], state: 'counter4' },
  'binary-ripple-counter': { name: ['RIPPLE', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS90'], state: 'counter4' },
  'binary-up-counter': { name: ['BINARY', 'UP COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS160'], state: 'counter4' },
  'synchronous-binary-counter': { name: ['SYNC', 'BINARY COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], circuit: 'nand-counter4', pinout: PINOUTS['74LS160'], state: 'counter4' },
  'decade-counter': { name: ['DECADE', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS90'], state: 'counter10' },
  'bcd-counter': { name: ['BCD', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS90'], state: 'counter10' },
  'mod5-counter': { name: ['MOD-5', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2'], circuit: 'nand-counter3', pinout: PINOUTS['74LS90'], state: 'counter5' },
  'mod6-counter': { name: ['MOD-6', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2'], circuit: 'nand-counter3', pinout: PINOUTS['74LS90'], state: 'counter6' },
  'mod8-up-counter': { name: ['MOD-8', 'UP COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2'], bot: ['CLR*~'], circuit: 'nand-counter3', pinout: PINOUTS['74LS160'], state: 'counter8' },
  'mod8-down-counter': { name: ['MOD-8', 'DOWN COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2'], bot: ['CLR*~'], circuit: 'nand-counter3', pinout: PINOUTS['74LS193'], state: 'counter8' },
  'mod10-synchronous-counter': { name: ['MOD-10', 'SYNC COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], circuit: 'nand-counter4', pinout: PINOUTS['74LS160'], state: 'counter10' },
  'up-down-counter': { name: ['UP-DOWN', 'COUNTER'], in: ['CLK^', 'U/D'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS193'], state: 'counter4' },
  'programmable-modulo-counter': { name: ['PROGRAMMABLE', 'MOD COUNTER'], in: ['CLK^', 'P0', 'P1', 'P2', 'P3'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['LOAD*~'], circuit: 'nand-counter4', pinout: PINOUTS['74LS160'], state: 'counter10' },
  'ring-counter': { name: ['RING', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', state: 'ring' },
  'johnson-counter': { name: ['JOHNSON', 'COUNTER'], in: ['CLK^'], out: ['Q0', 'Q1', 'Q2', 'Q3'], bot: ['CLR*~'], circuit: 'nand-counter4', state: 'johnson' },

  // ============================== Multiplexers / encoders / decoders
  'mux-2-to-1': { name: ['2:1', 'MULTIPLEXER'], in: ['D0', 'D1', 'S'], out: ['Y'], circuit: 'nand-mux2', pinout: PINOUTS['74157'] },
  'mux-4-to-1': { name: ['4:1', 'MULTIPLEXER'], in: ['D0', 'D1', 'D2', 'D3', 'S0', 'S1'], out: ['Y'], circuit: 'nand-mux4', pinout: PINOUTS['74153'] },
  'dual-mux-4-to-1': { name: ['DUAL 4:1', 'MULTIPLEXER'], in: ['1D0', '1D1', '1D2', '1D3', 'S0', 'S1'], out: ['1Y', '2Y'], circuit: 'nand-mux4', pinout: PINOUTS['74153'] },
  'mux-8-to-1': { name: ['8:1', 'MULTIPLEXER'], in: ['D0-D7', 'S0', 'S1', 'S2'], out: ['Y'], circuit: 'nand-mux4', pinout: PINOUTS['74151'] },
  'mux-16-to-1': { name: ['16:1', 'MULTIPLEXER'], in: ['D0-D15', 'S0-S3'], out: ['Y'], pinout: PINOUTS['74150'] },
  'analog-multiplexer': { name: ['ANALOG', 'MULTIPLEXER'], in: ['S0', 'S1'], out: ['COM'], pinout: PINOUTS['74153'] },
  'demux-1-to-4': { name: ['1:4', 'DEMULTIPLEXER'], in: ['D', 'S0', 'S1'], out: ['Y0', 'Y1', 'Y2', 'Y3'], circuit: 'nand-demux4', pinout: PINOUTS['74139'] },
  'demux-1-to-8': { name: ['1:8', 'DEMULTIPLEXER'], in: ['D', 'S0-S2'], out: ['Y0-Y7'], pinout: PINOUTS['74138'] },
  'decoder-2-to-4': { name: ['2:4', 'DECODER'], in: ['A0', 'A1', 'EN'], out: ['Y0', 'Y1', 'Y2', 'Y3'], circuit: 'nand-decoder24', pinout: PINOUTS['74139'] },
  'decoder-3-to-8': { name: ['3:8', 'DECODER'], in: ['A0', 'A1', 'A2', 'EN'], out: ['Y0-Y7'], circuit: 'nand-decoder38', pinout: PINOUTS['74138'] },
  'decoder-4-to-16': { name: ['4:16', 'DECODER'], in: ['A0-A3', 'EN'], out: ['Y0-Y15'], pinout: PINOUTS['74154'] },
  'encoder-4-to-2': { name: ['4:2', 'ENCODER'], in: ['D0', 'D1', 'D2', 'D3'], out: ['A0', 'A1'], circuit: 'nand-encoder42', pinout: PINOUTS['74148'] },
  'priority-encoder-4-to-2': { name: ['PRIORITY 4:2', 'ENCODER'], in: ['D0', 'D1', 'D2', 'D3'], out: ['A0', 'A1'], circuit: 'nand-encoder42', pinout: PINOUTS['74148'] },
  'priority-encoder-8-to-3': { name: ['PRIORITY 8:3', 'ENCODER'], in: ['D0-D7'], out: ['A0', 'A1', 'A2'], pinout: PINOUTS['74148'] },
  'bcd-to-7-segment-decoder': { name: ['BCD TO', '7-SEGMENT'], in: ['A', 'B', 'C', 'D'], out: ['a-g'], pinout: PINOUTS['74147'] },
  'bcd-to-binary-converter': { name: ['BCD TO', 'BINARY'], in: ['A', 'B', 'C', 'D'], out: ['Q0-Q3'] },
  'binary-to-bcd-converter': { name: ['BINARY', 'TO BCD'], in: ['B0-B3'], out: ['D0-D3'] },
  'binary-to-gray-converter': { name: ['BINARY', 'TO GRAY'], in: ['B0', 'B1', 'B2', 'B3'], out: ['G0', 'G1', 'G2', 'G3'] },
  'gray-to-binary-converter': { name: ['GRAY', 'TO BINARY'], in: ['G0', 'G1', 'G2', 'G3'], out: ['B0', 'B1', 'B2', 'B3'] },

  // ============================== Memory
  sram: { name: ['SRAM'], in: ['A0-A14', 'WE*', 'OE*', 'CS1*'], out: ['D0-D7'], pinout: PINOUTS['62256'] },
  dram: { name: ['DRAM'], in: ['A0-A9', 'RAS*', 'CAS*', 'WE*'], out: ['D0-D7'], pinout: PINOUTS['62256'] },
  eeprom: { name: ['EEPROM'], in: ['A0-A14', 'WE*', 'CE*', 'OE*'], out: ['D0-D7'], pinout: PINOUTS['28C256'] },
  'flash-memory': { name: ['FLASH', 'MEMORY'], in: ['A0-A20', 'WE*', 'CE*', 'OE*'], out: ['D0-D15'], pinout: PINOUTS['28C256'] },
  'nand-flash': { name: ['NAND', 'FLASH'], in: ['CLE', 'ALE', 'CE*', 'RE*', 'WE*'], out: ['I/O0-7'], pinout: PINOUTS['28C256'] },
  'nor-flash': { name: ['NOR', 'FLASH'], in: ['A0-A19', 'CE*', 'OE*', 'WE*'], out: ['D0-D15'], pinout: PINOUTS['28C256'] },
  'read-only-memory': { name: ['ROM'], in: ['A0-A12', 'CE*', 'OE*'], out: ['D0-D7'], pinout: PINOUTS['28C256'] },
  'fifo-buffer-memory': { name: ['FIFO', 'BUFFER'], in: ['D0-D7', 'WR*', 'RD*'], out: ['Q0-Q7', 'EF', 'FF'], pinout: PINOUTS['62256'] },

  // ============================== Data converters
  'sar-adc': { name: ['SAR', 'ADC'], in: ['VIN', 'CLK^', 'START'], out: ['D0-D11', 'EOC'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  'flash-adc': { name: ['FLASH', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D7'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  '12-bit-adc': { name: ['12-BIT', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D11'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  '8-bit-adc': { name: ['8-BIT', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D7'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  'dual-slope-adc': { name: ['DUAL-SLOPE', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D11'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  'pipeline-adc': { name: ['PIPELINE', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D11'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },
  'sigma-delta-adc': { name: ['SIGMA-DELTA', 'ADC'], in: ['VIN', 'CLK^'], out: ['D0-D15'], pinout: PINOUTS['ADC0804'], circuit: 'adc' },

  // ============================== Op-amps
  'inverting-amplifier': { name: ['INVERTING', 'AMPLIFIER'], in: ['VIN', 'R1', 'R2'], out: ['VOUT'], pinout: PINOUTS['LM741'], circuit: 'opamp-inv' },
  'non-inverting-amplifier': { name: ['NON-INV', 'AMPLIFIER'], in: ['VIN', 'R1', 'R2'], out: ['VOUT'], pinout: PINOUTS['LM741'], circuit: 'opamp-ninv' },
  'voltage-follower': { name: ['VOLTAGE', 'FOLLOWER'], in: ['VIN'], out: ['VOUT'], pinout: PINOUTS['LM358'], circuit: 'opamp-fol' },
  'summing-amplifier': { name: ['SUMMING', 'AMPLIFIER'], in: ['V1', 'V2', 'V3'], out: ['VOUT'], pinout: PINOUTS['LM741'], circuit: 'opamp-sum' },
  'differential-amplifier': { name: ['DIFFERENTIAL', 'AMPLIFIER'], in: ['V1', 'V2'], out: ['VOUT'], pinout: PINOUTS['LM358'], circuit: 'opamp-diff' },
  'opamp-integrator': { name: ['INTEGRATOR', 'OP-AMP'], in: ['VIN'], out: ['VOUT'], pinout: PINOUTS['LM741'], circuit: 'opamp-int' },
  'opamp-differentiator': { name: ['DIFFERENTIATOR', 'OP-AMP'], in: ['VIN'], out: ['VOUT'], pinout: PINOUTS['LM741'], circuit: 'opamp-diff2' },
  'opamp-comparator-circuit': { name: ['COMPARATOR', 'CIRCUIT'], in: ['VIN', 'VREF'], out: ['VOUT'], pinout: PINOUTS['LM358'], circuit: 'opamp-cmp' },

  // ============================== Regulators
  'linear-voltage-regulator': { name: ['LINEAR', 'REGULATOR'], in: ['VIN', 'GND'], out: ['VOUT'], pinout: PINOUTS['LM7805'], circuit: 'reg-linear' },
  'adjustable-linear-regulator': { name: ['ADJUSTABLE', 'REGULATOR'], in: ['VIN', 'ADJ'], out: ['VOUT'], pinout: PINOUTS['LM317'], circuit: 'reg-adj' },
  'low-dropout-regulator': { name: ['LDO', 'REGULATOR'], in: ['VIN', 'EN'], out: ['VOUT'], pinout: PINOUTS['LM317'], circuit: 'reg-adj' },
  'buck-converter': { name: ['BUCK', 'CONVERTER'], in: ['VIN', 'EN'], out: ['VOUT'], circuit: 'reg-buck' },
  'boost-converter': { name: ['BOOST', 'CONVERTER'], in: ['VIN', 'EN'], out: ['VOUT'], circuit: 'reg-boost' },
  'buck-boost-converter': { name: ['BUCK-BOOST', 'CONVERTER'], in: ['VIN', 'EN'], out: ['VOUT'], circuit: 'reg-buck' },
  'charge-pump-converter': { name: ['CHARGE-PUMP', 'CONVERTER'], in: ['VIN', 'CLK^'], out: ['VOUT'], circuit: 'reg-buck' },

  // ============================== Diodes / LEDs
  'rectifier-diode': { name: ['RECTIFIER', 'DIODE'], in: ['A'], out: ['K'], device: 'diode', circuit: 'diode-inline' },
  'zener-diode': { name: ['ZENER', 'DIODE'], in: ['A'], out: ['K'], device: 'zener', circuit: 'diode-zener' },
  'zener-5v1': { name: ['5.1 V', 'ZENER'], in: ['A'], out: ['K'], device: 'zener', circuit: 'diode-zener' },
  'zener-12v': { name: ['12 V', 'ZENER'], in: ['A'], out: ['K'], device: 'zener', circuit: 'diode-zener' },
  'schottky-diode': { name: ['SCHOTTKY', 'DIODE'], in: ['A'], out: ['K'], device: 'schottky', circuit: 'diode-zener' },
  'low-barrier-schottky-diode': { name: ['LOW-BARRIER', 'SCHOTTKY'], in: ['A'], out: ['K'], device: 'schottky', circuit: 'diode-zener' },
  'small-signal-switching-diode': { name: ['SWITCHING', 'DIODE'], in: ['A'], out: ['K'], device: 'diode', circuit: 'diode-inline' },
  'fast-recovery-diode': { name: ['FAST-RECOVERY', 'DIODE'], in: ['A'], out: ['K'], device: 'diode', circuit: 'diode-inline' },
  'pin-diode': { name: ['PIN', 'DIODE'], in: ['A'], out: ['K'], device: 'diode', circuit: 'diode-inline' },
  'varactor-diode': { name: ['VARACTOR', 'DIODE'], in: ['A'], out: ['K'], device: 'varactor', circuit: 'diode-zener' },
  photodiode: { name: ['PHOTO', 'DIODE'], in: ['A'], out: ['K'], device: 'photodiode', circuit: 'diode-inline' },
  'bridge-rectifier': { name: ['BRIDGE', 'RECTIFIER'], in: ['AC1', 'AC2'], out: ['V+', 'V-'], circuit: 'rectifier-bridge' },
  'red-led': { name: ['RED', 'LED'], in: ['A'], out: ['K'], device: 'led', circuit: 'led' },
  'green-led': { name: ['GREEN', 'LED'], in: ['A'], out: ['K'], device: 'led', circuit: 'led' },
  'blue-led': { name: ['BLUE', 'LED'], in: ['A'], out: ['K'], device: 'led', circuit: 'led' },
  'white-led': { name: ['WHITE', 'LED'], in: ['A'], out: ['K'], device: 'led', circuit: 'led' },
  'infrared-led': { name: ['INFRARED', 'LED'], in: ['A'], out: ['K'], device: 'led', circuit: 'led' },
  'rgb-led': { name: ['RGB', 'LED'], in: ['R', 'G', 'B'], out: ['COM'], device: 'led', circuit: 'led' },

  // ============================== Transistors
  'npn-bjt': { name: ['NPN', 'BJT'], in: ['B'], out: ['C', 'E'], device: 'npn', circuit: 'bjt-switch' },
  'pnp-bjt': { name: ['PNP', 'BJT'], in: ['B'], out: ['C', 'E'], device: 'pnp', circuit: 'bjt-switch' },
  'small-signal-npn-transistor': { name: ['SMALL-SIGNAL', 'NPN'], in: ['B'], out: ['C', 'E'], device: 'npn', circuit: 'bjt-switch' },
  'power-npn-transistor': { name: ['POWER', 'NPN'], in: ['B'], out: ['C', 'E'], device: 'npn', circuit: 'bjt-switch' },
  'darlington-pair': { name: ['DARLINGTON', 'PAIR'], in: ['B'], out: ['C', 'E'], device: 'darlington', circuit: 'bjt-switch' },
  phototransistor: { name: ['PHOTO', 'TRANSISTOR'], in: ['B'], out: ['C', 'E'], device: 'phototransistor', circuit: 'bjt-switch' },
  'nmos-enhancement': { name: ['N-CH', 'MOSFET'], in: ['G'], out: ['D', 'S'], device: 'nmos', circuit: 'mosfet-switch' },
  'pmos-enhancement': { name: ['P-CH', 'MOSFET'], in: ['G'], out: ['D', 'S'], device: 'pmos', circuit: 'mosfet-switch' },
  'power-mosfet': { name: ['POWER', 'MOSFET'], in: ['G'], out: ['D', 'S'], device: 'nmos', circuit: 'mosfet-switch' },
  'logic-level-nmos': { name: ['LOGIC-LEVEL', 'N-CH MOSFET'], in: ['G'], out: ['D', 'S'], device: 'nmos', circuit: 'mosfet-switch' },
  'dual-nmos': { name: ['DUAL', 'N-CH MOSFET'], in: ['G1', 'G2'], out: ['D1', 'D2', 'S1', 'S2'], device: 'nmos', circuit: 'mosfet-switch' },
  'pmos-load-switch': { name: ['P-CH', 'LOAD SWITCH'], in: ['ON', 'VIN'], out: ['VOUT'], device: 'pmos', circuit: 'mosfet-switch' },

  // ============================== Relays
  'spst-relay': { name: ['SPST', 'RELAY'], in: ['COIL+', 'COIL-'], out: ['COM', 'NO'], circuit: 'relay-spst' },
  'spdt-relay': { name: ['SPDT', 'RELAY'], in: ['COIL+', 'COIL-'], out: ['COM', 'NO', 'NC'], circuit: 'relay-spdt' },
  'dpdt-relay': { name: ['DPDT', 'RELAY'], in: ['COIL+', 'COIL-'], out: ['COM1', 'COM2'], circuit: 'relay-spdt' },
  'electromagnetic-relay': { name: ['ELECTROMAG', 'RELAY'], in: ['COIL+', 'COIL-'], out: ['COM', 'NO', 'NC'], circuit: 'relay-spdt' },
  'latching-relay': { name: ['LATCHING', 'RELAY'], in: ['SET', 'RESET'], out: ['COM', 'NO', 'NC'], circuit: 'relay-spdt' },
  'reed-relay': { name: ['REED', 'RELAY'], in: ['COIL+', 'COIL-'], out: ['COM', 'NO'], circuit: 'relay-spst' },
  'solid-state-relay': { name: ['SOLID-STATE', 'RELAY'], in: ['LED+', 'LED-'], out: ['AC1', 'AC2'], circuit: 'relay-ssr' },

  // ============================== Motors
  'brushed-dc-motor': { name: ['BRUSHED', 'DC MOTOR'], in: ['+', '-'], out: ['SHAFT'], device: 'motor' },
  'brushless-dc-motor': { name: ['BRUSHLESS', 'DC MOTOR'], in: ['U', 'V', 'W'], out: ['SHAFT'], device: 'motor' },
  'dc-gear-motor': { name: ['GEARED', 'DC MOTOR'], in: ['+', '-'], out: ['SHAFT'], device: 'motor' },
  'permanent-magnet-dc-motor': { name: ['PM', 'DC MOTOR'], in: ['+', '-'], out: ['SHAFT'], device: 'motor' },
  'servo-motor': { name: ['SERVO', 'MOTOR'], in: ['PWM', 'V+', 'GND'], out: ['SHAFT'], device: 'motor' },
  'stepper-motor': { name: ['STEPPER', 'MOTOR'], in: ['A1', 'A2', 'B1', 'B2'], out: ['SHAFT'], device: 'motor' },

  // ============================== Sensors
  'analog-temperature-sensor': { name: ['ANALOG TEMP', 'SENSOR'], in: ['V+', 'GND'], out: ['VOUT'], pinout: PINOUTS['LM358'] },
  'digital-temperature-sensor': { name: ['DIGITAL TEMP', 'SENSOR'], in: ['V+', 'GND'], out: ['DQ'], pinout: PINOUTS['DS18B20'] },
  'digital-humidity-sensor': { name: ['HUMIDITY', 'SENSOR'], in: ['V+', 'GND'], out: ['DATA'], pinout: PINOUTS['DS18B20'] },
  'ntc-thermistor': { name: ['NTC', 'THERMISTOR'], in: ['P1'], out: ['P2'], device: 'thermistor' },
  'ptc-thermistor': { name: ['PTC', 'THERMISTOR'], in: ['P1'], out: ['P2'], device: 'thermistor' },
  'rtd-sensor': { name: ['RTD', 'SENSOR'], in: ['P1'], out: ['P2'], device: 'thermistor' },
  thermocouple: { name: ['THERMO', 'COUPLE'], in: ['T+'], out: ['T-'], device: 'thermocouple' }
};

module.exports = { SPECS, PINOUTS };
