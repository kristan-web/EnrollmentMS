-- =============================================================================
-- New tables — added after the original src/schema/schema.sql
-- =============================================================================
-- These three tables exist in the running database but are NOT in the main
-- schema.sql, so a fresh import of schema.sql alone would be missing them.
-- Run this file once, after schema.sql, to add them.
--
-- Import (phpMyAdmin): pick the `enrollment_management_system` database ->
--   Import tab -> choose this file -> Go.
-- Import (command line):
--   mysql -u root enrollment_management_system < new_tables.sql
--
-- Everything uses CREATE TABLE IF NOT EXISTS and an idempotent seed, so it is
-- safe to run more than once.
--
--   acct_fees      the editable fee schedule (accounting module)
--   acct_payments  online payment attempts recorded during PayMongo checkout
--   audit_logs     admin-console sign-ins and staff-account changes
-- =============================================================================

USE `enrollment_management_system`;

SET NAMES utf8mb4;


-- -----------------------------------------------------------------------------
-- acct_fees — the fee schedule, one row per fee per term.
-- Read by FeeSchedule (accounting/api/Models/payment_model.php) so the amounts
-- can be edited in the database instead of in code.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `acct_fees` (
  `fee_id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL COMMENT 'TUITION, MISC, LAB ...',
  `name` varchar(100) NOT NULL,
  `note` varchar(255) DEFAULT NULL COMMENT 'small grey line under the name',
  `amount` decimal(10,2) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `school_year` varchar(9) NOT NULL COMMENT 'e.g. 2026-2027',
  `semester` enum('1st Semester','2nd Semester') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0 hides it without deleting',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`fee_id`),
  UNIQUE KEY `uq_fee_per_term` (`code`,`school_year`,`semester`),
  KEY `idx_term` (`school_year`,`semester`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Starting fee schedule (sums to 19,300.00 for 2026-2027, 1st Semester).
-- Safe to re-run: existing rows are updated, not duplicated.
INSERT INTO `acct_fees`
  (`code`, `name`, `note`, `amount`, `is_required`, `school_year`, `semester`, `sort_order`)
VALUES
  ('TUITION', 'Tuition Fee',           'Per semester',                 12000.00, 1, '2026-2027', '1st Semester', 1),
  ('MISC',    'Miscellaneous Fee',     'Guidance, athletics, etc.',     3500.00, 1, '2026-2027', '1st Semester', 2),
  ('LAB',     'Laboratory Fee',        'Computer & science labs',       1800.00, 1, '2026-2027', '1st Semester', 3),
  ('REG',     'Registration Fee',      'One-time this semester',         500.00, 1, '2026-2027', '1st Semester', 4),
  ('LIB',     'Library Fee',           'Books & online resources',       400.00, 1, '2026-2027', '1st Semester', 5),
  ('MEDDENT', 'Medical & Dental Fee',  'Clinic services',                350.00, 1, '2026-2027', '1st Semester', 6),
  ('IDMAT',   'ID & School Materials', 'School ID, modules, handbook',   750.00, 1, '2026-2027', '1st Semester', 7)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `note`        = VALUES(`note`),
  `amount`      = VALUES(`amount`),
  `is_required` = VALUES(`is_required`),
  `sort_order`  = VALUES(`sort_order`);


-- -----------------------------------------------------------------------------
-- acct_payments — the accounting module's own record of online payment attempts
-- (separate from the cashier's `payments` table, which needs an enrollment_id).
-- A row is written 'pending' when a PayMongo checkout link is created and
-- settled to 'paid'/'failed'/… when ?action=status confirms it.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `acct_payments` (
  `acct_payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `reference` varchar(40) NOT NULL COMMENT 'ours, e.g. SOA-2026-4821-7Q3K',
  `student_number` varchar(20) NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `semester` enum('1st Semester','2nd Semester') NOT NULL,
  `plan` enum('full','down','custom') NOT NULL DEFAULT 'full',
  `method` enum('gcash','maya','grabpay','card') DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL COMMENT 'pesos; PayMongo is billed in centavos',
  `status` enum('pending','paid','failed','expired','cancelled') NOT NULL DEFAULT 'pending',
  `checkout_session_id` varchar(100) DEFAULT NULL COMMENT 'PayMongo cs_...',
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`acct_payment_id`),
  UNIQUE KEY `uq_reference` (`reference`),
  KEY `idx_session` (`checkout_session_id`),
  KEY `idx_student` (`student_number`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- audit_logs — admin-console sign-ins and staff-account changes.
-- Written by the admin console (Staff Accounts) and the registrar/cashier
-- login handlers; read by the Audit Logs page.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `log_id`     int(11) NOT NULL AUTO_INCREMENT,
  `actor_id`   int(11) DEFAULT NULL COMMENT 'users.user_id of who acted (NULL if unknown)',
  `actor_name` varchar(100) DEFAULT NULL,
  `actor_role` varchar(20)  DEFAULT NULL,
  `action`     varchar(40)  NOT NULL COMMENT 'login | logout | create_account | update_account | reset_password | delete_account',
  `entity`     varchar(40)  DEFAULT NULL COMMENT 'what was acted on, e.g. user',
  `entity_id`  int(11)      DEFAULT NULL,
  `details`    varchar(255) DEFAULT NULL COMMENT 'human-readable summary',
  `ip_address` varchar(45)  DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_actor`   (`actor_id`),
  KEY `idx_action`  (`action`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
