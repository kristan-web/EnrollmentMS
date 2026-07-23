-- --------------------------------------------------------
-- Accounting module -- starting fee schedule
-- Run after schema/01_accounting_tables.sql
--
-- These are the same seven fees currently hardcoded in
-- api/Models/payment_model.php (FeeSchedule::items()), so importing this
-- gives the same 19,300.00 total the pages already show.
--
-- Safe to run twice: the rows are keyed on (code, school_year, semester) and
-- an existing row is updated rather than duplicated.
-- --------------------------------------------------------

USE `enrollment_management_system`;

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

-- Check: should come back as 19300.00
-- SELECT SUM(`amount`) AS total_assessment
--   FROM `acct_fees`
--  WHERE `school_year` = '2026-2027'
--    AND `semester` = '1st Semester'
--    AND `is_active` = 1;
