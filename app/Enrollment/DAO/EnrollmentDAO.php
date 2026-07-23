<?php

require_once __DIR__."/../../../config/db.php";
require_once __DIR__."/../Model/enrollment_model.php";

class EnrollmentDAO {

    private $conn;

    public function __construct() {
        try {
            $database = new Database();
            $this->conn = $database->connect();
            if (!$this->conn) {
                throw new Exception('Database connection failed');
            }
        } catch (Exception $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw $e;
        }
    }

    // ============ STUDENT QUERIES ============
    
    // GET UNENROLLED STUDENTS (students not yet enrolled for a specific school year and semester)
    public function getUnenrolledStudents($filters = []) {
        // If no school_year_id is provided, use the active one
        if (empty($filters["school_year_id"])) {
            $activeYear = $this->getActiveSchoolYear();
            if ($activeYear) {
                $filters["school_year_id"] = $activeYear['school_year_id'];
            }
        }
        
        // Determine if we're showing enrolled or unenrolled
        $showEnrolled = isset($filters["show_enrolled"]) && $filters["show_enrolled"] === 'true';
        
        $params = [
            ":school_year_id" => $filters["school_year_id"] ?? null
        ];

        // Semester belongs in the JOIN's ON clause, not the WHERE clause.
        // If it were a WHERE condition, it would evaluate against e.semester,
        // which is NULL for a LEFT JOIN non-match (i.e. every genuinely
        // unenrolled student) - "NULL = :semester" is never true in SQL, so
        // any semester filter would silently wipe out the entire unenrolled
        // list. Putting it in the ON clause instead scopes what counts as
        // "already enrolled" to that specific school year + semester, and
        // leaves unmatched (unenrolled) rows alone.
        $semesterJoinClause = "";
        if (!empty($filters["semester"])) {
            $semesterJoinClause = " AND e.semester = :semester ";
            $params[":semester"] = $filters["semester"];
        }

        $query = "
        SELECT 
            s.student_id,
            s.student_number,
            s.first_name,
            s.last_name,
            s.middle_name,
            s.gender,
            s.status AS student_status,
            CASE 
                WHEN e.enrollment_id IS NOT NULL THEN 'Enrolled'
                ELSE 'Not Enrolled'
            END AS enrollment_status,
            e.enrollment_id,
            e.school_year,
            e.semester,
            e.date_enrolled,
            e.status AS enrollment_status_value,
            e.section_id,
            cs.section_name,
            cs.grade_level,
            st.strand_code,
            st.strand_name
        FROM students s
        LEFT JOIN enrollments e ON e.student_id = s.student_id 
            AND e.school_year_id = :school_year_id 
            AND e.status = 'Enrolled'
            $semesterJoinClause
        LEFT JOIN class_sections cs ON cs.section_id = e.section_id
        LEFT JOIN strands st ON st.strand_id = cs.strand_id
        WHERE s.status IN ('Active', 'Inactive')
        ";

        // Show either enrolled or unenrolled based on filter
        if ($showEnrolled) {
            // Show only enrolled students
            $query .= " AND e.enrollment_id IS NOT NULL";
        } else {
            // Show only unenrolled students
            $query .= " AND e.enrollment_id IS NULL";
        }

        // Search filter
        if (!empty($filters["keyword"])) {
            $query .= " AND (
                s.first_name LIKE :kw1
                OR s.last_name LIKE :kw2
                OR s.student_number LIKE :kw3
            ) ";
            $likeKeyword = "%" . $filters["keyword"] . "%";
            $params[":kw1"] = $likeKeyword;
            $params[":kw2"] = $likeKeyword;
            $params[":kw3"] = $likeKeyword;
        }

        // Strand filter
        if (!empty($filters["strand"])) {
            $query .= " AND st.strand_code = :strand ";
            $params[":strand"] = $filters["strand"];
        }

        $query .= " ORDER BY s.last_name, s.first_name ";
        $query .= " LIMIT 1000 ";

        try {
            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log('getUnenrolledStudents returned ' . count($result) . ' records');
            return $result;
        } catch (PDOException $e) {
            error_log('SQL Error in getUnenrolledStudents: ' . $e->getMessage());
            error_log('Query: ' . $query);
            error_log('Params: ' . print_r($params, true));
            return [];
        }
    }

    // FIND STUDENT
    public function searchStudents($keyword) {
        $query = "
        SELECT student_id, student_number, first_name, last_name, middle_name, gender, status
        FROM students
        WHERE status IN ('Active', 'Inactive')
        AND (
            first_name LIKE :keyword1
            OR last_name LIKE :keyword2
            OR CONCAT(first_name, ' ', last_name) LIKE :keyword3
        )
        ORDER BY last_name, first_name
        LIMIT 6
        ";

        $stmt = $this->conn->prepare($query);
        $likeKeyword = "%" . $keyword . "%";
        $stmt->bindValue(":keyword1", $likeKeyword);
        $stmt->bindValue(":keyword2", $likeKeyword);
        $stmt->bindValue(":keyword3", $likeKeyword);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET STUDENT BY ID
    public function getStudentById($id) {
        $query = "
        SELECT student_id, student_number, first_name, last_name, middle_name, gender, status
        FROM students
        WHERE student_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ============ ENROLLMENT QUERIES ============
    // GET ALL ENROLLMENTS WITH STUDENT INFO - Updated with strand filter
    public function getEnrollments($filters = []) {
        $query = "
        SELECT
            e.enrollment_id,
            e.student_id,
            e.section_id,
            e.school_year,
            e.semester,
            e.date_enrolled,
            e.status,
            e.school_year_id,
            sy.year AS school_year_display,
            s.student_number,
            s.first_name,
            s.last_name,
            s.middle_name,
            s.status AS student_status,
            cs.section_name,
            cs.grade_level,
            st.strand_code,
            st.strand_name
        FROM enrollments e
        INNER JOIN students s ON s.student_id = e.student_id
        INNER JOIN class_sections cs ON cs.section_id = e.section_id
        INNER JOIN strands st ON st.strand_id = cs.strand_id
        LEFT JOIN school_years sy ON sy.school_year_id = e.school_year_id
        WHERE 1=1
        ";

        $params = [];

        if (!empty($filters["keyword"])) {
            $query .= " AND (
                s.first_name LIKE :kw1
                OR s.last_name LIKE :kw2
                OR s.student_number LIKE :kw3
            ) ";
            $likeKeyword = "%" . $filters["keyword"] . "%";
            $params[":kw1"] = $likeKeyword;
            $params[":kw2"] = $likeKeyword;
            $params[":kw3"] = $likeKeyword;
        }

        if (!empty($filters["status"]) && $filters["status"] !== 'all') {
            $query .= " AND e.status = :status ";
            $params[":status"] = $filters["status"];
        }

        if (!empty($filters["school_year_id"])) {
            $query .= " AND e.school_year_id = :school_year_id ";
            $params[":school_year_id"] = $filters["school_year_id"];
        }

        if (!empty($filters["semester"])) {
            $query .= " AND e.semester = :semester ";
            $params[":semester"] = $filters["semester"];
        }

        if (!empty($filters["strand"])) {
            $query .= " AND st.strand_code = :strand ";
            $params[":strand"] = $filters["strand"];
        }

        $query .= " ORDER BY e.date_enrolled DESC, s.last_name, s.first_name ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function reactivate($id) {
        // Check capacity before reactivating
        $enrollment = $this->getById($id);
        if (!$enrollment) {
            return false;
        }
        
        $capacity = $this->getSectionCapacity($enrollment['section_id']);
        if (!$capacity) {
            return false;
        }
        if ($capacity["enrolled_count"] >= $capacity["max_slots"]) {
            return false;
        }
        
        return $this->updateStatus($id, 'Enrolled');
    }

    // GET ENROLLMENTS BY STUDENT ID
    public function getEnrollmentsByStudent($studentId) {
        $query = "
        SELECT
            e.enrollment_id,
            e.school_year,
            e.semester,
            e.date_enrolled,
            e.status,
            sy.year AS school_year_display,
            cs.section_name,
            cs.grade_level,
            st.strand_code,
            cs.section_id
        FROM enrollments e
        INNER JOIN class_sections cs ON cs.section_id = e.section_id
        INNER JOIN strands st ON st.strand_id = cs.strand_id
        LEFT JOIN school_years sy ON sy.school_year_id = e.school_year_id
        WHERE e.student_id = :student_id
        ORDER BY e.date_enrolled DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":student_id", $studentId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ENROLLMENT BY ID
    public function getById($id) {
        $query = "
        SELECT * FROM enrollments
        WHERE enrollment_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ENROLLMENT DETAILS WITH STUDENT AND SECTION INFO
    public function getEnrollmentDetails($id) {
        $query = "
        SELECT
            e.*,
            s.student_number,
            s.first_name,
            s.last_name,
            s.middle_name,
            cs.section_name,
            cs.grade_level,
            st.strand_code,
            st.strand_name,
            sy.year AS school_year_display
        FROM enrollments e
        INNER JOIN students s ON s.student_id = e.student_id
        INNER JOIN class_sections cs ON cs.section_id = e.section_id
        INNER JOIN strands st ON st.strand_id = cs.strand_id
        LEFT JOIN school_years sy ON sy.school_year_id = e.school_year_id
        WHERE e.enrollment_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ============ SECTION QUERIES ============

    // AVAILABLE SECTIONS
    public function getAvailableSections($strandCode, $gradeLevel, $schoolYearId) {
        $query = "
        SELECT
            cs.section_id,
            cs.section_name,
            cs.max_slots,
            (
                SELECT COUNT(*) FROM enrollments e2
                WHERE e2.section_id = cs.section_id
                AND e2.status = 'Enrolled'
            ) AS enrolled_count
        FROM class_sections cs
        INNER JOIN strands st ON st.strand_id = cs.strand_id
        WHERE st.strand_code = :strand
        AND cs.grade_level = :grade
        AND cs.school_year = (SELECT year FROM school_years WHERE school_year_id = :school_year_id)
        AND cs.status = 'Open'
        ORDER BY cs.section_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":strand", $strandCode);
        $stmt->bindValue(":grade", $gradeLevel);
        $stmt->bindValue(":school_year_id", $schoolYearId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SECTION SCHEDULE - UPDATED to use your 'schedules' table
    public function getSectionSchedule($sectionId) {
        try {
            $query = "
            SELECT 
                sched.schedule_id,
                sched.day_of_week AS day,
                sched.start_time,
                sched.end_time,
                r.room_name AS room,
                sub.subject_code,
                sub.subject_name,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name
            FROM schedules sched
            INNER JOIN subjects sub ON sub.subject_id = sched.subject_id
            LEFT JOIN rooms r ON r.room_id = sched.room_id
            LEFT JOIN teachers t ON t.teacher_id = sched.teacher_id
            WHERE sched.section_id = :section_id
            ORDER BY FIELD(sched.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), sched.start_time
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":section_id", $sectionId);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!$result || count($result) === 0) {
                return [];
            }
            
            // Format the result
            return array_map(function($row) {
                $timeStart = $row['start_time'] ?? '-';
                $timeEnd = $row['end_time'] ?? '-';
                
                // Format time if needed
                if ($timeStart !== '-' && $timeStart != '00:00:00') {
                    $timeStart = date('h:i A', strtotime($timeStart));
                }
                if ($timeEnd !== '-' && $timeEnd != '00:00:00') {
                    $timeEnd = date('h:i A', strtotime($timeEnd));
                }
                
                return [
                    'subject_code' => $row['subject_code'] ?? '-',
                    'subject_name' => $row['subject_name'] ?? '-',
                    'day' => $row['day'] ?? '-',
                    'time_start' => $timeStart,
                    'time_end' => $timeEnd,
                    'room' => $row['room'] ?? '-',
                    'teacher' => $row['teacher_name'] ?? '-'
                ];
            }, $result);
            
        } catch (PDOException $e) {
            error_log('SQL Error in getSectionSchedule: ' . $e->getMessage());
            error_log('Query: ' . $query);
            return ['error' => 'Failed to load schedule: ' . $e->getMessage()];
        }
    }

    // GET SECTION DETAILS
    public function getSectionDetails($sectionId) {
        $query = "
        SELECT 
            cs.section_id,
            cs.section_name,
            cs.grade_level,
            cs.max_slots,
            cs.status,
            st.strand_code,
            st.strand_name
        FROM class_sections cs
        LEFT JOIN strands st ON st.strand_id = cs.strand_id
        WHERE cs.section_id = :section_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":section_id", $sectionId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET SECTION CAPACITY
    public function getSectionCapacity($sectionId) {
        $query = "
        SELECT
            cs.max_slots,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.section_id = cs.section_id
                AND e.status = 'Enrolled'
            ) AS enrolled_count
        FROM class_sections cs
        WHERE cs.section_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $sectionId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ============ SCHOOL YEAR QUERIES ============

    // GET SCHOOL YEARS for dropdown
    public function getSchoolYears() {
        $query = "
        SELECT school_year_id, year, status
        FROM school_years
        ORDER BY year DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SCHOOL YEAR BY ID
    public function getSchoolYearById($id) {
        $query = "
        SELECT school_year_id, year, status
        FROM school_years
        WHERE school_year_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ACTIVE SCHOOL YEAR
    public function getActiveSchoolYear() {
        $query = "
        SELECT school_year_id, year
        FROM school_years
        WHERE status = 'active'
        LIMIT 1
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ============ STRAND QUERIES ============

    // GET STRANDS
    public function getStrands() {
        $query = "
        SELECT strand_id, strand_code, strand_name
        FROM strands
        ORDER BY strand_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ============ ENROLLMENT CRUD OPERATIONS ============

    // CREATE ENROLLMENT
    public function insert(Enrollment $enrollment) {
        $query = "
        INSERT INTO enrollments
        (
            student_id,
            section_id,
            school_year_id,
            school_year,
            semester,
            status
        )
        VALUES
        (
            :student_id,
            :section_id,
            :school_year_id,
            :school_year,
            :semester,
            :status
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":student_id", $enrollment->getStudentId());
        $stmt->bindValue(":section_id", $enrollment->getSectionId());
        $stmt->bindValue(":school_year_id", $enrollment->getSchoolYearId());
        $stmt->bindValue(":school_year", $enrollment->getSchoolYear());
        $stmt->bindValue(":semester", $enrollment->getSemester());
        $stmt->bindValue(":status", $enrollment->getStatus());
        
        // Debug: Log what's being inserted
        error_log('Inserting enrollment: ' . print_r([
            'student_id' => $enrollment->getStudentId(),
            'section_id' => $enrollment->getSectionId(),
            'school_year_id' => $enrollment->getSchoolYearId(),
            'school_year' => $enrollment->getSchoolYear(),
            'semester' => $enrollment->getSemester(),
            'status' => $enrollment->getStatus()
        ], true));
        
        $result = $stmt->execute();
        error_log('Insert result: ' . ($result ? 'SUCCESS' : 'FAILED'));
        
        return $result;
    }

    // UPDATE ENROLLMENT STATUS
    public function updateStatus($enrollmentId, $status) {
        $query = "
        UPDATE enrollments
        SET status = :status
        WHERE enrollment_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->bindValue(":status", $status);
        return $stmt->execute();
    }

    // DROP ENROLLMENT
    public function drop($id) {
        return $this->updateStatus($id, 'Dropped');
    }

    // DELETE ENROLLMENT
    public function delete($id) {
        $query = "
        DELETE FROM enrollments
        WHERE enrollment_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // DUPLICATE CHECK
    public function isDuplicate($studentId, $schoolYearId, $semester) {
        $query = "
        SELECT COUNT(*) FROM enrollments
        WHERE student_id = :student_id
        AND school_year_id = :school_year_id
        AND semester = :semester
        AND status = 'Enrolled'
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":student_id", $studentId);
        $stmt->bindValue(":school_year_id", $schoolYearId);
        $stmt->bindValue(":semester", $semester);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // ============ DEBUG QUERIES ============

    // GET ALL ENROLLMENTS (for debugging)
    public function debugGetAllEnrollments($limit = 20) {
        $query = "SELECT * FROM enrollments ORDER BY enrollment_id DESC LIMIT :limit";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // CHECK SCHEDULE TABLE
    public function debugCheckScheduleTable() {
        try {
            // Check if table exists
            $query = "SHOW TABLES LIKE 'schedules'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $tableExists = $stmt->fetch();
            
            if (!$tableExists) {
                return ['error' => 'schedules table does not exist'];
            }
            
            // Get table structure
            $query = "DESCRIBE schedules";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get sample data
            $query = "SELECT * FROM schedules LIMIT 5";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $sampleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'table_exists' => true,
                'structure' => $structure,
                'sample_data' => $sampleData,
                'record_count' => count($sampleData)
            ];
        } catch (PDOException $e) {
            return ['error' => 'Failed to check schedule table: ' . $e->getMessage()];
        }
    }

    // GET STUDENT'S COMPLETE SCHEDULE WITH ALL ENROLLMENTS
    public function getStudentSchedule($studentId) {
        try {
            // Get all enrollments for the student
            $enrollments = $this->getEnrollmentsByStudent($studentId);
            
            if (!$enrollments || count($enrollments) === 0) {
                return ['error' => 'No enrollments found for this student'];
            }
            
            // Get schedule for each enrollment
            $scheduleData = [];
            foreach ($enrollments as $enrollment) {
                // Get section details
                $section = $this->getSectionDetails($enrollment['section_id']);
                
                // Get schedule for this section
                $schedule = $this->getSectionSchedule($enrollment['section_id']);
                
                // Check if schedule returned an error
                if (isset($schedule['error'])) {
                    $schedule = [];
                }
                
                $scheduleData[] = [
                    'enrollment' => [
                        'enrollment_id' => $enrollment['enrollment_id'],
                        'school_year' => $enrollment['school_year'],
                        'semester' => $enrollment['semester'],
                        'status' => $enrollment['status'],
                        'date_enrolled' => $enrollment['date_enrolled']
                    ],
                    'section' => $section,
                    'schedule' => $schedule
                ];
            }
            
            return $scheduleData;
            
        } catch (PDOException $e) {
            error_log('SQL Error in getStudentSchedule: ' . $e->getMessage());
            return ['error' => 'Failed to load student schedule: ' . $e->getMessage()];
        }
    }
}