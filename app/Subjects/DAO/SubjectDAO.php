<?php
require_once __DIR__ ."/../../../config/db.php";
require_once __DIR__."/../Model/subjects_model.php";

class SubjectDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET ALL SUBJECTS with strand info
    public function getAll($filters = []) {
        $query = "
        SELECT 
            s.subject_id,
            s.strand_id,
            s.subject_code,
            s.subject_name,
            s.subject_type,
            s.grade_level,
            s.semester,
            s.units,
            s.description,
            s.status,
            s.created_at,
            st.strand_code,
            st.strand_name,
            t.track_name
        FROM subjects s
        LEFT JOIN strands st ON st.strand_id = s.strand_id
        LEFT JOIN tracks t ON t.track_id = st.track_id
        WHERE 1=1
        ";

        $params = [];

        if (!empty($filters['keyword'])) {
            $query .= " AND (
                s.subject_code LIKE :keyword
                OR s.subject_name LIKE :keyword
            ) ";
            $params[':keyword'] = "%" . $filters['keyword'] . "%";
        }

        if (!empty($filters['subject_type'])) {
            $query .= " AND s.subject_type = :subject_type ";
            $params[':subject_type'] = $filters['subject_type'];
        }

        if (!empty($filters['grade_level'])) {
            $query .= " AND s.grade_level = :grade_level ";
            $params[':grade_level'] = $filters['grade_level'];
        }

        if (!empty($filters['semester'])) {
            $query .= " AND s.semester = :semester ";
            $params[':semester'] = $filters['semester'];
        }

        if (!empty($filters['status'])) {
            $query .= " AND s.status = :status ";
            $params[':status'] = $filters['status'];
        }

        $query .= " ORDER BY s.grade_level, s.subject_type, s.subject_code ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SUBJECT BY ID
    public function getById($id) {
        $query = "
        SELECT * FROM subjects WHERE subject_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET SUBJECTS BY STRAND
    public function getByStrand($strandId) {
        $query = "
        SELECT * FROM subjects
        WHERE strand_id = :strand_id
        AND status = 'Active'
        ORDER BY subject_code
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':strand_id', $strandId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SUBJECTS BY GRADE LEVEL
    public function getByGrade($gradeLevel) {
        $query = "
        SELECT * FROM subjects
        WHERE grade_level = :grade_level
        AND status = 'Active'
        ORDER BY subject_type, subject_code
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':grade_level', $gradeLevel);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // INSERT SUBJECT
    public function insert(Subject $subject) {
        $query = "
        INSERT INTO subjects
        (
            strand_id,
            subject_code,
            subject_name,
            subject_type,
            grade_level,
            semester,
            units,
            description,
            status
        )
        VALUES
        (
            :strand_id,
            :subject_code,
            :subject_name,
            :subject_type,
            :grade_level,
            :semester,
            :units,
            :description,
            :status
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':strand_id', $subject->getStrandId());
        $stmt->bindValue(':subject_code', $subject->getSubjectCode());
        $stmt->bindValue(':subject_name', $subject->getSubjectName());
        $stmt->bindValue(':subject_type', $subject->getSubjectType());
        $stmt->bindValue(':grade_level', $subject->getGradeLevel());
        $stmt->bindValue(':semester', $subject->getSemester());
        $stmt->bindValue(':units', $subject->getUnits());
        $stmt->bindValue(':description', $subject->getDescription());
        $stmt->bindValue(':status', $subject->getStatus());
        return $stmt->execute();
    }

    // UPDATE SUBJECT
    public function update(Subject $subject) {
        $query = "
        UPDATE subjects SET
            strand_id = :strand_id,
            subject_code = :subject_code,
            subject_name = :subject_name,
            subject_type = :subject_type,
            grade_level = :grade_level,
            semester = :semester,
            units = :units,
            description = :description,
            status = :status
        WHERE subject_id = :subject_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':subject_id', $subject->getSubjectId());
        $stmt->bindValue(':strand_id', $subject->getStrandId());
        $stmt->bindValue(':subject_code', $subject->getSubjectCode());
        $stmt->bindValue(':subject_name', $subject->getSubjectName());
        $stmt->bindValue(':subject_type', $subject->getSubjectType());
        $stmt->bindValue(':grade_level', $subject->getGradeLevel());
        $stmt->bindValue(':semester', $subject->getSemester());
        $stmt->bindValue(':units', $subject->getUnits());
        $stmt->bindValue(':description', $subject->getDescription());
        $stmt->bindValue(':status', $subject->getStatus());
        return $stmt->execute();
    }

    // DELETE SUBJECT (soft delete - set status to Inactive)
    public function delete($id) {
        $query = "
        UPDATE subjects SET status = 'Inactive'
        WHERE subject_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        return $stmt->execute();
    }

    // HARD DELETE SUBJECT (permanent)
    public function hardDelete($id) {
        $query = "DELETE FROM subjects WHERE subject_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        return $stmt->execute();
    }

    // CHECK IF CODE EXISTS
    public function isCodeTaken($code, $excludeId = null) {
        $query = "SELECT COUNT(*) FROM subjects WHERE subject_code = :code";
        if ($excludeId) {
            $query .= " AND subject_id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':code', $code);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // GET ALL STRANDS (for dropdown)
    public function getAllStrands() {
        $query = "
        SELECT 
            s.strand_id,
            s.strand_code,
            s.strand_name,
            t.track_name
        FROM strands s
        JOIN tracks t ON t.track_id = s.track_id
        ORDER BY t.track_name, s.strand_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL SEMESTERS (for dropdown)
    public function getAllSemesters() {
        return ['1st Semester', '2nd Semester'];
    }

    // GET ALL TYPES (for dropdown)
    public function getAllTypes() {
        return ['Core', 'Applied', 'Specialized'];
    }

    // GET SUBJECTS WITH USAGE COUNT (how many sections use this subject)
    public function getSubjectsWithUsage() {
        $query = "
        SELECT 
            s.*,
            COUNT(cs.class_subject_id) AS usage_count
        FROM subjects s
        LEFT JOIN class_subjects cs ON cs.subject_id = s.subject_id
        WHERE s.status = 'Active'
        GROUP BY s.subject_id
        ORDER BY s.grade_level, s.subject_type, s.subject_code
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}