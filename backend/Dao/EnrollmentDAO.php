<?php

require_once "../config/db.php";
require_once "../Models/enrollment_model.php";

class EnrollmentDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }




    // GET MASTERLIST
    // Joins enrollments -> students -> class_sections -> strands so the
    // table has everything it needs (name, student no., strand, grade, section)
    // in one call instead of the client stitching localStorage arrays together.
    //
    // $filters (optional):
    //   keyword - matches student first name, last name, or student number

    public function getMasterlist($filters = []) {

        $query = "

        SELECT
            e.enrollment_id,
            e.student_id,
            e.section_id,
            e.school_year,
            e.semester,
            e.date_enrolled,
            e.status,
            s.student_number,
            s.first_name,
            s.last_name,
            s.middle_name,
            cs.section_name,
            cs.grade_level,
            st.strand_code

        FROM enrollments e
        INNER JOIN students s ON s.student_id = e.student_id
        INNER JOIN class_sections cs ON cs.section_id = e.section_id
        INNER JOIN strands st ON st.strand_id = cs.strand_id

        WHERE 1=1

        ";

        $params = [];

        if (!empty($filters["keyword"])) {

            $query .= " AND (
                s.first_name LIKE :keyword
                OR s.last_name LIKE :keyword
                OR s.student_number LIKE :keyword
            ) ";

            $params[":keyword"] = "%" . $filters["keyword"] . "%";

        }

        $query .= " ORDER BY e.date_enrolled DESC, s.last_name, s.first_name ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // STRAND LIST (populates the Strand dropdown in step 2 of the modal)
    // Pulled live from the strands table so it can never drift out of sync
    // with whatever strands actually exist (e.g. new strands added later
    // via the Tracks & Strands CRUD in Phase 3).

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




    // FIND STUDENT (step 1 of the Enroll Student modal)
    // Only searches Active students - dropped/graduated students shouldn't
    // show up as enroll targets.

    public function searchStudents($keyword) {

        $query = "

        SELECT student_id, student_number, first_name, last_name, middle_name, gender

        FROM students

        WHERE status = 'Active'
        AND (
            first_name LIKE :keyword
            OR last_name LIKE :keyword
            OR CONCAT(first_name, ' ', last_name) LIKE :keyword
        )

        ORDER BY last_name, first_name

        LIMIT 6

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":keyword", "%" . $keyword . "%");

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // AVAILABLE SECTIONS (step 3 of the Enroll Student modal)
    // Only Open sections for the chosen strand + grade level + school year,
    // with a live enrolled-count so the UI can show remaining slots.

    public function getAvailableSections($strandCode, $gradeLevel, $schoolYear) {

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
        AND cs.school_year = :school_year
        AND cs.status = 'Open'

        ORDER BY cs.section_name

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":strand", $strandCode);
        $stmt->bindValue(":grade", $gradeLevel);
        $stmt->bindValue(":school_year", $schoolYear);

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }




    // Server-side duplicate check. The UI already blocks this, but the UI
    // can be bypassed (devtools, direct POST) so it must be re-checked here.

    public function isDuplicate($studentId, $schoolYear, $semester) {

        $query = "

        SELECT COUNT(*) FROM enrollments

        WHERE student_id = :student_id
        AND school_year = :school_year
        AND semester = :semester
        AND status = 'Enrolled'

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":student_id", $studentId);
        $stmt->bindValue(":school_year", $schoolYear);
        $stmt->bindValue(":semester", $semester);

        $stmt->execute();

        return $stmt->fetchColumn() > 0;

    }




    // Server-side capacity check (same reasoning as isDuplicate above).

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




    // CREATE ENROLLMENT

    public function insert(Enrollment $enrollment) {

        $query = "

        INSERT INTO enrollments

        (
            student_id,
            section_id,
            school_year,
            semester,
            status
        )

        VALUES

        (
            :student_id,
            :section_id,
            :school_year,
            :semester,
            :status
        )

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":student_id", $enrollment->getStudentId());
        $stmt->bindValue(":section_id", $enrollment->getSectionId());
        $stmt->bindValue(":school_year", $enrollment->getSchoolYear());
        $stmt->bindValue(":semester", $enrollment->getSemester());
        $stmt->bindValue(":status", $enrollment->getStatus());

        return $stmt->execute();

    }




    // DROP ENROLLMENT
    // Marks status Dropped - record stays in the masterlist, slot is freed
    // (enrolled_count only counts status = 'Enrolled').

    public function drop($id) {

        $query = "

        UPDATE enrollments

        SET status = 'Dropped'

        WHERE enrollment_id = :id

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":id", $id);

        return $stmt->execute();

    }




    // DELETE ENROLLMENT (permanent)

    public function delete($id) {

        $query = "

        DELETE FROM enrollments

        WHERE enrollment_id = :id

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":id", $id);

        return $stmt->execute();

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


}

?>
