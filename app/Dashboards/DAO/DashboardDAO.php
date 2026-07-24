<?php
// C:/xampp/htdocs/EnrollmentMS/app/Dashboard/DAO/DashboardDAO.php

require_once __DIR__."/../../../config/db.php";

class DashboardDAO {
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

    /**
     * Get total student count by status
     */
    public function getStudentStats() {
        $query = "
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactive,
                SUM(CASE WHEN status = 'Graduated' THEN 1 ELSE 0 END) AS graduated,
                SUM(CASE WHEN status = 'Dropped' THEN 1 ELSE 0 END) AS dropped
            FROM students
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get enrollment statistics by status
     */
    public function getEnrollmentStats() {
        $query = "
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Enrolled' THEN 1 ELSE 0 END) AS enrolled,
                SUM(CASE WHEN status = 'Dropped' THEN 1 ELSE 0 END) AS dropped,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
            FROM enrollments
            WHERE school_year_id = (SELECT school_year_id FROM school_years WHERE status = 'active' LIMIT 1)
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get current active school year
     */
    public function getActiveSchoolYear() {
        $query = "
            SELECT school_year_id, year, status
            FROM school_years
            WHERE status = 'active'
            LIMIT 1
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get strand distribution for current school year
     */
    public function getStrandDistribution() {
        $query = "
            SELECT 
                st.strand_code,
                st.strand_name,
                COUNT(DISTINCT e.student_id) AS student_count
            FROM enrollments e
            INNER JOIN class_sections cs ON cs.section_id = e.section_id
            INNER JOIN strands st ON st.strand_id = cs.strand_id
            WHERE e.status = 'Enrolled'
            AND e.school_year_id = (SELECT school_year_id FROM school_years WHERE status = 'active' LIMIT 1)
            GROUP BY st.strand_id
            ORDER BY student_count DESC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get grade level distribution for current school year
     */
    public function getGradeDistribution() {
        $query = "
            SELECT 
                cs.grade_level,
                COUNT(DISTINCT e.student_id) AS student_count
            FROM enrollments e
            INNER JOIN class_sections cs ON cs.section_id = e.section_id
            WHERE e.status = 'Enrolled'
            AND e.school_year_id = (SELECT school_year_id FROM school_years WHERE status = 'active' LIMIT 1)
            GROUP BY cs.grade_level
            ORDER BY cs.grade_level
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get gender distribution
     */
    public function getGenderDistribution() {
        $query = "
            SELECT 
                gender,
                COUNT(*) AS count
            FROM students
            WHERE status = 'Active'
            GROUP BY gender
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get section capacity overview
     */
    public function getSectionCapacity() {
        $query = "
            SELECT 
                cs.section_id,
                cs.section_name,
                cs.grade_level,
                st.strand_code,
                cs.max_slots,
                COUNT(e.enrollment_id) AS enrolled,
                (cs.max_slots - COUNT(e.enrollment_id)) AS available,
                ROUND((COUNT(e.enrollment_id) / cs.max_slots) * 100, 1) AS fill_rate
            FROM class_sections cs
            INNER JOIN strands st ON st.strand_id = cs.strand_id
            LEFT JOIN enrollments e ON e.section_id = cs.section_id AND e.status = 'Enrolled'
            WHERE cs.school_year = (SELECT year FROM school_years WHERE status = 'active' LIMIT 1)
            AND cs.status = 'Open'
            GROUP BY cs.section_id
            ORDER BY fill_rate DESC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get recent enrollments (last 7 days)
     */
    public function getRecentEnrollments($limit = 10) {
        $query = "
            SELECT 
                e.enrollment_id,
                e.date_enrolled,
                CONCAT(s.last_name, ', ', s.first_name) AS student_name,
                s.student_number,
                cs.section_name,
                st.strand_code,
                e.status
            FROM enrollments e
            INNER JOIN students s ON s.student_id = e.student_id
            INNER JOIN class_sections cs ON cs.section_id = e.section_id
            INNER JOIN strands st ON st.strand_id = cs.strand_id
            ORDER BY e.date_enrolled DESC
            LIMIT :limit
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get enrollment trend over time (daily counts for the last 30 days)
     */
    public function getEnrollmentTrend() {
        $query = "
            SELECT 
                DATE(date_enrolled) AS date,
                COUNT(*) AS count
            FROM enrollments
            WHERE date_enrolled >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(date_enrolled)
            ORDER BY date ASC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get school year comparison
     */
    public function getSchoolYearComparison() {
        $query = "
            SELECT 
                sy.year,
                COUNT(e.enrollment_id) AS enrollment_count
            FROM school_years sy
            LEFT JOIN enrollments e ON e.school_year_id = sy.school_year_id AND e.status = 'Enrolled'
            GROUP BY sy.school_year_id
            ORDER BY sy.year DESC
            LIMIT 5
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all dashboard data in one call
     */
    public function getDashboardData() {
        return [
            'student_stats' => $this->getStudentStats(),
            'enrollment_stats' => $this->getEnrollmentStats(),
            'active_school_year' => $this->getActiveSchoolYear(),
            'strand_distribution' => $this->getStrandDistribution(),
            'grade_distribution' => $this->getGradeDistribution(),
            'gender_distribution' => $this->getGenderDistribution(),
            'section_capacity' => $this->getSectionCapacity(),
            'recent_enrollments' => $this->getRecentEnrollments(10),
            'enrollment_trend' => $this->getEnrollmentTrend(),
            'school_year_comparison' => $this->getSchoolYearComparison()
        ];
    }
}
?>