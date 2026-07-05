-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 04, 2026 at 08:42 PM
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
-- Table structure for table `class_sections`
--

CREATE DATABASE `enrollment_management_system`;
USE `enrollment_management_system`;

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
(1, 3, NULL, '12', 'Shafira Warner', '2027-2028', 23, 'Closed', '2026-07-04 03:47:03'),
(2, 2, NULL, '12', 'Yael Rivas', '2026-2027', 17, 'Open', '2026-07-04 03:47:23'),
(3, 5, NULL, '11', 'Jesse Case', '2027-2028', 47, 'Open', '2026-07-04 04:51:09'),
(4, 3, NULL, '11', 'Priscilla Huff', '2027-2028', 77, 'Closed', '2026-07-04 04:51:24'),
(5, 5, NULL, '12', 'Natalie Gonzalez', '2026-2027', 77, 'Open', '2026-07-04 05:05:01'),
(6, 2, NULL, '11', 'asd', '2026-2027', 40, 'Open', '2026-07-04 05:06:26'),
(7, 2, 1, '11', 'Lillian Gay', '2025-2026', 47, 'Closed', '2026-07-04 05:22:04'),
(8, 2, 1, '11', 'asdasddas', '2026-2027', 40, 'Open', '2026-07-04 05:23:38');

-- --------------------------------------------------------

--
-- Table structure for table `class_subjects`
--

CREATE TABLE `class_subjects` (
  `class_subject_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 4, 2, '2026-2027', 1, '1st Semester', '2026-07-04 03:50:16', 'Dropped'),
(2, 1, 2, '2026-2027', 1, '1st Semester', '2026-07-04 05:29:51', 'Enrolled'),
(3, 3, 2, '2026-2027', 1, '1st Semester', '2026-07-05 02:13:18', 'Enrolled');

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

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `class_subject_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(4, 1, 'GAS', 'General Academic Strand', 'For students who are undecided or want a broader set of electives', '2026-07-04 03:08:34'),
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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `lrn`, `student_number`, `first_name`, `last_name`, `middle_name`, `gender`, `birthdate`, `address`, `contact_number`, `email`, `grade_level`, `status`, `father_name`, `father_contact_number`, `father_occupation`, `mother_name`, `mother_contact_number`, `mother_occupation`, `guardian_name`, `guardian_relationship`, `guardian_contact_number`, `guardian_address`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_number`, `created_at`) VALUES
(1, '123456789012', '2026-0001', 'Juan', 'Dela Cruz', 'Santos', 'Male', '2009-03-15', '123 Rizal St., Brgy. San Antonio, Dasmariñas, Cavite', '09171234501', 'juan.delacruz@example.com', '11', 'Active', 'Pedro Dela Cruz', '09171234502', 'Driver', 'Maria Dela Cruz', '09171234503', 'Vendor', NULL, NULL, NULL, NULL, 'Maria Dela Cruz', 'Mother', '09171234503', '2026-07-04 03:38:34'),
(2, '123456789013', '2026-0002', 'Andrea', 'Santos', 'Reyes', 'Female', '2008-11-02', '45 Mabini Ave., Brgy. Zone 2, Dasmariñas, Cavite', '09171234504', 'andrea.santos@example.com', '12', 'Active', 'Roberto Santos', '09171234505', 'Engineer', 'Liza Santos', '09171234506', 'Teacher', NULL, NULL, NULL, NULL, 'Roberto Santos', 'Father', '09171234505', '2026-07-04 03:38:34'),
(3, '123456789014', '2026-0003', 'Miguel', 'Ramos', NULL, 'Male', '2009-06-21', '78 Aguinaldo Hwy., Brgy. Salawag, Dasmariñas, Cavite', '09171234507', 'miguel.ramos@example.com', '11', 'Active', NULL, NULL, NULL, 'Carmela Ramos', '09171234508', 'Nurse', 'Carmela Ramos', 'Mother', '09171234508', '78 Aguinaldo Hwy., Brgy. Salawag, Dasmariñas, Cavite', 'Carmela Ramos', 'Mother', '09171234508', '2026-07-04 03:38:34'),
(4, '123456789015', '2026-0004', 'Bianca', 'Torres', 'Mendoza', 'Female', '2008-09-09', '12 Molino Rd., Brgy. Molino III, Bacoor, Cavite', '09171234509', 'bianca.torres@example.com', '12', 'Active', 'Antonio Torres', '09171234510', 'Businessman', 'Grace Torres', '09171234511', 'Accountant', NULL, NULL, NULL, NULL, 'Grace Torres', 'Mother', '09171234511', '2026-07-04 03:38:34'),
(5, '123456789016', '2026-0005', 'Josh', 'Villanueva', 'Cruz', 'Male', '2009-01-30', '89 Governor\'s Dr., Brgy. Malagasang, Imus, Cavite', '09171234512', 'josh.villanueva@example.com', '11', 'Active', 'Nestor Villanueva', '09171234513', 'OFW', 'Rosario Villanueva', '09171234514', 'Housewife', 'Elena Cruz', 'Aunt', '09171234515', '90 Governor\'s Dr., Brgy. Malagasang, Imus, Cavite', 'Rosario Villanueva', 'Mother', '09171234514', '2026-07-04 03:38:34'),
(6, 'Non error al', '762', 'Whoopi', 'Villarreal', 'Arden Stephenson', 'Female', '2011-05-08', 'Cillum nobis do veli', '+1 (517) 876-6398', 'malelimaq@mailinator.com', '12', 'Active', 'Leroy Newton', '+1 (585) 175-3873', 'Et vero impedit fac', 'Clinton Ferguson', '+1 (686) 408-8277', 'Repudiandae necessit', 'Alexander Jones', 'Nihil commodo id nem', '+1 (986) 374-5567', 'Amet officia quae i', 'Stella Frazier', 'Explicabo Facere er', '+1 (339) 397-6779', '2026-07-04 04:06:34'),
(7, 'Maiores dolo', '590', 'Merrill', 'Dotson', 'Nerea Holder', 'Female', '2024-08-30', 'Debitis doloremque q', '+1 (444) 222-8575', 'nofupe@mailinator.com', '11', 'Active', 'Yael Quinn', '+1 (645) 754-3951', 'In asperiores beatae', 'Xaviera Stout', '+1 (818) 853-1765', 'Amet officiis illum', 'Caleb Rivas', 'Adipisci ut aspernat', '+1 (275) 194-1103', 'Id accusantium neque', 'Winter Houston', 'Nostrud dolor qui et', '+1 (907) 754-4473', '2026-07-04 04:06:53');

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
(1, 'Rajah', 'Palmer', 'jewucugyk@mailinator.com', '123123123', 'Id et doloribus atqu', 'Active', '2026-07-04 05:21:29');

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
  `role` enum('Admin','Staff') NOT NULL DEFAULT 'Admin',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `password_hash`, `full_name`, `email`, `role`, `created_at`) VALUES
(1, '$2y$10$Y1vIULsMyjnhyUvOlJTku.IDLoR7mvehiLsT2uaNKGwQaocuqe8SC', 'Flavia Hunter', 'kadesu@mailinator.com', 'Staff', '2026-07-04 03:08:41'),
(2, '$2y$10$qa4TqzVvxse8TfjH.YnZq.cVYSB5yACk8fQj726GBR35gk9ky6pki', 'Cooper Meadows', 'vupusyfuk@mailinator.com', 'Staff', '2026-07-04 03:08:50'),
(3, '$2y$10$opj5udUgP27IsWmNJeDaMuxKaopL5XNK6FSMwE.PJ5WoLNDuiPfyS', 'kristan charles almario', 'kristan@gmail.com', 'Staff', '2026-07-04 03:09:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD PRIMARY KEY (`section_id`),
  ADD KEY `strand_id` (`strand_id`),
  ADD KEY `adviser_id` (`adviser_id`);

--
-- Indexes for table `class_subjects`
--
ALTER TABLE `class_subjects`
  ADD PRIMARY KEY (`class_subject_id`),
  ADD UNIQUE KEY `uq_section_subject` (`section_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`);

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
  ADD KEY `class_subject_id` (`class_subject_id`),
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
-- AUTO_INCREMENT for table `class_sections`
--
ALTER TABLE `class_sections`
  MODIFY `section_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `class_subjects`
--
ALTER TABLE `class_subjects`
  MODIFY `class_subject_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `teacher_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tracks`
--
ALTER TABLE `tracks`
  MODIFY `track_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `class_sections`
--
ALTER TABLE `class_sections`
  ADD CONSTRAINT `class_sections_ibfk_1` FOREIGN KEY (`strand_id`) REFERENCES `strands` (`strand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `class_sections_ibfk_2` FOREIGN KEY (`adviser_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `class_subjects`
--
ALTER TABLE `class_subjects`
  ADD CONSTRAINT `class_subjects_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `class_sections` (`section_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `class_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `class_subjects_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`class_subject_id`) REFERENCES `class_subjects` (`class_subject_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON UPDATE CASCADE;

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

-- ============================================================
-- Student-side additions for enrollment_management_system
-- 1) student_accounts   -> login (email, contact number, password)
-- 2) student_applications -> application form + uploaded documents
-- ============================================================

USE `enrollment_management_system`;

-- --------------------------------------------------------
-- Table: student_accounts
-- Used for the student's login credentials (separate from the
-- admin/staff `users` table).
-- --------------------------------------------------------

CREATE TABLE `student_accounts` (
  `account_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('Active','Disabled') NOT NULL DEFAULT 'Active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `student_accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `student_accounts`
  MODIFY `account_id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Table: student_applications
-- The SHS enrollment application form filled out after login.
-- Document uploads (2x2 picture, PSA/birth cert, report card,
-- school ID) are stored as file paths — actual files live on
-- disk/cloud storage (e.g. /uploads/applications/{id}/...).
-- --------------------------------------------------------

CREATE TABLE `student_applications` (
  `application_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,

  -- Personal information
  `full_name` varchar(150) NOT NULL,
  `birthdate` date NOT NULL,
  `place_of_birth` varchar(150) NOT NULL,
  `sex` enum('Male','Female') NOT NULL,
  `citizenship` varchar(50) NOT NULL,
  `home_address` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,

  -- Academic background
  `lrn` varchar(12) NOT NULL,
  `grade_level_completed` enum('10','11') NOT NULL,
  `preferred_track_id` int(11) NOT NULL,
  `preferred_strand_id` int(11) NOT NULL,

  -- Uploaded document paths
  `photo_2x2_path` varchar(255) NOT NULL,
  `psa_birth_cert_path` varchar(255) NOT NULL,
  `report_card_path` varchar(255) NOT NULL,
  `school_id_path` varchar(255) NOT NULL,

  -- Application workflow
  `application_status` enum('Pending','Under Review','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `remarks` text DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL COMMENT 'Set once approved and a students record is created',

  `submitted_at` datetime DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `student_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD UNIQUE KEY `lrn` (`lrn`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `preferred_track_id` (`preferred_track_id`),
  ADD KEY `preferred_strand_id` (`preferred_strand_id`),
  ADD KEY `student_id` (`student_id`);

ALTER TABLE `student_applications`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `student_applications`
  ADD CONSTRAINT `student_applications_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `student_accounts` (`account_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `student_applications_ibfk_2` FOREIGN KEY (`preferred_track_id`) REFERENCES `tracks` (`track_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `student_applications_ibfk_3` FOREIGN KEY (`preferred_strand_id`) REFERENCES `strands` (`strand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `student_applications_ibfk_4` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL ON UPDATE CASCADE;

