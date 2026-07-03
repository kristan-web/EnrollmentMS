-- =====================================================================
-- Senior High School Enrollment Management System
-- Philippine SHS structure: Grade 11-12, Academic Track & TVL Track
-- =====================================================================

CREATE DATABASE IF NOT EXISTS enrollment_management_system;
USE enrollment_management_system;

-- 1. Users Table (Admins / Registrar Staff)
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,  
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `role` ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Admin',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tracks Table (Academic, TVL)
CREATE TABLE IF NOT EXISTS `tracks` (
    `track_id` INT AUTO_INCREMENT PRIMARY KEY,
    `track_code` VARCHAR(10) NOT NULL UNIQUE,        -- e.g., ACAD, TVL
    `track_name` VARCHAR(100) NOT NULL,              -- e.g., Academic Track, Technical-Vocational-Livelihood Track
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Strands Table (e.g., STEM, ABM, HUMSS, GAS under Academic; ICT, HE, IA, AFA under TVL)
CREATE TABLE IF NOT EXISTS `strands` (
    `strand_id` INT AUTO_INCREMENT PRIMARY KEY,
    `track_id` INT NOT NULL,
    `strand_code` VARCHAR(20) NOT NULL UNIQUE,       -- e.g., STEM, ABM, ICT-CSS
    `strand_name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`track_id`) REFERENCES `tracks`(`track_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Teachers Table (renamed from Professors)
CREATE TABLE IF NOT EXISTS `teachers` (
    `teacher_id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `contact_number` VARCHAR(20),
    `specialization` VARCHAR(150),                   -- e.g., Major subject / learning area
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subjects Table (Core subjects are shared across all strands; Applied/Specialized belong to a strand)
CREATE TABLE IF NOT EXISTS `subjects` (
    `subject_id` INT AUTO_INCREMENT PRIMARY KEY,
    `strand_id` INT DEFAULT NULL,                    -- NULL = Core subject taken by all strands
    `subject_code` VARCHAR(20) NOT NULL UNIQUE,
    `subject_name` VARCHAR(150) NOT NULL,
    `subject_type` ENUM('Core', 'Applied', 'Specialized') NOT NULL DEFAULT 'Core',
    `grade_level` ENUM('11', '12') NOT NULL,
    `semester` ENUM('1st Semester', '2nd Semester') NOT NULL,
    `units` DECIMAL(3,1) NOT NULL,
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`strand_id`) REFERENCES `strands`(`strand_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Rooms Table
CREATE TABLE IF NOT EXISTS `rooms` (
    `room_id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_name` VARCHAR(50) NOT NULL UNIQUE,
    `building` VARCHAR(50) NOT NULL,
    `capacity` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Class Sections Table
-- In SHS, a section is a self-contained group of students (per grade level + strand)
-- that stays together for most/all of their subjects for a given school year.
CREATE TABLE IF NOT EXISTS `class_sections` (
    `section_id` INT AUTO_INCREMENT PRIMARY KEY,
    `strand_id` INT NOT NULL,
    `adviser_id` INT DEFAULT NULL,                   -- homeroom adviser (teacher)
    `grade_level` ENUM('11', '12') NOT NULL,
    `section_name` VARCHAR(50) NOT NULL,             -- e.g., "STEM 11 - Newton"
    `school_year` VARCHAR(9) NOT NULL,               -- e.g., "2026-2027"
    `max_slots` INT NOT NULL,
    `status` ENUM('Open', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Open',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`strand_id`) REFERENCES `strands`(`strand_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`adviser_id`) REFERENCES `teachers`(`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Class Subjects Table (links a subject + teacher to a specific section)
-- This is what a section's actual "load" looks like per semester.
CREATE TABLE IF NOT EXISTS `class_subjects` (
    `class_subject_id` INT AUTO_INCREMENT PRIMARY KEY,
    `section_id` INT NOT NULL,
    `subject_id` INT NOT NULL,
    `teacher_id` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`section_id`) REFERENCES `class_sections`(`section_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `uq_section_subject` (`section_id`, `subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Schedules Table (per class subject, since each subject in a section meets at its own time/room)
CREATE TABLE IF NOT EXISTS `schedules` (
    `schedule_id` INT AUTO_INCREMENT PRIMARY KEY,
    `class_subject_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`class_subject_id`) REFERENCES `class_subjects`(`class_subject_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Students Table (with LRN + Parent/Guardian & Emergency Contact info)
CREATE TABLE IF NOT EXISTS `students` (
    `student_id` INT AUTO_INCREMENT PRIMARY KEY,
    `lrn` VARCHAR(12) NOT NULL UNIQUE,                -- DepEd Learner Reference Number (12 digits)
    `student_number` VARCHAR(20) NOT NULL UNIQUE,     -- school-issued ID number
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `middle_name` VARCHAR(50) DEFAULT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `birthdate` DATE NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `contact_number` VARCHAR(20),
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `grade_level` ENUM('11', '12') NOT NULL,
    `status` ENUM('Active', 'Inactive', 'Graduated', 'Dropped') NOT NULL DEFAULT 'Active',

    -- Parent / Guardian Information (Emergency Contact)
    `father_name` VARCHAR(100) DEFAULT NULL,
    `father_contact_number` VARCHAR(20) DEFAULT NULL,
    `father_occupation` VARCHAR(100) DEFAULT NULL,
    `mother_name` VARCHAR(100) DEFAULT NULL,
    `mother_contact_number` VARCHAR(20) DEFAULT NULL,
    `mother_occupation` VARCHAR(100) DEFAULT NULL,
    `guardian_name` VARCHAR(100) DEFAULT NULL,        -- filled in if different from parents
    `guardian_relationship` VARCHAR(50) DEFAULT NULL,
    `guardian_contact_number` VARCHAR(20) DEFAULT NULL,
    `guardian_address` VARCHAR(255) DEFAULT NULL,

    -- Emergency Contact (can be same as a parent/guardian, or a separate person)
    `emergency_contact_name` VARCHAR(100) NOT NULL,
    `emergency_contact_relationship` VARCHAR(50) NOT NULL,
    `emergency_contact_number` VARCHAR(20) NOT NULL,

    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Enrollments Table
CREATE TABLE IF NOT EXISTS `enrollments` (
    `enrollment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `section_id` INT NOT NULL,
    `school_year` VARCHAR(9) NOT NULL,
    `semester` ENUM('1st Semester', '2nd Semester') NOT NULL,
    `date_enrolled` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('Enrolled', 'Dropped', 'Pending') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`section_id`) REFERENCES `class_sections`(`section_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Payments Table (for miscellaneous/other school fees — SHS is tuition-free under DepEd for public schools,
-- but private schools / vouchers may still collect fees)
CREATE TABLE IF NOT EXISTS `payments` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `enrollment_id` INT NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `payment_method` ENUM('Cash', 'PayMongo') NOT NULL,
    `paymongo_reference_id` VARCHAR(100) DEFAULT NULL,
    `payment_status` ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`enrollment_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Sample reference data for Tracks & Strands (optional seed data)
-- =====================================================================
INSERT INTO `tracks` (`track_code`, `track_name`, `description`) VALUES
('ACAD', 'Academic Track', 'Prepares students for college/university education'),
('TVL', 'Technical-Vocational-Livelihood Track', 'Prepares students for employment, entrepreneurship, or middle-level skills development');

INSERT INTO `strands` (`track_id`, `strand_code`, `strand_name`, `description`) VALUES
(1, 'STEM', 'Science, Technology, Engineering and Mathematics', 'For students inclined toward science and engineering courses'),
(1, 'ABM', 'Accountancy, Business and Management', 'For students inclined toward business and finance-related courses'),
(1, 'HUMSS', 'Humanities and Social Sciences', 'For students inclined toward law, education, and social science courses'),
(1, 'GAS', 'General Academic Strand', 'For students who are undecided or want a broader set of electives'),
(2, 'ICT', 'Information and Communications Technology', 'Focuses on computer systems servicing, programming, and animation'),
(2, 'HE', 'Home Economics', 'Focuses on cookery, food & beverage services, and tourism-related skills');


ALTER TABLE `subjects`
    ADD COLUMN `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `description`;

ALTER TABLE `users`
    DROP COLUMN `username`;