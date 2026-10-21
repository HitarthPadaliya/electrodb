-- ================================================================
-- ElectroDB - Full MySQL database for XAMPP / phpMyAdmin
-- Target: MySQL 8.0+ / compatible MariaDB version bundled with XAMPP
-- Import: phpMyAdmin -> Import -> choose this file -> Go
--
-- WARNING:
--   This script DROPS and recreates the `electrodb` database.
--   Back up any existing database named `electrodb` before importing.
--
-- Includes:
--   * Hierarchical categories and tags
--   * Components and typed educational content
--   * Separate truth/characteristic/excitation tables and equations
--   * Specifications and component specifications
--   * Application user records for DBMS assignment demonstration
--   * Audit log
--   * Views, indexes, stored procedures, functions, and triggers
--   * Seed data for 147 components
--
-- Notes:
--   * This is MySQL stored-program syntax, not Oracle PL/SQL.
--   * Diagram assets are SVG paths; create the actual SVG files in the
--     frontend public/assets/svg directory before expecting them to load.
--   * Educational numeric examples are illustrative unless sourced
--     from a verified datasheet.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS electrodb;
CREATE DATABASE electrodb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE electrodb;

-- ------------------------------
-- 1. Hierarchical category tree
-- ------------------------------
CREATE TABLE categories (
  category_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_category_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent_order (parent_category_id, display_order),
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_categories_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 2. Tags
-- ------------------------------
CREATE TABLE tags (
  tag_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  PRIMARY KEY (tag_id),
  UNIQUE KEY uq_tags_name (name),
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB;

-- ------------------------------
-- 3. Components
-- ------------------------------
CREATE TABLE components (
  component_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  short_description VARCHAR(1000) NULL,
  description TEXT NULL,
  main_image_path VARCHAR(500) NULL,
  circuit_symbol_path VARCHAR(500) NULL,
  datasheet_url VARCHAR(1000) NULL,
  is_illustrative TINYINT(1) NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (component_id),
  UNIQUE KEY uq_components_slug (slug),
  KEY idx_components_category (category_id),
  KEY idx_components_published_category (is_published, category_id),
  KEY idx_components_name (name),
  CONSTRAINT fk_components_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_components_illustrative CHECK (is_illustrative IN (0,1)),
  CONSTRAINT chk_components_published CHECK (is_published IN (0,1)),
  CONSTRAINT chk_components_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB;

CREATE TABLE component_tags (
  component_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (component_id, tag_id),
  KEY idx_component_tags_tag (tag_id),
  CONSTRAINT fk_component_tags_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------
-- 4. Content types and category templates
-- ------------------------------
CREATE TABLE content_types (
  content_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  label VARCHAR(100) NOT NULL,
  render_kind VARCHAR(30) NOT NULL,
  description VARCHAR(500) NULL,
  PRIMARY KEY (content_type_id),
  UNIQUE KEY uq_content_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE category_content_types (
  category_id BIGINT UNSIGNED NOT NULL,
  content_type_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(80) NOT NULL,
  section_label VARCHAR(120) NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, section_key),
  KEY idx_category_content_type (content_type_id),
  CONSTRAINT fk_cct_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cct_content_type
    FOREIGN KEY (content_type_id) REFERENCES content_types(content_type_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_cct_required CHECK (is_required IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 5. Component educational content
-- content may be prose, JSON text, LaTeX, or an SVG resource path.
-- ------------------------------
CREATE TABLE component_content (
  component_content_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  component_id BIGINT UNSIGNED NOT NULL,
  content_type_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  diagram_kind VARCHAR(40) NULL,
  alt_text VARCHAR(500) NULL,
  caption VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (component_content_id),
  UNIQUE KEY uq_component_content_section (component_id, section_key),
  KEY idx_component_content_order (component_id, display_order),
  KEY idx_component_content_type (content_type_id),
  CONSTRAINT fk_component_content_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_content_type
    FOREIGN KEY (content_type_id) REFERENCES content_types(content_type_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------
-- 6. Specifications
-- ------------------------------
CREATE TABLE specifications (
  specification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(40) NULL,
  value_kind ENUM('NUMBER','TEXT','RANGE') NOT NULL DEFAULT 'TEXT',
  description VARCHAR(500) NULL,
  PRIMARY KEY (specification_id),
  UNIQUE KEY uq_specifications_name (name)
) ENGINE=InnoDB;

CREATE TABLE component_specifications (
  component_id BIGINT UNSIGNED NOT NULL,
  specification_id BIGINT UNSIGNED NOT NULL,
  numeric_value DECIMAL(18,6) NULL,
  text_value VARCHAR(300) NULL,
  range_min DECIMAL(18,6) NULL,
  range_max DECIMAL(18,6) NULL,
  unit_override VARCHAR(40) NULL,
  source_note VARCHAR(500) NULL,
  PRIMARY KEY (component_id, specification_id),
  KEY idx_component_specs_spec (specification_id),
  CONSTRAINT fk_component_specs_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_component_specs_spec
    FOREIGN KEY (specification_id) REFERENCES specifications(specification_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_component_spec_range CHECK (
    range_min IS NULL OR range_max IS NULL OR range_min <= range_max
  )
) ENGINE=InnoDB;

-- ------------------------------
-- 7. Assignment-specific application users
-- These are application demo records, not MySQL server accounts.
-- Password hashes must be generated by the backend; no plaintext passwords.
-- ------------------------------
CREATE TABLE app_users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_code ENUM('NAIVE_USER','APP_DEVELOPER','DBA') NOT NULL DEFAULT 'NAIVE_USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_app_users_username (username),
  CONSTRAINT chk_app_users_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB;

-- ------------------------------
-- 8. Audit log
-- ------------------------------
CREATE TABLE application_audit_log (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(128) NOT NULL,
  operation_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  row_key VARCHAR(128) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  db_user VARCHAR(288) NOT NULL,
  application_user VARCHAR(100) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  PRIMARY KEY (audit_id),
  KEY idx_audit_table_time (table_name, changed_at),
  KEY idx_audit_operation_time (operation_type, changed_at)
) ENGINE=InnoDB;

-- ------------------------------
-- 9. Content type seed data
-- ------------------------------
INSERT INTO content_types (code, label, render_kind, description) VALUES
('TEXT','Text','TEXT','Readable prose or lists'),
('IMAGE','Image','IMAGE','Image or image resource'),
('TABLE','Table','TABLE','Structured table; content is JSON text'),
('EQUATION','Equation','EQUATION','LaTeX equation source'),
('DIAGRAM','Diagram','SVG_DIAGRAM','SVG diagram path'),
('TIMING_DIAGRAM','Timing Diagram','SVG_DIAGRAM','Timing diagram as SVG'),
('GRAPH','Graph','SVG_DIAGRAM','Graph image or SVG resource'),
('DOCUMENT','Document','DOCUMENT','Datasheet or document URL');

-- ------------------------------
-- 10. Categories
-- ------------------------------
INSERT INTO categories (category_id, parent_category_id, name, slug, description, display_order) VALUES
(1,NULL,'Digital Electronics','digital-electronics','Digital logic and sequential circuits',1),
(2,NULL,'Semiconductor Devices','semiconductor-devices','Semiconductor components',2),
(3,NULL,'Analog and Linear ICs','analog-linear-ics','Amplifiers and voltage control',3),
(4,NULL,'Sensors and Data Conversion','sensors-data-conversion','Sensors and conversion circuits',4),
(5,NULL,'Electromechanical Components','electromechanical-components','Relays and motors',5);

INSERT INTO categories (category_id, parent_category_id, name, slug, description, display_order) VALUES
(6,1,'Counters','counters','Sequential circuits that count clock events',1),
(7,1,'Flip-Flops','flip-flops','Bistable sequential logic elements',2),
(8,1,'Logic Gates','logic-gates','Boolean logic primitives',3),
(9,1,'Multiplexers','multiplexers','Digital data selection circuits',4),
(10,1,'Encoders and Decoders','encoders-decoders','Code conversion and selection circuits',5),
(11,2,'Rectifier Diodes','rectifier-diodes','PN junction rectifier diodes',1),
(12,2,'Zener Diodes','zener-diodes','Reverse-breakdown voltage reference diodes',2),
(13,2,'Schottky Diodes','schottky-diodes','Metal-semiconductor junction diodes',3),
(14,2,'Light-Emitting Diodes','leds','Light-emitting semiconductor diodes',4),
(15,2,'BJTs','bjts','Bipolar junction transistors',5),
(16,2,'MOSFETs','mosfets','Field-effect transistors',6),
(17,3,'Operational Amplifier Circuits','op-amp-circuits','Common op-amp configurations',1),
(18,3,'Voltage Regulators','voltage-regulators','Linear and switching regulation',2),
(19,4,'Temperature Sensors','temperature-sensors','Temperature sensing components',1),
(20,4,'Analog-to-Digital Converters','adcs','Analog input to digital output',2),
(21,4,'Memory ICs','memory-ics','Semiconductor data storage',3),
(22,5,'Relays','relays','Electrically operated switches',1),
(23,5,'DC Motors','dc-motors','Brushed DC motors and control',2);

-- ------------------------------
-- 11. Tags
-- ------------------------------
INSERT INTO tags (name, slug) VALUES
('digital','digital'),('sequential-logic','sequential-logic'),('combinational-logic','combinational-logic'),
('semiconductor','semiconductor'),('analog','analog'),('power','power'),('sensor','sensor'),
('memory','memory'),('electromechanical','electromechanical'),('educational-example','educational-example'),
('timing','timing'),('state-machine','state-machine'),('la-te-x','latex');

-- ------------------------------
-- 12. Specification definitions
-- ------------------------------
INSERT INTO specifications (name, unit, value_kind, description) VALUES
('Number of States',NULL,'NUMBER','Number of logical states'),
('Number of Bits','bit','NUMBER','Number of state bits'),
('Number of Inputs',NULL,'NUMBER','Number of logic inputs'),
('Number of Data Inputs',NULL,'NUMBER','Number of data inputs'),
('Number of Select Lines',NULL,'NUMBER','Number of select lines'),
('Number of Outputs',NULL,'NUMBER','Number of outputs'),
('Supply Voltage','V','RANGE','Supply voltage range'),
('Maximum Clock Frequency','Hz','NUMBER','Maximum clock frequency'),
('Propagation Delay','ns','NUMBER','Propagation delay'),
('Forward Voltage','V','RANGE','Forward voltage range'),
('Maximum Forward Current','A','NUMBER','Maximum forward current'),
('Zener Voltage','V','NUMBER','Nominal Zener voltage'),
('Collector Current','A','NUMBER','Collector current'),
('Drain-Source Voltage','V','NUMBER','Maximum drain-source voltage'),
('Gate Threshold Voltage','V','RANGE','Gate threshold range'),
('Voltage Gain',NULL,'TEXT','Voltage gain expression or value'),
('Output Voltage','V','RANGE','Output voltage range'),
('Measurement Range','°C','RANGE','Measurement range'),
('Resolution','bit','NUMBER','Resolution in bits'),
('Memory Capacity','bit','NUMBER','Memory capacity'),
('Coil Voltage','V','NUMBER','Relay coil voltage'),
('Rated Voltage','V','NUMBER','Rated voltage'),
('No-Load Speed','RPM','NUMBER','No-load speed'),
('Contact Configuration',NULL,'TEXT','Contact arrangement');

-- ------------------------------
-- 13. Components (46 initial educational entries)
-- ------------------------------
INSERT INTO components
(category_id, name, slug, short_description, description, main_image_path, circuit_symbol_path, datasheet_url, is_illustrative, is_published)
VALUES
(6, 'Decade Counter', 'decade-counter', 'A modulo-10 counter cycling through decimal digits.', 'A decade counter has ten valid states represented by four bits. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/counters/decade-counter.png', '/assets/svg/counters/decade-counter-symbol.svg', NULL, 1, 1),
(6, 'Mod-8 Up Counter', 'mod8-up-counter', 'A three-bit counter that counts from 0 through 7.', 'A modulo-8 counter uses three state bits. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/counters/mod8.png', '/assets/svg/counters/mod8-symbol.svg', NULL, 1, 1),
(6, 'Mod-8 Down Counter', 'mod8-down-counter', 'A three-bit counter that counts down from 7 to 0.', 'A modulo-8 down counter cycles through eight binary states. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/counters/mod8-down.png', '/assets/svg/counters/mod8-down-symbol.svg', NULL, 1, 1),
(6, 'Binary Up Counter', 'binary-up-counter', 'A counter that increments its binary state.', 'Binary counters represent integer states using flip-flops. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/counters/binary-up.png', '/assets/svg/counters/binary-counter.svg', NULL, 1, 1),
(6, 'Binary Ripple Counter', 'binary-ripple-counter', 'An asynchronous counter with cascaded toggle stages.', 'Each stage is clocked by a preceding stage output. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/counters/ripple.png', '/assets/svg/counters/ripple-counter.svg', NULL, 1, 1),
(7, 'SR Flip-Flop', 'sr-flip-flop', 'A set-reset bistable storage element.', 'The SR element stores one bit using set and reset inputs. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/flipflops/sr.png', '/assets/svg/flipflops/sr.svg', NULL, 1, 1),
(7, 'JK Flip-Flop', 'jk-flip-flop', 'A bistable element with set, reset, hold, and toggle behavior.', 'The JK flip-flop is a clocked sequential element. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/flipflops/jk.png', '/assets/svg/flipflops/jk.svg', NULL, 1, 1),
(7, 'D Flip-Flop', 'd-flip-flop', 'A clocked storage element that samples D.', 'The D flip-flop stores the input value at the active clock edge. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/flipflops/d.png', '/assets/svg/flipflops/d.svg', NULL, 1, 1),
(7, 'T Flip-Flop', 't-flip-flop', 'A toggle flip-flop.', 'The T flip-flop either holds or toggles its state. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/flipflops/t.png', '/assets/svg/flipflops/t.svg', NULL, 1, 1),
(7, 'Master-Slave JK Flip-Flop', 'master-slave-jk-flip-flop', 'A JK flip-flop using master and slave stages.', 'Two controlled storage stages reduce race-through behavior. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/flipflops/master-slave-jk.png', '/assets/svg/flipflops/master-slave-jk.svg', NULL, 1, 1),
(8, 'AND Gate', 'and-gate', 'Output is high only when all inputs are high.', 'The AND gate implements logical conjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/and.png', '/assets/svg/gates/and.svg', NULL, 0, 1),
(8, 'OR Gate', 'or-gate', 'Output is high when at least one input is high.', 'The OR gate implements logical disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/or.png', '/assets/svg/gates/or.svg', NULL, 0, 1),
(8, 'NOT Gate', 'not-gate', 'Inverts a single logic input.', 'The NOT gate produces the complement of its input. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/not.png', '/assets/svg/gates/not.svg', NULL, 0, 1),
(8, 'NAND Gate', 'nand-gate', 'An AND gate followed by inversion.', 'NAND is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/nand.png', '/assets/svg/gates/nand.svg', NULL, 0, 1),
(8, 'NOR Gate', 'nor-gate', 'An OR gate followed by inversion.', 'NOR is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/nor.png', '/assets/svg/gates/nor.svg', NULL, 0, 1),
(8, 'XOR Gate', 'xor-gate', 'Output is high when inputs differ.', 'XOR implements exclusive disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/xor.png', '/assets/svg/gates/xor.svg', NULL, 0, 1),
(8, 'XNOR Gate', 'xnor-gate', 'Output is high when inputs are equal.', 'XNOR is the complement of XOR. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/xnor.png', '/assets/svg/gates/xnor.svg', NULL, 0, 1),
(9, '2-to-1 Multiplexer', 'mux-2-to-1', 'Selects one of two data inputs.', 'A 2:1 multiplexer routes one data input to the output. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/mux/2to1.png', '/assets/svg/mux/2to1.svg', NULL, 0, 1),
(9, '4-to-1 Multiplexer', 'mux-4-to-1', 'Selects one of four data inputs.', 'A 4:1 multiplexer uses two select lines. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/mux/4to1.png', '/assets/svg/mux/4to1.svg', NULL, 0, 1),
(10, '2-to-4 Decoder', 'decoder-2-to-4', 'Activates one output based on a two-bit input.', 'A decoder converts an input code to one-of-N outputs. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/encoders/decoder2to4.png', '/assets/svg/encoders/decoder2to4.svg', NULL, 0, 1),
(10, '4-to-2 Encoder', 'encoder-4-to-2', 'Encodes one of four active inputs into two bits.', 'A simple encoder assumes a valid one-hot input unless priority logic is specified. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/encoders/encoder4to2.png', '/assets/svg/encoders/encoder4to2.svg', NULL, 0, 1),
(11, 'Rectifier Diode', 'rectifier-diode', 'A diode used for rectification.', 'A PN junction conducts primarily under forward bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/diodes/rectifier.png', '/assets/svg/diodes/diode.svg', NULL, 1, 1),
(12, 'Zener Diode', 'zener-diode', 'A diode used in reverse breakdown for voltage reference/regulation.', 'A Zener diode is operated in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/diodes/zener.png', '/assets/svg/diodes/zener.svg', NULL, 1, 1),
(13, 'Schottky Diode', 'schottky-diode', 'A metal-semiconductor diode often used for fast switching.', 'Schottky diodes typically have low charge storage compared with PN diodes. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', '/assets/images/diodes/schottky.png', '/assets/svg/diodes/schottky.svg', NULL, 1, 1),
(14, 'Red LED', 'red-led', 'A light-emitting diode for visible red light.', 'An LED emits light when forward current recombines carriers. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/diodes/red-led.png', '/assets/svg/diodes/led.svg', NULL, 1, 1),
(14, 'Infrared LED', 'infrared-led', 'An LED emitting infrared radiation.', 'Infrared LEDs are used in optical links and sensing. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/diodes/ir-led.png', '/assets/svg/diodes/led.svg', NULL, 1, 1),
(15, 'NPN BJT', 'npn-bjt', 'An NPN bipolar junction transistor.', 'A BJT uses base current to control collector current in common operating regions. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/transistors/npn.png', '/assets/svg/transistors/npn.svg', NULL, 1, 1),
(15, 'PNP BJT', 'pnp-bjt', 'A PNP bipolar junction transistor.', 'A PNP BJT uses opposite current/polarity conventions to an NPN device. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/transistors/pnp.png', '/assets/svg/transistors/pnp.svg', NULL, 1, 1),
(16, 'N-Channel Enhancement MOSFET', 'nmos-enhancement', 'A voltage-controlled n-channel transistor.', 'An enhancement MOSFET forms a conducting channel when gate drive is sufficient. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/transistors/nmos.png', '/assets/svg/transistors/nmos.svg', NULL, 1, 1),
(16, 'P-Channel Enhancement MOSFET', 'pmos-enhancement', 'A voltage-controlled p-channel transistor.', 'A PMOS device uses polarity conventions complementary to NMOS. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/transistors/pmos.png', '/assets/svg/transistors/pmos.svg', NULL, 1, 1),
(17, 'Inverting Amplifier', 'inverting-amplifier', 'An op-amp configuration with inverted output polarity.', 'The input signal is applied through an input resistor to the inverting node. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/inverting.png', '/assets/svg/opamps/inverting.svg', NULL, 1, 1),
(17, 'Non-Inverting Amplifier', 'non-inverting-amplifier', 'An op-amp configuration with non-inverted output.', 'The signal is applied to the non-inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/non-inverting.png', '/assets/svg/opamps/non-inverting.svg', NULL, 1, 1),
(17, 'Voltage Follower', 'voltage-follower', 'A unity-gain buffer using an op-amp.', 'The output is fed back directly to the inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/follower.png', '/assets/svg/opamps/follower.svg', NULL, 1, 1),
(18, 'Linear Voltage Regulator', 'linear-voltage-regulator', 'Maintains an approximately constant output voltage.', 'A linear regulator controls a pass element to regulate output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/regulators/linear.png', '/assets/svg/regulators/linear.svg', NULL, 1, 1),
(18, 'Buck Converter', 'buck-converter', 'A switching regulator that steps down DC voltage.', 'A buck converter uses a switch, inductor, diode or synchronous switch, and capacitor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/regulators/buck.png', '/assets/svg/regulators/buck.svg', NULL, 1, 1),
(19, 'Analog Temperature Sensor', 'analog-temperature-sensor', 'A temperature sensor with an analog output.', 'The output voltage/current represents temperature according to its transfer function. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/sensors/analog-temperature.png', '/assets/svg/sensors/temperature-sensor.svg', NULL, 1, 1),
(19, 'Digital Temperature Sensor', 'digital-temperature-sensor', 'A temperature sensor with a digital interface.', 'The sensor converts temperature internally and communicates over a digital bus. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/sensors/digital-temperature.png', '/assets/svg/sensors/temperature-sensor.svg', NULL, 1, 1),
(20, 'Successive Approximation ADC', 'sar-adc', 'An ADC using binary search over the input range.', 'A SAR ADC compares the input against DAC-generated trial levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/adcs/sar-adc.png', '/assets/svg/adcs/sar-adc.svg', NULL, 1, 1),
(20, 'Flash ADC', 'flash-adc', 'A high-speed ADC using parallel comparators.', 'A resistor ladder creates thresholds for multiple comparators. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/adcs/flash-adc.png', '/assets/svg/adcs/flash-adc.svg', NULL, 1, 1),
(21, 'EEPROM', 'eeprom', 'Non-volatile electrically erasable memory.', 'EEPROM retains stored data without power and supports electrical writes. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/memory/eeprom.png', '/assets/svg/memory/eeprom-block.svg', NULL, 1, 1),
(21, 'SRAM', 'sram', 'Volatile memory with static storage cells.', 'SRAM stores bits in bistable circuits while powered. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/memory/sram.png', '/assets/svg/memory/memory-block.svg', NULL, 1, 1),
(22, 'Electromagnetic Relay', 'electromagnetic-relay', 'A coil-operated mechanical switch.', 'Coil current creates a magnetic field that moves contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/relays/relay.png', '/assets/svg/relays/spdt-relay.svg', NULL, 1, 1),
(22, 'Solid-State Relay', 'solid-state-relay', 'An electronically switched relay.', 'Semiconductor devices switch the load without mechanical contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/relays/ssr.png', '/assets/svg/relays/solid-state-relay.svg', NULL, 1, 1),
(23, 'Brushed DC Motor', 'brushed-dc-motor', 'A motor using brushes and a commutator.', 'Armature current interacts with a magnetic field to create torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/motors/brushed-dc.png', '/assets/svg/motors/dc-motor.svg', NULL, 1, 1),
(23, 'DC Gear Motor', 'dc-gear-motor', 'A DC motor combined with a reduction gearbox.', 'The gearbox trades speed for increased output torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/motors/dc-gear.png', '/assets/svg/motors/dc-motor.svg', NULL, 1, 1);



-- ------------------------------
-- 13B. Additional component seed data (102 more; total catalogue exceeds 100)
-- ------------------------------
INSERT INTO components
(category_id, name, slug, short_description, description, main_image_path, circuit_symbol_path, datasheet_url, is_illustrative, is_published)
VALUES
(6, 'Mod-5 Counter', 'mod5-counter', 'A counter with five valid states.', 'A modulo-5 counter cycles through five states. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/mod5-counter.png', '/assets/svg/components/mod5-counter.svg', NULL, 1, 1),
(6, 'Mod-6 Counter', 'mod6-counter', 'A counter with six valid states.', 'A modulo-6 counter cycles through six states. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/mod6-counter.png', '/assets/svg/components/mod6-counter.svg', NULL, 1, 1),
(6, 'Mod-10 Synchronous Counter', 'mod10-synchronous-counter', 'A synchronous decade counter.', 'All state flip-flops share a common clock. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/mod10-synchronous-counter.png', '/assets/svg/components/mod10-synchronous-counter.svg', NULL, 1, 1),
(6, 'BCD Counter', 'bcd-counter', 'A counter that cycles through BCD digits.', 'A BCD counter represents decimal digits using four binary bits. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/bcd-counter.png', '/assets/svg/components/bcd-counter.svg', NULL, 1, 1),
(6, 'Johnson Counter', 'johnson-counter', 'A twisted-ring shift counter.', 'A Johnson counter feeds the inverted final stage back to the first stage. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/johnson-counter.png', '/assets/svg/components/johnson-counter.svg', NULL, 1, 1),
(6, 'Ring Counter', 'ring-counter', 'A shift-register counter with circulating state.', 'A ring counter circulates a one-hot pattern through its stages. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/ring-counter.png', '/assets/svg/components/ring-counter.svg', NULL, 1, 1),
(6, 'Up-Down Counter', 'up-down-counter', 'A counter supporting increment and decrement.', 'Direction logic selects the next count state. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/up-down-counter.png', '/assets/svg/components/up-down-counter.svg', NULL, 1, 1),
(6, 'Asynchronous Binary Counter', 'asynchronous-binary-counter', 'A counter with cascaded clocking stages.', 'Later stages are triggered by preceding stages. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/asynchronous-binary-counter.png', '/assets/svg/components/asynchronous-binary-counter.svg', NULL, 1, 1),
(6, 'Synchronous Binary Counter', 'synchronous-binary-counter', 'A counter whose stages share a clock.', 'All state bits receive the same clock signal. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/synchronous-binary-counter.png', '/assets/svg/components/synchronous-binary-counter.svg', NULL, 1, 1),
(6, 'Programmable Modulo Counter', 'programmable-modulo-counter', 'A counter with a configurable terminal count.', 'A programmable comparator determines the wrap state. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', '/assets/images/6/programmable-modulo-counter.png', '/assets/svg/components/programmable-modulo-counter.svg', NULL, 1, 1),
(7, 'Gated SR Latch', 'gated-sr-latch', 'An SR latch controlled by an enable input.', 'The enable signal determines when S and R can affect the stored state. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/gated-sr-latch.png', '/assets/svg/components/gated-sr-latch.svg', NULL, 1, 1),
(7, 'Active-Low SR Latch', 'active-low-sr-latch', 'An SR latch with active-low control inputs.', 'Control inputs are asserted at logic zero. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/active-low-sr-latch.png', '/assets/svg/components/active-low-sr-latch.svg', NULL, 1, 1),
(7, 'Edge-Triggered D Flip-Flop', 'edge-triggered-d-flip-flop', 'A D storage element triggered by a clock edge.', 'The D input is sampled at a specified clock transition. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/edge-triggered-d-flip-flop.png', '/assets/svg/components/edge-triggered-d-flip-flop.svg', NULL, 1, 1),
(7, 'Positive-Edge D Flip-Flop', 'positive-edge-d-flip-flop', 'A D flip-flop triggered on a rising clock edge.', 'The rising clock edge defines the sampling instant. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/positive-edge-d-flip-flop.png', '/assets/svg/components/positive-edge-d-flip-flop.svg', NULL, 1, 1),
(7, 'Negative-Edge D Flip-Flop', 'negative-edge-d-flip-flop', 'A D flip-flop triggered on a falling clock edge.', 'The falling clock edge defines the sampling instant. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/negative-edge-d-flip-flop.png', '/assets/svg/components/negative-edge-d-flip-flop.svg', NULL, 1, 1),
(7, 'JK Latch', 'jk-latch', 'A level-sensitive JK storage element.', 'The latch responds while its enable level is active. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/jk-latch.png', '/assets/svg/components/jk-latch.svg', NULL, 1, 1),
(7, 'Toggle Latch', 'toggle-latch', 'A level-controlled storage element with toggle behavior.', 'A toggle control determines whether the stored state changes. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/toggle-latch.png', '/assets/svg/components/toggle-latch.svg', NULL, 1, 1),
(7, 'Dual D Flip-Flop', 'dual-d-flip-flop', 'Two D flip-flops in one integrated circuit.', 'The device contains two independent D storage channels. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/dual-d-flip-flop.png', '/assets/svg/components/dual-d-flip-flop.svg', NULL, 1, 1),
(7, 'Quad D Flip-Flop', 'quad-d-flip-flop', 'Four D flip-flops in one package.', 'The device provides four clocked storage bits. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/quad-d-flip-flop.png', '/assets/svg/components/quad-d-flip-flop.svg', NULL, 1, 1),
(7, 'Presettable D Flip-Flop', 'presettable-d-flip-flop', 'A D flip-flop with asynchronous preset.', 'Preset forces a defined output state independently of the clock. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/presettable-d-flip-flop.png', '/assets/svg/components/presettable-d-flip-flop.svg', NULL, 1, 1),
(7, 'Clearable D Flip-Flop', 'clearable-d-flip-flop', 'A D flip-flop with clear input.', 'Clear forces the output to a defined state. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/clearable-d-flip-flop.png', '/assets/svg/components/clearable-d-flip-flop.svg', NULL, 1, 1),
(7, 'JK Flip-Flop with Preset and Clear', 'jk-preset-clear-flip-flop', 'A JK flip-flop with asynchronous controls.', 'Preset and clear establish the initial output state. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', '/assets/images/7/jk-preset-clear-flip-flop.png', '/assets/svg/components/jk-preset-clear-flip-flop.svg', NULL, 1, 1),
(8, 'Buffer Gate', 'buffer-gate', 'A non-inverting logic buffer.', 'The output follows the input logic level. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/buffer-gate.png', '/assets/svg/components/buffer-gate.svg', NULL, 1, 1),
(8, 'Tri-State Buffer', 'tri-state-buffer', 'A buffer with high-impedance output state.', 'An enable input controls whether the output is driven. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/tri-state-buffer.png', '/assets/svg/components/tri-state-buffer.svg', NULL, 1, 1),
(8, 'Open-Collector Inverter', 'open-collector-inverter', 'An inverter with an open-collector output stage.', 'The output transistor can pull low and requires a pull-up. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/open-collector-inverter.png', '/assets/svg/components/open-collector-inverter.svg', NULL, 1, 1),
(8, 'Schmitt Trigger Inverter', 'schmitt-trigger-inverter', 'An inverter with hysteresis.', 'Different switching thresholds improve noise immunity. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/schmitt-trigger-inverter.png', '/assets/svg/components/schmitt-trigger-inverter.svg', NULL, 1, 1),
(8, 'Majority Gate', 'majority-gate', 'Output is high when most inputs are high.', 'A majority gate evaluates the majority of its Boolean inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/majority-gate.png', '/assets/svg/components/majority-gate.svg', NULL, 1, 1),
(8, '2-Input AND-OR-Invert Gate', 'aoi21-gate', 'Combines AND and OR terms followed by inversion.', 'An AOI21 cell implements a compact compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/aoi21-gate.png', '/assets/svg/components/aoi21-gate.svg', NULL, 1, 1),
(8, '2-Input OR-AND-Invert Gate', 'oai21-gate', 'Combines OR and AND terms followed by inversion.', 'An OAI21 cell implements a compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/oai21-gate.png', '/assets/svg/components/oai21-gate.svg', NULL, 1, 1),
(8, 'Four-Input NAND Gate', 'four-input-nand-gate', 'A NAND gate with four inputs.', 'The output complements the conjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/four-input-nand-gate.png', '/assets/svg/components/four-input-nand-gate.svg', NULL, 1, 1),
(8, 'Four-Input NOR Gate', 'four-input-nor-gate', 'A NOR gate with four inputs.', 'The output complements the disjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/four-input-nor-gate.png', '/assets/svg/components/four-input-nor-gate.svg', NULL, 1, 1),
(9, '8-to-1 Multiplexer', 'mux-8-to-1', 'Selects one of eight data inputs.', 'Three select bits address one of eight inputs. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/mux-8-to-1.png', '/assets/svg/components/mux-8-to-1.svg', NULL, 1, 1),
(9, '16-to-1 Multiplexer', 'mux-16-to-1', 'Selects one of sixteen data inputs.', 'Four select bits address one of sixteen inputs. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/mux-16-to-1.png', '/assets/svg/components/mux-16-to-1.svg', NULL, 1, 1),
(9, 'Dual 4-to-1 Multiplexer', 'dual-mux-4-to-1', 'Two independent four-input multiplexers.', 'The device provides two separate selection channels. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/dual-mux-4-to-1.png', '/assets/svg/components/dual-mux-4-to-1.svg', NULL, 1, 1),
(9, 'Analog Multiplexer', 'analog-multiplexer', 'Routes one analog signal to a shared output.', 'A control code selects one analog channel. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/analog-multiplexer.png', '/assets/svg/components/analog-multiplexer.svg', NULL, 1, 1),
(9, 'Demultiplexer 1-to-4', 'demux-1-to-4', 'Routes one input to one of four outputs.', 'Select inputs determine which output receives the data. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/demux-1-to-4.png', '/assets/svg/components/demux-1-to-4.svg', NULL, 1, 1),
(9, 'Demultiplexer 1-to-8', 'demux-1-to-8', 'Routes one input to one of eight outputs.', 'Three select bits choose an output channel. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', '/assets/images/9/demux-1-to-8.png', '/assets/svg/components/demux-1-to-8.svg', NULL, 1, 1),
(10, '3-to-8 Decoder', 'decoder-3-to-8', 'Decodes a three-bit code to eight outputs.', 'Each input code selects one output line. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/decoder-3-to-8.png', '/assets/svg/components/decoder-3-to-8.svg', NULL, 1, 1),
(10, '4-to-16 Decoder', 'decoder-4-to-16', 'Decodes a four-bit code to sixteen outputs.', 'Four input bits identify one of sixteen output lines. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/decoder-4-to-16.png', '/assets/svg/components/decoder-4-to-16.svg', NULL, 1, 1),
(10, 'Priority Encoder 4-to-2', 'priority-encoder-4-to-2', 'Encodes the highest-priority active input.', 'Priority logic resolves multiple simultaneous asserted inputs. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/priority-encoder-4-to-2.png', '/assets/svg/components/priority-encoder-4-to-2.svg', NULL, 1, 1),
(10, 'Priority Encoder 8-to-3', 'priority-encoder-8-to-3', 'Encodes eight inputs into a three-bit code with priority.', 'Priority logic chooses one asserted input when several are active. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/priority-encoder-8-to-3.png', '/assets/svg/components/priority-encoder-8-to-3.svg', NULL, 1, 1),
(10, 'BCD-to-7-Segment Decoder', 'bcd-to-7-segment-decoder', 'Converts BCD digits to seven-segment control signals.', 'Combinational logic maps each decimal digit to segment patterns. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/bcd-to-7-segment-decoder.png', '/assets/svg/components/bcd-to-7-segment-decoder.svg', NULL, 1, 1),
(10, 'Binary-to-Gray Converter', 'binary-to-gray-converter', 'Converts binary code to Gray code.', 'Adjacent Gray-code values differ by one bit. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/binary-to-gray-converter.png', '/assets/svg/components/binary-to-gray-converter.svg', NULL, 1, 1),
(10, 'Gray-to-Binary Converter', 'gray-to-binary-converter', 'Converts Gray code to binary.', 'Cumulative XOR operations recover the binary code. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/gray-to-binary-converter.png', '/assets/svg/components/gray-to-binary-converter.svg', NULL, 1, 1),
(10, 'BCD-to-Binary Converter', 'bcd-to-binary-converter', 'Converts packed decimal digits to a binary number.', 'The decimal digit values are combined by place value. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/bcd-to-binary-converter.png', '/assets/svg/components/bcd-to-binary-converter.svg', NULL, 1, 1),
(10, 'Binary-to-BCD Converter', 'binary-to-bcd-converter', 'Converts a binary number to decimal-coded digits.', 'Conversion logic produces one BCD nibble per decimal digit. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', '/assets/images/10/binary-to-bcd-converter.png', '/assets/svg/components/binary-to-bcd-converter.svg', NULL, 1, 1),
(11, 'Fast Recovery Diode', 'fast-recovery-diode', 'A diode optimized for short reverse-recovery time.', 'The device is designed to switch between conduction states quickly. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/fast-recovery-diode.png', '/assets/svg/components/fast-recovery-diode.svg', NULL, 1, 1),
(11, 'Bridge Rectifier', 'bridge-rectifier', 'A four-diode arrangement for full-wave rectification.', 'Two diodes conduct during each half-cycle. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/bridge-rectifier.png', '/assets/svg/components/bridge-rectifier.svg', NULL, 1, 1),
(11, 'Small-Signal Switching Diode', 'small-signal-switching-diode', 'A diode intended for low-current switching applications.', 'The junction switches between forward and reverse bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/small-signal-switching-diode.png', '/assets/svg/components/small-signal-switching-diode.svg', NULL, 1, 1),
(11, 'PIN Diode', 'pin-diode', 'A diode with an intrinsic region between P and N regions.', 'The intrinsic layer changes the device''s RF resistance with bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/pin-diode.png', '/assets/svg/components/pin-diode.svg', NULL, 1, 1),
(11, 'Varactor Diode', 'varactor-diode', 'A voltage-variable junction capacitor.', 'Reverse bias changes the depletion-region width. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/varactor-diode.png', '/assets/svg/components/varactor-diode.svg', NULL, 1, 1),
(12, '5.1 V Zener Diode', 'zener-5v1', 'A nominal 5.1 V Zener reference example.', 'The device operates in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/12/zener-5v1.png', '/assets/svg/components/zener-5v1.svg', NULL, 1, 1),
(12, '12 V Zener Diode', 'zener-12v', 'A nominal 12 V Zener reference example.', 'The device is used for clamping or simple reference circuits. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/12/zener-12v.png', '/assets/svg/components/zener-12v.svg', NULL, 1, 1),
(13, 'Low-Barrier Schottky Diode', 'low-barrier-schottky-diode', 'A Schottky diode with a low forward voltage.', 'A metal-semiconductor barrier supports majority-carrier conduction. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', '/assets/images/13/low-barrier-schottky-diode.png', '/assets/svg/components/low-barrier-schottky-diode.svg', NULL, 1, 1),
(14, 'Green LED', 'green-led', 'A visible green light-emitting diode.', 'Forward current produces light through carrier recombination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/green-led.png', '/assets/svg/components/green-led.svg', NULL, 1, 1),
(14, 'Blue LED', 'blue-led', 'A visible blue light-emitting diode.', 'A semiconductor junction emits blue light when forward biased. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/blue-led.png', '/assets/svg/components/blue-led.svg', NULL, 1, 1),
(14, 'White LED', 'white-led', 'A white-light LED, commonly phosphor-converted blue emission.', 'The LED package produces white illumination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/white-led.png', '/assets/svg/components/white-led.svg', NULL, 1, 1),
(14, 'RGB LED', 'rgb-led', 'A package containing red, green, and blue emitters.', 'Independent channel currents mix to create colors. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/rgb-led.png', '/assets/svg/components/rgb-led.svg', NULL, 1, 1),
(14, 'Photodiode', 'photodiode', 'A light-sensitive semiconductor diode.', 'Incident photons generate charge carriers in the junction. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/photodiode.png', '/assets/svg/components/photodiode.svg', NULL, 1, 1),
(15, 'Darlington Pair', 'darlington-pair', 'Two BJTs arranged for high current gain.', 'The emitter of the first transistor drives the base of the second. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/darlington-pair.png', '/assets/svg/components/darlington-pair.svg', NULL, 1, 1),
(15, 'Phototransistor', 'phototransistor', 'A transistor whose conduction is controlled by light.', 'Incident light generates base-equivalent photocurrent. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/phototransistor.png', '/assets/svg/components/phototransistor.svg', NULL, 1, 1),
(15, 'Small-Signal NPN Transistor', 'small-signal-npn-transistor', 'An NPN transistor for low-current signal circuits.', 'Base drive controls collector current within operating limits. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/small-signal-npn-transistor.png', '/assets/svg/components/small-signal-npn-transistor.svg', NULL, 1, 1),
(15, 'Power NPN Transistor', 'power-npn-transistor', 'An NPN transistor designed for higher power handling.', 'The transistor controls load current with suitable base drive. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/power-npn-transistor.png', '/assets/svg/components/power-npn-transistor.svg', NULL, 1, 1),
(16, 'Logic-Level N-Channel MOSFET', 'logic-level-nmos', 'An N-channel MOSFET designed for specified low gate-drive voltages.', 'The device is characterized for conduction at defined gate-source voltages. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/16/logic-level-nmos.png', '/assets/svg/components/logic-level-nmos.svg', NULL, 1, 1),
(16, 'Power MOSFET', 'power-mosfet', 'A MOSFET intended for power switching.', 'A gate voltage controls a low-resistance conduction channel. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/16/power-mosfet.png', '/assets/svg/components/power-mosfet.svg', NULL, 1, 1),
(16, 'Dual N-Channel MOSFET', 'dual-nmos', 'Two N-channel MOSFETs in one package.', 'The package contains two transistor channels. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/16/dual-nmos.png', '/assets/svg/components/dual-nmos.svg', NULL, 1, 1),
(16, 'P-Channel MOSFET Load Switch', 'pmos-load-switch', 'A high-side switching arrangement using a P-channel MOSFET.', 'Gate voltage relative to source controls the switch. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/16/pmos-load-switch.png', '/assets/svg/components/pmos-load-switch.svg', NULL, 1, 1),
(17, 'Summing Amplifier', 'summing-amplifier', 'An op-amp circuit that combines multiple inputs.', 'Input currents sum at the virtual-ground node under ideal assumptions. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/summing-amplifier.png', '/assets/svg/components/summing-amplifier.svg', NULL, 1, 1),
(17, 'Differential Amplifier', 'differential-amplifier', 'Amplifies the difference between two input voltages.', 'Matched resistor ratios determine common-mode rejection. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/differential-amplifier.png', '/assets/svg/components/differential-amplifier.svg', NULL, 1, 1),
(17, 'Integrator Op-Amp', 'opamp-integrator', 'An op-amp circuit whose output integrates its input.', 'A capacitor in the feedback path accumulates input current. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-integrator.png', '/assets/svg/components/opamp-integrator.svg', NULL, 1, 1),
(17, 'Differentiator Op-Amp', 'opamp-differentiator', 'An op-amp circuit whose output responds to input rate of change.', 'An input capacitor and feedback impedance create differentiation behavior. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-differentiator.png', '/assets/svg/components/opamp-differentiator.svg', NULL, 1, 1),
(17, 'Comparator Circuit', 'opamp-comparator-circuit', 'Compares two input voltages to produce a logic-like output.', 'The output changes according to which input is greater. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-comparator-circuit.png', '/assets/svg/components/opamp-comparator-circuit.svg', NULL, 1, 1),
(18, 'Adjustable Linear Regulator', 'adjustable-linear-regulator', 'A regulator with a settable output voltage.', 'A feedback network sets the regulated output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/adjustable-linear-regulator.png', '/assets/svg/components/adjustable-linear-regulator.svg', NULL, 1, 1),
(18, 'Low-Dropout Regulator', 'low-dropout-regulator', 'A linear regulator designed for low input-output headroom.', 'A pass element and feedback regulate the output near the input voltage. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/low-dropout-regulator.png', '/assets/svg/components/low-dropout-regulator.svg', NULL, 1, 1),
(18, 'Boost Converter', 'boost-converter', 'A switching regulator that steps up DC voltage.', 'An inductor stores energy during one switch phase and releases it to the output during another. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/boost-converter.png', '/assets/svg/components/boost-converter.svg', NULL, 1, 1),
(18, 'Buck-Boost Converter', 'buck-boost-converter', 'A switching converter that can step voltage up or down.', 'A switching power stage transfers energy through an inductor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/buck-boost-converter.png', '/assets/svg/components/buck-boost-converter.svg', NULL, 1, 1),
(18, 'Charge Pump Voltage Converter', 'charge-pump-converter', 'A switched-capacitor voltage converter.', 'Capacitors are switched between phases to transfer charge. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/charge-pump-converter.png', '/assets/svg/components/charge-pump-converter.svg', NULL, 1, 1),
(19, 'NTC Thermistor', 'ntc-thermistor', 'A resistor whose resistance decreases as temperature rises.', 'The semiconductor resistance has a negative temperature coefficient. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/ntc-thermistor.png', '/assets/svg/components/ntc-thermistor.svg', NULL, 1, 1),
(19, 'PTC Thermistor', 'ptc-thermistor', 'A resistor whose resistance increases over a specified temperature region.', 'Resistance rises with temperature according to its material characteristic. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/ptc-thermistor.png', '/assets/svg/components/ptc-thermistor.svg', NULL, 1, 1),
(19, 'Thermocouple', 'thermocouple', 'A temperature sensor based on two dissimilar conductors.', 'A temperature difference produces a small thermoelectric voltage. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/thermocouple.png', '/assets/svg/components/thermocouple.svg', NULL, 1, 1),
(19, 'RTD Sensor', 'rtd-sensor', 'A resistive temperature detector.', 'Metal resistance changes predictably with temperature. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/rtd-sensor.png', '/assets/svg/components/rtd-sensor.svg', NULL, 1, 1),
(19, 'Digital Humidity Sensor', 'digital-humidity-sensor', 'A sensor that reports relative humidity digitally.', 'A sensing element and conversion circuitry produce digital measurements. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/digital-humidity-sensor.png', '/assets/svg/components/digital-humidity-sensor.svg', NULL, 1, 1),
(20, 'Dual-Slope ADC', 'dual-slope-adc', 'An ADC based on integrating and deintegrating an input.', 'An integrator accumulates input for a fixed interval and then measures return time. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/dual-slope-adc.png', '/assets/svg/components/dual-slope-adc.svg', NULL, 1, 1),
(20, 'Pipeline ADC', 'pipeline-adc', 'A high-throughput ADC using cascaded conversion stages.', 'Each stage resolves part of the code and passes a residue onward. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/pipeline-adc.png', '/assets/svg/components/pipeline-adc.svg', NULL, 1, 1),
(20, 'Sigma-Delta ADC', 'sigma-delta-adc', 'An oversampling ADC using noise shaping.', 'A modulator shapes quantization noise and digital filtering decimates the stream. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/sigma-delta-adc.png', '/assets/svg/components/sigma-delta-adc.svg', NULL, 1, 1),
(20, '8-bit ADC', '8-bit-adc', 'An ADC with 256 possible output codes.', 'The converter quantizes the input range into 256 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/8-bit-adc.png', '/assets/svg/components/8-bit-adc.svg', NULL, 1, 1),
(20, '12-bit ADC', '12-bit-adc', 'An ADC with 4096 possible output codes.', 'The converter quantizes the input range into 4096 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/12-bit-adc.png', '/assets/svg/components/12-bit-adc.svg', NULL, 1, 1),
(21, 'Flash Memory', 'flash-memory', 'Non-volatile memory erased in blocks or sectors.', 'Charge storage shifts transistor threshold characteristics. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/flash-memory.png', '/assets/svg/components/flash-memory.svg', NULL, 1, 1),
(21, 'NOR Flash', 'nor-flash', 'Flash memory with random-access read capability.', 'NOR array structure supports direct code reads. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/nor-flash.png', '/assets/svg/components/nor-flash.svg', NULL, 1, 1),
(21, 'NAND Flash', 'nand-flash', 'Dense non-volatile storage organized in pages and blocks.', 'NAND strings provide high storage density. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/nand-flash.png', '/assets/svg/components/nand-flash.svg', NULL, 1, 1),
(21, 'DRAM', 'dram', 'Volatile memory storing bits as charge in capacitors.', 'Stored charge leaks and must be periodically refreshed. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/dram.png', '/assets/svg/components/dram.svg', NULL, 1, 1),
(21, 'ROM', 'read-only-memory', 'Non-volatile memory for fixed data.', 'Stored bit patterns are read through address decoding. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/read-only-memory.png', '/assets/svg/components/read-only-memory.svg', NULL, 1, 1),
(21, 'FIFO Buffer Memory', 'fifo-buffer-memory', 'Memory that preserves first-in-first-out data order.', 'Read and write pointers track queue positions. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/fifo-buffer-memory.png', '/assets/svg/components/fifo-buffer-memory.svg', NULL, 1, 1),
(22, 'SPST Relay', 'spst-relay', 'A single-pole single-throw relay.', 'One contact path is controlled by an energized coil. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/spst-relay.png', '/assets/svg/components/spst-relay.svg', NULL, 1, 1),
(22, 'SPDT Relay', 'spdt-relay', 'A single-pole double-throw relay.', 'A common contact switches between normally closed and normally open contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/spdt-relay.png', '/assets/svg/components/spdt-relay.svg', NULL, 1, 1),
(22, 'DPDT Relay', 'dpdt-relay', 'A double-pole double-throw relay.', 'Two changeover contact sets are mechanically linked. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/dpdt-relay.png', '/assets/svg/components/dpdt-relay.svg', NULL, 1, 1),
(22, 'Reed Relay', 'reed-relay', 'A relay using sealed magnetic reed contacts.', 'A magnetic field closes or changes the reed contact state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/reed-relay.png', '/assets/svg/components/reed-relay.svg', NULL, 1, 1),
(22, 'Latching Relay', 'latching-relay', 'A relay that retains its contact state without continuous coil power.', 'A pulse or set/reset coil mechanism changes the retained state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/latching-relay.png', '/assets/svg/components/latching-relay.svg', NULL, 1, 1),
(23, 'Brushless DC Motor', 'brushless-dc-motor', 'A motor electronically commutated instead of using brushes.', 'An electronic controller energizes stator phases in sequence. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/brushless-dc-motor.png', '/assets/svg/components/brushless-dc-motor.svg', NULL, 1, 1),
(23, 'Stepper Motor', 'stepper-motor', 'A motor that moves in discrete angular increments.', 'Sequential phase excitation advances the rotor between stable positions. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/stepper-motor.png', '/assets/svg/components/stepper-motor.svg', NULL, 1, 1),
(23, 'Servo Motor', 'servo-motor', 'A motor used in a closed-loop position or speed system.', 'Feedback compares desired and measured motion. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/servo-motor.png', '/assets/svg/components/servo-motor.svg', NULL, 1, 1),
(23, 'Permanent-Magnet DC Motor', 'permanent-magnet-dc-motor', 'A DC motor with permanent-magnet field excitation.', 'Armature current interacts with the fixed magnetic field. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/permanent-magnet-dc-motor.png', '/assets/svg/components/permanent-magnet-dc-motor.svg', NULL, 1, 1);

-- ------------------------------
-- 14. Component tags
-- ------------------------------
INSERT IGNORE INTO component_tags (component_id, tag_id)
SELECT c.component_id, t.tag_id
FROM components c
JOIN tags t ON (
  (c.category_id IN (6,7) AND t.slug IN ('digital','sequential-logic','timing','state-machine')) OR
  (c.category_id IN (8,9,10) AND t.slug IN ('digital','combinational-logic')) OR
  (c.category_id IN (11,12,13,14,15,16) AND t.slug IN ('semiconductor')) OR
  (c.category_id IN (17,18) AND t.slug IN ('analog','power')) OR
  (c.category_id IN (19,20) AND t.slug IN ('sensor')) OR
  (c.category_id = 21 AND t.slug IN ('memory')) OR
  (c.category_id IN (22,23) AND t.slug IN ('electromechanical')) OR
  (c.is_illustrative = 1 AND t.slug = 'educational-example')
);

-- ------------------------------
-- 15. Category content templates
-- ------------------------------
INSERT INTO category_content_types
(category_id, content_type_id, section_key, section_label, is_required, display_order)
SELECT c.category_id, ct.content_type_id, x.section_key, x.section_label, x.is_required, x.display_order
FROM (
  SELECT 6 category_id, 'state_table' section_key, 'State / Next-State Table' section_label, 1 is_required, 1 display_order, 'TABLE' type_code
  UNION ALL SELECT 6,'timing_diagram','Timing Diagram',0,2,'TIMING_DIAGRAM'
  UNION ALL SELECT 6,'logic_diagram','Logic Circuit Diagram',0,3,'DIAGRAM'
  UNION ALL SELECT 6,'state_diagram','State Machine Diagram',0,4,'DIAGRAM'
  UNION ALL SELECT 7,'truth_table','Truth Table',1,1,'TABLE'
  UNION ALL SELECT 7,'characteristic_table','Characteristic Table',1,2,'TABLE'
  UNION ALL SELECT 7,'characteristic_equation','Characteristic Equation',1,3,'EQUATION'
  UNION ALL SELECT 7,'excitation_table','Excitation Table',1,4,'TABLE'
  UNION ALL SELECT 7,'timing_diagram','Timing Diagram',0,5,'TIMING_DIAGRAM'
  UNION ALL SELECT 7,'state_diagram','State Machine Diagram',0,6,'DIAGRAM'
  UNION ALL SELECT 8,'truth_table','Truth Table',1,2,'TABLE'
  UNION ALL SELECT 8,'boolean_equation','Boolean Equation',1,3,'EQUATION'
  UNION ALL SELECT 9,'selection_table','Selection Table',1,2,'TABLE'
  UNION ALL SELECT 9,'boolean_equation','Boolean Equation',1,3,'EQUATION'
) x
JOIN categories c ON c.category_id = x.category_id
JOIN content_types ct ON ct.code = x.type_code;

-- ------------------------------
-- 16. Component content seed records
-- ------------------------------
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'overview', 'Overview',
       c.description, NULL, NULL, NULL, 1
FROM components c JOIN content_types ct ON ct.code='TEXT';


-- Counter state tables (stored as JSON strings)
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_table', 'State / Next-State Table',
       CASE c.slug
         WHEN 'decade-counter' THEN JSON_OBJECT('columns',JSON_ARRAY('Decimal','Current State Q3Q2Q1Q0','Next State Q3Q2Q1Q0'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,'0000','0001'),JSON_ARRAY(1,'0001','0010'),JSON_ARRAY(2,'0010','0011'),
           JSON_ARRAY(3,'0011','0100'),JSON_ARRAY(4,'0100','0101'),JSON_ARRAY(5,'0101','0110'),
           JSON_ARRAY(6,'0110','0111'),JSON_ARRAY(7,'0111','1000'),JSON_ARRAY(8,'1000','1001'),
           JSON_ARRAY(9,'1001','0000')))
         WHEN 'mod8-up-counter' THEN JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY(
           JSON_ARRAY('000','001'),JSON_ARRAY('001','010'),JSON_ARRAY('010','011'),JSON_ARRAY('011','100'),
           JSON_ARRAY('100','101'),JSON_ARRAY('101','110'),JSON_ARRAY('110','111'),JSON_ARRAY('111','000')))
         WHEN 'mod8-down-counter' THEN JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY(
           JSON_ARRAY('111','110'),JSON_ARRAY('110','101'),JSON_ARRAY('101','100'),JSON_ARRAY('100','011'),
           JSON_ARRAY('011','010'),JSON_ARRAY('010','001'),JSON_ARRAY('001','000'),JSON_ARRAY('000','111')))
         ELSE JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY())
       END,
       NULL,NULL,NULL,3
FROM components c
JOIN content_types ct ON ct.code='TABLE'
WHERE c.category_id=6;

-- Flip-flop truth, characteristic, excitation tables, and equations are separate.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)','Operation'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0,'Hold'),JSON_ARRAY(0,0,1,1,'Hold'),JSON_ARRAY(0,1,0,0,'Reset'),JSON_ARRAY(0,1,1,0,'Reset'),
           JSON_ARRAY(1,0,0,1,'Set'),JSON_ARRAY(1,0,1,1,'Set'),JSON_ARRAY(1,1,0,1,'Toggle'),JSON_ARRAY(1,1,1,0,'Toggle')))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('D','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('T','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         ELSE JSON_OBJECT('columns',JSON_ARRAY('Inputs','Q','Q(next)'),'rows',JSON_ARRAY())
       END,
       NULL,NULL,'Q(next) is the output after the active clock edge. X means don''t care where applicable.',3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.category_id=7;

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0),JSON_ARRAY(0,0,1,1),JSON_ARRAY(0,1,0,0),JSON_ARRAY(0,1,1,0),
           JSON_ARRAY(1,0,0,1),JSON_ARRAY(1,0,1,1),JSON_ARRAY(1,1,0,1),JSON_ARRAY(1,1,1,0)))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('D','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('T','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         ELSE JSON_OBJECT('columns',JSON_ARRAY('Inputs','Q','Q(next)'),'rows',JSON_ARRAY())
       END,
       NULL,NULL,NULL,4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.category_id=7;

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_equation', 'Characteristic Equation',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN 'Q_{next}=J\\overline{Q}+\\overline{K}Q'
         WHEN 'd-flip-flop' THEN 'Q_{next}=D'
         WHEN 't-flip-flop' THEN 'Q_{next}=T\\overline{Q}+\\overline{T}Q'
         WHEN 'sr-flip-flop' THEN 'Q_{next}=S+\\overline{R}Q\\quad\\text{(valid states only)}'
         ELSE 'Q_{next}=f(inputs,Q)'
       END,
       NULL,NULL,'Stored as LaTeX source for frontend rendering.',5
FROM components c JOIN content_types ct ON ct.code='EQUATION'
WHERE c.category_id=7;

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','J','K'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,'X'),JSON_ARRAY(0,1,1,'X'),JSON_ARRAY(1,0,'X',1),JSON_ARRAY(1,1,'X',0)))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','D'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,0),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','T'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         ELSE JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State','Required Inputs'),'rows',JSON_ARRAY())
       END,
       NULL,NULL,'X means don''t care.',6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.category_id=7;

-- One SVG-path diagram content record per component with an available symbol path.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'circuit_diagram', 'Circuit / Symbol Diagram',
       c.circuit_symbol_path, 'LOGIC_CIRCUIT', CONCAT('SVG diagram for ',c.name), NULL, 10
FROM components c JOIN content_types ct ON ct.code='DIAGRAM'
WHERE c.circuit_symbol_path IS NOT NULL;

-- State-machine SVG paths for relevant sequential components.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'state_diagram', 'State Machine Diagram',
       CASE c.slug
         WHEN 'decade-counter' THEN '/assets/svg/counters/decade-counter-state.svg'
         WHEN 'mod8-up-counter' THEN '/assets/svg/counters/mod8-up-counter-state.svg'
         WHEN 'mod8-down-counter' THEN '/assets/svg/counters/mod8-down-counter-state.svg'
         WHEN 'jk-flip-flop' THEN '/assets/svg/flipflops/jk-flip-flop-state.svg'
         WHEN 'd-flip-flop' THEN '/assets/svg/flipflops/d-flip-flop-state.svg'
         WHEN 't-flip-flop' THEN '/assets/svg/flipflops/t-flip-flop-state.svg'
         ELSE CONCAT('/assets/svg/flipflops/',c.slug,'-state.svg')
       END,
       'STATE_MACHINE', CONCAT('State transitions for ',c.name), NULL, 11
FROM components c JOIN content_types ct ON ct.code='DIAGRAM'
WHERE c.category_id IN (6,7);

-- Counter timing diagram paths (assets must be created by frontend work).
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, diagram_kind, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'timing_diagram', 'Timing Diagram',
       CONCAT('/assets/svg/counters/',c.slug,'-timing.svg'),
       'TIMING', CONCAT('Timing diagram for ',c.name), NULL, 12
FROM components c JOIN content_types ct ON ct.code='TIMING_DIAGRAM'
WHERE c.category_id=6;

-- Representative Boolean equations for gates and multiplexers.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, display_order)
SELECT c.component_id, ct.content_type_id, 'boolean_equation', 'Boolean Equation',
       CASE c.slug
         WHEN 'and-gate' THEN 'Y=A\\cdot B'
         WHEN 'or-gate' THEN 'Y=A+B'
         WHEN 'not-gate' THEN 'Y=\\overline{A}'
         WHEN 'nand-gate' THEN 'Y=\\overline{A\\cdot B}'
         WHEN 'nor-gate' THEN 'Y=\\overline{A+B}'
         WHEN 'xor-gate' THEN 'Y=A\\oplus B'
         WHEN 'xnor-gate' THEN 'Y=\\overline{A\\oplus B}'
         WHEN 'mux-2-to-1' THEN 'Y=\\overline{S}D_0+SD_1'
         WHEN 'mux-4-to-1' THEN 'Y=\\overline{S_1}\\overline{S_0}D_0+\\overline{S_1}S_0D_1+S_1\\overline{S_0}D_2+S_1S_0D_3'
         ELSE 'Y=f(inputs)'
       END, 3
FROM components c JOIN content_types ct ON ct.code='EQUATION'
WHERE c.category_id IN (8,9);

-- ------------------------------
-- 17. Specification values
-- ------------------------------
INSERT INTO component_specifications
(component_id, specification_id, numeric_value, text_value, range_min, range_max, unit_override, source_note)
SELECT c.component_id, s.specification_id,
       CASE s.name WHEN 'Number of States' THEN 10 WHEN 'Number of Bits' THEN 4 ELSE NULL END,
       NULL, NULL, NULL, NULL, 'Logical property of the educational decade-counter model; not an IC rating'
FROM components c JOIN specifications s ON s.name IN ('Number of States','Number of Bits')
WHERE c.slug='decade-counter';

INSERT INTO component_specifications
(component_id, specification_id, numeric_value, text_value, range_min, range_max, unit_override, source_note)
SELECT c.component_id, s.specification_id,
       CASE s.name WHEN 'Number of States' THEN 8 WHEN 'Number of Bits' THEN 3 ELSE NULL END,
       NULL, NULL, NULL, NULL, 'Logical property of the educational Mod-8 counter model; not an IC rating'
FROM components c JOIN specifications s ON s.name IN ('Number of States','Number of Bits')
WHERE c.slug IN ('mod8-up-counter','mod8-down-counter');

INSERT INTO component_specifications
(component_id, specification_id, numeric_value, text_value, range_min, range_max, unit_override, source_note)
SELECT c.component_id, s.specification_id, 2, NULL, NULL, NULL, NULL, 'Logical input count'
FROM components c JOIN specifications s ON s.name='Number of Inputs'
WHERE c.category_id=8 AND c.slug <> 'not-gate';

INSERT INTO component_specifications
(component_id, specification_id, numeric_value, text_value, range_min, range_max, unit_override, source_note)
SELECT c.component_id, s.specification_id, 1, NULL, NULL, NULL, NULL, 'Logical input count'
FROM components c JOIN specifications s ON s.name='Number of Inputs'
WHERE c.slug='not-gate';

-- ------------------------------
-- 18. Views
-- ------------------------------
CREATE VIEW v_component_catalogue AS
SELECT c.component_id, c.name AS component_name, c.slug, c.short_description,
       c.is_published, c.is_illustrative, cat.category_id, cat.name AS category_name,
       parent.name AS parent_category_name
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
LEFT JOIN categories parent ON parent.category_id = cat.parent_category_id;

CREATE VIEW v_category_component_counts AS
SELECT cat.category_id, cat.name AS category_name, COUNT(c.component_id) AS component_count
FROM categories cat
LEFT JOIN components c ON c.category_id = cat.category_id
GROUP BY cat.category_id, cat.name;

-- ------------------------------
-- 19. Stored procedures/functions/triggers
-- ------------------------------
DELIMITER $$

CREATE PROCEDURE sp_insert_component(
  IN p_category_id BIGINT UNSIGNED,
  IN p_name VARCHAR(180),
  IN p_slug VARCHAR(200),
  IN p_short_description VARCHAR(1000)
)
BEGIN
  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name is required';
  END IF;
  INSERT INTO components(category_id,name,slug,short_description)
  VALUES(p_category_id,TRIM(p_name),p_slug,p_short_description);
  SELECT LAST_INSERT_ID() AS component_id;
END$$

CREATE PROCEDURE sp_update_component(
  IN p_component_id BIGINT UNSIGNED,
  IN p_category_id BIGINT UNSIGNED,
  IN p_name VARCHAR(180),
  IN p_short_description VARCHAR(1000)
)
BEGIN
  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name is required';
  END IF;
  UPDATE components
     SET category_id=p_category_id, name=TRIM(p_name),
         short_description=p_short_description
   WHERE component_id=p_component_id;
  IF ROW_COUNT()=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component not found or no values changed';
  END IF;
END$$

CREATE PROCEDURE sp_delete_component(IN p_component_id BIGINT UNSIGNED)
BEGIN
  DELETE FROM components WHERE component_id=p_component_id;
  IF ROW_COUNT()=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component not found';
  END IF;
END$$

CREATE PROCEDURE sp_search_components_page(IN p_page INT, IN p_page_size INT)
BEGIN
  DECLARE v_offset INT;
  IF p_page IS NULL OR p_page<1 OR p_page_size IS NULL OR p_page_size<1 OR p_page_size>100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid page or page size';
  END IF;
  SET v_offset=(p_page-1)*p_page_size;
  SELECT component_id,category_id,name,short_description
  FROM components WHERE is_published=1 ORDER BY component_id
  LIMIT p_page_size OFFSET v_offset;
  SELECT COUNT(*) AS total_rows FROM components WHERE is_published=1;
END$$

CREATE PROCEDURE sp_search_components_by_category(
  IN p_category_id BIGINT UNSIGNED, IN p_page INT, IN p_page_size INT
)
BEGIN
  DECLARE v_offset INT;
  IF p_page IS NULL OR p_page<1 OR p_page_size IS NULL OR p_page_size<1 OR p_page_size>100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid page or page size';
  END IF;
  SET v_offset=(p_page-1)*p_page_size;
  SELECT component_id,category_id,name,short_description
  FROM components
  WHERE is_published=1 AND category_id=p_category_id
  ORDER BY component_id LIMIT p_page_size OFFSET v_offset;
  SELECT COUNT(*) AS total_rows
  FROM components WHERE is_published=1 AND category_id=p_category_id;
END$$

CREATE FUNCTION fn_sum_component_ids()
RETURNS DECIMAL(30,0)
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(30,0);
  SELECT COALESCE(SUM(component_id),0) INTO v_total FROM components;
  RETURN v_total;
END$$

CREATE PROCEDURE sp_sum_component_ids_by_category()
BEGIN
  SELECT category_id, SUM(component_id) AS sum_component_ids
  FROM components GROUP BY category_id ORDER BY category_id;
END$$

CREATE PROCEDURE sp_cursor_components_all()
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_id BIGINT UNSIGNED;
  DECLARE v_name VARCHAR(180);
  DECLARE cur_components CURSOR FOR
    SELECT component_id,name FROM components ORDER BY component_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done=TRUE;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
  CREATE TEMPORARY TABLE tmp_cursor_components(component_id BIGINT UNSIGNED,name VARCHAR(180));
  OPEN cur_components;
  read_loop: LOOP
    FETCH cur_components INTO v_id,v_name;
    IF v_done THEN LEAVE read_loop; END IF;
    INSERT INTO tmp_cursor_components VALUES(v_id,v_name);
  END LOOP;
  CLOSE cur_components;
  SELECT * FROM tmp_cursor_components ORDER BY component_id;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
END$$

CREATE PROCEDURE sp_cursor_components_limited(IN p_limit INT)
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_id BIGINT UNSIGNED;
  DECLARE v_name VARCHAR(180);
  DECLARE v_count INT DEFAULT 0;
  DECLARE cur_components CURSOR FOR
    SELECT component_id,name FROM components ORDER BY component_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done=TRUE;
  IF p_limit IS NULL OR p_limit<1 OR p_limit>10000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Limit must be between 1 and 10000';
  END IF;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
  CREATE TEMPORARY TABLE tmp_cursor_components(component_id BIGINT UNSIGNED,name VARCHAR(180));
  OPEN cur_components;
  read_loop: LOOP
    IF v_count>=p_limit THEN LEAVE read_loop; END IF;
    FETCH cur_components INTO v_id,v_name;
    IF v_done THEN LEAVE read_loop; END IF;
    INSERT INTO tmp_cursor_components VALUES(v_id,v_name);
    SET v_count=v_count+1;
  END LOOP;
  CLOSE cur_components;
  SELECT * FROM tmp_cursor_components ORDER BY component_id;
  DROP TEMPORARY TABLE IF EXISTS tmp_cursor_components;
END$$

CREATE PROCEDURE sp_insert_app_user(
  IN p_username VARCHAR(100), IN p_password_hash VARCHAR(255), IN p_role_code VARCHAR(40)
)
BEGIN
  IF p_username IS NULL OR CHAR_LENGTH(TRIM(p_username))=0 OR p_password_hash IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username and password hash are required';
  END IF;
  IF p_role_code NOT IN ('NAIVE_USER','APP_DEVELOPER','DBA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid application role';
  END IF;
  INSERT INTO app_users(username,password_hash,role_code)
  VALUES(TRIM(p_username),p_password_hash,p_role_code);
END$$

CREATE PROCEDURE sp_update_app_user(
  IN p_user_id BIGINT UNSIGNED, IN p_role_code VARCHAR(40), IN p_is_active TINYINT
)
BEGIN
  IF p_role_code NOT IN ('NAIVE_USER','APP_DEVELOPER','DBA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid application role';
  END IF;
  UPDATE app_users SET role_code=p_role_code,is_active=p_is_active WHERE user_id=p_user_id;
END$$

CREATE PROCEDURE sp_delete_app_user(IN p_user_id BIGINT UNSIGNED)
BEGIN
  DELETE FROM app_users WHERE user_id=p_user_id;
END$$

-- Category self-parent validation is implemented with triggers rather than a CHECK.
-- MySQL rejects references to AUTO_INCREMENT columns inside CHECK constraints.
CREATE TRIGGER trg_categories_no_self_parent_bi
BEFORE INSERT ON categories FOR EACH ROW
BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END$$

CREATE TRIGGER trg_categories_no_self_parent_bu
BEFORE UPDATE ON categories FOR EACH ROW
BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END$$

-- MySQL row-level validation triggers. The table also has declarative checks.
CREATE TRIGGER trg_components_validate_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name))=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description)>1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END$$

CREATE TRIGGER trg_components_validate_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name))=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description)>1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END$$

-- MySQL has no statement-level trigger; these row triggers normalize each changed row.
CREATE TRIGGER trg_components_uppercase_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  SET NEW.name=UPPER(TRIM(NEW.name));
END$$

CREATE TRIGGER trg_components_uppercase_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  SET NEW.name=UPPER(TRIM(NEW.name));
END$$

CREATE TRIGGER trg_components_audit_ai
AFTER INSERT ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','INSERT',CAST(NEW.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),NULL,
     JSON_OBJECT('name',NEW.name,'category_id',NEW.category_id,'short_description',NEW.short_description));
END$$

CREATE TRIGGER trg_components_audit_au
AFTER UPDATE ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','UPDATE',CAST(NEW.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),
     JSON_OBJECT('name',OLD.name,'category_id',OLD.category_id,'short_description',OLD.short_description),
     JSON_OBJECT('name',NEW.name,'category_id',NEW.category_id,'short_description',NEW.short_description));
END$$

CREATE TRIGGER trg_components_audit_ad
AFTER DELETE ON components FOR EACH ROW
BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','DELETE',CAST(OLD.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),
     JSON_OBJECT('name',OLD.name,'category_id',OLD.category_id,'short_description',OLD.short_description),NULL);
END$$

CREATE TRIGGER trg_components_restricted_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component inserts are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

CREATE TRIGGER trg_components_restricted_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component updates are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

CREATE TRIGGER trg_components_restricted_bd
BEFORE DELETE ON components FOR EACH ROW
BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component deletes are disabled on Monday from 2 PM to 4 PM';
  END IF;
END$$

DELIMITER ;

-- ------------------------------
-- 20. Verification queries
-- ------------------------------
SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
UNION ALL SELECT 'components', COUNT(*) FROM components
UNION ALL SELECT 'content_types', COUNT(*) FROM content_types
UNION ALL SELECT 'component_content', COUNT(*) FROM component_content
UNION ALL SELECT 'specifications', COUNT(*) FROM specifications
UNION ALL SELECT 'tags', COUNT(*) FROM tags;

-- Assignment 11 examples; record actual timings in your report.
-- 1. Full-table display:
-- SELECT * FROM components;
-- 2. Insert demonstration (use a valid category and unique slug):
-- CALL sp_insert_component(8,'Example Gate','example-gate','Assignment demonstration row');
-- 3. Aggregate:
-- SELECT COUNT(*) AS component_count FROM components;
-- 4. Conditional query:
-- SELECT * FROM components WHERE category_id=6;
-- 5. Join:
-- SELECT c.name,cat.name AS category_name FROM components c JOIN categories cat ON cat.category_id=c.category_id;
-- 6. Subquery:
-- SELECT name FROM components WHERE category_id IN (SELECT category_id FROM categories WHERE parent_category_id=1);
-- 7. Correlated subquery:
-- SELECT cat.name FROM categories cat WHERE EXISTS (SELECT 1 FROM components c WHERE c.category_id=cat.category_id);
-- 8. Update:
-- UPDATE components SET short_description='Updated description' WHERE slug='decade-counter';
-- XML output for queries 1, 3, and 4 should be serialized by the Node.js API/frontend.

-- Final notes:
-- * The script drops and recreates `electrodb`; back up existing data first.
-- * State-machine and other SVG files are referenced by path and must be created in the frontend.
-- * Do not use the application demo user table as a substitute for MySQL server accounts/roles.
-- * Some MySQL/MariaDB versions differ in CHECK constraint enforcement and trigger features.
