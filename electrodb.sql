-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2026 at 06:09 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `electrodb`
--

-- --------------------------------------------------------

--
-- Table structure for table `application_audit_log`
--

CREATE TABLE `application_audit_log` (
  `audit_id` bigint(20) UNSIGNED NOT NULL,
  `table_name` varchar(128) NOT NULL,
  `operation_type` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `row_key` varchar(128) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `db_user` varchar(288) NOT NULL,
  `application_user` varchar(100) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `application_audit_log`
--

INSERT INTO `application_audit_log` (`audit_id`, `table_name`, `operation_type`, `row_key`, `changed_at`, `db_user`, `application_user`, `old_values`, `new_values`) VALUES
(1, 'components', 'DELETE', '103', '2026-10-31 16:20:32', 'root@localhost', NULL, '{\"name\": \"RGB LED\", \"category_id\": 14, \"short_description\": \"A package containing red, green, and blue emitters.\"}', NULL),
(2, 'components', 'DELETE', '105', '2026-10-31 16:25:05', 'root@localhost', NULL, '{\"name\": \"Darlington Pair\", \"category_id\": 15, \"short_description\": \"Two BJTs arranged for high current gain.\"}', NULL),
(3, 'components', 'DELETE', '109', '2026-10-31 16:50:31', 'root@localhost', NULL, '{\"name\": \"Logic-Level N-Channel MOSFET\", \"category_id\": 16, \"short_description\": \"An N-channel MOSFET designed for specified low gate-drive voltages.\"}', NULL),
(4, 'components', 'DELETE', '110', '2026-10-31 17:04:24', 'root@localhost', NULL, '{\"name\": \"Power MOSFET\", \"category_id\": 16, \"short_description\": \"A MOSFET intended for power switching.\"}', NULL),
(5, 'components', 'DELETE', '112', '2026-10-31 17:04:27', 'root@localhost', NULL, '{\"name\": \"P-Channel MOSFET Load Switch\", \"category_id\": 16, \"short_description\": \"A high-side switching arrangement using a P-channel MOSFET.\"}', NULL),
(6, 'components', 'DELETE', '66', '2026-11-01 16:10:31', 'root@localhost', NULL, '{\"name\": \"Clearable D Flip-Flop\", \"category_id\": 7, \"short_description\": \"A D flip-flop with clear input.\"}', NULL),
(7, 'components', 'DELETE', '63', '2026-11-01 16:15:47', 'root@localhost', NULL, '{\"name\": \"Dual D Flip-Flop\", \"category_id\": 7, \"short_description\": \"Two D flip-flops in one integrated circuit.\"}', NULL),
(8, 'components', 'DELETE', '58', '2026-11-01 16:16:02', 'root@localhost', NULL, '{\"name\": \"Edge-Triggered D Flip-Flop\", \"category_id\": 7, \"short_description\": \"A D storage element triggered by a clock edge.\"}', NULL),
(9, 'components', 'DELETE', '59', '2026-11-01 16:16:04', 'root@localhost', NULL, '{\"name\": \"Positive-Edge D Flip-Flop\", \"category_id\": 7, \"short_description\": \"A D flip-flop triggered on a rising clock edge.\"}', NULL),
(10, 'components', 'DELETE', '60', '2026-11-01 16:16:06', 'root@localhost', NULL, '{\"name\": \"Negative-Edge D Flip-Flop\", \"category_id\": 7, \"short_description\": \"A D flip-flop triggered on a falling clock edge.\"}', NULL),
(11, 'components', 'DELETE', '67', '2026-11-01 16:16:28', 'root@localhost', NULL, '{\"name\": \"JK Flip-Flop with Preset and Clear\", \"category_id\": 7, \"short_description\": \"A JK flip-flop with asynchronous controls.\"}', NULL),
(12, 'components', 'DELETE', '10', '2026-11-01 16:16:40', 'root@localhost', NULL, '{\"name\": \"Master-Slave JK Flip-Flop\", \"category_id\": 7, \"short_description\": \"A JK flip-flop using master and slave stages.\"}', NULL),
(13, 'components', 'DELETE', '65', '2026-11-01 16:16:59', 'root@localhost', NULL, '{\"name\": \"Presettable D Flip-Flop\", \"category_id\": 7, \"short_description\": \"A D flip-flop with asynchronous preset.\"}', NULL),
(14, 'components', 'DELETE', '64', '2026-11-01 16:17:11', 'root@localhost', NULL, '{\"name\": \"Quad D Flip-Flop\", \"category_id\": 7, \"short_description\": \"Four D flip-flops in one package.\"}', NULL),
(15, 'components', 'DELETE', '79', '2026-11-01 16:25:04', 'root@localhost', NULL, '{\"name\": \"Dual 4-to-1 Multiplexer\", \"category_id\": 9, \"short_description\": \"Two independent four-input multiplexers.\"}', NULL),
(16, 'components', 'DELETE', '133', '2026-11-01 16:55:27', 'root@localhost', NULL, '{\"name\": \"Flash Memory\", \"category_id\": 21, \"short_description\": \"Non-volatile memory erased in blocks or sectors.\"}', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `app_users`
--

CREATE TABLE `app_users` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_code` enum('NAIVE_USER','APP_DEVELOPER','DBA') NOT NULL DEFAULT 'NAIVE_USER',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `app_users`
--
DELIMITER $$
CREATE TRIGGER `trg_app_users_audit_ad` AFTER DELETE ON `app_users` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'DELETE', CAST(OLD.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), OLD.username,
     JSON_OBJECT('username', OLD.username, 'email', OLD.email,
                 'role_code', OLD.role_code, 'is_active', OLD.is_active), NULL);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_app_users_audit_ai` AFTER INSERT ON `app_users` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'INSERT', CAST(NEW.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), NEW.username, NULL,
     JSON_OBJECT('username', NEW.username, 'email', NEW.email,
                 'role_code', NEW.role_code, 'is_active', NEW.is_active));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_app_users_audit_au` AFTER UPDATE ON `app_users` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name, operation_type, row_key, changed_at, db_user, application_user, old_values, new_values)
  VALUES
    ('app_users', 'UPDATE', CAST(NEW.user_id AS CHAR), CURRENT_TIMESTAMP, CURRENT_USER(), NEW.username,
     JSON_OBJECT('username', OLD.username, 'email', OLD.email, 'role_code', OLD.role_code,
                 'is_active', OLD.is_active, 'password_changed', NOT (OLD.password_hash <=> NEW.password_hash)),
     JSON_OBJECT('username', NEW.username, 'email', NEW.email, 'role_code', NEW.role_code,
                 'is_active', NEW.is_active, 'password_changed', NOT (OLD.password_hash <=> NEW.password_hash)));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `bookmarks`
--

CREATE TABLE `bookmarks` (
  `bookmark_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `parent_category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `parent_category_id`, `name`, `slug`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Digital Electronics', 'digital-electronics', 'Digital logic and sequential circuits', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(2, NULL, 'Semiconductor Devices', 'semiconductor-devices', 'Semiconductor components', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(3, NULL, 'Analog and Linear ICs', 'analog-linear-ics', 'Amplifiers and voltage control', 3, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(4, NULL, 'Sensors and Data Conversion', 'sensors-data-conversion', 'Sensors and conversion circuits', 4, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(5, NULL, 'Electromechanical Components', 'electromechanical-components', 'Relays and motors', 5, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(6, 1, 'Counters', 'counters', 'Sequential circuits that count clock events', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(7, 1, 'Flip-Flops', 'flip-flops', 'Bistable sequential logic elements', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(8, 1, 'Logic Gates', 'logic-gates', 'Boolean logic primitives', 3, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(9, 1, 'Multiplexers and Demultiplexers', 'mux-demux', 'Digital data selection circuits', 4, 1, '2026-10-31 08:43:53', '2026-11-01 16:26:14'),
(10, 1, 'Encoders and Decoders', 'encoders-decoders', 'Code conversion and selection circuits', 5, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(11, 2, 'Rectifier Diodes', 'rectifier-diodes', 'PN junction rectifier diodes', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(12, 2, 'Zener Diodes', 'zener-diodes', 'Reverse-breakdown voltage reference diodes', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(13, 2, 'Schottky Diodes', 'schottky-diodes', 'Metal-semiconductor junction diodes', 3, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(14, 2, 'Light-Emitting Diodes', 'leds', 'Light-emitting semiconductor diodes', 4, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(15, 2, 'BJTs', 'bjts', 'Bipolar junction transistors', 5, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(16, 2, 'MOSFETs', 'mosfets', 'Field-effect transistors', 6, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(17, 3, 'Operational Amplifier Circuits', 'op-amp-circuits', 'Common op-amp configurations', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(18, 3, 'Voltage Regulators', 'voltage-regulators', 'Linear and switching regulation', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(19, 4, 'Temperature Sensors', 'temperature-sensors', 'Temperature sensing components', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(20, 4, 'Analog-to-Digital Converters', 'adcs', 'Analog input to digital output', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(21, 4, 'Memory ICs', 'memory-ics', 'Semiconductor data storage', 3, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(22, 5, 'Relays', 'relays', 'Electrically operated switches', 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(23, 5, 'DC Motors', 'dc-motors', 'Brushed DC motors and control', 2, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53');

--
-- Triggers `categories`
--
DELIMITER $$
CREATE TRIGGER `trg_categories_no_self_parent_bi` BEFORE INSERT ON `categories` FOR EACH ROW BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_categories_no_self_parent_bu` BEFORE UPDATE ON `categories` FOR EACH ROW BEGIN
  IF NEW.parent_category_id IS NOT NULL AND NEW.parent_category_id = NEW.category_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A category cannot be its own parent';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `category_content_types`
--

CREATE TABLE `category_content_types` (
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `content_type_id` bigint(20) UNSIGNED NOT NULL,
  `section_key` varchar(80) NOT NULL,
  `section_label` varchar(120) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category_content_types`
--

INSERT INTO `category_content_types` (`category_id`, `content_type_id`, `section_key`, `section_label`, `is_required`, `display_order`) VALUES
(6, 5, 'diagram', 'Diagrams', 0, 2),
(6, 5, 'logic_diagram', 'Logic Circuit Diagram', 0, 3),
(6, 3, 'state_table', 'State / Next-State Table', 1, 1),
(7, 4, 'characteristic_equation', 'Characteristic Equation', 1, 3),
(7, 3, 'characteristic_table', 'Characteristic Table', 1, 2),
(7, 5, 'diagram', 'Diagrams', 0, 5),
(7, 3, 'excitation_table', 'Excitation Table', 1, 4),
(7, 3, 'truth_table', 'Truth Table', 1, 1),
(8, 4, 'boolean_equation', 'Boolean Equation', 1, 3),
(8, 3, 'truth_table', 'Truth Table', 1, 2),
(9, 4, 'boolean_equation', 'Boolean Equation', 1, 3),
(9, 3, 'selection_table', 'Selection Table', 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `collections`
--

CREATE TABLE `collections` (
  `collection_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(280) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `collection_components`
--

CREATE TABLE `collection_components` (
  `collection_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `components`
--

CREATE TABLE `components` (
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(180) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `short_description` varchar(1000) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `main_image_path` varchar(500) DEFAULT NULL,
  `circuit_symbol_path` varchar(500) DEFAULT NULL,
  `datasheet_url` varchar(1000) DEFAULT NULL,
  `is_illustrative` tinyint(1) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `components`
--

INSERT INTO `components` (`component_id`, `category_id`, `name`, `slug`, `short_description`, `description`, `main_image_path`, `circuit_symbol_path`, `datasheet_url`, `is_illustrative`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 6, 'Decade Counter', 'decade-counter', 'A modulo-10 counter cycling through decimal digits.', 'A decade counter has ten valid states represented by four bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/counters/decade-counter.png', '/assets/svg/counters/decade-counter-symbol.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(2, 6, 'Mod-8 Up Counter', 'mod8-up-counter', 'A three-bit counter that counts from 0 through 7.', 'A modulo-8 counter uses three state bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/counters/mod8.png', '/assets/svg/counters/mod8-symbol.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(3, 6, 'Mod-8 Down Counter', 'mod8-down-counter', 'A three-bit counter that counts down from 7 to 0.', 'A modulo-8 down counter cycles through eight binary states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/counters/mod8-down.png', '/assets/svg/counters/mod8-down-symbol.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(4, 6, 'Binary Up Counter', 'binary-up-counter', 'A counter that increments its binary state.', 'Binary counters represent integer states using flip-flops. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/counters/binary-up.png', '/assets/svg/counters/binary-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(5, 6, 'Binary Ripple Counter', 'binary-ripple-counter', 'An asynchronous counter with cascaded toggle stages.', 'Each stage is clocked by a preceding stage output. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/counters/ripple.png', '/assets/svg/counters/ripple-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(6, 7, 'SR Flip-Flop', 'sr-flip-flop', 'A set-reset bistable storage element.', 'The SR element stores one bit using set and reset inputs. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/flipflops/sr.png', '/assets/svg/flipflops/sr.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(7, 7, 'JK Flip-Flop', 'jk-flip-flop', 'A bistable element with set, reset, hold, and toggle behavior.', 'The JK flip-flop is a clocked sequential element. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/flipflops/jk.png', '/assets/svg/flipflops/jk-flip-flop.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(8, 7, 'D Flip-Flop', 'd-flip-flop', 'A clocked storage element that samples D.', 'The D flip-flop stores the input value at the active clock edge. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/flipflops/d.png', '/assets/svg/flipflops/d.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(9, 7, 'T Flip-Flop', 't-flip-flop', 'A toggle flip-flop.', 'The T flip-flop either holds or toggles its state. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/flipflops/t.png', '/assets/svg/flipflops/t.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(11, 8, 'AND Gate', 'and-gate', 'Output is high only when all inputs are high.', 'The AND gate implements logical conjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/and.png', '/assets/svg/gates/and.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(12, 8, 'OR Gate', 'or-gate', 'Output is high when at least one input is high.', 'The OR gate implements logical disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/or.png', '/assets/svg/gates/or.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(13, 8, 'NOT Gate', 'not-gate', 'Inverts a single logic input.', 'The NOT gate produces the complement of its input. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/not.png', '/assets/svg/gates/not.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(14, 8, 'NAND Gate', 'nand-gate', 'An AND gate followed by inversion.', 'NAND is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/nand.png', '/assets/svg/gates/nand.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(15, 8, 'NOR Gate', 'nor-gate', 'An OR gate followed by inversion.', 'NOR is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/nor.png', '/assets/svg/gates/nor.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(16, 8, 'XOR Gate', 'xor-gate', 'Output is high when inputs differ.', 'XOR implements exclusive disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/xor.png', '/assets/svg/gates/xor.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(17, 8, 'XNOR Gate', 'xnor-gate', 'Output is high when inputs are equal.', 'XNOR is the complement of XOR. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/gates/xnor.png', '/assets/svg/gates/xnor.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(18, 9, '2-to-1 Multiplexer', 'mux-2-to-1', 'Selects one of two data inputs.', 'A 2:1 multiplexer routes one data input to the output. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/mux/2to1.png', '/assets/svg/mux/2to1.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(19, 9, '4-to-1 Multiplexer', 'mux-4-to-1', 'Selects one of four data inputs.', 'A 4:1 multiplexer uses two select lines. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/mux/4to1.png', '/assets/svg/mux/4to1.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(20, 10, '2-to-4 Decoder', 'decoder-2-to-4', 'Activates one output based on a two-bit input.', 'A decoder converts an input code to one-of-N outputs. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/encoders/decoder2to4.png', '/assets/svg/encoders/decoder2to4.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(21, 10, '4-to-2 Encoder', 'encoder-4-to-2', 'Encodes one of four active inputs into two bits.', 'A simple encoder assumes a valid one-hot input unless priority logic is specified. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/encoders/encoder4to2.png', '/assets/svg/encoders/encoder4to2.svg', NULL, 0, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(22, 11, 'Rectifier Diode', 'rectifier-diode', 'A diode used for rectification.', 'A PN junction conducts primarily under forward bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/diodes/rectifier.png', '/assets/svg/diodes/diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(23, 12, 'Zener Diode', 'zener-diode', 'A diode used in reverse breakdown for voltage reference/regulation.', 'A Zener diode is operated in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/diodes/zener.png', '/assets/svg/diodes/zener.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(24, 13, 'Schottky Diode', 'schottky-diode', 'A metal-semiconductor diode often used for fast switching.', 'Schottky diodes typically have low charge storage compared with PN diodes. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', '/assets/images/diodes/schottky.png', '/assets/svg/diodes/schottky.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(25, 14, 'Red LED', 'red-led', 'A light-emitting diode for visible red light.', 'An LED emits light when forward current recombines carriers. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/diodes/red-led.png', '/assets/svg/diodes/led.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(26, 14, 'Infrared LED', 'infrared-led', 'An LED emitting infrared radiation.', 'Infrared LEDs are used in optical links and sensing. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/diodes/ir-led.png', '/assets/svg/diodes/led.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(27, 15, 'NPN BJT', 'npn-bjt', 'An NPN bipolar junction transistor.', 'A BJT uses base current to control collector current in common operating regions. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/transistors/npn.png', '/assets/svg/transistors/npn.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(28, 15, 'PNP BJT', 'pnp-bjt', 'A PNP bipolar junction transistor.', 'A PNP BJT uses opposite current/polarity conventions to an NPN device. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/transistors/pnp.png', '/assets/svg/transistors/pnp.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(29, 16, 'N-Channel Enhancement MOSFET', 'nmos-enhancement', 'A voltage-controlled n-channel transistor.', 'An enhancement MOSFET forms a conducting channel when gate drive is sufficient. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/transistors/nmos.png', '/assets/svg/transistors/nmos.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(30, 16, 'P-Channel Enhancement MOSFET', 'pmos-enhancement', 'A voltage-controlled p-channel transistor.', 'A PMOS device uses polarity conventions complementary to NMOS. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/transistors/pmos.png', '/assets/svg/transistors/pmos.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(31, 17, 'Inverting Amplifier', 'inverting-amplifier', 'An op-amp configuration with inverted output polarity.', 'The input signal is applied through an input resistor to the inverting node. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/inverting.png', '/assets/svg/opamps/inverting.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(32, 17, 'Non-Inverting Amplifier', 'non-inverting-amplifier', 'An op-amp configuration with non-inverted output.', 'The signal is applied to the non-inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/non-inverting.png', '/assets/svg/opamps/non-inverting.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(33, 17, 'Voltage Follower', 'voltage-follower', 'A unity-gain buffer using an op-amp.', 'The output is fed back directly to the inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/opamps/follower.png', '/assets/svg/opamps/follower.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(34, 18, 'Linear Voltage Regulator', 'linear-voltage-regulator', 'Maintains an approximately constant output voltage.', 'A linear regulator controls a pass element to regulate output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/regulators/linear.png', '/assets/svg/regulators/linear.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(35, 18, 'Buck Converter', 'buck-converter', 'A switching regulator that steps down DC voltage.', 'A buck converter uses a switch, inductor, diode or synchronous switch, and capacitor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/regulators/buck.png', '/assets/svg/regulators/buck.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(36, 19, 'Analog Temperature Sensor', 'analog-temperature-sensor', 'A temperature sensor with an analog output.', 'The output voltage/current represents temperature according to its transfer function. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/sensors/analog-temperature.png', '/assets/svg/sensors/temperature-sensor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(37, 19, 'Digital Temperature Sensor', 'digital-temperature-sensor', 'A temperature sensor with a digital interface.', 'The sensor converts temperature internally and communicates over a digital bus. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/sensors/digital-temperature.png', '/assets/svg/sensors/temperature-sensor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(38, 20, 'Successive Approximation ADC', 'sar-adc', 'An ADC using binary search over the input range.', 'A SAR ADC compares the input against DAC-generated trial levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/adcs/sar-adc.png', '/assets/svg/adcs/sar-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(39, 20, 'Flash ADC', 'flash-adc', 'A high-speed ADC using parallel comparators.', 'A resistor ladder creates thresholds for multiple comparators. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/adcs/flash-adc.png', '/assets/svg/adcs/flash-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(40, 21, 'EEPROM', 'eeprom', 'Non-volatile electrically erasable memory.', 'EEPROM retains stored data without power and supports electrical writes. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/memory/eeprom.png', '/assets/svg/memory/eeprom-block.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(41, 21, 'SRAM', 'sram', 'Volatile memory with static storage cells.', 'SRAM stores bits in bistable circuits while powered. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/memory/sram.png', '/assets/svg/memory/memory-block.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(42, 22, 'Electromagnetic Relay', 'electromagnetic-relay', 'A coil-operated mechanical switch.', 'Coil current creates a magnetic field that moves contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/relays/relay.png', '/assets/svg/relays/spdt-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(43, 22, 'Solid-State Relay', 'solid-state-relay', 'An electronically switched relay.', 'Semiconductor devices switch the load without mechanical contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/relays/ssr.png', '/assets/svg/relays/solid-state-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(44, 23, 'Brushed DC Motor', 'brushed-dc-motor', 'A motor using brushes and a commutator.', 'Armature current interacts with a magnetic field to create torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/motors/brushed-dc.png', '/assets/svg/motors/dc-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(45, 23, 'DC Gear Motor', 'dc-gear-motor', 'A DC motor combined with a reduction gearbox.', 'The gearbox trades speed for increased output torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/motors/dc-gear.png', '/assets/svg/motors/dc-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(46, 6, 'Mod-5 Counter', 'mod5-counter', 'A counter with five valid states.', 'A modulo-5 counter cycles through five states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/mod5-counter.png', '/assets/svg/components/mod5-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(47, 6, 'Mod-6 Counter', 'mod6-counter', 'A counter with six valid states.', 'A modulo-6 counter cycles through six states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/mod6-counter.png', '/assets/svg/components/mod6-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(48, 6, 'Mod-10 Synchronous Counter', 'mod10-synchronous-counter', 'A synchronous decade counter.', 'All state flip-flops share a common clock. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/mod10-synchronous-counter.png', '/assets/svg/components/mod10-synchronous-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(49, 6, 'BCD Counter', 'bcd-counter', 'A counter that cycles through BCD digits.', 'A BCD counter represents decimal digits using four binary bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/bcd-counter.png', '/assets/svg/components/bcd-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(50, 6, 'Johnson Counter', 'johnson-counter', 'A twisted-ring shift counter.', 'A Johnson counter feeds the inverted final stage back to the first stage. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/johnson-counter.png', '/assets/svg/components/johnson-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(51, 6, 'Ring Counter', 'ring-counter', 'A shift-register counter with circulating state.', 'A ring counter circulates a one-hot pattern through its stages. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/ring-counter.png', '/assets/svg/components/ring-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(52, 6, 'Up-Down Counter', 'up-down-counter', 'A counter supporting increment and decrement.', 'Direction logic selects the next count state. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/up-down-counter.png', '/assets/svg/components/up-down-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(53, 6, 'Asynchronous Binary Counter', 'asynchronous-binary-counter', 'A counter with cascaded clocking stages.', 'Later stages are triggered by preceding stages. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/asynchronous-binary-counter.png', '/assets/svg/components/asynchronous-binary-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(54, 6, 'Synchronous Binary Counter', 'synchronous-binary-counter', 'A counter whose stages share a clock.', 'All state bits receive the same clock signal. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/synchronous-binary-counter.png', '/assets/svg/components/synchronous-binary-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(55, 6, 'Programmable Modulo Counter', 'programmable-modulo-counter', 'A counter with a configurable terminal count.', 'A programmable comparator determines the wrap state. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', '/assets/images/6/programmable-modulo-counter.png', '/assets/svg/components/programmable-modulo-counter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(56, 7, 'Gated SR Latch', 'gated-sr-latch', 'An SR latch controlled by an enable input.', 'The enable signal determines when S and R can affect the stored state. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/7/gated-sr-latch.png', '/assets/svg/components/gated-sr-latch.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(57, 7, 'Active-Low SR Latch', 'active-low-sr-latch', 'An SR latch with active-low control inputs.', 'Control inputs are asserted at logic zero. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/7/active-low-sr-latch.png', '/assets/svg/components/active-low-sr-latch.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(61, 7, 'JK Latch', 'jk-latch', 'A level-sensitive JK storage element.', 'The latch responds while its enable level is active. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/7/jk-latch.png', '/assets/svg/components/jk-latch.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(62, 7, 'Toggle Latch', 'toggle-latch', 'A level-controlled storage element with toggle behavior.', 'A toggle control determines whether the stored state changes. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', '/assets/images/7/toggle-latch.png', '/assets/svg/components/toggle-latch.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(68, 8, 'Buffer Gate', 'buffer-gate', 'A non-inverting logic buffer.', 'The output follows the input logic level. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/buffer-gate.png', '/assets/svg/components/buffer-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(69, 8, 'Tri-State Buffer', 'tri-state-buffer', 'A buffer with high-impedance output state.', 'An enable input controls whether the output is driven. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/tri-state-buffer.png', '/assets/svg/components/tri-state-buffer.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(70, 8, 'Open-Collector Inverter', 'open-collector-inverter', 'An inverter with an open-collector output stage.', 'The output transistor can pull low and requires a pull-up. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/open-collector-inverter.png', '/assets/svg/components/open-collector-inverter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(71, 8, 'Schmitt Trigger Inverter', 'schmitt-trigger-inverter', 'An inverter with hysteresis.', 'Different switching thresholds improve noise immunity. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/schmitt-trigger-inverter.png', '/assets/svg/components/schmitt-trigger-inverter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(72, 8, 'Majority Gate', 'majority-gate', 'Output is high when most inputs are high.', 'A majority gate evaluates the majority of its Boolean inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/majority-gate.png', '/assets/svg/components/majority-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(73, 8, '2-Input AND-OR-Invert Gate', 'aoi21-gate', 'Combines AND and OR terms followed by inversion.', 'An AOI21 cell implements a compact compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/aoi21-gate.png', '/assets/svg/components/aoi21-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(74, 8, '2-Input OR-AND-Invert Gate', 'oai21-gate', 'Combines OR and AND terms followed by inversion.', 'An OAI21 cell implements a compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/oai21-gate.png', '/assets/svg/components/oai21-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(75, 8, 'Four-Input NAND Gate', 'four-input-nand-gate', 'A NAND gate with four inputs.', 'The output complements the conjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/four-input-nand-gate.png', '/assets/svg/components/four-input-nand-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(76, 8, 'Four-Input NOR Gate', 'four-input-nor-gate', 'A NOR gate with four inputs.', 'The output complements the disjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', '/assets/images/8/four-input-nor-gate.png', '/assets/svg/components/four-input-nor-gate.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(77, 9, '8-to-1 Multiplexer', 'mux-8-to-1', 'Selects one of eight data inputs.', 'Three select bits address one of eight inputs. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/9/mux-8-to-1.png', '/assets/svg/components/mux-8-to-1.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(78, 9, '16-to-1 Multiplexer', 'mux-16-to-1', 'Selects one of sixteen data inputs.', 'Four select bits address one of sixteen inputs. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/9/mux-16-to-1.png', '/assets/svg/components/mux-16-to-1.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(80, 9, 'Analog Multiplexer', 'analog-multiplexer', 'Routes one analog signal to a shared output.', 'A control code selects one analog channel. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/9/analog-multiplexer.png', '/assets/svg/components/analog-multiplexer.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(81, 9, 'Demultiplexer 1-to-4', 'demux-1-to-4', 'Routes one input to one of four outputs.', 'Select inputs determine which output receives the data. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/9/demux-1-to-4.png', '/assets/svg/components/demux-1-to-4.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(82, 9, 'Demultiplexer 1-to-8', 'demux-1-to-8', 'Routes one input to one of eight outputs.', 'Three select bits choose an output channel. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', '/assets/images/9/demux-1-to-8.png', '/assets/svg/components/demux-1-to-8.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(83, 10, '3-to-8 Decoder', 'decoder-3-to-8', 'Decodes a three-bit code to eight outputs.', 'Each input code selects one output line. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/decoder-3-to-8.png', '/assets/svg/components/decoder-3-to-8.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(84, 10, '4-to-16 Decoder', 'decoder-4-to-16', 'Decodes a four-bit code to sixteen outputs.', 'Four input bits identify one of sixteen output lines. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/decoder-4-to-16.png', '/assets/svg/components/decoder-4-to-16.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(85, 10, 'Priority Encoder 4-to-2', 'priority-encoder-4-to-2', 'Encodes the highest-priority active input.', 'Priority logic resolves multiple simultaneous asserted inputs. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/priority-encoder-4-to-2.png', '/assets/svg/components/priority-encoder-4-to-2.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(86, 10, 'Priority Encoder 8-to-3', 'priority-encoder-8-to-3', 'Encodes eight inputs into a three-bit code with priority.', 'Priority logic chooses one asserted input when several are active. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/priority-encoder-8-to-3.png', '/assets/svg/components/priority-encoder-8-to-3.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(87, 10, 'BCD-to-7-Segment Decoder', 'bcd-to-7-segment-decoder', 'Converts BCD digits to seven-segment control signals.', 'Combinational logic maps each decimal digit to segment patterns. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/bcd-to-7-segment-decoder.png', '/assets/svg/components/bcd-to-7-segment-decoder.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(88, 10, 'Binary-to-Gray Converter', 'binary-to-gray-converter', 'Converts binary code to Gray code.', 'Adjacent Gray-code values differ by one bit. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/binary-to-gray-converter.png', '/assets/svg/components/binary-to-gray-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(89, 10, 'Gray-to-Binary Converter', 'gray-to-binary-converter', 'Converts Gray code to binary.', 'Cumulative XOR operations recover the binary code. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/gray-to-binary-converter.png', '/assets/svg/components/gray-to-binary-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(90, 10, 'BCD-to-Binary Converter', 'bcd-to-binary-converter', 'Converts packed decimal digits to a binary number.', 'The decimal digit values are combined by place value. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/bcd-to-binary-converter.png', '/assets/svg/components/bcd-to-binary-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(91, 10, 'Binary-to-BCD Converter', 'binary-to-bcd-converter', 'Converts a binary number to decimal-coded digits.', 'Conversion logic produces one BCD nibble per decimal digit. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', '/assets/images/10/binary-to-bcd-converter.png', '/assets/svg/components/binary-to-bcd-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53');
INSERT INTO `components` (`component_id`, `category_id`, `name`, `slug`, `short_description`, `description`, `main_image_path`, `circuit_symbol_path`, `datasheet_url`, `is_illustrative`, `is_published`, `created_at`, `updated_at`) VALUES
(92, 11, 'Fast Recovery Diode', 'fast-recovery-diode', 'A diode optimized for short reverse-recovery time.', 'The device is designed to switch between conduction states quickly. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/fast-recovery-diode.png', '/assets/svg/components/fast-recovery-diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(93, 11, 'Bridge Rectifier', 'bridge-rectifier', 'A four-diode arrangement for full-wave rectification.', 'Two diodes conduct during each half-cycle. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/bridge-rectifier.png', '/assets/svg/components/bridge-rectifier.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(94, 11, 'Small-Signal Switching Diode', 'small-signal-switching-diode', 'A diode intended for low-current switching applications.', 'The junction switches between forward and reverse bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/small-signal-switching-diode.png', '/assets/svg/components/small-signal-switching-diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(95, 11, 'PIN Diode', 'pin-diode', 'A diode with an intrinsic region between P and N regions.', 'The intrinsic layer changes the device\'s RF resistance with bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/pin-diode.png', '/assets/svg/components/pin-diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(96, 11, 'Varactor Diode', 'varactor-diode', 'A voltage-variable junction capacitor.', 'Reverse bias changes the depletion-region width. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', '/assets/images/11/varactor-diode.png', '/assets/svg/components/varactor-diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(97, 12, '5.1 V Zener Diode', 'zener-5v1', 'A nominal 5.1 V Zener reference example.', 'The device operates in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/12/zener-5v1.png', '/assets/svg/components/zener-5v1.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(98, 12, '12 V Zener Diode', 'zener-12v', 'A nominal 12 V Zener reference example.', 'The device is used for clamping or simple reference circuits. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', '/assets/images/12/zener-12v.png', '/assets/svg/components/zener-12v.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(99, 13, 'Low-Barrier Schottky Diode', 'low-barrier-schottky-diode', 'A Schottky diode with a low forward voltage.', 'A metal-semiconductor barrier supports majority-carrier conduction. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', '/assets/images/13/low-barrier-schottky-diode.png', '/assets/svg/components/low-barrier-schottky-diode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(100, 14, 'Green LED', 'green-led', 'A visible green light-emitting diode.', 'Forward current produces light through carrier recombination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/green-led.png', '/assets/svg/components/green-led.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(101, 14, 'Blue LED', 'blue-led', 'A visible blue light-emitting diode.', 'A semiconductor junction emits blue light when forward biased. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/blue-led.png', '/assets/svg/components/blue-led.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(102, 14, 'White LED', 'white-led', 'A white-light LED, commonly phosphor-converted blue emission.', 'The LED package produces white illumination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/white-led.png', '/assets/svg/components/white-led.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(104, 14, 'Photodiode', 'photodiode', 'A light-sensitive semiconductor diode.', 'Incident photons generate charge carriers in the junction. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', '/assets/images/14/photodiode.png', '/assets/svg/components/photodiode.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(106, 15, 'Phototransistor', 'phototransistor', 'A transistor whose conduction is controlled by light.', 'Incident light generates base-equivalent photocurrent. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/phototransistor.png', '/assets/svg/components/phototransistor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(107, 15, 'Small-Signal NPN Transistor', 'small-signal-npn-transistor', 'An NPN transistor for low-current signal circuits.', 'Base drive controls collector current within operating limits. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/small-signal-npn-transistor.png', '/assets/svg/components/small-signal-npn-transistor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(108, 15, 'Power NPN Transistor', 'power-npn-transistor', 'An NPN transistor designed for higher power handling.', 'The transistor controls load current with suitable base drive. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', '/assets/images/15/power-npn-transistor.png', '/assets/svg/components/power-npn-transistor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(111, 16, 'Dual N-Channel MOSFET', 'dual-nmos', 'Two N-channel MOSFETs in one package.', 'The package contains two transistor channels. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', '/assets/images/16/dual-nmos.png', '/assets/svg/components/dual-nmos.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(113, 17, 'Summing Amplifier', 'summing-amplifier', 'An op-amp circuit that combines multiple inputs.', 'Input currents sum at the virtual-ground node under ideal assumptions. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/summing-amplifier.png', '/assets/svg/components/summing-amplifier.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(114, 17, 'Differential Amplifier', 'differential-amplifier', 'Amplifies the difference between two input voltages.', 'Matched resistor ratios determine common-mode rejection. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/differential-amplifier.png', '/assets/svg/components/differential-amplifier.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(115, 17, 'Integrator Op-Amp', 'opamp-integrator', 'An op-amp circuit whose output integrates its input.', 'A capacitor in the feedback path accumulates input current. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-integrator.png', '/assets/svg/components/opamp-integrator.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(116, 17, 'Differentiator Op-Amp', 'opamp-differentiator', 'An op-amp circuit whose output responds to input rate of change.', 'An input capacitor and feedback impedance create differentiation behavior. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-differentiator.png', '/assets/svg/components/opamp-differentiator.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(117, 17, 'Comparator Circuit', 'opamp-comparator-circuit', 'Compares two input voltages to produce a logic-like output.', 'The output changes according to which input is greater. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', '/assets/images/17/opamp-comparator-circuit.png', '/assets/svg/components/opamp-comparator-circuit.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(118, 18, 'Adjustable Linear Regulator', 'adjustable-linear-regulator', 'A regulator with a settable output voltage.', 'A feedback network sets the regulated output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/adjustable-linear-regulator.png', '/assets/svg/components/adjustable-linear-regulator.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(119, 18, 'Low-Dropout Regulator', 'low-dropout-regulator', 'A linear regulator designed for low input-output headroom.', 'A pass element and feedback regulate the output near the input voltage. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/low-dropout-regulator.png', '/assets/svg/components/low-dropout-regulator.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(120, 18, 'Boost Converter', 'boost-converter', 'A switching regulator that steps up DC voltage.', 'An inductor stores energy during one switch phase and releases it to the output during another. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/boost-converter.png', '/assets/svg/components/boost-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(121, 18, 'Buck-Boost Converter', 'buck-boost-converter', 'A switching converter that can step voltage up or down.', 'A switching power stage transfers energy through an inductor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/buck-boost-converter.png', '/assets/svg/components/buck-boost-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(122, 18, 'Charge Pump Voltage Converter', 'charge-pump-converter', 'A switched-capacitor voltage converter.', 'Capacitors are switched between phases to transfer charge. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', '/assets/images/18/charge-pump-converter.png', '/assets/svg/components/charge-pump-converter.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(123, 19, 'NTC Thermistor', 'ntc-thermistor', 'A resistor whose resistance decreases as temperature rises.', 'The semiconductor resistance has a negative temperature coefficient. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/ntc-thermistor.png', '/assets/svg/components/ntc-thermistor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(124, 19, 'PTC Thermistor', 'ptc-thermistor', 'A resistor whose resistance increases over a specified temperature region.', 'Resistance rises with temperature according to its material characteristic. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/ptc-thermistor.png', '/assets/svg/components/ptc-thermistor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(125, 19, 'Thermocouple', 'thermocouple', 'A temperature sensor based on two dissimilar conductors.', 'A temperature difference produces a small thermoelectric voltage. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/thermocouple.png', '/assets/svg/components/thermocouple.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(126, 19, 'RTD Sensor', 'rtd-sensor', 'A resistive temperature detector.', 'Metal resistance changes predictably with temperature. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/rtd-sensor.png', '/assets/svg/components/rtd-sensor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(127, 19, 'Digital Humidity Sensor', 'digital-humidity-sensor', 'A sensor that reports relative humidity digitally.', 'A sensing element and conversion circuitry produce digital measurements. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', '/assets/images/19/digital-humidity-sensor.png', '/assets/svg/components/digital-humidity-sensor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(128, 20, 'Dual-Slope ADC', 'dual-slope-adc', 'An ADC based on integrating and deintegrating an input.', 'An integrator accumulates input for a fixed interval and then measures return time. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/dual-slope-adc.png', '/assets/svg/components/dual-slope-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(129, 20, 'Pipeline ADC', 'pipeline-adc', 'A high-throughput ADC using cascaded conversion stages.', 'Each stage resolves part of the code and passes a residue onward. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/pipeline-adc.png', '/assets/svg/components/pipeline-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(130, 20, 'Sigma-Delta ADC', 'sigma-delta-adc', 'An oversampling ADC using noise shaping.', 'A modulator shapes quantization noise and digital filtering decimates the stream. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/sigma-delta-adc.png', '/assets/svg/components/sigma-delta-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(131, 20, '8-bit ADC', '8-bit-adc', 'An ADC with 256 possible output codes.', 'The converter quantizes the input range into 256 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/8-bit-adc.png', '/assets/svg/components/8-bit-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(132, 20, '12-bit ADC', '12-bit-adc', 'An ADC with 4096 possible output codes.', 'The converter quantizes the input range into 4096 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', '/assets/images/20/12-bit-adc.png', '/assets/svg/components/12-bit-adc.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(134, 21, 'NOR Flash', 'nor-flash', 'Flash memory with random-access read capability.', 'NOR array structure supports direct code reads. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/nor-flash.png', '/assets/svg/components/nor-flash.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(135, 21, 'NAND Flash', 'nand-flash', 'Dense non-volatile storage organized in pages and blocks.', 'NAND strings provide high storage density. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/nand-flash.png', '/assets/svg/components/nand-flash.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(136, 21, 'DRAM', 'dram', 'Volatile memory storing bits as charge in capacitors.', 'Stored charge leaks and must be periodically refreshed. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/dram.png', '/assets/svg/components/dram.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(137, 21, 'ROM', 'read-only-memory', 'Non-volatile memory for fixed data.', 'Stored bit patterns are read through address decoding. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/read-only-memory.png', '/assets/svg/components/read-only-memory.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(138, 21, 'FIFO Buffer Memory', 'fifo-buffer-memory', 'Memory that preserves first-in-first-out data order.', 'Read and write pointers track queue positions. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', '/assets/images/21/fifo-buffer-memory.png', '/assets/svg/components/fifo-buffer-memory.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(139, 22, 'SPST Relay', 'spst-relay', 'A single-pole single-throw relay.', 'One contact path is controlled by an energized coil. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/spst-relay.png', '/assets/svg/components/spst-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(140, 22, 'SPDT Relay', 'spdt-relay', 'A single-pole double-throw relay.', 'A common contact switches between normally closed and normally open contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/spdt-relay.png', '/assets/svg/components/spdt-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(141, 22, 'DPDT Relay', 'dpdt-relay', 'A double-pole double-throw relay.', 'Two changeover contact sets are mechanically linked. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/dpdt-relay.png', '/assets/svg/components/dpdt-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(142, 22, 'Reed Relay', 'reed-relay', 'A relay using sealed magnetic reed contacts.', 'A magnetic field closes or changes the reed contact state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/reed-relay.png', '/assets/svg/components/reed-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(143, 22, 'Latching Relay', 'latching-relay', 'A relay that retains its contact state without continuous coil power.', 'A pulse or set/reset coil mechanism changes the retained state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', '/assets/images/22/latching-relay.png', '/assets/svg/components/latching-relay.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(144, 23, 'Brushless DC Motor', 'brushless-dc-motor', 'A motor electronically commutated instead of using brushes.', 'An electronic controller energizes stator phases in sequence. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/brushless-dc-motor.png', '/assets/svg/components/brushless-dc-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(145, 23, 'Stepper Motor', 'stepper-motor', 'A motor that moves in discrete angular increments.', 'Sequential phase excitation advances the rotor between stable positions. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/stepper-motor.png', '/assets/svg/components/stepper-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(146, 23, 'Servo Motor', 'servo-motor', 'A motor used in a closed-loop position or speed system.', 'Feedback compares desired and measured motion. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/servo-motor.png', '/assets/svg/components/servo-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(147, 23, 'Permanent-Magnet DC Motor', 'permanent-magnet-dc-motor', 'A DC motor with permanent-magnet field excitation.', 'Armature current interacts with the fixed magnetic field. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', '/assets/images/23/permanent-magnet-dc-motor.png', '/assets/svg/components/permanent-magnet-dc-motor.svg', NULL, 1, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53');

--
-- Triggers `components`
--
DELIMITER $$
CREATE TRIGGER `trg_components_audit_ad` AFTER DELETE ON `components` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','DELETE',CAST(OLD.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),
     JSON_OBJECT('name',OLD.name,'category_id',OLD.category_id,'short_description',OLD.short_description),NULL);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_audit_ai` AFTER INSERT ON `components` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','INSERT',CAST(NEW.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),NULL,
     JSON_OBJECT('name',NEW.name,'category_id',NEW.category_id,'short_description',NEW.short_description));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_audit_au` AFTER UPDATE ON `components` FOR EACH ROW BEGIN
  INSERT INTO application_audit_log
    (table_name,operation_type,row_key,changed_at,db_user,old_values,new_values)
  VALUES
    ('components','UPDATE',CAST(NEW.component_id AS CHAR),CURRENT_TIMESTAMP,CURRENT_USER(),
     JSON_OBJECT('name',OLD.name,'category_id',OLD.category_id,'short_description',OLD.short_description),
     JSON_OBJECT('name',NEW.name,'category_id',NEW.category_id,'short_description',NEW.short_description));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_restricted_bd` BEFORE DELETE ON `components` FOR EACH ROW BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component deletes are disabled on Monday from 2 PM to 4 PM';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_restricted_bi` BEFORE INSERT ON `components` FOR EACH ROW BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component inserts are disabled on Monday from 2 PM to 4 PM';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_restricted_bu` BEFORE UPDATE ON `components` FOR EACH ROW BEGIN
  IF DAYOFWEEK(CURRENT_TIMESTAMP)=2 AND TIME(CURRENT_TIMESTAMP)>='14:00:00'
     AND TIME(CURRENT_TIMESTAMP)<'16:00:00' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Component updates are disabled on Monday from 2 PM to 4 PM';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_uppercase_bi` BEFORE INSERT ON `components` FOR EACH ROW BEGIN
  SET NEW.name=UPPER(TRIM(NEW.name));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_uppercase_bu` BEFORE UPDATE ON `components` FOR EACH ROW BEGIN
  SET NEW.name=UPPER(TRIM(NEW.name));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_validate_bi` BEFORE INSERT ON `components` FOR EACH ROW BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name))=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description)>1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_components_validate_bu` BEFORE UPDATE ON `components` FOR EACH ROW BEGIN
  IF NEW.name IS NULL OR CHAR_LENGTH(TRIM(NEW.name))=0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Component name cannot be blank';
  END IF;
  IF NEW.short_description IS NOT NULL AND CHAR_LENGTH(NEW.short_description)>1000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Short description exceeds 1000 characters';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `component_content`
--

CREATE TABLE `component_content` (
  `component_content_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `content_type_id` bigint(20) UNSIGNED NOT NULL,
  `section_key` varchar(80) NOT NULL,
  `title` varchar(180) NOT NULL,
  `content` longtext NOT NULL,
  `alt_text` varchar(500) DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `component_content`
--

INSERT INTO `component_content` (`component_content_id`, `component_id`, `content_type_id`, `section_key`, `title`, `content`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'overview', 'Overview', 'A decade counter has ten valid states represented by four bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(2, 2, 1, 'overview', 'Overview', 'A modulo-8 counter uses three state bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(3, 3, 1, 'overview', 'Overview', 'A modulo-8 down counter cycles through eight binary states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(4, 4, 1, 'overview', 'Overview', 'Binary counters represent integer states using flip-flops. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(5, 5, 1, 'overview', 'Overview', 'Each stage is clocked by a preceding stage output. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(6, 6, 1, 'overview', 'Overview', 'The SR element stores one bit using set and reset inputs. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(7, 7, 1, 'overview', 'Overview', 'The JK flip-flop is a clocked sequential element. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(8, 8, 1, 'overview', 'Overview', 'The D flip-flop stores the input value at the active clock edge. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(9, 9, 1, 'overview', 'Overview', 'The T flip-flop either holds or toggles its state. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(11, 11, 1, 'overview', 'Overview', 'The AND gate implements logical conjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(12, 12, 1, 'overview', 'Overview', 'The OR gate implements logical disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(13, 13, 1, 'overview', 'Overview', 'The NOT gate produces the complement of its input. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(14, 14, 1, 'overview', 'Overview', 'NAND is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(15, 15, 1, 'overview', 'Overview', 'NOR is functionally complete when combined appropriately. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(16, 16, 1, 'overview', 'Overview', 'XOR implements exclusive disjunction. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(17, 17, 1, 'overview', 'Overview', 'XNOR is the complement of XOR. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(18, 18, 1, 'overview', 'Overview', 'A 2:1 multiplexer routes one data input to the output. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(19, 19, 1, 'overview', 'Overview', 'A 4:1 multiplexer uses two select lines. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(20, 20, 1, 'overview', 'Overview', 'A decoder converts an input code to one-of-N outputs. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(21, 21, 1, 'overview', 'Overview', 'A simple encoder assumes a valid one-hot input unless priority logic is specified. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(22, 22, 1, 'overview', 'Overview', 'A PN junction conducts primarily under forward bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(23, 23, 1, 'overview', 'Overview', 'A Zener diode is operated in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(24, 24, 1, 'overview', 'Overview', 'Schottky diodes typically have low charge storage compared with PN diodes. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(25, 25, 1, 'overview', 'Overview', 'An LED emits light when forward current recombines carriers. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(26, 26, 1, 'overview', 'Overview', 'Infrared LEDs are used in optical links and sensing. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(27, 27, 1, 'overview', 'Overview', 'A BJT uses base current to control collector current in common operating regions. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(28, 28, 1, 'overview', 'Overview', 'A PNP BJT uses opposite current/polarity conventions to an NPN device. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(29, 29, 1, 'overview', 'Overview', 'An enhancement MOSFET forms a conducting channel when gate drive is sufficient. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(30, 30, 1, 'overview', 'Overview', 'A PMOS device uses polarity conventions complementary to NMOS. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(31, 31, 1, 'overview', 'Overview', 'The input signal is applied through an input resistor to the inverting node. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(32, 32, 1, 'overview', 'Overview', 'The signal is applied to the non-inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(33, 33, 1, 'overview', 'Overview', 'The output is fed back directly to the inverting input. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(34, 34, 1, 'overview', 'Overview', 'A linear regulator controls a pass element to regulate output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(35, 35, 1, 'overview', 'Overview', 'A buck converter uses a switch, inductor, diode or synchronous switch, and capacitor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(36, 36, 1, 'overview', 'Overview', 'The output voltage/current represents temperature according to its transfer function. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(37, 37, 1, 'overview', 'Overview', 'The sensor converts temperature internally and communicates over a digital bus. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(38, 38, 1, 'overview', 'Overview', 'A SAR ADC compares the input against DAC-generated trial levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(39, 39, 1, 'overview', 'Overview', 'A resistor ladder creates thresholds for multiple comparators. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(40, 40, 1, 'overview', 'Overview', 'EEPROM retains stored data without power and supports electrical writes. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(41, 41, 1, 'overview', 'Overview', 'SRAM stores bits in bistable circuits while powered. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(42, 42, 1, 'overview', 'Overview', 'Coil current creates a magnetic field that moves contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(43, 43, 1, 'overview', 'Overview', 'Semiconductor devices switch the load without mechanical contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(44, 44, 1, 'overview', 'Overview', 'Armature current interacts with a magnetic field to create torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(45, 45, 1, 'overview', 'Overview', 'The gearbox trades speed for increased output torque. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(46, 46, 1, 'overview', 'Overview', 'A modulo-5 counter cycles through five states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(47, 47, 1, 'overview', 'Overview', 'A modulo-6 counter cycles through six states. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(48, 48, 1, 'overview', 'Overview', 'All state flip-flops share a common clock. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(49, 49, 1, 'overview', 'Overview', 'A BCD counter represents decimal digits using four binary bits. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(50, 50, 1, 'overview', 'Overview', 'A Johnson counter feeds the inverted final stage back to the first stage. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(51, 51, 1, 'overview', 'Overview', 'A ring counter circulates a one-hot pattern through its stages. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(52, 52, 1, 'overview', 'Overview', 'Direction logic selects the next count state. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(53, 53, 1, 'overview', 'Overview', 'Later stages are triggered by preceding stages. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(54, 54, 1, 'overview', 'Overview', 'All state bits receive the same clock signal. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(55, 55, 1, 'overview', 'Overview', 'A programmable comparator determines the wrap state. An N-state counter advances through its defined sequence on the active clock event and wraps or reloads at its terminal condition. Its modulus and state width determine sequence capacity; direction, reset or load controls, and synchronous versus ripple clocking determine transition behavior. Maximum clock rate and reset timing depend on the selected implementation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(56, 56, 1, 'overview', 'Overview', 'The enable signal determines when S and R can affect the stored state. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(57, 57, 1, 'overview', 'Overview', 'Control inputs are asserted at logic zero. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(61, 61, 1, 'overview', 'Overview', 'The latch responds while its enable level is active. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(62, 62, 1, 'overview', 'Overview', 'A toggle control determines whether the stored state changes. During normal operation, the next output state is determined by the input combination and the active clock edge or enable level. Preset and clear, when provided, may override that behavior with device-specific active polarity. Setup time, hold time, and propagation delay are electrical limits specified for the selected part.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(68, 68, 1, 'overview', 'Overview', 'The output follows the input logic level. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(69, 69, 1, 'overview', 'Overview', 'An enable input controls whether the output is driven. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(70, 70, 1, 'overview', 'Overview', 'The output transistor can pull low and requires a pull-up. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(71, 71, 1, 'overview', 'Overview', 'Different switching thresholds improve noise immunity. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(72, 72, 1, 'overview', 'Overview', 'A majority gate evaluates the majority of its Boolean inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(73, 73, 1, 'overview', 'Overview', 'An AOI21 cell implements a compact compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(74, 74, 1, 'overview', 'Overview', 'An OAI21 cell implements a compound logic function. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(75, 75, 1, 'overview', 'Overview', 'The output complements the conjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(76, 76, 1, 'overview', 'Overview', 'The output complements the disjunction of four inputs. The Boolean function defines the ideal logic behavior; a physical implementation also has logic-level thresholds, propagation delay, fan-in limits, and output-drive limits. Multi-input and compound variants should be evaluated against their exact truth table and device datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(77, 77, 1, 'overview', 'Overview', 'Three select bits address one of eight inputs. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(78, 78, 1, 'overview', 'Overview', 'Four select bits address one of sixteen inputs. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(80, 80, 1, 'overview', 'Overview', 'A control code selects one analog channel. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(81, 81, 1, 'overview', 'Overview', 'Select inputs determine which output receives the data. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(82, 82, 1, 'overview', 'Overview', 'Three select bits choose an output channel. The number of data channels and select lines determines the selection capacity. Select inputs determine the routed channel; an enable input, when present, qualifies the connection and defines its inactive behavior. For analog switches, also check signal range, on-resistance, leakage, bandwidth, and charge injection. Digital multiplexers must meet logic-threshold and timing requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(83, 83, 1, 'overview', 'Overview', 'Each input code selects one output line. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(84, 84, 1, 'overview', 'Overview', 'Four input bits identify one of sixteen output lines. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(85, 85, 1, 'overview', 'Overview', 'Priority logic resolves multiple simultaneous asserted inputs. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(86, 86, 1, 'overview', 'Overview', 'Priority logic chooses one asserted input when several are active. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(87, 87, 1, 'overview', 'Overview', 'Combinational logic maps each decimal digit to segment patterns. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(88, 88, 1, 'overview', 'Overview', 'Adjacent Gray-code values differ by one bit. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(89, 89, 1, 'overview', 'Overview', 'Cumulative XOR operations recover the binary code. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(90, 90, 1, 'overview', 'Overview', 'The decimal digit values are combined by place value. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(91, 91, 1, 'overview', 'Overview', 'Conversion logic produces one BCD nibble per decimal digit. The input code maps to an output code or one-of-N output lines. Truth tables define valid input combinations, output coding, and active-high or active-low conventions. A priority encoder resolves simultaneous requests according to its priority order; a simple encoder may require one-hot inputs, while decoders and code converters follow their specified mappings. Enable and invalid-code behavior depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(92, 92, 1, 'overview', 'Overview', 'The device is designed to switch between conduction states quickly. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(93, 93, 1, 'overview', 'Overview', 'Two diodes conduct during each half-cycle. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(94, 94, 1, 'overview', 'Overview', 'The junction switches between forward and reverse bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(95, 95, 1, 'overview', 'Overview', 'The intrinsic layer changes the device\'s RF resistance with bias. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(96, 96, 1, 'overview', 'Overview', 'Reverse bias changes the depletion-region width. Selection and sizing should account for forward-current rating, reverse-voltage rating, forward voltage, power dissipation, switching behavior, and thermal conditions. Values vary by part number and must be confirmed in the component datasheet.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(97, 97, 1, 'overview', 'Overview', 'The device operates in its specified reverse-breakdown region. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(98, 98, 1, 'overview', 'Overview', 'The device is used for clamping or simple reference circuits. A Zener diode is normally used with a current-limiting element and within its specified reverse-current and power limits. Regulation accuracy depends on Zener voltage tolerance, dynamic resistance, operating current, temperature, and load variation.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(99, 99, 1, 'overview', 'Overview', 'A metal-semiconductor barrier supports majority-carrier conduction. Schottky devices are commonly considered where low forward drop or fast switching is useful. Reverse leakage, reverse-voltage rating, surge current, and thermal limits remain important selection criteria and vary across part numbers.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(100, 100, 1, 'overview', 'Overview', 'Forward current produces light through carrier recombination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(101, 101, 1, 'overview', 'Overview', 'A semiconductor junction emits blue light when forward biased. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(102, 102, 1, 'overview', 'Overview', 'The LED package produces white illumination. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(104, 104, 1, 'overview', 'Overview', 'Incident photons generate charge carriers in the junction. LED operation requires current control, either through a suitable series resistor or a regulated driver. Forward voltage, luminous intensity, viewing angle, wavelength, reverse rating, and thermal limits are part-specific.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(106, 106, 1, 'overview', 'Overview', 'Incident light generates base-equivalent photocurrent. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(107, 107, 1, 'overview', 'Overview', 'Base drive controls collector current within operating limits. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(108, 108, 1, 'overview', 'Overview', 'The transistor controls load current with suitable base drive. BJT selection depends on polarity, collector-emitter voltage, collector current, gain range, saturation voltage, switching speed, and power dissipation. Base-drive and bias networks must be designed for the intended operating region.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(111, 111, 1, 'overview', 'Overview', 'The package contains two transistor channels. MOSFET selection should consider drain-source voltage, continuous and pulsed current, on-resistance at the available gate drive, gate charge, switching losses, safe operating area, and thermal resistance. Threshold voltage alone does not guarantee low on-resistance.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(113, 113, 1, 'overview', 'Overview', 'Input currents sum at the virtual-ground node under ideal assumptions. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(114, 114, 1, 'overview', 'Overview', 'Matched resistor ratios determine common-mode rejection. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(115, 115, 1, 'overview', 'Overview', 'A capacitor in the feedback path accumulates input current. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(116, 116, 1, 'overview', 'Overview', 'An input capacitor and feedback impedance create differentiation behavior. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(117, 117, 1, 'overview', 'Overview', 'The output changes according to which input is greater. The circuit configuration determines the relationship between input and output signals. Practical design should consider supply rails, input common-mode range, output swing, gain-bandwidth product, slew rate, offset, stability, and load requirements.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(118, 118, 1, 'overview', 'Overview', 'A feedback network sets the regulated output. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(119, 119, 1, 'overview', 'Overview', 'A pass element and feedback regulate the output near the input voltage. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(120, 120, 1, 'overview', 'Overview', 'An inductor stores energy during one switch phase and releases it to the output during another. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(121, 121, 1, 'overview', 'Overview', 'A switching power stage transfers energy through an inductor. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(122, 122, 1, 'overview', 'Overview', 'Capacitors are switched between phases to transfer charge. A regulator is selected by its input range, output voltage, load current, dropout or conversion efficiency, ripple, transient response, thermal dissipation, and protection features. Confirm these limits for the exact regulator and application circuit.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(123, 123, 1, 'overview', 'Overview', 'The semiconductor resistance has a negative temperature coefficient. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53');
INSERT INTO `component_content` (`component_content_id`, `component_id`, `content_type_id`, `section_key`, `title`, `content`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(124, 124, 1, 'overview', 'Overview', 'Resistance rises with temperature according to its material characteristic. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(125, 125, 1, 'overview', 'Overview', 'A temperature difference produces a small thermoelectric voltage. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(126, 126, 1, 'overview', 'Overview', 'Metal resistance changes predictably with temperature. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(127, 127, 1, 'overview', 'Overview', 'A sensing element and conversion circuitry produce digital measurements. Sensor performance is described by measurement range, accuracy, sensitivity, response time, calibration, and environmental constraints. Interface circuitry and conversion from the sensor output to engineering units depend on the specific device.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(128, 128, 1, 'overview', 'Overview', 'An integrator accumulates input for a fixed interval and then measures return time. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(129, 129, 1, 'overview', 'Overview', 'Each stage resolves part of the code and passes a residue onward. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(130, 130, 1, 'overview', 'Overview', 'A modulator shapes quantization noise and digital filtering decimates the stream. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(131, 131, 1, 'overview', 'Overview', 'The converter quantizes the input range into 256 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(132, 132, 1, 'overview', 'Overview', 'The converter quantizes the input range into 4096 levels. ADC performance depends on resolution, input range, sampling rate, reference accuracy, input bandwidth, conversion latency, and interface format. Resolution in bits does not by itself guarantee equivalent absolute accuracy.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(134, 134, 1, 'overview', 'Overview', 'NOR array structure supports direct code reads. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(135, 135, 1, 'overview', 'Overview', 'NAND strings provide high storage density. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(136, 136, 1, 'overview', 'Overview', 'Stored charge leaks and must be periodically refreshed. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(137, 137, 1, 'overview', 'Overview', 'Stored bit patterns are read through address decoding. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(138, 138, 1, 'overview', 'Overview', 'Read and write pointers track queue positions. Memory devices are characterized by capacity, organization, access time, interface, write endurance or retention where applicable, and power requirements. Volatile and non-volatile technologies have different data-retention and write constraints.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(139, 139, 1, 'overview', 'Overview', 'One contact path is controlled by an energized coil. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(140, 140, 1, 'overview', 'Overview', 'A common contact switches between normally closed and normally open contacts. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(141, 141, 1, 'overview', 'Overview', 'Two changeover contact sets are mechanically linked. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(142, 142, 1, 'overview', 'Overview', 'A magnetic field closes or changes the reed contact state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(143, 143, 1, 'overview', 'Overview', 'A pulse or set/reset coil mechanism changes the retained state. Relay selection depends on coil voltage and current, contact arrangement, contact voltage/current ratings, switching load type, isolation, operating time, and mechanical/electrical life. Inductive loads may require suppression across the coil or load.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(144, 144, 1, 'overview', 'Overview', 'An electronic controller energizes stator phases in sequence. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(145, 145, 1, 'overview', 'Overview', 'Sequential phase excitation advances the rotor between stable positions. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(146, 146, 1, 'overview', 'Overview', 'Feedback compares desired and measured motion. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(147, 147, 1, 'overview', 'Overview', 'Armature current interacts with the fixed magnetic field. Motor operation depends on rated voltage, load torque, speed, current, mechanical mounting, and thermal limits. Reversing direction or controlling speed requires a suitable driver and protection against inductive transients.', NULL, NULL, 1, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(256, 1, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(257, 2, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"000\",\"001\"],[\"001\",\"010\"],[\"010\",\"011\"],[\"011\",\"100\"],[\"100\",\"101\"],[\"101\",\"110\"],[\"110\",\"111\"],[\"111\",\"000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(258, 3, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"000\",\"111\"],[\"001\",\"000\"],[\"010\",\"001\"],[\"011\",\"010\"],[\"100\",\"011\"],[\"101\",\"100\"],[\"110\",\"101\"],[\"111\",\"110\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(259, 4, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"1010\"],[\"1010\",\"1011\"],[\"1011\",\"1100\"],[\"1100\",\"1101\"],[\"1101\",\"1110\"],[\"1110\",\"1111\"],[\"1111\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(260, 5, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"1010\"],[\"1010\",\"1011\"],[\"1011\",\"1100\"],[\"1100\",\"1101\"],[\"1101\",\"1110\"],[\"1110\",\"1111\"],[\"1111\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(261, 46, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"000\",\"001\"],[\"001\",\"010\"],[\"010\",\"011\"],[\"011\",\"100\"],[\"100\",\"000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(262, 47, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"000\",\"001\"],[\"001\",\"010\"],[\"010\",\"011\"],[\"011\",\"100\"],[\"100\",\"101\"],[\"101\",\"000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(263, 48, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(264, 49, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(265, 50, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0011\"],[\"0011\",\"0111\"],[\"0111\",\"1111\"],[\"1111\",\"1110\"],[\"1110\",\"1100\"],[\"1100\",\"1000\"],[\"1000\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Four-stage model; only the initialized valid cycle is shown.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(266, 51, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0001\",\"0010\"],[\"0010\",\"0100\"],[\"0100\",\"1000\"],[\"1000\",\"0001\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Four-stage model; only the initialized valid cycle is shown.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(267, 52, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next (UP)\",\"Next (DOWN)\"],\"rows\":[[\"0000\",\"0001\",\"1111\"],[\"0001\",\"0010\",\"0000\"],[\"0010\",\"0011\",\"0001\"],[\"0011\",\"0100\",\"0010\"],[\"0100\",\"0101\",\"0011\"],[\"0101\",\"0110\",\"0100\"],[\"0110\",\"0111\",\"0101\"],[\"0111\",\"1000\",\"0110\"],[\"1000\",\"1001\",\"0111\"],[\"1001\",\"1010\",\"1000\"],[\"1010\",\"1011\",\"1001\"],[\"1011\",\"1100\",\"1010\"],[\"1100\",\"1101\",\"1011\"],[\"1101\",\"1110\",\"1100\"],[\"1110\",\"1111\",\"1101\"],[\"1111\",\"0000\",\"1110\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(268, 53, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"1010\"],[\"1010\",\"1011\"],[\"1011\",\"1100\"],[\"1100\",\"1101\"],[\"1101\",\"1110\"],[\"1110\",\"1111\"],[\"1111\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(269, 54, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"1010\"],[\"1010\",\"1011\"],[\"1011\",\"1100\"],[\"1100\",\"1101\"],[\"1101\",\"1110\"],[\"1110\",\"1111\"],[\"1111\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16).', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(270, 55, 3, 'state_table', 'State / Next-State Table', '{\"columns\":[\"Current state\",\"Next state\"],\"rows\":[[\"0000\",\"0001\"],[\"0001\",\"0010\"],[\"0010\",\"0011\"],[\"0011\",\"0100\"],[\"0100\",\"0101\"],[\"0101\",\"0110\"],[\"0110\",\"0111\"],[\"0111\",\"1000\"],[\"1000\",\"1001\"],[\"1001\",\"1010\"],[\"1010\",\"1011\"],[\"1011\",\"1100\"],[\"1100\",\"1101\"],[\"1101\",\"1110\"],[\"1110\",\"1111\"],[\"1111\",\"0000\"]]}', NULL, 'Advances on each active clock event, with reset inactive. Illustrative four-bit model (modulus 16). Programmed modulus M = 16; load inactive.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(271, 6, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"S\",\"R\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"\\\\(Q_n\\\\)\",\"Hold\"],[0,1,0,\"Reset\"],[1,0,1,\"Set\"],[1,1,\"X\",\"Invalid\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(272, 7, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"J\",\"K\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"\\\\(Q_n\\\\)\",\"Hold\"],[0,1,0,\"Reset\"],[1,0,1,\"Set\"],[1,1,\"\\\\(\\\\overline{Q_n}\\\\)\",\"Toggle\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(273, 8, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"D\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"Reset\"],[1,1,\"Set\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(274, 9, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"T\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,\"\\\\(Q_n\\\\)\",\"Hold\"],[1,\"\\\\(\\\\overline{Q_n}\\\\)\",\"Toggle\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(276, 56, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"S\",\"R\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"\\\\(Q_n\\\\)\",\"Hold\"],[0,1,0,\"Reset\"],[1,0,1,\"Set\"],[1,1,\"X\",\"Invalid\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(277, 57, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"S̅\",\"R̅\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"X\",\"Invalid\"],[0,1,1,\"Set\"],[1,0,0,\"Reset\"],[1,1,\"\\\\(Q_n\\\\)\",\"Hold\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(281, 61, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"J\",\"K\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,0,\"\\\\(Q_n\\\\)\",\"Hold\"],[0,1,0,\"Reset\"],[1,0,1,\"Set\"],[1,1,\"\\\\(\\\\overline{Q_n}\\\\)\",\"Toggle\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(282, 62, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"T\",\"Q(n+1)\",\"Operation\"],\"rows\":[[0,\"\\\\(Q_n\\\\)\",\"Hold\"],[1,\"\\\\(\\\\overline{Q_n}\\\\)\",\"Toggle\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(302, 6, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"S\",\"R\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,\"X\"],[1,1,1,\"X\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(303, 7, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"J\",\"K\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(304, 8, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"D\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0],[0,1,0],[1,0,1],[1,1,1]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(305, 9, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"T\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(307, 56, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"S\",\"R\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,\"X\"],[1,1,1,\"X\"]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(308, 57, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"S̅\",\"R̅\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0,\"X\"],[0,0,1,\"X\"],[0,1,0,1],[0,1,1,1],[1,0,0,0],[1,0,1,0],[1,1,0,0],[1,1,1,1]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(312, 61, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"J\",\"K\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0,0],[0,0,1,1],[0,1,0,0],[0,1,1,0],[1,0,0,1],[1,0,1,1],[1,1,0,1],[1,1,1,0]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(313, 62, 3, 'characteristic_table', 'Characteristic Table', '{\"columns\":[\"T\",\"Q(n)\",\"Q(n+1)\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 'Single storage element with asynchronous preset/clear inactive. Clocked devices are evaluated at the active edge; latches while enabled. Multi-element devices repeat this function independently. X denotes an invalid SR input combination.', 4, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(333, 6, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=S+\\overline{R}Q\\quad\\text{(valid states only)}', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(334, 7, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=J\\overline{Q}+\\overline{K}Q', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(335, 8, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=D', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(336, 9, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=T\\overline{Q}+\\overline{T}Q', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(338, 56, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=f(inputs,Q)', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(339, 57, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=f(inputs,Q)', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(343, 61, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=f(inputs,Q)', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(344, 62, 4, 'characteristic_equation', 'Characteristic Equation', 'Q_{next}=f(inputs,Q)', NULL, 'Stored as LaTeX source for frontend rendering.', 5, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(364, 6, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"S\",\"R\"],\"rows\":[[0,0,0,\"X\"],[0,1,1,0],[1,0,0,1],[1,1,\"X\",0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(365, 7, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"J\",\"K\"],\"rows\":[[0,0,0,\"X\"],[0,1,1,\"X\"],[1,0,\"X\",1],[1,1,\"X\",0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(366, 8, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"D\"],\"rows\":[[0,0,0],[0,1,1],[1,0,0],[1,1,1]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(367, 9, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"T\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(369, 56, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"S\",\"R\"],\"rows\":[[0,0,0,\"X\"],[0,1,1,0],[1,0,0,1],[1,1,\"X\",0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(370, 57, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"S̅\",\"R̅\"],\"rows\":[[0,0,1,\"X\"],[0,1,0,1],[1,0,1,0],[1,1,\"X\",1]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(374, 61, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"J\",\"K\"],\"rows\":[[0,0,0,\"X\"],[0,1,1,\"X\"],[1,0,\"X\",1],[1,1,\"X\",0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(375, 62, 3, 'excitation_table', 'Excitation Table', '{\"columns\":[\"Q(n)\",\"Q(n+1)\",\"T\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, 'X means don’t care. Controls are inactive; latch enable is asserted where applicable.', 6, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(395, 11, 4, 'boolean_equation', 'Boolean Equation', 'Y=A\\cdot B', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(396, 12, 4, 'boolean_equation', 'Boolean Equation', 'Y=A+B', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(397, 13, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{A}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(398, 14, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{A\\cdot B}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(399, 15, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{A+B}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(400, 16, 4, 'boolean_equation', 'Boolean Equation', 'Y=A\\oplus B', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(401, 17, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{A\\oplus B}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(402, 68, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(403, 69, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(404, 70, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(405, 71, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(406, 72, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(407, 73, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(408, 74, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(409, 75, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(410, 76, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(411, 18, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{S}D_0+SD_1', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(412, 19, 4, 'boolean_equation', 'Boolean Equation', 'Y=\\overline{S_1}\\overline{S_0}D_0+\\overline{S_1}S_0D_1+S_1\\overline{S_0}D_2+S_1S_0D_3', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(413, 77, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(414, 78, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(416, 80, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(417, 81, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(418, 82, 4, 'boolean_equation', 'Boolean Equation', 'Y=f(inputs)', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(446, 11, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,0],[0,1,0],[1,0,0],[1,1,1]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(447, 12, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,1]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(448, 13, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"Y\"],\"rows\":[[0,1],[1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(449, 14, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,1],[0,1,1],[1,0,1],[1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(450, 15, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,1],[0,1,0],[1,0,0],[1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(451, 16, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(452, 17, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"Y\"],\"rows\":[[0,0,1],[0,1,0],[1,0,0],[1,1,1]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(453, 18, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S0\",\"Y\"],\"rows\":[[0,\"I0\"],[1,\"I1\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(454, 19, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S1\",\"S0\",\"Y\"],\"rows\":[[0,0,\"I0\"],[0,1,\"I1\"],[1,0,\"I2\"],[1,1,\"I3\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(455, 20, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Input code\",\"Y0\",\"Y1\",\"Y2\",\"Y3\"],\"rows\":[[\"00\",1,0,0,0],[\"01\",0,1,0,0],[\"10\",0,0,1,0],[\"11\",0,0,0,1]]}', NULL, 'Enabled, active-high logical decoder; package output polarity may differ.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(456, 21, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Inputs D3…D0\",\"Output code\",\"Valid\"],\"rows\":[[\"1000\",\"11\",1],[\"0100\",\"10\",1],[\"0010\",\"01\",1],[\"0001\",\"00\",1],[\"0000\",\"X\",0]]}', NULL, 'One-hot active-high input required; multiple asserted inputs are invalid. Output is undefined when Valid = 0.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(503, 68, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"Y\"],\"rows\":[[0,0],[1,1]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(504, 69, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"OE\",\"Y\"],\"rows\":[[0,0,\"Z\"],[1,0,\"Z\"],[0,1,0],[1,1,1]]}', NULL, 'Active-high output enable. Z means high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(505, 70, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"Y\"],\"rows\":[[0,\"Z\"],[1,0]]}', NULL, 'Z is the released output; an external pull-up produces logic high.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(506, 71, 3, 'truth_table', 'Switching Table', '{\"columns\":[\"Input condition\",\"Y\"],\"rows\":[[\"Vin < VT−\",1],[\"VT− ≤ Vin ≤ VT+\",\"Previous output\"],[\"Vin > VT+\",0]]}', NULL, 'Hysteresis thresholds are device-specific.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(507, 72, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"C\",\"Y\"],\"rows\":[[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,1],[1,1,1,1]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(508, 73, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"C\",\"Y\"],\"rows\":[[0,0,0,1],[0,0,1,0],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(509, 74, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"C\",\"Y\"],\"rows\":[[0,0,0,1],[0,0,1,1],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,1],[1,1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(510, 75, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"C\",\"D\",\"Y\"],\"rows\":[[0,0,0,0,1],[0,0,0,1,1],[0,0,1,0,1],[0,0,1,1,1],[0,1,0,0,1],[0,1,0,1,1],[0,1,1,0,1],[0,1,1,1,1],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,0,1,1,1],[1,1,0,0,1],[1,1,0,1,1],[1,1,1,0,1],[1,1,1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(511, 76, 3, 'truth_table', 'Truth Table', '{\"columns\":[\"A\",\"B\",\"C\",\"D\",\"Y\"],\"rows\":[[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,0],[0,1,0,0,0],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,0],[1,0,0,0,0],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,0],[1,1,0,0,0],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,0]]}', NULL, NULL, 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(512, 77, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S2\",\"S1\",\"S0\",\"Y\"],\"rows\":[[0,0,0,\"I0\"],[0,0,1,\"I1\"],[0,1,0,\"I2\"],[0,1,1,\"I3\"],[1,0,0,\"I4\"],[1,0,1,\"I5\"],[1,1,0,\"I6\"],[1,1,1,\"I7\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(513, 78, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S3\",\"S2\",\"S1\",\"S0\",\"Y\"],\"rows\":[[0,0,0,0,\"I0\"],[0,0,0,1,\"I1\"],[0,0,1,0,\"I2\"],[0,0,1,1,\"I3\"],[0,1,0,0,\"I4\"],[0,1,0,1,\"I5\"],[0,1,1,0,\"I6\"],[0,1,1,1,\"I7\"],[1,0,0,0,\"I8\"],[1,0,0,1,\"I9\"],[1,0,1,0,\"I10\"],[1,0,1,1,\"I11\"],[1,1,0,0,\"I12\"],[1,1,0,1,\"I13\"],[1,1,1,0,\"I14\"],[1,1,1,1,\"I15\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(515, 80, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S1\",\"S0\",\"Y\"],\"rows\":[[0,0,\"I0\"],[0,1,\"I1\"],[1,0,\"I2\"],[1,1,\"I3\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(516, 81, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S1\",\"S0\",\"Outputs\"],\"rows\":[[0,0,\"Y0 = D; other outputs = 0\"],[0,1,\"Y1 = D; other outputs = 0\"],[1,0,\"Y2 = D; other outputs = 0\"],[1,1,\"Y3 = D; other outputs = 0\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(517, 82, 3, 'selection_table', 'Selection Table', '{\"columns\":[\"S2\",\"S1\",\"S0\",\"Outputs\"],\"rows\":[[0,0,0,\"Y0 = D; other outputs = 0\"],[0,0,1,\"Y1 = D; other outputs = 0\"],[0,1,0,\"Y2 = D; other outputs = 0\"],[0,1,1,\"Y3 = D; other outputs = 0\"],[1,0,0,\"Y4 = D; other outputs = 0\"],[1,0,1,\"Y5 = D; other outputs = 0\"],[1,1,0,\"Y6 = D; other outputs = 0\"],[1,1,1,\"Y7 = D; other outputs = 0\"]]}', NULL, 'Enable asserted where present. Dual multiplexers apply this mapping independently to each bank. Analog model: four enabled channels, bidirectional selected path; off channels are high impedance.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(518, 83, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Input code\",\"Y0\",\"Y1\",\"Y2\",\"Y3\",\"Y4\",\"Y5\",\"Y6\",\"Y7\"],\"rows\":[[\"000\",1,0,0,0,0,0,0,0],[\"001\",0,1,0,0,0,0,0,0],[\"010\",0,0,1,0,0,0,0,0],[\"011\",0,0,0,1,0,0,0,0],[\"100\",0,0,0,0,1,0,0,0],[\"101\",0,0,0,0,0,1,0,0],[\"110\",0,0,0,0,0,0,1,0],[\"111\",0,0,0,0,0,0,0,1]]}', NULL, 'Enabled, active-high logical decoder; package output polarity may differ.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(519, 84, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Input code\",\"Y0\",\"Y1\",\"Y2\",\"Y3\",\"Y4\",\"Y5\",\"Y6\",\"Y7\",\"Y8\",\"Y9\",\"Y10\",\"Y11\",\"Y12\",\"Y13\",\"Y14\",\"Y15\"],\"rows\":[[\"0000\",1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[\"0001\",0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[\"0010\",0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[\"0011\",0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[\"0100\",0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[\"0101\",0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[\"0110\",0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[\"0111\",0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[\"1000\",0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[\"1001\",0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[\"1010\",0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[\"1011\",0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[\"1100\",0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],[\"1101\",0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[\"1110\",0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],[\"1111\",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]]}', NULL, 'Enabled, active-high logical decoder; package output polarity may differ.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(520, 85, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Inputs D3…D0\",\"Output code\",\"Valid\"],\"rows\":[[\"1XXX\",\"11\",1],[\"01XX\",\"10\",1],[\"001X\",\"01\",1],[\"0001\",\"00\",1],[\"0000\",\"X\",0]]}', NULL, 'Highest-numbered asserted input wins. X means don’t care; output is undefined when Valid = 0.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(521, 86, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Inputs D7…D0\",\"Output code\",\"Valid\"],\"rows\":[[\"1XXXXXXX\",\"111\",1],[\"01XXXXXX\",\"110\",1],[\"001XXXXX\",\"101\",1],[\"0001XXXX\",\"100\",1],[\"00001XXX\",\"011\",1],[\"000001XX\",\"010\",1],[\"0000001X\",\"001\",1],[\"00000001\",\"000\",1],[\"00000000\",\"X\",0]]}', NULL, 'Highest-numbered asserted input wins. X means don’t care; output is undefined when Valid = 0.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(522, 87, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"BCD\",\"abcdefg\"],\"rows\":[[\"0000\",\"1111110\"],[\"0001\",\"0110000\"],[\"0010\",\"1101101\"],[\"0011\",\"1111001\"],[\"0100\",\"0110011\"],[\"0101\",\"1011011\"],[\"0110\",\"1011111\"],[\"0111\",\"1110000\"],[\"1000\",\"1111111\"],[\"1001\",\"1111011\"],[\"1010–1111\",\"Invalid BCD\"]]}', NULL, 'Active-high segments (common-cathode model); invalid BCD inputs are unspecified.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(523, 88, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Binary\",\"Gray\"],\"rows\":[[\"0000\",\"0000\"],[\"0001\",\"0001\"],[\"0010\",\"0011\"],[\"0011\",\"0010\"],[\"0100\",\"0110\"],[\"0101\",\"0111\"],[\"0110\",\"0101\"],[\"0111\",\"0100\"],[\"1000\",\"1100\"],[\"1001\",\"1101\"],[\"1010\",\"1111\"],[\"1011\",\"1110\"],[\"1100\",\"1010\"],[\"1101\",\"1011\"],[\"1110\",\"1001\"],[\"1111\",\"1000\"]]}', NULL, 'Illustrative four-bit input model.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(524, 89, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Gray\",\"Binary\"],\"rows\":[[\"0000\",\"0000\"],[\"0001\",\"0001\"],[\"0010\",\"0011\"],[\"0011\",\"0010\"],[\"0100\",\"0111\"],[\"0101\",\"0110\"],[\"0110\",\"0100\"],[\"0111\",\"0101\"],[\"1000\",\"1111\"],[\"1001\",\"1110\"],[\"1010\",\"1100\"],[\"1011\",\"1101\"],[\"1100\",\"1000\"],[\"1101\",\"1001\"],[\"1110\",\"1011\"],[\"1111\",\"1010\"]]}', NULL, 'Illustrative four-bit input model.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(525, 90, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"BCD\",\"Binary\"],\"rows\":[[\"0000\",\"0000\"],[\"0001\",\"0001\"],[\"0010\",\"0010\"],[\"0011\",\"0011\"],[\"0100\",\"0100\"],[\"0101\",\"0101\"],[\"0110\",\"0110\"],[\"0111\",\"0111\"],[\"1000\",\"1000\"],[\"1001\",\"1001\"]]}', NULL, 'Single BCD digit model; codes 1010–1111 are invalid.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(526, 91, 3, 'mapping_table', 'Code Mapping', '{\"columns\":[\"Binary\",\"BCD (tens units)\"],\"rows\":[[\"0000\",\"0000 0000\"],[\"0001\",\"0000 0001\"],[\"0010\",\"0000 0010\"],[\"0011\",\"0000 0011\"],[\"0100\",\"0000 0100\"],[\"0101\",\"0000 0101\"],[\"0110\",\"0000 0110\"],[\"0111\",\"0000 0111\"],[\"1000\",\"0000 1000\"],[\"1001\",\"0000 1001\"],[\"1010\",\"0001 0000\"],[\"1011\",\"0001 0001\"],[\"1100\",\"0001 0010\"],[\"1101\",\"0001 0011\"],[\"1110\",\"0001 0100\"],[\"1111\",\"0001 0101\"]]}', NULL, 'Illustrative four-bit input model.', 3, '2026-10-31 08:43:53', '2026-10-31 08:43:53');

-- --------------------------------------------------------

--
-- Table structure for table `component_diagrams`
--

CREATE TABLE `component_diagrams` (
  `diagram_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(180) NOT NULL,
  `diagram_kind` enum('SYMBOL','CIRCUIT','PINOUT','STATE','TIMING','OTHER') NOT NULL DEFAULT 'OTHER',
  `image_path` varchar(500) NOT NULL,
  `alt_text` varchar(500) DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `component_diagrams`
--

INSERT INTO `component_diagrams` (`diagram_id`, `component_id`, `title`, `diagram_kind`, `image_path`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'Symbol Diagram', 'SYMBOL', '/assets/svg/counters/decade-counter-symbol.svg', 'Pin-level diagram for Decade Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(2, 2, 'Symbol Diagram', 'SYMBOL', '/assets/svg/counters/mod8-symbol.svg', 'Pin-level diagram for Mod-8 Up Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(3, 3, 'Symbol Diagram', 'SYMBOL', '/assets/svg/counters/mod8-down-symbol.svg', 'Pin-level diagram for Mod-8 Down Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(4, 4, 'Symbol Diagram', 'SYMBOL', '/assets/svg/counters/binary-counter.svg', 'Pin-level diagram for Binary Up Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(5, 5, 'Symbol Diagram', 'SYMBOL', '/assets/svg/counters/ripple-counter.svg', 'Pin-level diagram for Binary Ripple Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(6, 6, 'Symbol Diagram', 'SYMBOL', '/assets/svg/flipflops/sr.svg', 'Pin-level diagram for SR Flip-Flop, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(7, 7, 'Symbol Diagram', 'SYMBOL', '/assets/svg/flipflops/jk-flip-flop.svg', 'Pin-level diagram for JK Flip-Flop, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(8, 8, 'Symbol Diagram', 'SYMBOL', '/assets/svg/flipflops/d.svg', 'Pin-level diagram for D Flip-Flop, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(9, 9, 'Symbol Diagram', 'SYMBOL', '/assets/svg/flipflops/t.svg', 'Pin-level diagram for T Flip-Flop, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(11, 11, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/and.svg', 'Pin-level diagram for AND Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(12, 12, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/or.svg', 'Pin-level diagram for OR Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(13, 13, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/not.svg', 'Pin-level diagram for NOT Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(14, 14, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/nand.svg', 'Pin-level diagram for NAND Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(15, 15, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/nor.svg', 'Pin-level diagram for NOR Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(16, 16, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/xor.svg', 'Pin-level diagram for XOR Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(17, 17, 'Symbol Diagram', 'SYMBOL', '/assets/svg/gates/xnor.svg', 'Pin-level diagram for XNOR Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(18, 18, 'Symbol Diagram', 'SYMBOL', '/assets/svg/mux/2to1.svg', 'Pin-level diagram for 2-to-1 Multiplexer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(19, 19, 'Symbol Diagram', 'SYMBOL', '/assets/svg/mux/4to1.svg', 'Pin-level diagram for 4-to-1 Multiplexer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(20, 20, 'Symbol Diagram', 'SYMBOL', '/assets/svg/encoders/decoder2to4.svg', 'Pin-level diagram for 2-to-4 Decoder, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(21, 21, 'Symbol Diagram', 'SYMBOL', '/assets/svg/encoders/encoder4to2.svg', 'Pin-level diagram for 4-to-2 Encoder, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(22, 22, 'Symbol Diagram', 'SYMBOL', '/assets/svg/diodes/diode.svg', 'Pin-level diagram for Rectifier Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(23, 23, 'Symbol Diagram', 'SYMBOL', '/assets/svg/diodes/zener.svg', 'Pin-level diagram for Zener Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(24, 24, 'Symbol Diagram', 'SYMBOL', '/assets/svg/diodes/schottky.svg', 'Pin-level diagram for Schottky Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(25, 25, 'Symbol Diagram', 'SYMBOL', '/assets/svg/diodes/led.svg', 'Pin-level diagram for Red LED, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(26, 26, 'Symbol Diagram', 'SYMBOL', '/assets/svg/diodes/led.svg', 'Pin-level diagram for Infrared LED, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(27, 27, 'Symbol Diagram', 'SYMBOL', '/assets/svg/transistors/npn.svg', 'Pin-level diagram for NPN BJT, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(28, 28, 'Symbol Diagram', 'SYMBOL', '/assets/svg/transistors/pnp.svg', 'Pin-level diagram for PNP BJT, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(29, 29, 'Symbol Diagram', 'SYMBOL', '/assets/svg/transistors/nmos.svg', 'Pin-level diagram for N-Channel Enhancement MOSFET, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(30, 30, 'Symbol Diagram', 'SYMBOL', '/assets/svg/transistors/pmos.svg', 'Pin-level diagram for P-Channel Enhancement MOSFET, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(31, 31, 'Symbol Diagram', 'SYMBOL', '/assets/svg/opamps/inverting.svg', 'Pin-level diagram for Inverting Amplifier, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(32, 32, 'Symbol Diagram', 'SYMBOL', '/assets/svg/opamps/non-inverting.svg', 'Pin-level diagram for Non-Inverting Amplifier, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(33, 33, 'Symbol Diagram', 'SYMBOL', '/assets/svg/opamps/follower.svg', 'Pin-level diagram for Voltage Follower, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(34, 34, 'Symbol Diagram', 'SYMBOL', '/assets/svg/regulators/linear.svg', 'Pin-level diagram for Linear Voltage Regulator, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(35, 35, 'Symbol Diagram', 'SYMBOL', '/assets/svg/regulators/buck.svg', 'Pin-level diagram for Buck Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(36, 36, 'Symbol Diagram', 'SYMBOL', '/assets/svg/sensors/analog-temperature.svg', 'Pin-level diagram for Analog Temperature Sensor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 15:49:23'),
(37, 37, 'Symbol Diagram', 'SYMBOL', '/assets/svg/sensors/temperature-sensor.svg', 'Pin-level diagram for Digital Temperature Sensor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(38, 38, 'Symbol Diagram', 'SYMBOL', '/assets/svg/adcs/sar-adc.svg', 'Pin-level diagram for Successive Approximation ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(39, 39, 'Symbol Diagram', 'SYMBOL', '/assets/svg/adcs/flash-adc.svg', 'Pin-level diagram for Flash ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(40, 40, 'Symbol Diagram', 'SYMBOL', '/assets/svg/memory/eeprom-block.svg', 'Pin-level diagram for EEPROM, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(41, 41, 'Symbol Diagram', 'SYMBOL', '/assets/svg/memory/memory-block.svg', 'Pin-level diagram for SRAM, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(42, 42, 'Symbol Diagram', 'SYMBOL', '/assets/svg/relays/spdt-relay.svg', 'Pin-level diagram for Electromagnetic Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(43, 43, 'Symbol Diagram', 'SYMBOL', '/assets/svg/relays/solid-state-relay.svg', 'Pin-level diagram for Solid-State Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(44, 44, 'Symbol Diagram', 'SYMBOL', '/assets/svg/motors/dc-motor.svg', 'Pin-level diagram for Brushed DC Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(45, 45, 'Symbol Diagram', 'SYMBOL', '/assets/svg/motors/dc-motor.svg', 'Pin-level diagram for DC Gear Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(46, 46, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/mod5-counter.svg', 'Pin-level diagram for Mod-5 Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(47, 47, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/mod6-counter.svg', 'Pin-level diagram for Mod-6 Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(48, 48, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/mod10-synchronous-counter.svg', 'Pin-level diagram for Mod-10 Synchronous Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(49, 49, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/bcd-counter.svg', 'Pin-level diagram for BCD Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(50, 50, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/johnson-counter.svg', 'Pin-level diagram for Johnson Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(51, 51, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/ring-counter.svg', 'Pin-level diagram for Ring Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(52, 52, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/up-down-counter.svg', 'Pin-level diagram for Up-Down Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(53, 53, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/asynchronous-binary-counter.svg', 'Pin-level diagram for Asynchronous Binary Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(54, 54, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/synchronous-binary-counter.svg', 'Pin-level diagram for Synchronous Binary Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(55, 55, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/programmable-modulo-counter.svg', 'Pin-level diagram for Programmable Modulo Counter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(56, 56, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/gated-sr-latch.svg', 'Pin-level diagram for Gated SR Latch, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(57, 57, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/active-low-sr-latch.svg', 'Pin-level diagram for Active-Low SR Latch, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(61, 61, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/jk-latch.svg', 'Pin-level diagram for JK Latch, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(62, 62, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/toggle-latch.svg', 'Pin-level diagram for Toggle Latch, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(68, 68, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/buffer-gate.svg', 'Pin-level diagram for Buffer Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(69, 69, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/tri-state-buffer.svg', 'Pin-level diagram for Tri-State Buffer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(70, 70, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/open-collector-inverter.svg', 'Pin-level diagram for Open-Collector Inverter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(71, 71, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/schmitt-trigger-inverter.svg', 'Pin-level diagram for Schmitt Trigger Inverter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(72, 72, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/majority-gate.svg', 'Pin-level diagram for Majority Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(73, 73, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/aoi21-gate.svg', 'Pin-level diagram for 2-Input AND-OR-Invert Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(74, 74, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/oai21-gate.svg', 'Pin-level diagram for 2-Input OR-AND-Invert Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(75, 75, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/four-input-nand-gate.svg', 'Pin-level diagram for Four-Input NAND Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(76, 76, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/four-input-nor-gate.svg', 'Pin-level diagram for Four-Input NOR Gate, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(77, 77, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/mux-8-to-1.svg', 'Pin-level diagram for 8-to-1 Multiplexer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(78, 78, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/mux-16-to-1.svg', 'Pin-level diagram for 16-to-1 Multiplexer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(80, 80, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/analog-multiplexer.svg', 'Pin-level diagram for Analog Multiplexer, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(81, 81, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/demux-1-to-4.svg', 'Pin-level diagram for Demultiplexer 1-to-4, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(82, 82, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/demux-1-to-8.svg', 'Pin-level diagram for Demultiplexer 1-to-8, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(83, 83, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/decoder-3-to-8.svg', 'Pin-level diagram for 3-to-8 Decoder, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(84, 84, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/decoder-4-to-16.svg', 'Pin-level diagram for 4-to-16 Decoder, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(85, 85, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/priority-encoder-4-to-2.svg', 'Pin-level diagram for Priority Encoder 4-to-2, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(86, 86, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/priority-encoder-8-to-3.svg', 'Pin-level diagram for Priority Encoder 8-to-3, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(87, 87, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/bcd-to-7-segment-decoder.svg', 'Pin-level diagram for BCD-to-7-Segment Decoder, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(88, 88, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/binary-to-gray-converter.svg', 'Pin-level diagram for Binary-to-Gray Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(89, 89, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/gray-to-binary-converter.svg', 'Pin-level diagram for Gray-to-Binary Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(90, 90, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/bcd-to-binary-converter.svg', 'Pin-level diagram for BCD-to-Binary Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(91, 91, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/binary-to-bcd-converter.svg', 'Pin-level diagram for Binary-to-BCD Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(92, 92, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/fast-recovery-diode.svg', 'Pin-level diagram for Fast Recovery Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(93, 93, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/bridge-rectifier.svg', 'Pin-level diagram for Bridge Rectifier, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(94, 94, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/small-signal-switching-diode.svg', 'Pin-level diagram for Small-Signal Switching Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(95, 95, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/pin-diode.svg', 'Pin-level diagram for PIN Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(96, 96, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/varactor-diode.svg', 'Pin-level diagram for Varactor Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(97, 97, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/zener-5v1.svg', 'Pin-level diagram for 5.1 V Zener Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(98, 98, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/zener-12v.svg', 'Pin-level diagram for 12 V Zener Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(99, 99, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/low-barrier-schottky-diode.svg', 'Pin-level diagram for Low-Barrier Schottky Diode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(100, 100, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/green-led.svg', 'Pin-level diagram for Green LED, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(101, 101, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/blue-led.svg', 'Pin-level diagram for Blue LED, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(102, 102, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/white-led.svg', 'Pin-level diagram for White LED, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(104, 104, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/photodiode.svg', 'Pin-level diagram for Photodiode, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(106, 106, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/phototransistor.svg', 'Pin-level diagram for Phototransistor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(107, 107, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/small-signal-npn-transistor.svg', 'Pin-level diagram for Small-Signal NPN Transistor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(108, 108, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/power-npn-transistor.svg', 'Pin-level diagram for Power NPN Transistor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(111, 111, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/dual-nmos.svg', 'Pin-level diagram for Dual N-Channel MOSFET, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(113, 113, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/summing-amplifier.svg', 'Pin-level diagram for Summing Amplifier, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(114, 114, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/differential-amplifier.svg', 'Pin-level diagram for Differential Amplifier, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(115, 115, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/opamp-integrator.svg', 'Pin-level diagram for Integrator Op-Amp, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(116, 116, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/opamp-differentiator.svg', 'Pin-level diagram for Differentiator Op-Amp, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(117, 117, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/opamp-comparator-circuit.svg', 'Pin-level diagram for Comparator Circuit, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(118, 118, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/adjustable-linear-regulator.svg', 'Pin-level diagram for Adjustable Linear Regulator, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(119, 119, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/low-dropout-regulator.svg', 'Pin-level diagram for Low-Dropout Regulator, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(120, 120, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/boost-converter.svg', 'Pin-level diagram for Boost Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(121, 121, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/buck-boost-converter.svg', 'Pin-level diagram for Buck-Boost Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(122, 122, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/charge-pump-converter.svg', 'Pin-level diagram for Charge Pump Voltage Converter, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(123, 123, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/ntc-thermistor.svg', 'Pin-level diagram for NTC Thermistor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(124, 124, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/ptc-thermistor.svg', 'Pin-level diagram for PTC Thermistor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(125, 125, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/thermocouple.svg', 'Pin-level diagram for Thermocouple, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(126, 126, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/rtd-sensor.svg', 'Pin-level diagram for RTD Sensor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(127, 127, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/digital-humidity-sensor.svg', 'Pin-level diagram for Digital Humidity Sensor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(128, 128, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/dual-slope-adc.svg', 'Pin-level diagram for Dual-Slope ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(129, 129, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/pipeline-adc.svg', 'Pin-level diagram for Pipeline ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(130, 130, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/sigma-delta-adc.svg', 'Pin-level diagram for Sigma-Delta ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(131, 131, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/8-bit-adc.svg', 'Pin-level diagram for 8-bit ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53');
INSERT INTO `component_diagrams` (`diagram_id`, `component_id`, `title`, `diagram_kind`, `image_path`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(132, 132, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/12-bit-adc.svg', 'Pin-level diagram for 12-bit ADC, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(134, 134, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/nor-flash.svg', 'Pin-level diagram for NOR Flash, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(135, 135, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/nand-flash.svg', 'Pin-level diagram for NAND Flash, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(136, 136, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/dram.svg', 'Pin-level diagram for DRAM, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(137, 137, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/read-only-memory.svg', 'Pin-level diagram for ROM, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(138, 138, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/fifo-buffer-memory.svg', 'Pin-level diagram for FIFO Buffer Memory, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(139, 139, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/spst-relay.svg', 'Pin-level diagram for SPST Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(140, 140, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/spdt-relay.svg', 'Pin-level diagram for SPDT Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(141, 141, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/dpdt-relay.svg', 'Pin-level diagram for DPDT Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(142, 142, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/reed-relay.svg', 'Pin-level diagram for Reed Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(143, 143, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/latching-relay.svg', 'Pin-level diagram for Latching Relay, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(144, 144, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/brushless-dc-motor.svg', 'Pin-level diagram for Brushless DC Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(145, 145, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/stepper-motor.svg', 'Pin-level diagram for Stepper Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(146, 146, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/servo-motor.svg', 'Pin-level diagram for Servo Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(147, 147, 'Symbol Diagram', 'SYMBOL', '/assets/svg/components/permanent-magnet-dc-motor.svg', 'Pin-level diagram for Permanent-Magnet DC Motor, showing its functional symbol and labeled input, output, clock, control, and supply terminals where applicable.', 'Functional block diagram identifying the component and its labeled signal, clock, control, supply, and output terminals where applicable.', 10, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(256, 1, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/decade-counter.svg', 'Circuit schematic for Decade Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(257, 2, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mod8-up-counter.svg', 'Circuit schematic for Mod-8 Up Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(258, 3, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mod8-down-counter.svg', 'Circuit schematic for Mod-8 Down Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(259, 4, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/binary-up-counter.svg', 'Circuit schematic for Binary Up Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(260, 5, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/binary-ripple-counter.svg', 'Circuit schematic for Binary Ripple Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(261, 6, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/sr-flip-flop.svg', 'Circuit schematic for SR Flip-Flop, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(262, 7, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/jk-flip-flop-circuit.svg', 'Circuit schematic for JK Flip-Flop, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(263, 8, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/d-flip-flop.svg', 'Circuit schematic for D Flip-Flop, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(264, 9, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/t-flip-flop.svg', 'Circuit schematic for T Flip-Flop, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(266, 18, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mux-2-to-1.svg', 'Circuit schematic for 2-to-1 Multiplexer, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(267, 19, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mux-4-to-1.svg', 'Circuit schematic for 4-to-1 Multiplexer, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(268, 20, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/decoder-2-to-4.svg', 'Circuit schematic for 2-to-4 Decoder, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(269, 21, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/encoder-4-to-2.svg', 'Circuit schematic for 4-to-2 Encoder, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(279, 31, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/inverting-amplifier.svg', 'Circuit schematic for Inverting Amplifier, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(280, 32, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/non-inverting-amplifier.svg', 'Circuit schematic for Non-Inverting Amplifier, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(281, 33, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/voltage-follower.svg', 'Circuit schematic for Voltage Follower, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(282, 34, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/linear-voltage-regulator.svg', 'Circuit schematic for Linear Voltage Regulator, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(283, 35, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/buck-converter.svg', 'Circuit schematic for Buck Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(284, 36, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/analog-temperature-sensor.svg', 'Circuit schematic for Analog Temperature Sensor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(285, 37, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/digital-temperature-sensor.svg', 'Circuit schematic for Digital Temperature Sensor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(288, 40, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/eeprom.svg', 'Circuit schematic for EEPROM, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(289, 41, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/sram.svg', 'Circuit schematic for SRAM, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(290, 42, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/electromagnetic-relay.svg', 'Circuit schematic for Electromagnetic Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(291, 43, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/solid-state-relay.svg', 'Circuit schematic for Solid-State Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(292, 44, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/brushed-dc-motor.svg', 'Circuit schematic for Brushed DC Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(293, 45, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/dc-gear-motor.svg', 'Circuit schematic for DC Gear Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(294, 46, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mod5-counter.svg', 'Circuit schematic for Mod-5 Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(295, 47, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mod6-counter.svg', 'Circuit schematic for Mod-6 Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(296, 48, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mod10-synchronous-counter.svg', 'Circuit schematic for Mod-10 Synchronous Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(297, 49, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/bcd-counter.svg', 'Circuit schematic for BCD Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(298, 50, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/johnson-counter.svg', 'Circuit schematic for Johnson Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(299, 51, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/ring-counter.svg', 'Circuit schematic for Ring Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(300, 52, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/up-down-counter.svg', 'Circuit schematic for Up-Down Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(301, 53, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/asynchronous-binary-counter.svg', 'Circuit schematic for Asynchronous Binary Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(302, 54, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/synchronous-binary-counter.svg', 'Circuit schematic for Synchronous Binary Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(303, 55, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/programmable-modulo-counter.svg', 'Circuit schematic for Programmable Modulo Counter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(304, 56, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/gated-sr-latch.svg', 'Circuit schematic for Gated SR Latch, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(305, 57, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/active-low-sr-latch.svg', 'Circuit schematic for Active-Low SR Latch, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(309, 61, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/jk-latch.svg', 'Circuit schematic for JK Latch, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(310, 62, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/toggle-latch.svg', 'Circuit schematic for Toggle Latch, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(316, 77, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mux-8-to-1.svg', 'Circuit schematic for 8-to-1 Multiplexer, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(317, 78, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/mux-16-to-1.svg', 'Circuit schematic for 16-to-1 Multiplexer, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(319, 80, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/analog-multiplexer.svg', 'Circuit schematic for Analog Multiplexer, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(320, 81, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/demux-1-to-4.svg', 'Circuit schematic for Demultiplexer 1-to-4, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(321, 82, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/demux-1-to-8.svg', 'Circuit schematic for Demultiplexer 1-to-8, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(322, 83, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/decoder-3-to-8.svg', 'Circuit schematic for 3-to-8 Decoder, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(323, 84, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/decoder-4-to-16.svg', 'Circuit schematic for 4-to-16 Decoder, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(324, 85, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/priority-encoder-4-to-2.svg', 'Circuit schematic for Priority Encoder 4-to-2, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(325, 86, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/priority-encoder-8-to-3.svg', 'Circuit schematic for Priority Encoder 8-to-3, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(326, 87, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/bcd-to-7-segment-decoder.svg', 'Circuit schematic for BCD-to-7-Segment Decoder, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(327, 88, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/binary-to-gray-converter.svg', 'Circuit schematic for Binary-to-Gray Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(328, 89, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/gray-to-binary-converter.svg', 'Circuit schematic for Gray-to-Binary Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(329, 90, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/bcd-to-binary-converter.svg', 'Circuit schematic for BCD-to-Binary Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(330, 91, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/binary-to-bcd-converter.svg', 'Circuit schematic for Binary-to-BCD Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(343, 104, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/photodiode.svg', 'Circuit schematic for Photodiode, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(352, 113, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/summing-amplifier.svg', 'Circuit schematic for Summing Amplifier, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(353, 114, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/differential-amplifier.svg', 'Circuit schematic for Differential Amplifier, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(354, 115, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/opamp-integrator.svg', 'Circuit schematic for Integrator Op-Amp, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(355, 116, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/opamp-differentiator.svg', 'Circuit schematic for Differentiator Op-Amp, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(356, 117, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/opamp-comparator-circuit.svg', 'Circuit schematic for Comparator Circuit, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(357, 118, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/adjustable-linear-regulator.svg', 'Circuit schematic for Adjustable Linear Regulator, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(358, 119, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/low-dropout-regulator.svg', 'Circuit schematic for Low-Dropout Regulator, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(359, 120, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/boost-converter.svg', 'Circuit schematic for Boost Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(360, 121, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/buck-boost-converter.svg', 'Circuit schematic for Buck-Boost Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(361, 122, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/charge-pump-converter.svg', 'Circuit schematic for Charge Pump Voltage Converter, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(362, 123, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/ntc-thermistor.svg', 'Circuit schematic for NTC Thermistor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(363, 124, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/ptc-thermistor.svg', 'Circuit schematic for PTC Thermistor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(364, 125, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/thermocouple.svg', 'Circuit schematic for Thermocouple, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(365, 126, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/rtd-sensor.svg', 'Circuit schematic for RTD Sensor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(366, 127, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/digital-humidity-sensor.svg', 'Circuit schematic for Digital Humidity Sensor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(373, 134, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/nor-flash.svg', 'Circuit schematic for NOR Flash, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(374, 135, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/nand-flash.svg', 'Circuit schematic for NAND Flash, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(375, 136, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/dram.svg', 'Circuit schematic for DRAM, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(376, 137, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/read-only-memory.svg', 'Circuit schematic for ROM, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(377, 138, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/fifo-buffer-memory.svg', 'Circuit schematic for FIFO Buffer Memory, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(378, 139, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/spst-relay.svg', 'Circuit schematic for SPST Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(379, 140, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/spdt-relay.svg', 'Circuit schematic for SPDT Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(380, 141, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/dpdt-relay.svg', 'Circuit schematic for DPDT Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(381, 142, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/reed-relay.svg', 'Circuit schematic for Reed Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(382, 143, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/latching-relay.svg', 'Circuit schematic for Latching Relay, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(383, 144, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/brushless-dc-motor.svg', 'Circuit schematic for Brushless DC Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(384, 145, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/stepper-motor.svg', 'Circuit schematic for Stepper Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(385, 146, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/servo-motor.svg', 'Circuit schematic for Servo Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(386, 147, 'Circuit Diagram', 'CIRCUIT', '/assets/svg/circuits/permanent-magnet-dc-motor.svg', 'Circuit schematic for Permanent-Magnet DC Motor, showing interconnected logic gates or device stages and their principal signal paths.', 'Schematic showing the principal logic or device stages, their interconnections, and the signal and control paths in the reference implementation.', 20, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(511, 1, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/decade-counter.svg', 'Package pin map for Decade Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(512, 2, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mod8-up-counter.svg', 'Package pin map for Mod-8 Up Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(513, 3, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mod8-down-counter.svg', 'Package pin map for Mod-8 Down Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(514, 4, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/binary-up-counter.svg', 'Package pin map for Binary Up Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(515, 5, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/binary-ripple-counter.svg', 'Package pin map for Binary Ripple Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(516, 6, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/sr-flip-flop.svg', 'Package pin map for SR Flip-Flop, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(517, 7, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/jk-flip-flop.svg', 'Package pin map for JK Flip-Flop, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(518, 8, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/d-flip-flop.svg', 'Package pin map for D Flip-Flop, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(519, 9, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/t-flip-flop.svg', 'Package pin map for T Flip-Flop, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(521, 11, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/and-gate.svg', 'Package pin map for AND Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(522, 12, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/or-gate.svg', 'Package pin map for OR Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(523, 13, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/not-gate.svg', 'Package pin map for NOT Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(524, 14, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/nand-gate.svg', 'Package pin map for NAND Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(525, 15, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/nor-gate.svg', 'Package pin map for NOR Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(526, 16, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/xor-gate.svg', 'Package pin map for XOR Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(527, 17, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/xnor-gate.svg', 'Package pin map for XNOR Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(528, 18, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mux-2-to-1.svg', 'Package pin map for 2-to-1 Multiplexer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(529, 19, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mux-4-to-1.svg', 'Package pin map for 4-to-1 Multiplexer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(530, 20, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/decoder-2-to-4.svg', 'Package pin map for 2-to-4 Decoder, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53');
INSERT INTO `component_diagrams` (`diagram_id`, `component_id`, `title`, `diagram_kind`, `image_path`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(531, 21, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/encoder-4-to-2.svg', 'Package pin map for 4-to-2 Encoder, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(532, 31, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/inverting-amplifier.svg', 'Package pin map for Inverting Amplifier, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(533, 32, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/non-inverting-amplifier.svg', 'Package pin map for Non-Inverting Amplifier, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(534, 33, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/voltage-follower.svg', 'Package pin map for Voltage Follower, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(535, 34, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/linear-voltage-regulator.svg', 'Package pin map for Linear Voltage Regulator, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(536, 35, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/buck-converter.svg', 'Package pin map for Buck Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(537, 36, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/analog-temperature-sensor.svg', 'Package pin map for Analog Temperature Sensor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(538, 37, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/digital-temperature-sensor.svg', 'Package pin map for Digital Temperature Sensor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(539, 38, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/sar-adc.svg', 'Package pin map for Successive Approximation ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(540, 39, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/flash-adc.svg', 'Package pin map for Flash ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(541, 40, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/eeprom.svg', 'Package pin map for EEPROM, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(542, 41, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/sram.svg', 'Package pin map for SRAM, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(543, 46, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mod5-counter.svg', 'Package pin map for Mod-5 Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(544, 47, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mod6-counter.svg', 'Package pin map for Mod-6 Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(545, 48, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mod10-synchronous-counter.svg', 'Package pin map for Mod-10 Synchronous Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(546, 49, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/bcd-counter.svg', 'Package pin map for BCD Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(547, 50, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/johnson-counter.svg', 'Package pin map for Johnson Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(548, 51, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/ring-counter.svg', 'Package pin map for Ring Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(549, 52, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/up-down-counter.svg', 'Package pin map for Up-Down Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(550, 53, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/asynchronous-binary-counter.svg', 'Package pin map for Asynchronous Binary Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(551, 54, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/synchronous-binary-counter.svg', 'Package pin map for Synchronous Binary Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(552, 55, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/programmable-modulo-counter.svg', 'Package pin map for Programmable Modulo Counter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(553, 56, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/gated-sr-latch.svg', 'Package pin map for Gated SR Latch, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(554, 57, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/active-low-sr-latch.svg', 'Package pin map for Active-Low SR Latch, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(558, 61, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/jk-latch.svg', 'Package pin map for JK Latch, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(559, 62, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/toggle-latch.svg', 'Package pin map for Toggle Latch, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(565, 68, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/buffer-gate.svg', 'Package pin map for Buffer Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(566, 69, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/tri-state-buffer.svg', 'Package pin map for Tri-State Buffer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(567, 70, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/open-collector-inverter.svg', 'Package pin map for Open-Collector Inverter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(568, 71, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/schmitt-trigger-inverter.svg', 'Package pin map for Schmitt Trigger Inverter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(569, 72, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/majority-gate.svg', 'Package pin map for Majority Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(570, 73, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/aoi21-gate.svg', 'Package pin map for 2-Input AND-OR-Invert Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(571, 74, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/oai21-gate.svg', 'Package pin map for 2-Input OR-AND-Invert Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(572, 75, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/four-input-nand-gate.svg', 'Package pin map for Four-Input NAND Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(573, 76, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/four-input-nor-gate.svg', 'Package pin map for Four-Input NOR Gate, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(574, 77, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mux-8-to-1.svg', 'Package pin map for 8-to-1 Multiplexer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(575, 78, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/mux-16-to-1.svg', 'Package pin map for 16-to-1 Multiplexer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(577, 80, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/analog-multiplexer.svg', 'Package pin map for Analog Multiplexer, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(578, 81, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/demux-1-to-4.svg', 'Package pin map for Demultiplexer 1-to-4, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(579, 82, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/demux-1-to-8.svg', 'Package pin map for Demultiplexer 1-to-8, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(580, 83, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/decoder-3-to-8.svg', 'Package pin map for 3-to-8 Decoder, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(581, 84, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/decoder-4-to-16.svg', 'Package pin map for 4-to-16 Decoder, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(582, 85, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/priority-encoder-4-to-2.svg', 'Package pin map for Priority Encoder 4-to-2, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(583, 86, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/priority-encoder-8-to-3.svg', 'Package pin map for Priority Encoder 8-to-3, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(584, 87, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/bcd-to-7-segment-decoder.svg', 'Package pin map for BCD-to-7-Segment Decoder, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(585, 88, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/binary-to-gray-converter.svg', 'Package pin map for Binary-to-Gray Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(586, 89, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/gray-to-binary-converter.svg', 'Package pin map for Gray-to-Binary Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(587, 90, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/bcd-to-binary-converter.svg', 'Package pin map for BCD-to-Binary Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(588, 91, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/binary-to-bcd-converter.svg', 'Package pin map for Binary-to-BCD Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(589, 113, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/summing-amplifier.svg', 'Package pin map for Summing Amplifier, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(590, 114, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/differential-amplifier.svg', 'Package pin map for Differential Amplifier, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(591, 115, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/opamp-integrator.svg', 'Package pin map for Integrator Op-Amp, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(592, 116, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/opamp-differentiator.svg', 'Package pin map for Differentiator Op-Amp, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(593, 117, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/opamp-comparator-circuit.svg', 'Package pin map for Comparator Circuit, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(594, 118, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/adjustable-linear-regulator.svg', 'Package pin map for Adjustable Linear Regulator, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(595, 119, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/low-dropout-regulator.svg', 'Package pin map for Low-Dropout Regulator, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(596, 120, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/boost-converter.svg', 'Package pin map for Boost Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(597, 121, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/buck-boost-converter.svg', 'Package pin map for Buck-Boost Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(598, 122, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/charge-pump-converter.svg', 'Package pin map for Charge Pump Voltage Converter, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(599, 123, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/ntc-thermistor.svg', 'Package pin map for NTC Thermistor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(600, 124, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/ptc-thermistor.svg', 'Package pin map for PTC Thermistor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(601, 125, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/thermocouple.svg', 'Package pin map for Thermocouple, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(602, 126, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/rtd-sensor.svg', 'Package pin map for RTD Sensor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(603, 127, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/digital-humidity-sensor.svg', 'Package pin map for Digital Humidity Sensor, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(604, 128, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/dual-slope-adc.svg', 'Package pin map for Dual-Slope ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(605, 129, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/pipeline-adc.svg', 'Package pin map for Pipeline ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(606, 130, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/sigma-delta-adc.svg', 'Package pin map for Sigma-Delta ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(607, 131, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/8-bit-adc.svg', 'Package pin map for 8-bit ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(608, 132, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/12-bit-adc.svg', 'Package pin map for 12-bit ADC, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(610, 134, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/nor-flash.svg', 'Package pin map for NOR Flash, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(611, 135, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/nand-flash.svg', 'Package pin map for NAND Flash, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(612, 136, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/dram.svg', 'Package pin map for DRAM, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(613, 137, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/read-only-memory.svg', 'Package pin map for ROM, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(614, 138, 'Pinout Diagram', 'PINOUT', '/assets/svg/pinouts/fifo-buffer-memory.svg', 'Package pin map for FIFO Buffer Memory, showing numbered terminals and signal names; confirm orientation and package variant against the datasheet.', 'Identifies numbered package terminals and their signal names in standard orientation. Confirm package variant and pin-one orientation against the device datasheet.', 25, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(638, 1, 'State Diagram', 'STATE', '/assets/svg/counters/decade-counter-state.svg', 'Decade Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(639, 2, 'State Diagram', 'STATE', '/assets/svg/counters/mod8-up-counter-state.svg', 'Mod-8 Up Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(640, 3, 'State Diagram', 'STATE', '/assets/svg/counters/mod8-down-counter-state.svg', 'Mod-8 Down Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(641, 4, 'State Diagram', 'STATE', '/assets/svg/counters/binary-up-counter-state.svg', 'Binary Up Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(642, 5, 'State Diagram', 'STATE', '/assets/svg/counters/binary-ripple-counter-state.svg', 'Binary Ripple Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(643, 6, 'State Diagram', 'STATE', '/assets/svg/flipflops/sr-flip-flop-state.svg', 'SR Flip-Flop state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(644, 7, 'State Diagram', 'STATE', '/assets/svg/flipflops/jk-flip-flop-state.svg', 'JK Flip-Flop state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(645, 8, 'State Diagram', 'STATE', '/assets/svg/flipflops/d-flip-flop-state.svg', 'D Flip-Flop state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(646, 9, 'State Diagram', 'STATE', '/assets/svg/flipflops/t-flip-flop-state.svg', 'T Flip-Flop state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(648, 46, 'State Diagram', 'STATE', '/assets/svg/counters/mod5-counter-state.svg', 'Mod-5 Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(649, 47, 'State Diagram', 'STATE', '/assets/svg/counters/mod6-counter-state.svg', 'Mod-6 Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(650, 48, 'State Diagram', 'STATE', '/assets/svg/counters/mod10-synchronous-counter-state.svg', 'Mod-10 Synchronous Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(651, 49, 'State Diagram', 'STATE', '/assets/svg/counters/bcd-counter-state.svg', 'BCD Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(652, 50, 'State Diagram', 'STATE', '/assets/svg/counters/johnson-counter-state.svg', 'Johnson Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(653, 51, 'State Diagram', 'STATE', '/assets/svg/counters/ring-counter-state.svg', 'Ring Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(654, 52, 'State Diagram', 'STATE', '/assets/svg/counters/up-down-counter-state.svg', 'Up-Down Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(655, 53, 'State Diagram', 'STATE', '/assets/svg/counters/asynchronous-binary-counter-state.svg', 'Asynchronous Binary Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(656, 54, 'State Diagram', 'STATE', '/assets/svg/counters/synchronous-binary-counter-state.svg', 'Synchronous Binary Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(657, 55, 'State Diagram', 'STATE', '/assets/svg/counters/programmable-modulo-counter-state.svg', 'Programmable Modulo Counter state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(658, 56, 'State Diagram', 'STATE', '/assets/svg/flipflops/gated-sr-latch-state.svg', 'Gated SR Latch state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(659, 57, 'State Diagram', 'STATE', '/assets/svg/flipflops/active-low-sr-latch-state.svg', 'Active-Low SR Latch state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(663, 61, 'State Diagram', 'STATE', '/assets/svg/flipflops/jk-latch-state.svg', 'JK Latch state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(664, 62, 'State Diagram', 'STATE', '/assets/svg/flipflops/toggle-latch-state.svg', 'Toggle Latch state transitions: MOORE machine first on the left with outputs associated with states; MEALY machine second on the right with input/output labels on directed arrows. Self-loops and cross-state transitions show direction.', 'MOORE appears first on the left, with outputs associated with states; MEALY follows on the right, with input/output labels on transitions. Directed arrowheads mark every transition, including self-loops.', 30, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(701, 1, 'Timing Diagram', 'TIMING', '/assets/svg/counters/decade-counter-timing.svg', 'Timing waveform for Decade Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(702, 2, 'Timing Diagram', 'TIMING', '/assets/svg/counters/mod8-up-counter-timing.svg', 'Timing waveform for Mod-8 Up Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(703, 3, 'Timing Diagram', 'TIMING', '/assets/svg/counters/mod8-down-counter-timing.svg', 'Timing waveform for Mod-8 Down Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(704, 4, 'Timing Diagram', 'TIMING', '/assets/svg/counters/binary-up-counter-timing.svg', 'Timing waveform for Binary Up Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(705, 5, 'Timing Diagram', 'TIMING', '/assets/svg/counters/binary-ripple-counter-timing.svg', 'Timing waveform for Binary Ripple Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(706, 6, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/sr-flip-flop-timing.svg', 'Timing waveform for SR Flip-Flop, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53');
INSERT INTO `component_diagrams` (`diagram_id`, `component_id`, `title`, `diagram_kind`, `image_path`, `alt_text`, `caption`, `display_order`, `created_at`, `updated_at`) VALUES
(707, 7, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/jk-flip-flop-timing.svg', 'Timing waveform for JK Flip-Flop, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(708, 8, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/d-flip-flop-timing.svg', 'Timing waveform for D Flip-Flop, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(709, 9, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/t-flip-flop-timing.svg', 'Timing waveform for T Flip-Flop, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(711, 46, 'Timing Diagram', 'TIMING', '/assets/svg/counters/mod5-counter-timing.svg', 'Timing waveform for Mod-5 Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(712, 47, 'Timing Diagram', 'TIMING', '/assets/svg/counters/mod6-counter-timing.svg', 'Timing waveform for Mod-6 Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(713, 48, 'Timing Diagram', 'TIMING', '/assets/svg/counters/mod10-synchronous-counter-timing.svg', 'Timing waveform for Mod-10 Synchronous Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(714, 49, 'Timing Diagram', 'TIMING', '/assets/svg/counters/bcd-counter-timing.svg', 'Timing waveform for BCD Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(715, 50, 'Timing Diagram', 'TIMING', '/assets/svg/counters/johnson-counter-timing.svg', 'Timing waveform for Johnson Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(716, 51, 'Timing Diagram', 'TIMING', '/assets/svg/counters/ring-counter-timing.svg', 'Timing waveform for Ring Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(717, 52, 'Timing Diagram', 'TIMING', '/assets/svg/counters/up-down-counter-timing.svg', 'Timing waveform for Up-Down Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(718, 53, 'Timing Diagram', 'TIMING', '/assets/svg/counters/asynchronous-binary-counter-timing.svg', 'Timing waveform for Asynchronous Binary Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(719, 54, 'Timing Diagram', 'TIMING', '/assets/svg/counters/synchronous-binary-counter-timing.svg', 'Timing waveform for Synchronous Binary Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(720, 55, 'Timing Diagram', 'TIMING', '/assets/svg/counters/programmable-modulo-counter-timing.svg', 'Timing waveform for Programmable Modulo Counter, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(721, 56, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/gated-sr-latch-timing.svg', 'Timing waveform for Gated SR Latch, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(722, 57, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/active-low-sr-latch-timing.svg', 'Timing waveform for Active-Low SR Latch, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(726, 61, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/jk-latch-timing.svg', 'Timing waveform for JK Latch, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53'),
(727, 62, 'Timing Diagram', 'TIMING', '/assets/svg/flipflops/toggle-latch-timing.svg', 'Timing waveform for Toggle Latch, with clock and related logic signals across successive cycles, showing transitions and resulting state or output changes.', 'Aligns clock and logic signals across successive cycles to show active transitions and resulting state or output changes. Exact setup, hold, and propagation limits depend on the selected device.', 40, '2026-10-31 08:43:53', '2026-10-31 08:43:53');

-- --------------------------------------------------------

--
-- Table structure for table `component_specifications`
--

CREATE TABLE `component_specifications` (
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `specification_id` bigint(20) UNSIGNED NOT NULL,
  `numeric_value` decimal(18,6) DEFAULT NULL,
  `text_value` varchar(300) DEFAULT NULL,
  `range_min` decimal(18,6) DEFAULT NULL,
  `range_max` decimal(18,6) DEFAULT NULL,
  `unit_override` varchar(40) DEFAULT NULL,
  `source_note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `component_specifications`
--

INSERT INTO `component_specifications` (`component_id`, `specification_id`, `numeric_value`, `text_value`, `range_min`, `range_max`, `unit_override`, `source_note`) VALUES
(1, 1, 10.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational decade-counter model; not an IC rating'),
(1, 2, 4.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational decade-counter model; not an IC rating'),
(2, 1, 8.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational Mod-8 counter model; not an IC rating'),
(2, 2, 3.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational Mod-8 counter model; not an IC rating'),
(3, 1, 8.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational Mod-8 counter model; not an IC rating'),
(3, 2, 3.000000, NULL, NULL, NULL, NULL, 'Logical property of the educational Mod-8 counter model; not an IC rating'),
(11, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(12, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(13, 3, 1.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(14, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(15, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(16, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(17, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(68, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(69, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(70, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(71, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(72, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(73, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(74, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(75, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count'),
(76, 3, 2.000000, NULL, NULL, NULL, NULL, 'Logical input count');

-- --------------------------------------------------------

--
-- Table structure for table `component_tags`
--

CREATE TABLE `component_tags` (
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `tag_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `component_tags`
--

INSERT INTO `component_tags` (`component_id`, `tag_id`) VALUES
(1, 1),
(1, 2),
(1, 10),
(1, 11),
(2, 1),
(2, 2),
(2, 10),
(2, 11),
(3, 1),
(3, 2),
(3, 10),
(3, 11),
(4, 1),
(4, 2),
(4, 10),
(4, 11),
(5, 1),
(5, 2),
(5, 10),
(5, 11),
(6, 1),
(6, 2),
(6, 10),
(6, 11),
(7, 1),
(7, 2),
(7, 10),
(7, 11),
(8, 1),
(8, 2),
(8, 10),
(8, 11),
(9, 1),
(9, 2),
(9, 10),
(9, 11),
(11, 1),
(11, 3),
(12, 1),
(12, 3),
(13, 1),
(13, 3),
(14, 1),
(14, 3),
(15, 1),
(15, 3),
(16, 1),
(16, 3),
(17, 1),
(17, 3),
(18, 1),
(18, 3),
(19, 1),
(19, 3),
(20, 1),
(20, 3),
(21, 1),
(21, 3),
(22, 4),
(23, 4),
(24, 4),
(25, 4),
(26, 4),
(27, 4),
(28, 4),
(29, 4),
(30, 4),
(31, 5),
(31, 6),
(32, 5),
(32, 6),
(33, 5),
(33, 6),
(34, 5),
(34, 6),
(35, 5),
(35, 6),
(36, 7),
(37, 7),
(38, 7),
(39, 7),
(40, 8),
(41, 8),
(42, 9),
(43, 9),
(44, 9),
(45, 9),
(46, 1),
(46, 2),
(46, 10),
(46, 11),
(47, 1),
(47, 2),
(47, 10),
(47, 11),
(48, 1),
(48, 2),
(48, 10),
(48, 11),
(49, 1),
(49, 2),
(49, 10),
(49, 11),
(50, 1),
(50, 2),
(50, 10),
(50, 11),
(51, 1),
(51, 2),
(51, 10),
(51, 11),
(52, 1),
(52, 2),
(52, 10),
(52, 11),
(53, 1),
(53, 2),
(53, 10),
(53, 11),
(54, 1),
(54, 2),
(54, 10),
(54, 11),
(55, 1),
(55, 2),
(55, 10),
(55, 11),
(56, 1),
(56, 2),
(56, 10),
(56, 11),
(57, 1),
(57, 2),
(57, 10),
(57, 11),
(61, 1),
(61, 2),
(61, 10),
(61, 11),
(62, 1),
(62, 2),
(62, 10),
(62, 11),
(68, 1),
(68, 3),
(69, 1),
(69, 3),
(70, 1),
(70, 3),
(71, 1),
(71, 3),
(72, 1),
(72, 3),
(73, 1),
(73, 3),
(74, 1),
(74, 3),
(75, 1),
(75, 3),
(76, 1),
(76, 3),
(77, 1),
(77, 3),
(78, 1),
(78, 3),
(80, 1),
(80, 3),
(81, 1),
(81, 3),
(82, 1),
(82, 3),
(83, 1),
(83, 3),
(84, 1),
(84, 3),
(85, 1),
(85, 3),
(86, 1),
(86, 3),
(87, 1),
(87, 3),
(88, 1),
(88, 3),
(89, 1),
(89, 3),
(90, 1),
(90, 3),
(91, 1),
(91, 3),
(92, 4),
(93, 4),
(94, 4),
(95, 4),
(96, 4),
(97, 4),
(98, 4),
(99, 4),
(100, 4),
(101, 4),
(102, 4),
(104, 4),
(106, 4),
(107, 4),
(108, 4),
(111, 4),
(113, 5),
(113, 6),
(114, 5),
(114, 6),
(115, 5),
(115, 6),
(116, 5),
(116, 6),
(117, 5),
(117, 6),
(118, 5),
(118, 6),
(119, 5),
(119, 6),
(120, 5),
(120, 6),
(121, 5),
(121, 6),
(122, 5),
(122, 6),
(123, 7),
(124, 7),
(125, 7),
(126, 7),
(127, 7),
(128, 7),
(129, 7),
(130, 7),
(131, 7),
(132, 7),
(134, 8),
(135, 8),
(136, 8),
(137, 8),
(138, 8),
(139, 9),
(140, 9),
(141, 9),
(142, 9),
(143, 9),
(144, 9),
(145, 9),
(146, 9),
(147, 9);

-- --------------------------------------------------------

--
-- Table structure for table `content_types`
--

CREATE TABLE `content_types` (
  `content_type_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(40) NOT NULL,
  `label` varchar(100) NOT NULL,
  `render_kind` varchar(30) NOT NULL,
  `description` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `content_types`
--

INSERT INTO `content_types` (`content_type_id`, `code`, `label`, `render_kind`, `description`) VALUES
(1, 'TEXT', 'Text', 'TEXT', 'Readable prose or lists'),
(2, 'IMAGE', 'Image', 'IMAGE', 'Image or image resource'),
(3, 'TABLE', 'Table', 'TABLE', 'Structured table; content is JSON text'),
(4, 'EQUATION', 'Equation', 'EQUATION', 'LaTeX equation source'),
(5, 'DIAGRAM', 'Diagram', 'SVG_DIAGRAM', 'SVG diagram path'),
(6, 'GRAPH', 'Graph', 'SVG_DIAGRAM', 'Graph image or SVG resource'),
(7, 'DOCUMENT', 'Document', 'DOCUMENT', 'Datasheet or document URL');

-- --------------------------------------------------------

--
-- Table structure for table `recently_viewed`
--

CREATE TABLE `recently_viewed` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `last_viewed_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `specifications`
--

CREATE TABLE `specifications` (
  `specification_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `unit` varchar(40) DEFAULT NULL,
  `value_kind` enum('NUMBER','TEXT','RANGE') NOT NULL DEFAULT 'TEXT',
  `description` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `specifications`
--

INSERT INTO `specifications` (`specification_id`, `name`, `unit`, `value_kind`, `description`) VALUES
(1, 'Number of States', NULL, 'NUMBER', 'Number of logical states'),
(2, 'Number of Bits', 'bit', 'NUMBER', 'Number of state bits'),
(3, 'Number of Inputs', NULL, 'NUMBER', 'Number of logic inputs'),
(4, 'Number of Data Inputs', NULL, 'NUMBER', 'Number of data inputs'),
(5, 'Number of Select Lines', NULL, 'NUMBER', 'Number of select lines'),
(6, 'Number of Outputs', NULL, 'NUMBER', 'Number of outputs'),
(7, 'Supply Voltage', 'V', 'RANGE', 'Supply voltage range'),
(8, 'Maximum Clock Frequency', 'Hz', 'NUMBER', 'Maximum clock frequency'),
(9, 'Propagation Delay', 'ns', 'NUMBER', 'Propagation delay'),
(10, 'Forward Voltage', 'V', 'RANGE', 'Forward voltage range'),
(11, 'Maximum Forward Current', 'A', 'NUMBER', 'Maximum forward current'),
(12, 'Zener Voltage', 'V', 'NUMBER', 'Nominal Zener voltage'),
(13, 'Collector Current', 'A', 'NUMBER', 'Collector current'),
(14, 'Drain-Source Voltage', 'V', 'NUMBER', 'Maximum drain-source voltage'),
(15, 'Gate Threshold Voltage', 'V', 'RANGE', 'Gate threshold range'),
(16, 'Voltage Gain', NULL, 'TEXT', 'Voltage gain expression or value'),
(17, 'Output Voltage', 'V', 'RANGE', 'Output voltage range'),
(18, 'Measurement Range', '°C', 'RANGE', 'Measurement range'),
(19, 'Resolution', 'bit', 'NUMBER', 'Resolution in bits'),
(20, 'Memory Capacity', 'bit', 'NUMBER', 'Memory capacity'),
(21, 'Coil Voltage', 'V', 'NUMBER', 'Relay coil voltage'),
(22, 'Rated Voltage', 'V', 'NUMBER', 'Rated voltage'),
(23, 'No-Load Speed', 'RPM', 'NUMBER', 'No-load speed'),
(24, 'Contact Configuration', NULL, 'TEXT', 'Contact arrangement');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `tag_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `slug` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`tag_id`, `name`, `slug`) VALUES
(1, 'digital', 'digital'),
(2, 'sequential-logic', 'sequential-logic'),
(3, 'combinational-logic', 'combinational-logic'),
(4, 'semiconductor', 'semiconductor'),
(5, 'analog', 'analog'),
(6, 'power', 'power'),
(7, 'sensor', 'sensor'),
(8, 'memory', 'memory'),
(9, 'electromechanical', 'electromechanical'),
(10, 'timing', 'timing'),
(11, 'state-machine', 'state-machine'),
(12, 'la-te-x', 'latex');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_seen_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_category_component_counts`
-- (See below for the actual view)
--
CREATE TABLE `v_category_component_counts` (
`category_id` bigint(20) unsigned
,`category_name` varchar(120)
,`component_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_component_catalogue`
-- (See below for the actual view)
--
CREATE TABLE `v_component_catalogue` (
`component_id` bigint(20) unsigned
,`component_name` varchar(180)
,`slug` varchar(200)
,`short_description` varchar(1000)
,`is_published` tinyint(1)
,`is_illustrative` tinyint(1)
,`category_id` bigint(20) unsigned
,`category_name` varchar(120)
,`parent_category_name` varchar(120)
);

-- --------------------------------------------------------

--
-- Structure for view `v_category_component_counts`
--
DROP TABLE IF EXISTS `v_category_component_counts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_category_component_counts`  AS SELECT `cat`.`category_id` AS `category_id`, `cat`.`name` AS `category_name`, count(`c`.`component_id`) AS `component_count` FROM (`categories` `cat` left join `components` `c` on(`c`.`category_id` = `cat`.`category_id`)) GROUP BY `cat`.`category_id`, `cat`.`name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_component_catalogue`
--
DROP TABLE IF EXISTS `v_component_catalogue`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_component_catalogue`  AS SELECT `c`.`component_id` AS `component_id`, `c`.`name` AS `component_name`, `c`.`slug` AS `slug`, `c`.`short_description` AS `short_description`, `c`.`is_published` AS `is_published`, `c`.`is_illustrative` AS `is_illustrative`, `cat`.`category_id` AS `category_id`, `cat`.`name` AS `category_name`, `parent`.`name` AS `parent_category_name` FROM ((`components` `c` join `categories` `cat` on(`cat`.`category_id` = `c`.`category_id`)) left join `categories` `parent` on(`parent`.`category_id` = `cat`.`parent_category_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `application_audit_log`
--
ALTER TABLE `application_audit_log`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_audit_table_time` (`table_name`,`changed_at`),
  ADD KEY `idx_audit_operation_time` (`operation_type`,`changed_at`);

--
-- Indexes for table `app_users`
--
ALTER TABLE `app_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_app_users_username` (`username`),
  ADD UNIQUE KEY `uq_app_users_email` (`email`);

--
-- Indexes for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`bookmark_id`),
  ADD UNIQUE KEY `uq_bookmarks_user_component` (`user_id`,`component_id`),
  ADD KEY `idx_bookmarks_user_created` (`user_id`,`created_at`),
  ADD KEY `fk_bookmarks_component` (`component_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `uq_categories_slug` (`slug`),
  ADD KEY `idx_categories_parent_order` (`parent_category_id`,`display_order`);

--
-- Indexes for table `category_content_types`
--
ALTER TABLE `category_content_types`
  ADD PRIMARY KEY (`category_id`,`section_key`),
  ADD KEY `idx_category_content_type` (`content_type_id`);

--
-- Indexes for table `collections`
--
ALTER TABLE `collections`
  ADD PRIMARY KEY (`collection_id`),
  ADD UNIQUE KEY `uq_collections_user_name` (`user_id`,`name`),
  ADD KEY `idx_collections_user` (`user_id`);

--
-- Indexes for table `collection_components`
--
ALTER TABLE `collection_components`
  ADD PRIMARY KEY (`collection_id`,`component_id`),
  ADD KEY `idx_collection_components_component` (`component_id`);

--
-- Indexes for table `components`
--
ALTER TABLE `components`
  ADD PRIMARY KEY (`component_id`),
  ADD UNIQUE KEY `uq_components_slug` (`slug`),
  ADD KEY `idx_components_category` (`category_id`),
  ADD KEY `idx_components_published_category` (`is_published`,`category_id`),
  ADD KEY `idx_components_name` (`name`);

--
-- Indexes for table `component_content`
--
ALTER TABLE `component_content`
  ADD PRIMARY KEY (`component_content_id`),
  ADD UNIQUE KEY `uq_component_content_section` (`component_id`,`section_key`),
  ADD KEY `idx_component_content_order` (`component_id`,`display_order`),
  ADD KEY `idx_component_content_type` (`content_type_id`);

--
-- Indexes for table `component_diagrams`
--
ALTER TABLE `component_diagrams`
  ADD PRIMARY KEY (`diagram_id`),
  ADD KEY `idx_component_diagrams_order` (`component_id`,`display_order`),
  ADD KEY `idx_component_diagrams_kind` (`component_id`,`diagram_kind`);

--
-- Indexes for table `component_specifications`
--
ALTER TABLE `component_specifications`
  ADD PRIMARY KEY (`component_id`,`specification_id`),
  ADD KEY `idx_component_specs_spec` (`specification_id`);

--
-- Indexes for table `component_tags`
--
ALTER TABLE `component_tags`
  ADD PRIMARY KEY (`component_id`,`tag_id`),
  ADD KEY `idx_component_tags_tag` (`tag_id`);

--
-- Indexes for table `content_types`
--
ALTER TABLE `content_types`
  ADD PRIMARY KEY (`content_type_id`),
  ADD UNIQUE KEY `uq_content_types_code` (`code`);

--
-- Indexes for table `recently_viewed`
--
ALTER TABLE `recently_viewed`
  ADD PRIMARY KEY (`user_id`,`component_id`),
  ADD KEY `idx_recently_viewed_user_time` (`user_id`,`last_viewed_at`),
  ADD KEY `fk_recently_viewed_component` (`component_id`);

--
-- Indexes for table `specifications`
--
ALTER TABLE `specifications`
  ADD PRIMARY KEY (`specification_id`),
  ADD UNIQUE KEY `uq_specifications_name` (`name`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`tag_id`),
  ADD UNIQUE KEY `uq_tags_name` (`name`),
  ADD UNIQUE KEY `uq_tags_slug` (`slug`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `uq_user_sessions_token` (`token_hash`),
  ADD KEY `idx_user_sessions_user` (`user_id`),
  ADD KEY `idx_user_sessions_expiry` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `application_audit_log`
--
ALTER TABLE `application_audit_log`
  MODIFY `audit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `app_users`
--
ALTER TABLE `app_users`
  MODIFY `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `bookmark_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `collections`
--
ALTER TABLE `collections`
  MODIFY `collection_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `components`
--
ALTER TABLE `components`
  MODIFY `component_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;

--
-- AUTO_INCREMENT for table `component_content`
--
ALTER TABLE `component_content`
  MODIFY `component_content_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=527;

--
-- AUTO_INCREMENT for table `component_diagrams`
--
ALTER TABLE `component_diagrams`
  MODIFY `diagram_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=733;

--
-- AUTO_INCREMENT for table `content_types`
--
ALTER TABLE `content_types`
  MODIFY `content_type_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `specifications`
--
ALTER TABLE `specifications`
  MODIFY `specification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `tag_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `session_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `fk_bookmarks_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_category_id`) REFERENCES `categories` (`category_id`) ON UPDATE CASCADE;

--
-- Constraints for table `category_content_types`
--
ALTER TABLE `category_content_types`
  ADD CONSTRAINT `fk_cct_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cct_content_type` FOREIGN KEY (`content_type_id`) REFERENCES `content_types` (`content_type_id`) ON UPDATE CASCADE;

--
-- Constraints for table `collections`
--
ALTER TABLE `collections`
  ADD CONSTRAINT `fk_collections_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `collection_components`
--
ALTER TABLE `collection_components`
  ADD CONSTRAINT `fk_collection_components_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`collection_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_collection_components_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `components`
--
ALTER TABLE `components`
  ADD CONSTRAINT `fk_components_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON UPDATE CASCADE;

--
-- Constraints for table `component_content`
--
ALTER TABLE `component_content`
  ADD CONSTRAINT `fk_component_content_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_component_content_type` FOREIGN KEY (`content_type_id`) REFERENCES `content_types` (`content_type_id`) ON UPDATE CASCADE;

--
-- Constraints for table `component_diagrams`
--
ALTER TABLE `component_diagrams`
  ADD CONSTRAINT `fk_component_diagrams_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `component_specifications`
--
ALTER TABLE `component_specifications`
  ADD CONSTRAINT `fk_component_specs_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_component_specs_spec` FOREIGN KEY (`specification_id`) REFERENCES `specifications` (`specification_id`) ON UPDATE CASCADE;

--
-- Constraints for table `component_tags`
--
ALTER TABLE `component_tags`
  ADD CONSTRAINT `fk_component_tags_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_component_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `recently_viewed`
--
ALTER TABLE `recently_viewed`
  ADD CONSTRAINT `fk_recently_viewed_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`component_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recently_viewed_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
