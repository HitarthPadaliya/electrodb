-- Add missing tables and repair empty or generic logical table data. Safe to reapply.
USE electrodb;

-- BEGIN COMPLETE CATALOGUE TABLES (scripts/fill-catalogue-data.js)
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","0000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='decade-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["000","001"],["001","010"],["010","011"],["011","100"],["100","101"],["101","110"],["110","111"],["111","000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mod8-up-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["000","111"],["001","000"],["010","001"],["011","010"],["100","011"],["101","100"],["110","101"],["111","110"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mod8-down-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","1010"],["1010","1011"],["1011","1100"],["1100","1101"],["1101","1110"],["1110","1111"],["1111","0000"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='binary-up-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","1010"],["1010","1011"],["1011","1100"],["1100","1101"],["1101","1110"],["1110","1111"],["1111","0000"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='binary-ripple-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["S","R","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"X","Invalid"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='sr-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["S","R","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,"X"],[1,1,1,"X"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='sr-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","S","R"],"rows":[[0,0,0,"X"],[0,1,1,0],[1,0,0,1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='sr-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["J","K","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["J","K","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","J","K"],"rows":[[0,0,0,"X"],[0,1,1,"X"],[1,0,"X",1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["T","Q(n+1)","Operation"],"rows":[[0,"\\\\(Q_n\\\\)","Hold"],[1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='t-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["T","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='t-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","T"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='t-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["J","K","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='master-slave-jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["J","K","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='master-slave-jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","J","K"],"rows":[[0,0,0,"X"],[0,1,1,"X"],[1,0,"X",1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='master-slave-jk-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,0],[0,1,0],[1,0,0],[1,1,1]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='and-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,1]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='or-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","Y"],"rows":[[0,1],[1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='not-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,1],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='nand-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,1],[0,1,0],[1,0,0],[1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='nor-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='xor-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","Y"],"rows":[[0,0,1],[0,1,0],[1,0,0],[1,1,1]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='xnor-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S0","Y"],"rows":[[0,"I0"],[1,"I1"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mux-2-to-1'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S1","S0","Y"],"rows":[[0,0,"I0"],[0,1,"I1"],[1,0,"I2"],[1,1,"I3"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mux-4-to-1'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Input code","Y0","Y1","Y2","Y3"],"rows":[["00",1,0,0,0],["01",0,1,0,0],["10",0,0,1,0],["11",0,0,0,1]]}', 'Enabled, active-high logical decoder; package output polarity may differ.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='decoder-2-to-4'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Inputs D3…D0","Output code","Valid"],"rows":[["1000","11",1],["0100","10",1],["0010","01",1],["0001","00",1],["0000","X",0]]}', 'One-hot active-high input required; multiple asserted inputs are invalid. Output is undefined when Valid = 0.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='encoder-4-to-2'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["000","001"],["001","010"],["010","011"],["011","100"],["100","000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mod5-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["000","001"],["001","010"],["010","011"],["011","100"],["100","101"],["101","000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mod6-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","0000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mod10-synchronous-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","0000"]]}', 'Advances on each active clock event, with reset inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='bcd-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0011"],["0011","0111"],["0111","1111"],["1111","1110"],["1110","1100"],["1100","1000"],["1000","0000"]]}', 'Advances on each active clock event, with reset inactive. Four-stage model; only the initialized valid cycle is shown.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='johnson-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0001","0010"],["0010","0100"],["0100","1000"],["1000","0001"]]}', 'Advances on each active clock event, with reset inactive. Four-stage model; only the initialized valid cycle is shown.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='ring-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next (UP)","Next (DOWN)"],"rows":[["0000","0001","1111"],["0001","0010","0000"],["0010","0011","0001"],["0011","0100","0010"],["0100","0101","0011"],["0101","0110","0100"],["0110","0111","0101"],["0111","1000","0110"],["1000","1001","0111"],["1001","1010","1000"],["1010","1011","1001"],["1011","1100","1010"],["1100","1101","1011"],["1101","1110","1100"],["1110","1111","1101"],["1111","0000","1110"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='up-down-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","1010"],["1010","1011"],["1011","1100"],["1100","1101"],["1101","1110"],["1110","1111"],["1111","0000"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='asynchronous-binary-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","1010"],["1010","1011"],["1011","1100"],["1100","1101"],["1101","1110"],["1110","1111"],["1111","0000"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='synchronous-binary-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       '{"columns":["Current state","Next state"],"rows":[["0000","0001"],["0001","0010"],["0010","0011"],["0011","0100"],["0100","0101"],["0101","0110"],["0110","0111"],["0111","1000"],["1000","1001"],["1001","1010"],["1010","1011"],["1011","1100"],["1100","1101"],["1101","1110"],["1110","1111"],["1111","0000"]]}', 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16). Programmed modulus M = 16; load inactive.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='programmable-modulo-counter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["S","R","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"X","Invalid"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='gated-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["S","R","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,"X"],[1,1,1,"X"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='gated-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","S","R"],"rows":[[0,0,0,"X"],[0,1,1,0],[1,0,0,1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='gated-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["S̅","R̅","Q(n+1)","Operation"],"rows":[[0,0,"X","Invalid"],[0,1,1,"Set"],[1,0,0,"Reset"],[1,1,"\\\\(Q_n\\\\)","Hold"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='active-low-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["S̅","R̅","Q(n)","Q(n+1)"],"rows":[[0,0,0,"X"],[0,0,1,"X"],[0,1,0,1],[0,1,1,1],[1,0,0,0],[1,0,1,0],[1,1,0,0],[1,1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='active-low-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","S̅","R̅"],"rows":[[0,0,1,"X"],[0,1,0,1],[1,0,1,0],[1,1,"X",1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='active-low-sr-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='edge-triggered-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='edge-triggered-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='edge-triggered-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='positive-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='positive-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='positive-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='negative-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='negative-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='negative-edge-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["J","K","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["J","K","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","J","K"],"rows":[[0,0,0,"X"],[0,1,1,"X"],[1,0,"X",1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["T","Q(n+1)","Operation"],"rows":[[0,"\\\\(Q_n\\\\)","Hold"],[1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='toggle-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["T","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='toggle-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","T"],"rows":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='toggle-latch'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='dual-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='dual-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='dual-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='quad-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='quad-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='quad-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='presettable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='presettable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='presettable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["D","Q(n+1)","Operation"],"rows":[[0,0,"Reset"],[1,1,"Set"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='clearable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["D","Q(n)","Q(n+1)"],"rows":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='clearable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","D"],"rows":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='clearable-d-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["J","K","Q(n+1)","Operation"],"rows":[[0,0,"\\\\(Q_n\\\\)","Hold"],[0,1,0,"Reset"],[1,0,1,"Set"],[1,1,"\\\\(\\\\overline{Q_n}\\\\)","Toggle"]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-preset-clear-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       '{"columns":["J","K","Q(n)","Q(n+1)"],"rows":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-preset-clear-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       '{"columns":["Q(n)","Q(n+1)","J","K"],"rows":[[0,0,0,"X"],[0,1,1,"X"],[1,0,"X",1],[1,1,"X",0]]}', 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='jk-preset-clear-flip-flop'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","Y"],"rows":[[0,0],[1,1]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='buffer-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","OE","Y"],"rows":[[0,0,"Z"],[1,0,"Z"],[0,1,0],[1,1,1]]}', 'Active-high output enable. Z means high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='tri-state-buffer'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","Y"],"rows":[[0,"Z"],[1,0]]}', 'Z is the released output; an external pull-up produces logic high.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='open-collector-inverter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Switching Table',
       '{"columns":["Input condition","Y"],"rows":[["Vin < VT−",1],["VT− ≤ Vin ≤ VT+","Previous output"],["Vin > VT+",0]]}', 'Hysteresis thresholds are device-specific.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='schmitt-trigger-inverter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","C","Y"],"rows":[[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,1],[1,1,1,1]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='majority-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","C","Y"],"rows":[[0,0,0,1],[0,0,1,0],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='aoi21-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","C","Y"],"rows":[[0,0,0,1],[0,0,1,1],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,1],[1,1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='oai21-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","C","D","Y"],"rows":[[0,0,0,0,1],[0,0,0,1,1],[0,0,1,0,1],[0,0,1,1,1],[0,1,0,0,1],[0,1,0,1,1],[0,1,1,0,1],[0,1,1,1,1],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,0,1,1,1],[1,1,0,0,1],[1,1,0,1,1],[1,1,1,0,1],[1,1,1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='four-input-nand-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       '{"columns":["A","B","C","D","Y"],"rows":[[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,0],[0,1,0,0,0],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,0],[1,0,0,0,0],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,0],[1,1,0,0,0],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,0]]}', NULL, 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='four-input-nor-gate'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S2","S1","S0","Y"],"rows":[[0,0,0,"I0"],[0,0,1,"I1"],[0,1,0,"I2"],[0,1,1,"I3"],[1,0,0,"I4"],[1,0,1,"I5"],[1,1,0,"I6"],[1,1,1,"I7"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mux-8-to-1'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S3","S2","S1","S0","Y"],"rows":[[0,0,0,0,"I0"],[0,0,0,1,"I1"],[0,0,1,0,"I2"],[0,0,1,1,"I3"],[0,1,0,0,"I4"],[0,1,0,1,"I5"],[0,1,1,0,"I6"],[0,1,1,1,"I7"],[1,0,0,0,"I8"],[1,0,0,1,"I9"],[1,0,1,0,"I10"],[1,0,1,1,"I11"],[1,1,0,0,"I12"],[1,1,0,1,"I13"],[1,1,1,0,"I14"],[1,1,1,1,"I15"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='mux-16-to-1'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S1","S0","Y"],"rows":[[0,0,"I0"],[0,1,"I1"],[1,0,"I2"],[1,1,"I3"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='dual-mux-4-to-1'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S1","S0","Y"],"rows":[[0,0,"I0"],[0,1,"I1"],[1,0,"I2"],[1,1,"I3"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='analog-multiplexer'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S1","S0","Outputs"],"rows":[[0,0,"Y0 = D; other outputs = 0"],[0,1,"Y1 = D; other outputs = 0"],[1,0,"Y2 = D; other outputs = 0"],[1,1,"Y3 = D; other outputs = 0"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='demux-1-to-4'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'selection_table', 'Selection Table',
       '{"columns":["S2","S1","S0","Outputs"],"rows":[[0,0,0,"Y0 = D; other outputs = 0"],[0,0,1,"Y1 = D; other outputs = 0"],[0,1,0,"Y2 = D; other outputs = 0"],[0,1,1,"Y3 = D; other outputs = 0"],[1,0,0,"Y4 = D; other outputs = 0"],[1,0,1,"Y5 = D; other outputs = 0"],[1,1,0,"Y6 = D; other outputs = 0"],[1,1,1,"Y7 = D; other outputs = 0"]]}', 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='demux-1-to-8'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Input code","Y0","Y1","Y2","Y3","Y4","Y5","Y6","Y7"],"rows":[["000",1,0,0,0,0,0,0,0],["001",0,1,0,0,0,0,0,0],["010",0,0,1,0,0,0,0,0],["011",0,0,0,1,0,0,0,0],["100",0,0,0,0,1,0,0,0],["101",0,0,0,0,0,1,0,0],["110",0,0,0,0,0,0,1,0],["111",0,0,0,0,0,0,0,1]]}', 'Enabled, active-high logical decoder; package output polarity may differ.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='decoder-3-to-8'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Input code","Y0","Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13","Y14","Y15"],"rows":[["0000",1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],["0001",0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],["0010",0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],["0011",0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],["0100",0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],["0101",0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],["0110",0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],["0111",0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],["1000",0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],["1001",0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],["1010",0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],["1011",0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],["1100",0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],["1101",0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],["1110",0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],["1111",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]]}', 'Enabled, active-high logical decoder; package output polarity may differ.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='decoder-4-to-16'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Inputs D3…D0","Output code","Valid"],"rows":[["1XXX","11",1],["01XX","10",1],["001X","01",1],["0001","00",1],["0000","X",0]]}', 'Highest-numbered asserted input wins. X means don’t care; output is undefined when Valid = 0.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='priority-encoder-4-to-2'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Inputs D7…D0","Output code","Valid"],"rows":[["1XXXXXXX","111",1],["01XXXXXX","110",1],["001XXXXX","101",1],["0001XXXX","100",1],["00001XXX","011",1],["000001XX","010",1],["0000001X","001",1],["00000001","000",1],["00000000","X",0]]}', 'Highest-numbered asserted input wins. X means don’t care; output is undefined when Valid = 0.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='priority-encoder-8-to-3'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["BCD","abcdefg"],"rows":[["0000","1111110"],["0001","0110000"],["0010","1101101"],["0011","1111001"],["0100","0110011"],["0101","1011011"],["0110","1011111"],["0111","1110000"],["1000","1111111"],["1001","1111011"],["1010–1111","Invalid BCD"]]}', 'Active-high segments (common-cathode model); invalid BCD inputs are unspecified.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='bcd-to-7-segment-decoder'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Binary","Gray"],"rows":[["0000","0000"],["0001","0001"],["0010","0011"],["0011","0010"],["0100","0110"],["0101","0111"],["0110","0101"],["0111","0100"],["1000","1100"],["1001","1101"],["1010","1111"],["1011","1110"],["1100","1010"],["1101","1011"],["1110","1001"],["1111","1000"]]}', 'Illustrative four-bit input model.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='binary-to-gray-converter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Gray","Binary"],"rows":[["0000","0000"],["0001","0001"],["0010","0011"],["0011","0010"],["0100","0111"],["0101","0110"],["0110","0100"],["0111","0101"],["1000","1111"],["1001","1110"],["1010","1100"],["1011","1101"],["1100","1000"],["1101","1001"],["1110","1011"],["1111","1010"]]}', 'Illustrative four-bit input model.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='gray-to-binary-converter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["BCD","Binary"],"rows":[["0000","0000"],["0001","0001"],["0010","0010"],["0011","0011"],["0100","0100"],["0101","0101"],["0110","0110"],["0111","0111"],["1000","1000"],["1001","1001"]]}', 'Single BCD digit model; codes 1010–1111 are invalid.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='bcd-to-binary-converter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'mapping_table', 'Code Mapping',
       '{"columns":["Binary","BCD (tens units)"],"rows":[["0000","0000 0000"],["0001","0000 0001"],["0010","0000 0010"],["0011","0000 0011"],["0100","0000 0100"],["0101","0000 0101"],["0110","0000 0110"],["0111","0000 0111"],["1000","0000 1000"],["1001","0000 1001"],["1010","0001 0000"],["1011","0001 0001"],["1100","0001 0010"],["1101","0001 0011"],["1110","0001 0100"],["1111","0001 0101"]]}', 'Illustrative four-bit input model.', 3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug='binary-to-bcd-converter'
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), caption=VALUES(caption), display_order=VALUES(display_order);
-- END COMPLETE CATALOGUE TABLES
