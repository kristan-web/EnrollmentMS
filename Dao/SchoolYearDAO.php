<?php

require_once "../config/db.php";
require_once "../Models/school_year_model.php";

class SchoolYearDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET ALL SCHOOL YEARS (with enrollment count)
    public function getAll($filters = []) {
        $query = "
        SELECT 
            sy.*,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.school_year = sy.year
                AND e.status = 'Enrolled'
            ) AS enrollment_count
        FROM school_years sy
        WHERE 1 = 1
        ";

        $params = [];

        if (!empty($filters['keyword'])) {
            $query .= " AND sy.year LIKE :keyword ";
            $params[':keyword'] = "%" . $filters['keyword'] . "%";
        }

        $query .= " ORDER BY sy.year DESC ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SCHOOL YEAR BY ID
    public function getById($id) {
        $query = "
        SELECT 
            sy.*,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.school_year = sy.year
                AND e.status = 'Enrolled'
            ) AS enrollment_count
        FROM school_years sy
        WHERE sy.school_year_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET SCHOOL YEAR BY YEAR STRING
    public function getByYear($year) {
        $query = "
        SELECT 
            sy.*,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.school_year = sy.year
                AND e.status = 'Enrolled'
            ) AS enrollment_count
        FROM school_years sy
        WHERE sy.year = :year
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':year', $year);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ACTIVE SCHOOL YEAR
    public function getActive() {
        $query = "
        SELECT 
            sy.*,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.school_year = sy.year
                AND e.status = 'Enrolled'
            ) AS enrollment_count
        FROM school_years sy
        WHERE sy.status = 'active'
        LIMIT 1
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // INSERT SCHOOL YEAR
    public function insert(SchoolYear $schoolYear) {
        $query = "
        INSERT INTO school_years
        (
            year,
            status
        )
        VALUES
        (
            :year,
            :status
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':year', $schoolYear->getYear());
        $stmt->bindValue(':status', $schoolYear->getStatus());
        return $stmt->execute();
    }

    // UPDATE SCHOOL YEAR
    public function update(SchoolYear $schoolYear) {
        $query = "
        UPDATE school_years SET
            year = :year,
            status = :status
        WHERE school_year_id = :school_year_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':school_year_id', $schoolYear->getSchoolYearId());
        $stmt->bindValue(':year', $schoolYear->getYear());
        $stmt->bindValue(':status', $schoolYear->getStatus());
        return $stmt->execute();
    }

    // DELETE SCHOOL YEAR
    public function delete($id) {
        $query = "DELETE FROM school_years WHERE school_year_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        return $stmt->execute();
    }

    // CHECK IF YEAR EXISTS
    public function isYearTaken($year, $excludeId = null) {
        $query = "SELECT COUNT(*) FROM school_years WHERE year = :year";
        if ($excludeId) {
            $query .= " AND school_year_id <> :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':year', $year);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK IF SCHOOL YEAR HAS ENROLLMENTS
    public function hasEnrollments($year) {
        $query = "
        SELECT COUNT(*) FROM enrollments
        WHERE school_year = :year
        AND status = 'Enrolled'
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':year', $year);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // DEACTIVATE ALL SCHOOL YEARS
    public function deactivateAll() {
        $query = "UPDATE school_years SET status = 'closed' WHERE status = 'active'";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute();
    }

    // GET ENROLLMENT COUNT FOR A SCHOOL YEAR
    public function getEnrollmentCount($year) {
        $query = "
        SELECT COUNT(*) FROM enrollments
        WHERE school_year = :year
        AND status = 'Enrolled'
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':year', $year);
        $stmt->execute();
        return $stmt->fetchColumn();
    }

    // SUGGEST NEXT SCHOOL YEAR
    public function suggestNextYear() {
        $query = "
        SELECT year FROM school_years
        ORDER BY year DESC
        LIMIT 1
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            $lastYear = intval(substr($result['year'], 0, 4));
            $start = $lastYear + 1;
        } else {
            $start = date('Y');
        }

        return $start . '-' . ($start + 1);
    }
}