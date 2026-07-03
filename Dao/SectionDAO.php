<?php

require_once "../config/db.php";
require_once "../Models/sections_model.php";

class SectionDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }

    // INSERT SECTION

    public function insert(Section $section) {

        $query = "

        INSERT INTO class_sections

        (
            strand_id,
            adviser_id,
            grade_level,
            section_name,
            school_year,
            max_slots,
            status
        )

        VALUES

        (
            :strand_id,
            :adviser_id,
            :grade_level,
            :section_name,
            :school_year,
            :max_slots,
            :status
        )

        ";


        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":strand_id", $section->getStrandId());
        $stmt->bindValue(":adviser_id", $section->getAdviserId());
        $stmt->bindValue(":grade_level", $section->getGradeLevel());
        $stmt->bindValue(":section_name", $section->getSectionName());
        $stmt->bindValue(":school_year", $section->getSchoolYear());
        $stmt->bindValue(":max_slots", $section->getMaxSlots());
        $stmt->bindValue(":status", $section->getStatus());

        return $stmt->execute();

    }





    // GET OPEN/CLOSED SECTIONS (excludes Cancelled, same idea as Student's "Active only")

    public function getAll() {


        $query = "

        SELECT

            cs.*,
            st.strand_code,
            st.strand_name,
            t.track_id,
            t.track_name,
            te.first_name AS adviser_first_name,
            te.last_name AS adviser_last_name

        FROM class_sections cs

        JOIN strands st
            ON cs.strand_id = st.strand_id

        JOIN tracks t
            ON st.track_id = t.track_id

        LEFT JOIN teachers te
            ON cs.adviser_id = te.teacher_id

        WHERE cs.status <> 'Cancelled'

        ORDER BY cs.section_id DESC

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // SEARCH / FILTER SECTIONS
    //
    // $filters (all optional):
    //   keyword     - matches section_name, school_year
    //   track_id
    //   strand_id
    //   grade_level - '11' or '12'
    //   school_year
    //   status      - Open, Closed, Cancelled

    public function search($filters = []) {

        $query = "

        SELECT

            cs.*,
            st.strand_code,
            st.strand_name,
            t.track_id,
            t.track_name,
            te.first_name AS adviser_first_name,
            te.last_name AS adviser_last_name

        FROM class_sections cs

        JOIN strands st
            ON cs.strand_id = st.strand_id

        JOIN tracks t
            ON st.track_id = t.track_id

        LEFT JOIN teachers te
            ON cs.adviser_id = te.teacher_id

        WHERE 1 = 1

        ";

        $params = [];

        if (!empty($filters["keyword"])) {

            $query .= " AND (
                cs.section_name LIKE :keyword
                OR cs.school_year LIKE :keyword
            ) ";

            $params[":keyword"] = "%" . $filters["keyword"] . "%";

        }

        if (!empty($filters["track_id"])) {

            $query .= " AND t.track_id = :track_id ";
            $params[":track_id"] = $filters["track_id"];

        }

        if (!empty($filters["strand_id"])) {

            $query .= " AND st.strand_id = :strand_id ";
            $params[":strand_id"] = $filters["strand_id"];

        }

        if (!empty($filters["grade_level"])) {

            $query .= " AND cs.grade_level = :grade_level ";
            $params[":grade_level"] = $filters["grade_level"];

        }

        if (!empty($filters["school_year"])) {

            $query .= " AND cs.school_year = :school_year ";
            $params[":school_year"] = $filters["school_year"];

        }

        if (!empty($filters["status"])) {

            $query .= " AND cs.status = :status ";
            $params[":status"] = $filters["status"];

        } else {

            // default view hides Cancelled sections unless explicitly asked for
            $query .= " AND cs.status <> 'Cancelled' ";

        }

        $query .= " ORDER BY cs.section_id DESC ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // GET SECTION BY ID (plain row, used to prefill the edit form)

    public function getById($id) {


        $query = "

        SELECT * FROM class_sections

        WHERE section_id = :id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        $stmt->execute();


        return $stmt->fetch(PDO::FETCH_ASSOC);

    }





    // UPDATE SECTION

    public function update(Section $section) {


        $query = "

        UPDATE class_sections SET

        strand_id = :strand_id,
        adviser_id = :adviser_id,
        grade_level = :grade_level,
        section_name = :section_name,
        school_year = :school_year,
        max_slots = :max_slots,
        status = :status

        WHERE section_id = :section_id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":section_id", $section->getSectionId());
        $stmt->bindValue(":strand_id", $section->getStrandId());
        $stmt->bindValue(":adviser_id", $section->getAdviserId());
        $stmt->bindValue(":grade_level", $section->getGradeLevel());
        $stmt->bindValue(":section_name", $section->getSectionName());
        $stmt->bindValue(":school_year", $section->getSchoolYear());
        $stmt->bindValue(":max_slots", $section->getMaxSlots());
        $stmt->bindValue(":status", $section->getStatus());


        return $stmt->execute();

    }





    // SOFT DELETE SECTION
    // Changes status -> Cancelled (row is kept; enrollments FK is ON DELETE
    // RESTRICT anyway, so a real DELETE would be blocked once a section has
    // enrolled students)

    public function delete($id) {


        $query = "

        UPDATE class_sections

        SET status = 'Cancelled'

        WHERE section_id = :id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // RESTORE SECTION

    public function restore($id) {


        $query = "

        UPDATE class_sections

        SET status = 'Open'

        WHERE section_id = :id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // GET CANCELLED SECTIONS

    public function getCancelled() {


        $query = "

        SELECT

            cs.*,
            st.strand_code,
            st.strand_name

        FROM class_sections cs

        JOIN strands st
            ON cs.strand_id = st.strand_id

        WHERE cs.status = 'Cancelled'

        ORDER BY cs.section_id DESC

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // LOOKUP: ALL STRANDS (for the strand dropdown, with track name for grouping/labels)

    public function getAllStrands() {


        $query = "

        SELECT

            s.strand_id,
            s.strand_code,
            s.strand_name,
            s.track_id,
            t.track_name

        FROM strands s

        JOIN tracks t
            ON s.track_id = t.track_id

        ORDER BY t.track_name, s.strand_name

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // LOOKUP: ACTIVE TEACHERS (for the homeroom adviser dropdown)

    public function getAllTeachers() {


        $query = "

        SELECT

            teacher_id,
            first_name,
            last_name

        FROM teachers

        WHERE status = 'Active'

        ORDER BY last_name, first_name

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


}

?>
