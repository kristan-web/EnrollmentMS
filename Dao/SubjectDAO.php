<?php

require_once "../config/db.php";
require_once "../Models/subjects_model.php";

class SubjectDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }


    // Helper: bind strand_id correctly whether it's a value or NULL
    // (Core subjects are shared across all strands, so strand_id can be NULL)

    private function bindStrandId($stmt, $strand_id) {

        if ($strand_id === null || $strand_id === "") {
            $stmt->bindValue(":strand_id", null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(":strand_id", $strand_id, PDO::PARAM_INT);
        }

    }


    // CHECK IF SUBJECT CODE ALREADY EXISTS
    // Used by the controller to give a friendly duplicate-code error
    // instead of relying solely on the DB unique constraint.

    public function codeExists($subject_code, $excludeId = null) {

        $query = "SELECT subject_id FROM subjects WHERE subject_code = :subject_code";

        if (!empty($excludeId)) {
            $query .= " AND subject_id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":subject_code", $subject_code);

        if (!empty($excludeId)) {
            $stmt->bindValue(":exclude_id", $excludeId);
        }

        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;

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

        $this->bindStrandId($stmt, $subject->getStrandId());
        $stmt->bindValue(":subject_code", $subject->getSubjectCode());
        $stmt->bindValue(":subject_name", $subject->getSubjectName());
        $stmt->bindValue(":subject_type", $subject->getSubjectType());
        $stmt->bindValue(":grade_level", $subject->getGradeLevel());
        $stmt->bindValue(":semester", $subject->getSemester());
        $stmt->bindValue(":units", $subject->getUnits());
        $stmt->bindValue(":description", $subject->getDescription());
        $stmt->bindValue(":status", $subject->getStatus());

        return $stmt->execute();

    }




    // GET ACTIVE SUBJECTS ONLY (with strand info joined in for display)

    public function getAll() {

        $query = "

        SELECT sub.*, st.strand_code, st.strand_name

        FROM subjects sub

        LEFT JOIN strands st ON sub.strand_id = st.strand_id

        WHERE sub.status = 'Active'

        ORDER BY sub.subject_code

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // SEARCH / FILTER SUBJECTS
    //
    // $filters (all optional):
    //   keyword       - matches subject_code or subject_name
    //   subject_type  - Core / Applied / Specialized
    //   grade_level   - 11 / 12
    //   semester      - 1st Semester / 2nd Semester
    //   strand_id     - filter by a specific strand
    //   status        - Active / Inactive (defaults to 'Active')

    public function search($filters = []) {

        $query = "

        SELECT sub.*, st.strand_code, st.strand_name

        FROM subjects sub

        LEFT JOIN strands st ON sub.strand_id = st.strand_id

        WHERE sub.status = :status

        ";

        $params = [
            ":status" => !empty($filters["status"]) ? $filters["status"] : "Active",
        ];

        if (!empty($filters["keyword"])) {

            $query .= " AND (
                sub.subject_code LIKE :keyword
                OR sub.subject_name LIKE :keyword
            ) ";

            $params[":keyword"] = "%" . $filters["keyword"] . "%";

        }

        if (!empty($filters["subject_type"])) {

            $query .= " AND sub.subject_type = :subject_type ";
            $params[":subject_type"] = $filters["subject_type"];

        }

        if (!empty($filters["grade_level"])) {

            $query .= " AND sub.grade_level = :grade_level ";
            $params[":grade_level"] = $filters["grade_level"];

        }

        if (!empty($filters["semester"])) {

            $query .= " AND sub.semester = :semester ";
            $params[":semester"] = $filters["semester"];

        }

        if (!empty($filters["strand_id"])) {

            $query .= " AND sub.strand_id = :strand_id ";
            $params[":strand_id"] = $filters["strand_id"];

        }

        $query .= " ORDER BY sub.subject_code ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // GET SUBJECT BY ID (with strand info joined in for display)

    public function getById($id) {

        $query = "

        SELECT sub.*, st.strand_code, st.strand_name

        FROM subjects sub

        LEFT JOIN strands st ON sub.strand_id = st.strand_id

        WHERE sub.subject_id = :id

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":id", $id);

        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);

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

        $stmt->bindValue(":subject_id", $subject->getSubjectId());
        $this->bindStrandId($stmt, $subject->getStrandId());
        $stmt->bindValue(":subject_code", $subject->getSubjectCode());
        $stmt->bindValue(":subject_name", $subject->getSubjectName());
        $stmt->bindValue(":subject_type", $subject->getSubjectType());
        $stmt->bindValue(":grade_level", $subject->getGradeLevel());
        $stmt->bindValue(":semester", $subject->getSemester());
        $stmt->bindValue(":units", $subject->getUnits());
        $stmt->bindValue(":description", $subject->getDescription());
        $stmt->bindValue(":status", $subject->getStatus());

        return $stmt->execute();

    }




    // SOFT DELETE SUBJECT
    // Changes status from Active -> Inactive

    public function delete($id) {

        $query = "

        UPDATE subjects

        SET status = 'Inactive'

        WHERE subject_id = :id

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":id", $id);

        return $stmt->execute();

    }




    // RESTORE SUBJECT
    // Changes status from Inactive -> Active

    public function restore($id) {

        $query = "

        UPDATE subjects

        SET status = 'Active'

        WHERE subject_id = :id

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":id", $id);

        return $stmt->execute();

    }




    // GET INACTIVE SUBJECTS

    public function getInactive() {

        $query = "

        SELECT sub.*, st.strand_code, st.strand_name

        FROM subjects sub

        LEFT JOIN strands st ON sub.strand_id = st.strand_id

        WHERE sub.status = 'Inactive'

        ORDER BY sub.subject_code

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // GET STRANDS
    // Used to populate the strand dropdown on the add/edit form and list filter

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


}

?>