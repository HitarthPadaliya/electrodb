-- ================================================================
-- ElectroDB - Complete merged MySQL database and Assignment 10 stored programs
-- Target: MySQL 8.0+ / compatible MariaDB version bundled with XAMPP
-- Import: phpMyAdmin -> Import -> choose this file -> Go
--
-- WARNING:
--   This script DROPS and recreates the `electrodb` database.
--   Back up any existing database named `electrodb` before importing.
--
-- Includes:
--   * Hierarchical categories and tags
--   * Components, educational content, and component diagrams
--   * Separate truth/characteristic/excitation tables and equations
--   * Specifications and component specifications
--   * Application user records for DBMS assignment demonstration
--   * Audit log
--   * Views, indexes, stored procedures, functions, cursors, and triggers
--   * Consolidates the standalone Assignment 10 stored-program examples;
--     duplicate routine/trigger definitions are intentionally not repeated
--   * Seed data for 45 components
--   * Dedicated component_diagrams table; diagram subtypes are not stored
--
-- Notes:
--   * This is MySQL stored-program syntax, not Oracle PL/SQL.
--   * Includes the shared procedures, cursor examples, aggregate function,
--     validation/normalization/audit/restricted-hours triggers, and app-user routines.
--   * Diagram assets are SVG paths; create the actual SVG files in the
--     frontend public/assets/svg directory before expecting them to load.
--   * Educational numeric examples are illustrative unless sourced
--     from a verified datasheet.
-- ================================================================

SET NAMES utf8mb4;
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
  name_uppercase VARCHAR(180) NOT NULL DEFAULT '',
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
-- 5A. Component diagrams
-- All diagrams share one storage model. The database stores title,
-- caption, alt text, asset path, and display order; it does not classify
-- diagrams as circuit/timing/state/etc.
-- ------------------------------
CREATE TABLE component_diagrams (
  diagram_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  component_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(500) NULL,
  caption VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (diagram_id),
  KEY idx_component_diagrams_order (component_id, display_order),
  CONSTRAINT fk_component_diagrams_component
    FOREIGN KEY (component_id) REFERENCES components(component_id)
    ON DELETE CASCADE ON UPDATE CASCADE
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
-- 13. Components (45 educational entries)
-- ------------------------------
INSERT INTO components
(category_id, name, slug, short_description, description, main_image_path, circuit_symbol_path, datasheet_url, is_illustrative, is_published)
VALUES
(6, 'Decade Counter', 'decade-counter', 'A modulo-10 counter cycling through decimal digits.', 'A decade counter has ten valid states represented by four bits. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', NULL, NULL, NULL, 1, 1),
(6, 'Mod-8 Up Counter', 'mod8-up-counter', 'A three-bit counter that counts from 0 through 7.', 'A modulo-8 counter uses three state bits. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', NULL, NULL, NULL, 1, 1),
(6, 'Mod-8 Down Counter', 'mod8-down-counter', 'A three-bit counter that counts down from 7 to 0.', 'A modulo-8 down counter cycles through eight binary states. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', NULL, NULL, NULL, 1, 1),
(6, 'Binary Up Counter', 'binary-up-counter', 'A counter that increments its binary state.', 'Binary counters represent integer states using flip-flops. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', NULL, NULL, NULL, 1, 1),
(6, 'Binary Ripple Counter', 'binary-ripple-counter', 'An asynchronous counter with cascaded toggle stages.', 'Each stage is clocked by a preceding stage output. The detail page should explain the count sequence, number of state bits, modulus, clock edge or level, reset behavior, and whether the implementation is synchronous or asynchronous. Exact timing limits depend on the selected circuit or IC.', NULL, NULL, NULL, 1, 1),
(7, 'SR Flip-Flop', 'sr-flip-flop', 'A set-reset bistable storage element.', 'The SR element stores one bit using set and reset inputs. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', NULL, NULL, NULL, 1, 1),
(7, 'JK Flip-Flop', 'jk-flip-flop', 'A bistable element with set, reset, hold, and toggle behavior.', 'The JK flip-flop is a clocked sequential element. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', NULL, NULL, NULL, 1, 1),
(7, 'D Flip-Flop', 'd-flip-flop', 'A clocked storage element that samples D.', 'The D flip-flop stores the input value at the active clock edge. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', NULL, NULL, NULL, 1, 1),
(7, 'T Flip-Flop', 't-flip-flop', 'A toggle flip-flop.', 'The T flip-flop either holds or toggles its state. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', NULL, NULL, NULL, 1, 1),
(7, 'Master-Slave JK Flip-Flop', 'master-slave-jk-flip-flop', 'A JK flip-flop using master and slave stages.', 'Two controlled storage stages reduce race-through behavior. The detail page should identify the input signals, active clock edge or enable condition, asynchronous preset/clear behavior if present, and the output-state convention. Timing-sensitive designs must also respect setup time, hold time, and clock-to-output delay from the relevant datasheet.', NULL, NULL, NULL, 1, 1),
(8, 'AND Gate', 'and-gate', 'Output is high only when all inputs are high.', 'The AND gate implements logical conjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'OR Gate', 'or-gate', 'Output is high when at least one input is high.', 'The OR gate implements logical disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'NOT Gate', 'not-gate', 'Inverts a single logic input.', 'The NOT gate produces the complement of its input. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'NAND Gate', 'nand-gate', 'An AND gate followed by inversion.', 'NAND is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'NOR Gate', 'nor-gate', 'An OR gate followed by inversion.', 'NOR is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'XOR Gate', 'xor-gate', 'Output is high when inputs differ.', 'XOR implements exclusive disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(8, 'XNOR Gate', 'xnor-gate', 'Output is high when inputs are equal.', 'XNOR is the complement of XOR. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, NULL, 0, 1),
(9, '2-to-1 Multiplexer', 'mux-2-to-1', 'Selects one of two data inputs.', 'A 2:1 multiplexer routes one data input to the output. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', NULL, NULL, NULL, 0, 1),
(9, '4-to-1 Multiplexer', 'mux-4-to-1', 'Selects one of four data inputs.', 'A 4:1 multiplexer uses two select lines. The number of data channels and select lines determines the selection capacity. The detail page should clarify select-code mapping, enable polarity, output behavior, and whether the device switches digital logic or analog signals.', NULL, NULL, NULL, 0, 1),
(10, '2-to-4 Decoder', 'decoder-2-to-4', 'Activates one output based on a two-bit input.', 'A decoder converts an input code to one-of-N outputs. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', NULL, NULL, NULL, 0, 1),
(10, '4-to-2 Encoder', 'encoder-4-to-2', 'Encodes one of four active inputs into two bits.', 'A simple encoder assumes a valid one-hot input unless priority logic is specified. The input code maps to an output code or one-of-N output lines. The detail page should state input/output polarity, valid-input assumptions, priority behavior where applicable, and how simultaneous active inputs are handled.', NULL, NULL, NULL, 0, 1),
(11, 'Rectifier Diode', 'rectifier-diode', 'A diode used for rectification.', 'A PN junction conducts primarily under forward bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, NULL, 1, 1),
(12, 'Zener Diode', 'zener-diode', 'A diode used in reverse breakdown for voltage reference/regulation.', 'A Zener diode is operated in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', NULL, NULL, NULL, 1, 1),
(13, 'Schottky Diode', 'schottky-diode', 'A metal-semiconductor diode often used for fast switching.', 'Schottky diodes typically have low charge storage compared with PN diodes. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', NULL, NULL, NULL, 1, 1),
(14, 'Red LED', 'red-led', 'A light-emitting diode for visible red light.', 'An LED emits light when forward current recombines carriers. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, NULL, 1, 1),
(14, 'Infrared LED', 'infrared-led', 'An LED emitting infrared radiation.', 'Infrared LEDs are used in optical links and sensing. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, NULL, 1, 1),
(15, 'NPN BJT', 'npn-bjt', 'An NPN bipolar junction transistor.', 'A BJT uses base current to control collector current in common operating regions. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, NULL, 1, 1),
(15, 'PNP BJT', 'pnp-bjt', 'A PNP bipolar junction transistor.', 'A PNP BJT uses opposite current/polarity conventions to an NPN device. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, NULL, 1, 1),
(16, 'N-Channel Enhancement MOSFET', 'nmos-enhancement', 'A voltage-controlled n-channel transistor.', 'An enhancement MOSFET forms a conducting channel when gate drive is sufficient. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', NULL, NULL, NULL, 1, 1),
(16, 'P-Channel Enhancement MOSFET', 'pmos-enhancement', 'A voltage-controlled p-channel transistor.', 'A PMOS device uses polarity conventions complementary to NMOS. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', NULL, NULL, NULL, 1, 1),
(17, 'Inverting Amplifier', 'inverting-amplifier', 'An op-amp configuration with inverted output polarity.', 'The input signal is applied through an input resistor to the inverting node. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, NULL, 1, 1),
(17, 'Non-Inverting Amplifier', 'non-inverting-amplifier', 'An op-amp configuration with non-inverted output.', 'The signal is applied to the non-inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, NULL, 1, 1),
(17, 'Voltage Follower', 'voltage-follower', 'A unity-gain buffer using an op-amp.', 'The output is fed back directly to the inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, NULL, 1, 1),
(18, 'Linear Voltage Regulator', 'linear-voltage-regulator', 'Maintains an approximately constant output voltage.', 'A linear regulator controls a pass element to regulate output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, NULL, 1, 1),
(18, 'Buck Converter', 'buck-converter', 'A switching regulator that steps down DC voltage.', 'A buck converter uses a switch, inductor, diode or synchronous switch, and capacitor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, NULL, 1, 1),
(19, 'Analog Temperature Sensor', 'analog-temperature-sensor', 'A temperature sensor with an analog output.', 'The output voltage/current represents temperature according to its transfer function. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, NULL, 1, 1),
(19, 'Digital Temperature Sensor', 'digital-temperature-sensor', 'A temperature sensor with a digital interface.', 'The sensor converts temperature internally and communicates over a digital bus. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, NULL, 1, 1),
(20, 'Successive Approximation ADC', 'sar-adc', 'An ADC using binary search over the input range.', 'A SAR ADC compares the input against DAC-generated trial levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, NULL, 1, 1),
(20, 'Flash ADC', 'flash-adc', 'A high-speed ADC using parallel comparators.', 'A resistor ladder creates thresholds for multiple comparators. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, NULL, 1, 1),
(21, 'EEPROM', 'eeprom', 'Non-volatile electrically erasable memory.', 'EEPROM retains stored data without power and supports electrical writes. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, NULL, 1, 1),
(21, 'SRAM', 'sram', 'Volatile memory with static storage cells.', 'SRAM stores bits in bistable circuits while powered. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, NULL, 1, 1),
(22, 'Electromagnetic Relay', 'electromagnetic-relay', 'A coil-operated mechanical switch.', 'Coil current creates a magnetic field that moves contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, NULL, 1, 1),
(22, 'Solid-State Relay', 'solid-state-relay', 'An electronically switched relay.', 'Semiconductor devices switch the load without mechanical contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, NULL, 1, 1),
(23, 'Brushed DC Motor', 'brushed-dc-motor', 'A motor using brushes and a commutator.', 'Armature current interacts with a magnetic field to create torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, NULL, 1, 1),
(23, 'DC Gear Motor', 'dc-gear-motor', 'A DC motor combined with a reduction gearbox.', 'The gearbox trades speed for increased output torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, NULL, 1, 1);

-- Seed the uppercase normalization key before row triggers are created below.
UPDATE components SET name_uppercase=UPPER(TRIM(name));

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
  UNION ALL SELECT 6,'diagram','Diagrams',0,2,'DIAGRAM'
  UNION ALL SELECT 6,'logic_diagram','Logic Circuit Diagram',0,3,'DIAGRAM'
  UNION ALL SELECT 7,'truth_table','Truth Table',1,1,'TABLE'
  UNION ALL SELECT 7,'characteristic_table','Characteristic Table',1,2,'TABLE'
  UNION ALL SELECT 7,'characteristic_equation','Characteristic Equation',1,3,'EQUATION'
  UNION ALL SELECT 7,'excitation_table','Excitation Table',1,4,'TABLE'
  UNION ALL SELECT 7,'diagram','Diagrams',0,5,'DIAGRAM'
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
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'overview', 'Overview',
       c.description, NULL, NULL, 1
FROM components c JOIN content_types ct ON ct.code='TEXT';


-- Counter state tables (stored as JSON strings)
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
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
         WHEN 'binary-up-counter' THEN JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY(
           JSON_ARRAY('000','001'),JSON_ARRAY('001','010'),JSON_ARRAY('010','011'),JSON_ARRAY('011','100'),
           JSON_ARRAY('100','101'),JSON_ARRAY('101','110'),JSON_ARRAY('110','111'),JSON_ARRAY('111','000')))
         WHEN 'binary-ripple-counter' THEN JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY(
           JSON_ARRAY('000','001'),JSON_ARRAY('001','010'),JSON_ARRAY('010','011'),JSON_ARRAY('011','100'),
           JSON_ARRAY('100','101'),JSON_ARRAY('101','110'),JSON_ARRAY('110','111'),JSON_ARRAY('111','000')))
         ELSE JSON_OBJECT('columns',JSON_ARRAY('Current State','Next State'),'rows',JSON_ARRAY())
       END,
       NULL,CASE WHEN c.slug IN ('binary-up-counter','binary-ripple-counter')
         THEN 'Illustrative 3-bit sequence; actual counter width depends on implementation.' ELSE NULL END,3
FROM components c
JOIN content_types ct ON ct.code='TABLE'
WHERE c.category_id=6;

-- Flip-flop truth, characteristic, excitation tables, and equations are separate.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'truth_table', 'Truth Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)','Operation'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0,'Hold'),JSON_ARRAY(0,0,1,1,'Hold'),JSON_ARRAY(0,1,0,0,'Reset'),JSON_ARRAY(0,1,1,0,'Reset'),
           JSON_ARRAY(1,0,0,1,'Set'),JSON_ARRAY(1,0,1,1,'Set'),JSON_ARRAY(1,1,0,1,'Toggle'),JSON_ARRAY(1,1,1,0,'Toggle')))
         WHEN 'master-slave-jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)','Operation'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0,'Hold'),JSON_ARRAY(0,0,1,1,'Hold'),JSON_ARRAY(0,1,0,0,'Reset'),JSON_ARRAY(0,1,1,0,'Reset'),
           JSON_ARRAY(1,0,0,1,'Set'),JSON_ARRAY(1,0,1,1,'Set'),JSON_ARRAY(1,1,0,1,'Toggle'),JSON_ARRAY(1,1,1,0,'Toggle')))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('D','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('T','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         WHEN 'sr-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('S','R','Q','Q(next)','Operation'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0,'Hold'),JSON_ARRAY(0,0,1,1,'Hold'),JSON_ARRAY(0,1,0,0,'Reset'),JSON_ARRAY(0,1,1,0,'Reset'),
           JSON_ARRAY(1,0,0,1,'Set'),JSON_ARRAY(1,0,1,1,'Set'),JSON_ARRAY(1,1,0,'X','Invalid'),JSON_ARRAY(1,1,1,'X','Invalid')))
       END,
       NULL,'Q(next) is the output after the active clock edge. X denotes an invalid or don’t-care condition as labelled.',3
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug IN ('jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_table', 'Characteristic Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0),JSON_ARRAY(0,0,1,1),JSON_ARRAY(0,1,0,0),JSON_ARRAY(0,1,1,0),
           JSON_ARRAY(1,0,0,1),JSON_ARRAY(1,0,1,1),JSON_ARRAY(1,1,0,1),JSON_ARRAY(1,1,1,0)))
         WHEN 'master-slave-jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('J','K','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0),JSON_ARRAY(0,0,1,1),JSON_ARRAY(0,1,0,0),JSON_ARRAY(0,1,1,0),
           JSON_ARRAY(1,0,0,1),JSON_ARRAY(1,0,1,1),JSON_ARRAY(1,1,0,1),JSON_ARRAY(1,1,1,0)))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('D','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('T','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         WHEN 'sr-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('S','R','Q','Q(next)'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,0),JSON_ARRAY(0,0,1,1),JSON_ARRAY(0,1,0,0),JSON_ARRAY(0,1,1,0),
           JSON_ARRAY(1,0,0,1),JSON_ARRAY(1,0,1,1),JSON_ARRAY(1,1,0,'X'),JSON_ARRAY(1,1,1,'X')))
       END,
       NULL,'The characteristic table maps inputs and current state to the next state.',4
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug IN ('jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'characteristic_equation', 'Characteristic Equation',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN 'Q_{next}=J\\overline{Q}+\\overline{K}Q'
         WHEN 'master-slave-jk-flip-flop' THEN 'Q_{next}=J\\overline{Q}+\\overline{K}Q'
         WHEN 'd-flip-flop' THEN 'Q_{next}=D'
         WHEN 't-flip-flop' THEN 'Q_{next}=T\\overline{Q}+\\overline{T}Q'
         WHEN 'sr-flip-flop' THEN 'Q_{next}=S+\\overline{R}Q\\quad\\text{(valid states only)}'
       END,
       NULL,'Stored as LaTeX source for frontend rendering; the SR equation excludes the invalid S=R=1 condition.',5
FROM components c JOIN content_types ct ON ct.code='EQUATION'
WHERE c.slug IN ('jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, alt_text, caption, display_order)
SELECT c.component_id, ct.content_type_id, 'excitation_table', 'Excitation Table',
       CASE c.slug
         WHEN 'jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','J','K'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,'X'),JSON_ARRAY(0,1,1,'X'),JSON_ARRAY(1,0,'X',1),JSON_ARRAY(1,1,'X',0)))
         WHEN 'master-slave-jk-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','J','K'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,'X'),JSON_ARRAY(0,1,1,'X'),JSON_ARRAY(1,0,'X',1),JSON_ARRAY(1,1,'X',0)))
         WHEN 'd-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','D'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,0),JSON_ARRAY(1,1,1)))
         WHEN 't-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','T'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         WHEN 'sr-flip-flop' THEN JSON_OBJECT('columns',JSON_ARRAY('Q','Q(next)','S','R'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,0,'X'),JSON_ARRAY(0,1,1,0),JSON_ARRAY(1,0,0,1),JSON_ARRAY(1,1,'X',0)))
       END,
       NULL,'X means don’t care.',6
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug IN ('jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

-- Diagram assets are seeded only when the corresponding reviewed SVG exists
-- in public/assets/svg. Unsupported symbol/state figures are omitted rather
-- than publishing broken asset paths. There is one generic diagram model.
INSERT INTO component_diagrams
(component_id, title, image_path, alt_text, caption, display_order)
SELECT c.component_id, 'State Diagram',
       CASE c.slug
         WHEN 'decade-counter' THEN '/assets/svg/counters/decade-counter-state.svg'
         WHEN 'mod8-up-counter' THEN '/assets/svg/counters/mod8-up-counter-state.svg'
         WHEN 'mod8-down-counter' THEN '/assets/svg/counters/mod8-down-counter-state.svg'
         WHEN 'binary-up-counter' THEN '/assets/svg/counters/binary-up-counter-state.svg'
         WHEN 'binary-ripple-counter' THEN '/assets/svg/counters/binary-ripple-counter-state.svg'
         WHEN 'jk-flip-flop' THEN '/assets/svg/flipflops/jk-flip-flop-state.svg'
         WHEN 'master-slave-jk-flip-flop' THEN '/assets/svg/flipflops/master-slave-jk-flip-flop-state.svg'
         WHEN 'd-flip-flop' THEN '/assets/svg/flipflops/d-flip-flop-state.svg'
         WHEN 't-flip-flop' THEN '/assets/svg/flipflops/t-flip-flop-state.svg'
         WHEN 'sr-flip-flop' THEN '/assets/svg/flipflops/sr-flip-flop-state.svg'
       END, CONCAT('State transitions for ',c.name), NULL, 11
FROM components c
WHERE c.slug IN ('decade-counter','mod8-up-counter','mod8-down-counter','binary-up-counter','binary-ripple-counter',
                 'jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

INSERT INTO component_diagrams
(component_id, title, image_path, alt_text, caption, display_order)
SELECT c.component_id, 'Timing Diagram',
       CONCAT('/assets/svg/counters/',c.slug,'-timing.svg'),
       CONCAT('Idealized timing diagram for ',c.name),
       'Illustrative state timing; physical propagation delays are not shown.', 12
FROM components c
WHERE c.slug IN ('decade-counter','mod8-up-counter','mod8-down-counter','binary-up-counter','binary-ripple-counter');

INSERT INTO component_diagrams
(component_id, title, image_path, alt_text, caption, display_order)
SELECT c.component_id, 'Timing Diagram',
       CONCAT('/assets/svg/flipflops/',c.slug,'-timing.svg'),
       CONCAT('Idealized timing diagram for ',c.name),
       'Illustrative active-edge behavior; physical setup, hold, and propagation times are device-specific.', 12
FROM components c
WHERE c.slug IN ('jk-flip-flop','master-slave-jk-flip-flop','d-flip-flop','t-flip-flop','sr-flip-flop');

-- Gate truth tables provide complete binary input combinations.
INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, display_order)
SELECT c.component_id,ct.content_type_id,'truth_table','Truth Table',
       CASE c.slug
         WHEN 'not-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,1),JSON_ARRAY(1,0)))
         WHEN 'and-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,0),JSON_ARRAY(1,1,1)))
         WHEN 'or-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,1)))
         WHEN 'nand-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,1),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         WHEN 'nor-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,1),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,0),JSON_ARRAY(1,1,0)))
         WHEN 'xor-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,0),JSON_ARRAY(0,1,1),JSON_ARRAY(1,0,1),JSON_ARRAY(1,1,0)))
         WHEN 'xnor-gate' THEN JSON_OBJECT('columns',JSON_ARRAY('A','B','Y'),'rows',JSON_ARRAY(JSON_ARRAY(0,0,1),JSON_ARRAY(0,1,0),JSON_ARRAY(1,0,0),JSON_ARRAY(1,1,1)))
       END,2
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug IN ('and-gate','or-gate','not-gate','nand-gate','nor-gate','xor-gate','xnor-gate');

INSERT INTO component_content
(component_id, content_type_id, section_key, title, content, display_order)
SELECT c.component_id,ct.content_type_id,'selection_table','Selection Table',
       CASE c.slug
         WHEN 'mux-2-to-1' THEN JSON_OBJECT('columns',JSON_ARRAY('S','Selected Input','Y'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,'D0','D0'),JSON_ARRAY(1,'D1','D1')))
         WHEN 'mux-4-to-1' THEN JSON_OBJECT('columns',JSON_ARRAY('S1','S0','Selected Input','Y'),'rows',JSON_ARRAY(
           JSON_ARRAY(0,0,'D0','D0'),JSON_ARRAY(0,1,'D1','D1'),
           JSON_ARRAY(1,0,'D2','D2'),JSON_ARRAY(1,1,'D3','D3')))
       END,2
FROM components c JOIN content_types ct ON ct.code='TABLE'
WHERE c.slug IN ('mux-2-to-1','mux-4-to-1');

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
SELECT c.component_id, s.specification_id,
       CASE s.name WHEN 'Number of States' THEN 8 WHEN 'Number of Bits' THEN 3 ELSE NULL END,
       NULL, NULL, NULL, NULL, 'Illustrative 3-bit educational model; implementation widths vary and this is not a device rating'
FROM components c JOIN specifications s ON s.name IN ('Number of States','Number of Bits')
WHERE c.slug IN ('binary-up-counter','binary-ripple-counter');

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
  IF p_slug IS NULL OR CHAR_LENGTH(TRIM(p_slug)) = 0 OR p_slug REGEXP '[^a-z0-9-]' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component slug must contain lowercase letters, digits, and hyphens only';
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
  IF NOT EXISTS (SELECT 1 FROM components WHERE component_id=p_component_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component not found';
  END IF;
  UPDATE components
     SET category_id=p_category_id, name=TRIM(p_name),
         short_description=p_short_description
   WHERE component_id=p_component_id;
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
  IF p_role_code IS NULL OR p_role_code NOT IN ('NAIVE_USER','APP_DEVELOPER','DBA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid application role';
  END IF;
  IF p_is_active IS NULL OR p_is_active NOT IN (0,1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active state must be 0 or 1';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE user_id=p_user_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application user not found';
  END IF;
  UPDATE app_users SET role_code=p_role_code,is_active=p_is_active WHERE user_id=p_user_id;
END$$

CREATE PROCEDURE sp_delete_app_user(IN p_user_id BIGINT UNSIGNED)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE user_id=p_user_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application user not found';
  END IF;
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

-- MySQL has no statement-level trigger; these row triggers maintain a normalized uppercase search-key while preserving the display name.
CREATE TRIGGER trg_components_uppercase_bi
BEFORE INSERT ON components FOR EACH ROW
BEGIN
  SET NEW.name=TRIM(NEW.name);
  SET NEW.name_uppercase=UPPER(NEW.name);
END$$

CREATE TRIGGER trg_components_uppercase_bu
BEFORE UPDATE ON components FOR EACH ROW
BEGIN
  SET NEW.name=TRIM(NEW.name);
  SET NEW.name_uppercase=UPPER(NEW.name);
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
UNION ALL SELECT 'component_diagrams', COUNT(*) FROM component_diagrams
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
