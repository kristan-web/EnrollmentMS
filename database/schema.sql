-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 24, 2026 at 05:26 AM
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
-- Database: `enrollment_management_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `acct_fees`
--

CREATE TABLE `acct_fees` (
  `fee_id` int(11) NOT NULL,
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
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `acct_fees`
--

INSERT INTO `acct_fees` (`fee_id`, `code`, `name`, `note`, `amount`, `is_required`, `school_year`, `semester`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'TUITION', 'Tuition Fee', 'Per semester', 12000.00, 1, '2026-2027', '1st Semester', 1, 1, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(2, 'MISC', 'Miscellaneous Fee', 'Guidance, athletics, etc.', 3500.00, 1, '2026-2027', '1st Semester', 1, 2, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(3, 'LAB', 'Laboratory Fee', 'Computer & science labs', 1800.00, 1, '2026-2027', '1st Semester', 1, 3, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(4, 'REG', 'Registration Fee', 'One-time this semester', 500.00, 1, '2026-2027', '1st Semester', 1, 4, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(5, 'LIB', 'Library Fee', 'Books & online resources', 400.00, 1, '2026-2027', '1st Semester', 1, 5, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(6, 'MEDDENT', 'Medical & Dental Fee', 'Clinic services', 350.00, 1, '2026-2027', '1st Semester', 1, 6, '2026-07-23 16:28:09', '2026-07-23 16:28:09'),
(7, 'IDMAT', 'ID & School Materials', 'School ID, modules, handbook', 750.00, 1, '2026-2027', '1st Semester', 1, 7, '2026-07-23 16:28:09', '2026-07-23 16:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `acct_payments`
--

CREATE TABLE `acct_payments` (
  `acct_payment_id` int(11) NOT NULL,
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
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applicants`
--

CREATE TABLE `applicants` (
  `applicant_id` int(11) NOT NULL,
  `reference_number` varchar(20) NOT NULL,
  `applicant_type` enum('New Student','Transferee') NOT NULL DEFAULT 'New Student',
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `birthdate` date NOT NULL,
  `address` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `lrn` varchar(12) DEFAULT NULL,
  `desired_grade_level` enum('11','12') NOT NULL,
  `desired_strand_id` int(11) NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `father_contact_number` varchar(20) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `mother_contact_number` varchar(20) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `guardian_contact_number` varchar(20) DEFAULT NULL,
  `emergency_contact_name` varchar(100) NOT NULL,
  `emergency_contact_relationship` varchar(50) NOT NULL,
  `emergency_contact_number` varchar(20) NOT NULL,
  `status` enum('Pending','Under Review','Approved','Rejected','Enrolled') NOT NULL DEFAULT 'Pending',
  `rejection_reason` varchar(255) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `converted_student_id` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applicants`
--

INSERT INTO `applicants` (`applicant_id`, `reference_number`, `applicant_type`, `first_name`, `last_name`, `middle_name`, `gender`, `birthdate`, `address`, `contact_number`, `email`, `lrn`, `desired_grade_level`, `desired_strand_id`, `school_year`, `father_name`, `father_contact_number`, `mother_name`, `mother_contact_number`, `guardian_name`, `guardian_relationship`, `guardian_contact_number`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_number`, `status`, `rejection_reason`, `reviewed_by`, `reviewed_at`, `converted_student_id`, `submitted_at`) VALUES
(1, 'EMS-2026-574324', 'New Student', 'Almario', 'Kristan', 'Stacy Garcia', 'Male', '1995-12-31', 'Anim qui rerum bland', '09999999999', 'pawatytil@mailinator.com', '875554564645', '11', 2, '2026-2027', 'Alexa Vega', '09099999999', 'Kenyon Franks', '09999999999', 'Olivia Henry', 'Aut id est maiores a', '09999999999', 'Leigh Pierce', 'Aliquid praesentium', '09999999999', 'Approved', '', NULL, '2026-07-18 03:10:18', 12, '2026-07-18 03:09:53'),
(2, 'EMS-2026-936527', 'Transferee', 'Evelyn', 'Wolf', 'Olivia Roach', 'Female', '1984-11-18', 'Sed et aperiam venia', '09999999999', 'hofako@mailinator.com', '099999999999', '12', 6, '2026-2027', 'Rana Davidson', '09999999999', 'Heidi Perry', '09999999999', 'Alfonso Steele', 'Incididunt dolore pr', '09999999999', 'Tanner Benson', 'Nulla laboriosam al', '09999999999', 'Approved', '', NULL, '2026-07-23 16:54:39', 13, '2026-07-23 16:20:53'),
(3, 'EMS-2026-243983', 'Transferee', 'Sawyer', 'Wilkinson', 'Ferdinand Kidd', 'Female', '1970-02-10', 'Eos iusto obcaecati', '09999999999', 'mewy@mailinator.com', '099999999999', '11', 1, '2026-2027', 'Quemby Christensen', '09999999999', '09999999999999999999', '09999999999', 'Nissim Weber', 'Officia necessitatib', '09999999999', 'Wylie Tyler', 'Odio magnam quo moll+1 (947) 595-7124', '09999999999', '', 'Ang pangit talaga pre', NULL, '2026-07-24 01:43:09', NULL, '2026-07-24 01:42:24'),
(4, 'EMS-2026-737235', 'Transferee', 'Brenda', 'Kent', 'Florence Nielsen', 'Male', '1992-03-22', 'Consequatur digniss', '09999999999', 'fatotyqojy@mailinator.com', '999999999999', '11', 2, '2026-2027', 'Oliver Clark', '09999999999', 'Ina Franks', '09999999999', 'Desirae Strong', 'Dolores provident i', '09999999999', 'Irene Blake', 'Possimus laborum A', '09999999999', 'Rejected', 'pangit', NULL, '2026-07-24 02:00:04', NULL, '2026-07-24 01:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `applicant_documents`
--

CREATE TABLE `applicant_documents` (
  `document_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `status` enum('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  `remarks` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applicant_documents`
--

INSERT INTO `applicant_documents` (`document_id`, `applicant_id`, `document_type_id`, `file_path`, `original_filename`, `file_size`, `mime_type`, `status`, `remarks`, `uploaded_at`) VALUES
(5, 1, 5, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-938506/5045393a9434439b74c56d07fcd0cb6a.png', 'Schedule (11).png', 70070, 'image/png', 'Pending', NULL, '2026-07-06 00:19:00'),
(21, 1, 1, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-574324/af8987961037d1d1f9f9e5fb141c96d6.pdf', 'COLORED-1-COPY_20260715_135637_0000.pdf', 79141, 'application/pdf', 'Pending', NULL, '2026-07-18 03:09:53'),
(22, 1, 2, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-574324/6e5b6691bd04d3030d1d2abc72cd11cf.pdf', 'COLORED-1-COPY_20260715_135637_0000.pdf', 79141, 'application/pdf', 'Pending', NULL, '2026-07-18 03:09:53'),
(23, 1, 3, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-574324/0db2dc6366ac99b8c0114e925ae79f57.pdf', 'LEARNING-OUTCOME-FORMAT.pdf', 282750, 'application/pdf', 'Pending', NULL, '2026-07-18 03:09:53'),
(24, 1, 4, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-574324/f0dff2b19b67b369d003647e1d67fd13.pdf', 'COLORED-1-COPY_20260715_135637_0000.pdf', 79141, 'application/pdf', 'Pending', NULL, '2026-07-18 03:09:53'),
(25, 2, 1, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-936527/a925050ebfcb316df78e8798cb07781d.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-23 16:20:53'),
(26, 2, 2, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-936527/9e7cef91b8c524bde8aeec21d159c8bc.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-23 16:20:53'),
(27, 2, 3, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-936527/ebb16ede6a28756d48bdc8f9f8e90d1d.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-23 16:20:53'),
(28, 2, 4, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-936527/29364e859339770554a392a727c602ba.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-23 16:20:53'),
(29, 2, 5, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-936527/166a3ae3d04bf4218d22c6c97237dccd.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-23 16:20:53'),
(30, 3, 1, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-243983/02f077a6e9479890efc0adb903c9df62.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:42:24'),
(31, 3, 2, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-243983/1e614eaad16b8f05827a83865be0a8b6.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:42:24'),
(32, 3, 3, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-243983/0ca51116ebef15ca18080595f79fe690.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:42:24'),
(33, 3, 4, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-243983/be0fb11ba78cd0cffaf745e50c440be1.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:42:25'),
(34, 3, 5, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-243983/8ede501653b2a334cd9aa604599375b4.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:42:25'),
(35, 4, 1, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-737235/695ab64968b5e3cf54374e0c22943f24.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:47:02'),
(36, 4, 2, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-737235/39348646cbe8201362298b0004a2ab0a.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:47:02'),
(37, 4, 3, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-737235/2244aa4e908991582987b2b4ffb52503.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:47:02'),
(38, 4, 4, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-737235/39d35c5003db241faad2eb7cae90ce35.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:47:02'),
(39, 4, 5, 'C:/xampp/enrollment_uploads/applicants/EMS-2026-737235/d46713695033839823b091913ae6fbde.jpg', '742324485_1960946938195230_5444947441481501899_n.jpg', 315003, 'image/jpeg', 'Pending', NULL, '2026-07-24 01:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `class_sections`
--

CREATE TABLE `class_sections` (
  `section_id` int(11) NOT NULL,
  `strand_id` int(11) NOT NULL,
  `adviser_id` int(11) DEFAULT NULL,
  `grade_level` enum('11','12') NOT NULL,
  `section_name` varchar(50) NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `max_slots` int(11) NOT NULL,
  `status` enum('Open','Closed','Cancelled') NOT NULL DEFAULT 'Open',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_sections`
--

INSERT INTO `class_sections` (`section_id`, `strand_id`, `adviser_id`, `grade_level`, `section_name`, `school_year`, `max_slots`, `status`, `created_at`) VALUES
(1, 1, 1, '11', 'STEM 11-A', '2026-2027', 40, 'Open', '2026-07-12 17:38:05'),
(2, 1, 1, '11', 'STEM 11-B', '2026-2027', 40, 'Open', '2026-07-12 17:38:05'),
(3, 1, 1, '12', 'STEM 12-A', '2026-2027', 40, 'Open', '2026-07-12 17:38:05'),
(4, 1, 1, '12', 'STEM 12-B', '2026-2027', 38, 'Closed', '2026-07-12 17:38:05'),
(5, 2, 1, '11', 'ABM 11-A', '2026-2027', 42, 'Open', '2026-07-12 17:38:05'),
(6, 2, 1, '11', 'ABM 11-B', '2026-2027', 42, 'Open', '2026-07-12 17:38:05'),
(7, 2, 1, '12', 'ABM 12-A', '2026-2027', 40, 'Open', '2026-07-12 17:38:05'),
(8, 2, 1, '12', 'ABM 12-B', '2026-2027', 40, 'Closed', '2026-07-12 17:38:05'),
(9, 3, 1, '11', 'HUMSS 11-A', '2026-2027', 45, 'Open', '2026-07-12 17:38:05'),
(10, 3, 1, '11', 'HUMSS 11-B', '2026-2027', 45, 'Open', '2026-07-12 17:38:05'),
(11, 3, 1, '12', 'HUMSS 12-A', '2026-2027', 42, 'Open', '2026-07-12 17:38:05'),
(12, 3, 1, '12', 'HUMSS 12-B', '2026-2027', 42, 'Closed', '2026-07-12 17:38:05'),
(13, 5, 1, '11', 'ICT 11-A', '2026-2027', 35, 'Open', '2026-07-12 17:38:05'),
(14, 5, 1, '11', 'ICT 11-B', '2026-2027', 35, 'Open', '2026-07-12 17:38:05'),
(15, 5, 1, '12', 'ICT 12-A', '2026-2027', 35, 'Open', '2026-07-12 17:38:05'),
(16, 5, 1, '12', 'ICT 12-B', '2026-2027', 30, 'Closed', '2026-07-12 17:38:05'),
(17, 6, 1, '11', 'HE 11-A', '2026-2027', 38, 'Open', '2026-07-12 17:38:05'),
(18, 6, 1, '11', 'HE 11-B', '2026-2027', 38, 'Open', '2026-07-12 17:38:05'),
(19, 6, 1, '12', 'HE 12-A', '2026-2027', 36, 'Open', '2026-07-12 17:38:05'),
(20, 6, 1, '12', 'HE 12-B', '2026-2027', 36, 'Closed', '2026-07-12 17:38:05');

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

CREATE TABLE `document_types` (
  `document_type_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `applicant_type` enum('New Student','Transferee','All') NOT NULL DEFAULT 'All',
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`document_type_id`, `name`, `description`, `applicant_type`, `is_required`, `is_active`, `sort_order`, `created_at`) VALUES
(1, 'Form 138 (Report Card)', 'Proof of previous academic performance / Grade 10 completion', 'All', 1, 1, 1, '2026-07-05 23:27:06'),
(2, 'Certificate of Good Moral Character', 'Behavioral clearance from previous school', 'All', 1, 1, 2, '2026-07-05 23:27:06'),
(3, 'PSA Birth Certificate (photocopy)', 'Identity & age verification', 'All', 1, 1, 3, '2026-07-05 23:27:06'),
(4, '2x2 ID Photo', 'School ID, records', 'All', 1, 1, 4, '2026-07-05 23:27:06'),
(5, 'Certificate of Transfer / Honorable Dismissal', 'Confirms clearance from the previous school', 'Transferee', 1, 1, 5, '2026-07-05 23:27:06');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `enrollment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `semester` enum('1st Semester','2nd Semester') NOT NULL,
  `date_enrolled` datetime DEFAULT current_timestamp(),
  `status` enum('Enrolled','Dropped','Pending') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`enrollment_id`, `student_id`, `section_id`, `school_year`, `school_year_id`, `semester`, `date_enrolled`, `status`) VALUES
(8, 10, 5, '2026-2027', 1, '1st Semester', '2026-07-23 17:21:16', 'Enrolled');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `enrollment_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','PayMongo') NOT NULL,
  `paymongo_reference_id` varchar(100) DEFAULT NULL,
  `payment_status` enum('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  `payment_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `enrollment_id`, `amount`, `payment_method`, `paymongo_reference_id`, `payment_status`, `payment_date`) VALUES
(1, 8, 19300.00, 'Cash', NULL, 'Paid', '2026-07-24 11:03:02');

-- --------------------------------------------------------

--
-- Table structure for table `payment_proofs`
--

CREATE TABLE `payment_proofs` (
  `proof_id` int(11) NOT NULL,
  `student_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  `remarks` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_name` varchar(50) NOT NULL,
  `building` varchar(50) NOT NULL,
  `capacity` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `room_name`, `building`, `capacity`, `created_at`) VALUES
(1, 'SHS-101', 'Main Building', 40, '2026-07-14 03:07:53'),
(2, 'SHS-102', 'Main Building', 40, '2026-07-14 03:07:53'),
(3, 'SHS-103', 'Main Building', 45, '2026-07-14 03:07:53'),
(4, 'SHS-104', 'Main Building', 45, '2026-07-14 03:07:53'),
(5, 'SHS-105', 'Main Building', 40, '2026-07-14 03:07:53'),
(6, 'SHS-106', 'Main Building', 35, '2026-07-14 03:07:53'),
(7, 'SHS-201', 'Main Building', 40, '2026-07-14 03:07:53'),
(8, 'SHS-202', 'Main Building', 40, '2026-07-14 03:07:53'),
(9, 'SHS-203', 'Main Building', 45, '2026-07-14 03:07:53'),
(10, 'SHS-204', 'Main Building', 40, '2026-07-14 03:07:53'),
(11, 'SHS-301', 'Science Building', 35, '2026-07-14 03:07:53'),
(12, 'SHS-302', 'Science Building', 35, '2026-07-14 03:07:53'),
(13, 'SHS-303', 'Science Building', 30, '2026-07-14 03:07:53'),
(14, 'SHS-401', 'TVL Building', 30, '2026-07-14 03:07:53'),
(15, 'SHS-402', 'TVL Building', 30, '2026-07-14 03:07:53'),
(16, 'SHS-403', 'TVL Building', 25, '2026-07-14 03:07:53'),
(17, 'SHS-404', 'TVL Building', 25, '2026-07-14 03:07:53'),
(18, 'SHS-501', 'Annex Building', 40, '2026-07-14 03:07:53'),
(19, 'SHS-502', 'Annex Building', 40, '2026-07-14 03:07:53'),
(20, 'SHS-503', 'Annex Building', 35, '2026-07-14 03:07:53');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `room_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`schedule_id`, `section_id`, `subject_id`, `teacher_id`, `room_id`, `day_of_week`, `start_time`, `end_time`, `created_at`) VALUES
(1, 5, 5, 4, 1, 'Monday', '01:00:00', '09:00:00', '2026-07-14 03:17:12'),
(2, 5, 6, 4, 14, 'Monday', '10:00:00', '11:00:00', '2026-07-14 03:26:05'),
(3, 5, 6, 4, 13, 'Monday', '11:00:00', '12:00:00', '2026-07-14 03:38:00');

-- --------------------------------------------------------

--
-- Table structure for table `school_years`
--

CREATE TABLE `school_years` (
  `school_year_id` int(11) NOT NULL,
  `year` varchar(9) NOT NULL,
  `status` enum('active','closed') NOT NULL DEFAULT 'closed',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_years`
--

INSERT INTO `school_years` (`school_year_id`, `year`, `status`, `created_at`, `updated_at`) VALUES
(1, '2026-2027', 'active', '2026-07-05 02:32:50', '2026-07-05 02:32:50');

-- --------------------------------------------------------

--
-- Table structure for table `strands`
--

CREATE TABLE `strands` (
  `strand_id` int(11) NOT NULL,
  `track_id` int(11) NOT NULL,
  `strand_code` varchar(20) NOT NULL,
  `strand_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `strands`
--

INSERT INTO `strands` (`strand_id`, `track_id`, `strand_code`, `strand_name`, `description`, `created_at`) VALUES
(1, 1, 'STEM', 'Science, Technology, Engineering and Mathematics', 'For students inclined toward science and engineering courses', '2026-07-04 03:08:34'),
(2, 1, 'ABM', 'Accountancy, Business and Management', 'For students inclined toward business and finance-related courses', '2026-07-04 03:08:34'),
(3, 1, 'HUMSS', 'Humanities and Social Sciences', 'For students inclined toward law, education, and social science courses', '2026-07-04 03:08:34'),
(5, 2, 'ICT', 'Information and Communications Technology', 'Focuses on computer systems servicing, programming, and animation', '2026-07-04 03:08:34'),
(6, 2, 'HE', 'Home Economics', 'Focuses on cookery, food & beverage services, and tourism-related skills', '2026-07-04 03:08:34');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
  `lrn` varchar(12) NOT NULL,
  `student_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `birthdate` date NOT NULL,
  `address` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `grade_level` enum('11','12') NOT NULL,
  `status` enum('Active','Inactive','Graduated','Dropped') NOT NULL DEFAULT 'Active',
  `father_name` varchar(100) DEFAULT NULL,
  `father_contact_number` varchar(20) DEFAULT NULL,
  `father_occupation` varchar(100) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `mother_contact_number` varchar(20) DEFAULT NULL,
  `mother_occupation` varchar(100) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `guardian_contact_number` varchar(20) DEFAULT NULL,
  `guardian_address` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(100) NOT NULL,
  `emergency_contact_relationship` varchar(50) NOT NULL,
  `emergency_contact_number` varchar(20) NOT NULL,
  `archive_reason` varchar(255) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `lrn`, `student_number`, `first_name`, `last_name`, `middle_name`, `gender`, `birthdate`, `address`, `contact_number`, `email`, `grade_level`, `status`, `father_name`, `father_contact_number`, `father_occupation`, `mother_name`, `mother_contact_number`, `mother_occupation`, `guardian_name`, `guardian_relationship`, `guardian_contact_number`, `guardian_address`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_number`, `archive_reason`, `archived_at`, `created_at`) VALUES
(1, '123456789012', '2026-0001', 'saddasadsdasdasdas', 'Dela Cruz', 'Santos', 'Male', '2009-03-15', '123 Rizal St., Brgy. San Antonio, Dasmariñas, Cavite', '09171234501', 'juan.delacruz@example.com', '11', 'Inactive', 'Pedro Dela Cruz', '09171234502', 'Driver', 'Maria Dela Cruz', '09171234503', 'Vendor', '', '', '', '', 'Maria Dela Cruz', 'Mother', '09171234503', 'Transferred Out', '2026-07-08 17:23:05', '2026-07-04 03:38:34'),
(2, '123456789013', '2026-0002', 'Andrea', 'Santos', 'Reyes', 'Female', '2008-11-02', '45 Mabini Ave., Brgy. Zone 2, Dasmariñas, Cavite', '09171234504', 'andrea.santos@example.com', '12', 'Active', 'Roberto Santos', '09171234505', 'Engineer', 'Liza Santos', '09171234506', 'Teacher', NULL, NULL, NULL, NULL, 'Roberto Santos', 'Father', '09171234505', NULL, NULL, '2026-07-04 03:38:34'),
(3, '123456789014', '2026-0003', 'Miguel', 'Ramos', NULL, 'Male', '2009-06-21', '78 Aguinaldo Hwy., Brgy. Salawag, Dasmariñas, Cavite', '09171234507', 'miguel.ramos@example.com', '11', 'Active', NULL, NULL, NULL, 'Carmela Ramos', '09171234508', 'Nurse', 'Carmela Ramos', 'Mother', '09171234508', '78 Aguinaldo Hwy., Brgy. Salawag, Dasmariñas, Cavite', 'Carmela Ramos', 'Mother', '09171234508', NULL, NULL, '2026-07-04 03:38:34'),
(4, '123456789015', '2026-0004', 'Bianca', 'Torres', 'Mendoza', 'Female', '2008-09-09', '12 Molino Rd., Brgy. Molino III, Bacoor, Cavite', '09171234509', 'bianca.torres@example.com', '12', 'Active', 'Antonio Torres', '09171234510', 'Businessman', 'Grace Torres', '09171234511', 'Accountant', NULL, NULL, NULL, NULL, 'Grace Torres', 'Mother', '09171234511', NULL, NULL, '2026-07-04 03:38:34'),
(5, '123456789016', '2026-0005', 'Josh', 'Villanueva', 'Cruz', 'Male', '2009-01-30', '89 Governor\'s Dr., Brgy. Malagasang, Imus, Cavite', '09171234512', 'josh.villanueva@example.com', '11', 'Active', 'Nestor Villanueva', '09171234513', 'OFW', 'Rosario Villanueva', '09171234514', 'Housewife', 'Elena Cruz', 'Aunt', '09171234515', '90 Governor\'s Dr., Brgy. Malagasang, Imus, Cavite', 'Rosario Villanueva', 'Mother', '09171234514', NULL, NULL, '2026-07-04 03:38:34'),
(6, 'Non error al', '762', 'Whoopi', 'Villarreal', 'Arden Stephenson', 'Female', '2011-05-08', 'Cillum nobis do veli', '+1 (517) 876-6398', 'malelimaq@mailinator.com', '12', 'Active', 'Leroy Newton', '+1 (585) 175-3873', 'Et vero impedit fac', 'Clinton Ferguson', '+1 (686) 408-8277', 'Repudiandae necessit', 'Alexander Jones', 'Nihil commodo id nem', '+1 (986) 374-5567', 'Amet officia quae i', 'Stella Frazier', 'Explicabo Facere er', '+1 (339) 397-6779', NULL, NULL, '2026-07-04 04:06:34'),
(7, 'Maiores dolo', '590', 'Merrill', 'Dotson', 'Nerea Holder', 'Female', '2024-08-30', 'Debitis doloremque q', '+1 (444) 222-8575', 'nofupe@mailinator.com', '11', 'Inactive', 'Yael Quinn', '+1 (645) 754-3951', 'In asperiores beatae', 'Xaviera Stout', '+1 (818) 853-1765', 'Amet officiis illum', 'Caleb Rivas', 'Adipisci ut aspernat', '+1 (275) 194-1103', 'Id accusantium neque', 'Winter Houston', 'Nostrud dolor qui et', '+1 (907) 754-4473', 'Transferred Out', '2026-07-08 17:23:07', '2026-07-04 04:06:53'),
(8, '211222222222', '2026-8485', 'Christine', 'Farley', 'Britanney Conner', 'Female', '1994-03-15', 'Irure dolore ullamco', '09999999999', 'jesihebec@mailinator.com', '11', 'Active', 'Nigel Rodriquez', '09999999999', NULL, 'Idona Sharpe', '09999999999', NULL, 'Alden Branch', 'Minima minim tenetur', '09999999999', NULL, 'Daniel Lewis', 'Magnam mollit ea mol', '09999999999', NULL, NULL, '2026-07-17 02:55:57'),
(9, '888888888888', '2026-2198', 'Dillon', 'Sampson', 'Denton Wilkerson', 'Female', '2013-09-22', 'Exercitationem disti', '09999999999', 'senylahoni@mailinator.com', '12', 'Active', 'Iona Stout', '09999999999', NULL, 'Hiroko Mays', '09999999999', NULL, 'Caldwell Chen', 'Distinctio Voluptas', '09999999999', NULL, 'Yeo Pearson', 'Quo doloribus sapien', '09999999999', NULL, NULL, '2026-07-18 01:15:58'),
(10, '122222222222', '2026-4246', 'Sybil', 'Delaney', 'Riley Brennan', 'Male', '1982-01-03', 'Occaecat nihil molli', '09999999999', 'kristanalmario@gmail.com', '11', 'Active', 'Kevin Waller', '09999999999', NULL, 'Suki Ball', '09999999999', NULL, 'Salvador Rivas', 'Ad ut aut dolore ten0', '09999999999', NULL, 'Charde Ayers', 'Vitae tempora tempor', '09999999999', NULL, NULL, '2026-07-18 01:18:38'),
(12, '875554564645', '2026-4161', 'Almario', 'Kristan', 'Stacy Garcia', 'Male', '1995-12-31', 'Anim qui rerum bland', '09999999999', 'pawatytil@mailinator.com', '11', 'Active', 'Alexa Vega', '09099999999', NULL, 'Kenyon Franks', '09999999999', NULL, 'Olivia Henry', 'Aut id est maiores a', '09999999999', NULL, 'Leigh Pierce', 'Aliquid praesentium', '09999999999', NULL, NULL, '2026-07-18 03:10:18'),
(13, '099999999999', '2026-1571', 'Evelyn', 'Wolf', 'Olivia Roach', 'Female', '1984-11-18', 'Sed et aperiam venia', '09999999999', 'hofako@mailinator.com', '12', 'Active', 'Rana Davidson', '09999999999', NULL, 'Heidi Perry', '09999999999', NULL, 'Alfonso Steele', 'Incididunt dolore pr', '09999999999', NULL, 'Tanner Benson', 'Nulla laboriosam al', '09999999999', NULL, NULL, '2026-07-23 16:54:39');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `strand_id` int(11) DEFAULT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(150) NOT NULL,
  `subject_type` enum('Core','Applied','Specialized') NOT NULL DEFAULT 'Core',
  `grade_level` enum('11','12') NOT NULL,
  `semester` enum('1st Semester','2nd Semester') NOT NULL,
  `units` decimal(3,1) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `strand_id`, `subject_code`, `subject_name`, `subject_type`, `grade_level`, `semester`, `units`, `description`, `status`, `created_at`) VALUES
(3, NULL, 'ORALCOM', 'Oral Communication', 'Core', '11', '1st Semester', 1.0, 'Develops effective oral communication skills in various contexts.', 'Active', '2026-07-12 17:27:13'),
(4, NULL, 'KOMPAN', 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'Core', '11', '1st Semester', 1.0, 'Kasanayan sa komunikasyon at pananaliksik gamit ang wikang Filipino.', 'Active', '2026-07-12 17:27:13'),
(5, NULL, 'GENMATH', 'General Mathematics', 'Core', '11', '1st Semester', 1.0, 'Covers functions, business math, and logic.', 'Active', '2026-07-12 17:27:13'),
(6, NULL, 'EARTHLIFE', 'Earth and Life Science', 'Core', '11', '1st Semester', 1.0, 'Introductory earth science and biology concepts.', 'Active', '2026-07-12 17:27:13'),
(7, NULL, 'PERSDEV', 'Personal Development', 'Core', '11', '1st Semester', 1.0, 'Self-awareness and personal growth topics.', 'Active', '2026-07-12 17:27:13'),
(8, NULL, 'PHILO', 'Introduction to the Philosophy of the Human Person', 'Core', '11', '1st Semester', 1.0, 'Philosophical reflection on the human condition.', 'Active', '2026-07-12 17:27:13'),
(9, NULL, 'PE1', 'Physical Education and Health 1', 'Core', '11', '1st Semester', 1.0, 'Physical fitness and health education.', 'Active', '2026-07-12 17:27:13'),
(10, NULL, 'READWRITE', 'Reading and Writing Skills', 'Core', '11', '2nd Semester', 1.0, 'Develops critical reading and academic writing skills.', 'Active', '2026-07-12 17:27:13'),
(11, NULL, 'PAGBASA', 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik', 'Core', '11', '2nd Semester', 1.0, 'Kritikal na pagbasa at pagsusuri ng teksto.', 'Active', '2026-07-12 17:27:13'),
(12, NULL, 'STATPROB', 'Statistics and Probability', 'Core', '11', '2nd Semester', 1.0, 'Basic statistical concepts and probability.', 'Active', '2026-07-12 17:27:13'),
(13, NULL, 'PHYSCI', 'Physical Science', 'Core', '11', '2nd Semester', 1.0, 'Introductory chemistry and physics concepts.', 'Active', '2026-07-12 17:27:13'),
(14, NULL, 'UCSP', 'Understanding Culture, Society and Politics', 'Core', '11', '2nd Semester', 1.0, 'Anthropological, sociological, and political perspectives.', 'Active', '2026-07-12 17:27:13'),
(15, NULL, 'LIT21', '21st Century Literature from the Philippines and the World', 'Core', '11', '2nd Semester', 1.0, 'Contemporary literary works and genres.', 'Active', '2026-07-12 17:27:13'),
(16, NULL, 'PE2', 'Physical Education and Health 2', 'Core', '11', '2nd Semester', 1.0, 'Physical fitness and health education.', 'Active', '2026-07-12 17:27:13'),
(17, NULL, 'EAPP', 'English for Academic and Professional Purposes', 'Applied', '12', '1st Semester', 1.0, 'Academic and workplace communication in English.', 'Active', '2026-07-12 17:27:13'),
(18, NULL, 'EMPTECH', 'Empowerment Technologies', 'Applied', '12', '1st Semester', 1.0, 'ICT skills for professional and personal use.', 'Active', '2026-07-12 17:27:13'),
(19, NULL, 'PRACRES1', 'Practical Research 1', 'Applied', '12', '1st Semester', 1.0, 'Introduction to qualitative research methods.', 'Active', '2026-07-12 17:27:13'),
(20, NULL, 'PE3', 'Physical Education and Health 3', 'Core', '12', '1st Semester', 1.0, 'Physical fitness and health education.', 'Active', '2026-07-12 17:27:13'),
(21, NULL, 'MIL', 'Media and Information Literacy', 'Applied', '12', '2nd Semester', 1.0, 'Critical evaluation and use of media and information.', 'Active', '2026-07-12 17:27:13'),
(22, NULL, 'PRACRES2', 'Practical Research 2', 'Applied', '12', '2nd Semester', 1.0, 'Introduction to quantitative research methods.', 'Active', '2026-07-12 17:27:13'),
(23, NULL, 'CPAR', 'Contemporary Philippine Arts from the Regions', 'Core', '12', '2nd Semester', 1.0, 'Survey of Philippine regional art forms.', 'Active', '2026-07-12 17:27:13'),
(24, NULL, 'PE4', 'Physical Education and Health 4', 'Core', '12', '2nd Semester', 1.0, 'Physical fitness and health education.', 'Active', '2026-07-12 17:27:13'),
(25, 1, 'PRECALC', 'Pre-Calculus', 'Specialized', '11', '1st Semester', 1.0, 'Functions, trigonometry, and analytic geometry.', 'Active', '2026-07-12 17:27:13'),
(26, 1, 'GENBIO1', 'General Biology 1', 'Specialized', '11', '1st Semester', 1.0, 'Cell biology, genetics, and evolution.', 'Active', '2026-07-12 17:27:13'),
(27, 1, 'GENCHEM1', 'General Chemistry 1', 'Specialized', '11', '1st Semester', 1.0, 'Atomic structure, bonding, and stoichiometry.', 'Active', '2026-07-12 17:27:13'),
(28, 1, 'BASICCALC', 'Basic Calculus', 'Specialized', '11', '2nd Semester', 1.0, 'Limits, derivatives, and integrals.', 'Active', '2026-07-12 17:27:13'),
(29, 1, 'GENBIO2', 'General Biology 2', 'Specialized', '11', '2nd Semester', 1.0, 'Physiology, ecology, and biodiversity.', 'Active', '2026-07-12 17:27:13'),
(30, 1, 'GENCHEM2', 'General Chemistry 2', 'Specialized', '11', '2nd Semester', 1.0, 'Organic chemistry and reaction kinetics.', 'Active', '2026-07-12 17:27:13'),
(31, 1, 'GENPHYS1', 'General Physics 1', 'Specialized', '12', '1st Semester', 1.0, 'Mechanics, kinematics, and dynamics.', 'Active', '2026-07-12 17:27:13'),
(32, 1, 'STEMRES1', 'Research Project 1 (STEM)', 'Specialized', '12', '1st Semester', 1.0, 'Design and proposal of a STEM-based research/capstone project.', 'Active', '2026-07-12 17:27:13'),
(33, 1, 'GENPHYS2', 'General Physics 2', 'Specialized', '12', '2nd Semester', 1.0, 'Electricity, magnetism, and modern physics.', 'Active', '2026-07-12 17:27:13'),
(34, 1, 'STEMRES2', 'Research Project 2 (STEM)', 'Specialized', '12', '2nd Semester', 1.0, 'Implementation and defense of the STEM capstone project.', 'Active', '2026-07-12 17:27:13'),
(35, 2, 'ABM1', 'Fundamentals of Accountancy, Business and Management 1', 'Specialized', '11', '1st Semester', 1.0, 'Basic accounting principles and the accounting cycle.', 'Active', '2026-07-12 17:27:13'),
(36, 2, 'BUSMATH', 'Business Mathematics', 'Specialized', '11', '1st Semester', 1.0, 'Mathematical tools for business decision-making.', 'Active', '2026-07-12 17:27:13'),
(37, 2, 'ORGMAN', 'Organization and Management', 'Specialized', '11', '1st Semester', 1.0, 'Principles of management and organizational behavior.', 'Active', '2026-07-12 17:27:13'),
(38, 2, 'ABM2', 'Fundamentals of Accountancy, Business and Management 2', 'Specialized', '11', '2nd Semester', 1.0, 'Financial statement analysis and reporting.', 'Active', '2026-07-12 17:27:13'),
(39, 2, 'APPECON', 'Applied Economics', 'Specialized', '11', '2nd Semester', 1.0, 'Micro and macroeconomic concepts applied to real markets.', 'Active', '2026-07-12 17:27:13'),
(40, 2, 'BUSFIN', 'Business Finance', 'Specialized', '11', '2nd Semester', 1.0, 'Financial planning, budgeting, and investment basics.', 'Active', '2026-07-12 17:27:13'),
(41, 2, 'MKTG', 'Principles of Marketing', 'Specialized', '12', '1st Semester', 1.0, 'Marketing mix, consumer behavior, and market research.', 'Active', '2026-07-12 17:27:13'),
(42, 2, 'BUSETHICS', 'Business Ethics and Social Responsibility', 'Specialized', '12', '1st Semester', 1.0, 'Ethical decision-making and corporate social responsibility.', 'Active', '2026-07-12 17:27:13'),
(43, 2, 'BUSSIM1', 'Business Enterprise Simulation 1', 'Specialized', '12', '2nd Semester', 1.0, 'Hands-on simulation of running a small business.', 'Active', '2026-07-12 17:27:13'),
(44, 2, 'BUSSIM2', 'Work Immersion / Business Enterprise Simulation', 'Specialized', '12', '2nd Semester', 1.0, 'Practical business/work experience component.', 'Active', '2026-07-12 17:27:13'),
(45, 3, 'CREWRITE', 'Creative Writing', 'Specialized', '11', '1st Semester', 1.0, 'Introduction to creative writing across genres.', 'Active', '2026-07-12 17:27:13'),
(46, 3, 'DISCSOC', 'Disciplines and Ideas in the Social Sciences', 'Specialized', '11', '1st Semester', 1.0, 'Overview of anthropology, sociology, political science, psychology, and economics.', 'Active', '2026-07-12 17:27:13'),
(47, 3, 'PHILGOV', 'Philippine Politics and Governance', 'Specialized', '11', '2nd Semester', 1.0, 'Philippine political structures and governance issues.', 'Active', '2026-07-12 17:27:13'),
(48, 3, 'CREATNONFIC', 'Creative Nonfiction: The Literary Essay', 'Specialized', '11', '2nd Semester', 1.0, 'Writing nonfiction narrative and essay forms.', 'Active', '2026-07-12 17:27:13'),
(49, 3, 'DISCAPPSOC', 'Disciplines and Ideas in the Applied Social Sciences', 'Specialized', '12', '1st Semester', 1.0, 'Applied concepts in counseling, communication, and social work.', 'Active', '2026-07-12 17:27:13'),
(50, 3, 'COMMENGAGE', 'Community Engagement, Solidarity, and Citizenship', 'Specialized', '12', '1st Semester', 1.0, 'Civic engagement and community-based projects.', 'Active', '2026-07-12 17:27:13'),
(51, 3, 'TRENDSNAT', 'Trends, Networks, and Critical Thinking in the 21st Century Culture', 'Specialized', '12', '2nd Semester', 1.0, 'Analysis of global cultural and social trends.', 'Active', '2026-07-12 17:27:13'),
(52, 3, 'SOCSCIRES', 'Social Science Research', 'Specialized', '12', '2nd Semester', 1.0, 'Capstone research project in the social sciences.', 'Active', '2026-07-12 17:27:13'),
(53, 5, 'CSSINTRO', 'Introduction to Computer Systems Servicing', 'Specialized', '11', '1st Semester', 1.0, 'Computer hardware, assembly, and basic troubleshooting.', 'Active', '2026-07-12 17:27:13'),
(54, 5, 'COMPPROG1', 'Computer Programming 1', 'Specialized', '11', '2nd Semester', 1.0, 'Fundamentals of programming logic and design.', 'Active', '2026-07-12 17:27:13'),
(55, 5, 'COMPPROG2', 'Computer Programming 2', 'Specialized', '12', '1st Semester', 1.0, 'Object-oriented programming and application development.', 'Active', '2026-07-12 17:27:13'),
(56, 5, 'ANIMATION', 'Animation', 'Specialized', '12', '2nd Semester', 1.0, 'Principles of 2D/3D animation and digital media production.', 'Active', '2026-07-12 17:27:13'),
(57, 6, 'COOKERY', 'Cookery', 'Specialized', '11', '1st Semester', 1.0, 'Basic food preparation and cooking methods.', 'Active', '2026-07-12 17:27:13'),
(58, 6, 'BREADPAS', 'Bread and Pastry Production', 'Specialized', '11', '2nd Semester', 1.0, 'Baking techniques for bread, cakes, and pastries.', 'Active', '2026-07-12 17:27:13'),
(59, 6, 'FBSERV', 'Food and Beverage Services', 'Specialized', '12', '1st Semester', 1.0, 'Dining service standards and hospitality skills.', 'Active', '2026-07-12 17:27:13'),
(60, 6, 'HOUSEKEEP', 'Housekeeping', 'Specialized', '12', '2nd Semester', 1.0, 'Housekeeping operations for the hospitality industry.', 'Active', '2026-07-12 17:27:13');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `teacher_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `first_name`, `last_name`, `email`, `contact_number`, `specialization`, `status`, `created_at`) VALUES
(1, 'Rajah', 'Palmer', 'jewucugyk@mailinator.com', '123123123', 'Id et doloribus atqu', 'Inactive', '2026-07-04 05:21:29'),
(2, 'Maria', 'Santos', 'maria.santos@school.edu', '09171234567', 'Mathematics', 'Active', '2026-07-14 03:16:25'),
(3, 'Jose', 'Reyes', 'jose.reyes@school.edu', '09171234568', 'Science', 'Active', '2026-07-14 03:16:25'),
(4, 'Ana', 'Cruz', 'ana.cruz@school.edu', '09171234569', 'English', 'Active', '2026-07-14 03:16:25');

-- --------------------------------------------------------

--
-- Table structure for table `tracks`
--

CREATE TABLE `tracks` (
  `track_id` int(11) NOT NULL,
  `track_code` varchar(10) NOT NULL,
  `track_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tracks`
--

INSERT INTO `tracks` (`track_id`, `track_code`, `track_name`, `description`, `created_at`) VALUES
(1, 'ACAD', 'Academic Track', 'Prepares students for college/university education', '2026-07-04 03:08:34'),
(2, 'TVL', 'Technical-Vocational-Livelihood Track', 'Prepares students for employment, entrepreneurship, or middle-level skills development', '2026-07-04 03:08:34');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('Admin','Staff','Registrar','Accounting') NOT NULL DEFAULT 'Admin',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `password_hash`, `full_name`, `email`, `role`, `created_at`) VALUES
(1, '$2y$10$Y1vIULsMyjnhyUvOlJTku.IDLoR7mvehiLsT2uaNKGwQaocuqe8SC', 'Flavia Hunter', 'kadesu@mailinator.com', 'Staff', '2026-07-04 03:08:41'),
(2, '$2y$10$qa4TqzVvxse8TfjH.YnZq.cVYSB5yACk8fQj726GBR35gk9ky6pki', 'Cooper Meadows', 'vupusyfuk@mailinator.com', 'Staff', '2026-07-04 03:08:50'),
(3, '$2y$10$opj5udUgP27IsWmNJeDaMuxKaopL5XNK6FSMwE.PJ5WoLNDuiPfyS', 'kristan charles almario', 'kristan@gmail.com', 'Staff', '2026-07-04 03:09:23'),
(4, '$2y$10$E1c4ZhJ319I9NG1up5loWepxXI8PIIMSTidDfdnYwW/ullPoTNCoe', 'Alvin Rhodes', 'fawybeciw@mailinator.com', 'Staff', '2026-07-08 18:52:43'),
(7, '$2y$10$IS7FOPPUli/Al5VNG5pAguAnvgLMoJBoJsHIxRUyrXBN7NBLjFQT6', 'Lance', 'lance@gmail.com', 'Admin', '2026-07-24 09:53:01'),
(8, '$2y$10$dydVp8/3aJts5SdW2y5TpeOwp248DsTqNOyjYzWvBB4sIs5H4YyjK', 'Alexis', 'alexis@gmail.com', 'Accounting', '2026-07-24 10:00:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `acct_fees`
--
ALTER TABLE `acct_fees`
  ADD PRIMARY KEY (`fee_id`),
  ADD UNIQUE KEY `uq_fee_per_term` (`code`,`school_year`,`semester`),
  ADD KEY `idx_term` (`school_year`,`semester`,`is_active`);

--
-- Indexes for table `acct_payments`
--
ALTER TABLE `acct_payments`
  ADD PRIMARY KEY (`acct_payment_id`),
  ADD UNIQUE KEY `uq_reference` (`reference`),
  ADD KEY `idx_session` (`checkout_session_id`),
  ADD KEY `idx_student` (`student_number`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `applicants`
--
ALTER TABLE `applicants`
  ADD PRIMARY KEY (`applicant_id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `desired_strand_id` (`desired_strand_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `converted_student_id` (`converted_student_id`);

--
-- Indexes for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `applicant_id` (`applicant_id`),
  ADD KEY `document_type_id` (`document_type_id`);

--
-- Indexes for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD PRIMARY KEY (`section_id`),
  ADD KEY `strand_id` (`strand_id`),
  ADD KEY `adviser_id` (`adviser_id`);

--
-- Indexes for table `document_types`
--
ALTER TABLE `document_types`
  ADD PRIMARY KEY (`document_type_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `section_id` (`section_id`),
  ADD KEY `idx_enrollments_school_year_id` (`school_year_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `enrollment_id` (`enrollment_id`);

--
-- Indexes for table `payment_proofs`
--
ALTER TABLE `payment_proofs`
  ADD PRIMARY KEY (`proof_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_name` (`room_name`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `section_id` (`section_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `school_years`
--
ALTER TABLE `school_years`
  ADD PRIMARY KEY (`school_year_id`),
  ADD UNIQUE KEY `year` (`year`);

--
-- Indexes for table `strands`
--
ALTER TABLE `strands`
  ADD PRIMARY KEY (`strand_id`),
  ADD UNIQUE KEY `strand_code` (`strand_code`),
  ADD KEY `track_id` (`track_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `lrn` (`lrn`),
  ADD UNIQUE KEY `student_number` (`student_number`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD UNIQUE KEY `subject_code` (`subject_code`),
  ADD KEY `strand_id` (`strand_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`teacher_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tracks`
--
ALTER TABLE `tracks`
  ADD PRIMARY KEY (`track_id`),
  ADD UNIQUE KEY `track_code` (`track_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `acct_fees`
--
ALTER TABLE `acct_fees`
  MODIFY `fee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `acct_payments`
--
ALTER TABLE `acct_payments`
  MODIFY `acct_payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applicants`
--
ALTER TABLE `applicants`
  MODIFY `applicant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `class_sections`
--
ALTER TABLE `class_sections`
  MODIFY `section_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `document_types`
--
ALTER TABLE `document_types`
  MODIFY `document_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_proofs`
--
ALTER TABLE `payment_proofs`
  MODIFY `proof_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `school_years`
--
ALTER TABLE `school_years`
  MODIFY `school_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `strands`
--
ALTER TABLE `strands`
  MODIFY `strand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `teacher_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tracks`
--
ALTER TABLE `tracks`
  MODIFY `track_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applicants`
--
ALTER TABLE `applicants`
  ADD CONSTRAINT `applicants_ibfk_1` FOREIGN KEY (`desired_strand_id`) REFERENCES `strands` (`strand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `applicants_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `applicants_ibfk_3` FOREIGN KEY (`converted_student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  ADD CONSTRAINT `applicant_documents_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`applicant_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `applicant_documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON UPDATE CASCADE;

--
-- Constraints for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD CONSTRAINT `class_sections_ibfk_1` FOREIGN KEY (`strand_id`) REFERENCES `strands` (`strand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `class_sections_ibfk_2` FOREIGN KEY (`adviser_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `class_sections` (`section_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_enrollments_school_year` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`school_year_id`) ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`enrollment_id`) ON UPDATE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `class_sections` (`section_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_4` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON UPDATE CASCADE;

--
-- Constraints for table `strands`
--
ALTER TABLE `strands`
  ADD CONSTRAINT `strands_ibfk_1` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`track_id`) ON UPDATE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`strand_id`) REFERENCES `strands` (`strand_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
