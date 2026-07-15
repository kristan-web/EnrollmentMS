-- --------------------------------------------------------
-- Accounting module -- tables
-- Target: XAMPP (MariaDB / MySQL), database `enrollment_management_system`
--
-- Adds to the database made by src/schema/schema.sql. It does not change or
-- drop anything already there. Both tables are prefixed `acct_` so they can't
-- collide with the existing `payments` table.
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET NAMES utf8mb4 */;

USE `enrollment_management_system`;

-- --------------------------------------------------------
-- Table `acct_fees`
--
-- The fee schedule, one row per fee per term. This is meant to replace the
-- hardcoded FeeSchedule::items() in api/Models/payment_model.php so the
-- amounts can be edited instead of living in the code.
-- --------------------------------------------------------

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

-- --------------------------------------------------------
-- Table `acct_payments`
--
-- One row per checkout started from the accounting module.
--
-- The existing `payments` table needs an `enrollment_id`, but this module only
-- asks for a typed student number, so it can't fill that in. This table keeps
-- the cashier's own record. If the student number is later matched to a real
-- enrollment, a row can be copied across.
--
-- The enum values match the codes used in the code:
--   plan   -> Payment::allowedPlans()
--   method -> Payment::methodMap() keys
-- --------------------------------------------------------

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

COMMIT;
