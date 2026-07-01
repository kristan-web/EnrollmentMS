<?php

require_once "../config/db.php";
require_once "../Models/students_model.php";

class StudentDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }

    // INSERT STUDENT

    public function insert(Student $student) {

        $query = "

        INSERT INTO students

        (
            lrn,
            student_number,
            first_name,
            middle_name,
            last_name,
            gender,
            birthdate,
            address,
            contact_number,
            email,
            grade_level,
            status,
            father_name,
            father_contact_number,
            father_occupation,
            mother_name,
            mother_contact_number,
            mother_occupation,
            guardian_name,
            guardian_relationship,
            guardian_contact_number,
            guardian_address,
            emergency_contact_name,
            emergency_contact_relationship,
            emergency_contact_number

        )

        VALUES

        (
            :lrn,
            :student_number,
            :first_name,
            :middle_name,
            :last_name,
            :gender,
            :birthdate,
            :address,
            :contact_number,
            :email,
            :grade_level,
            :status,
            :father_name,
            :father_contact_number,
            :father_occupation,
            :mother_name,
            :mother_contact_number,
            :mother_occupation,
            :guardian_name,
            :guardian_relationship,
            :guardian_contact_number,
            :guardian_address,
            :emergency_contact_name,
            :emergency_contact_relationship,
            :emergency_contact_number

        )

        ";


        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":lrn", $student->getLrn());
        $stmt->bindValue(":student_number", $student->getStudentNumber());
        $stmt->bindValue(":first_name", $student->getFirstName());
        $stmt->bindValue(":middle_name", $student->getMiddleName());
        $stmt->bindValue(":last_name", $student->getLastName());
        $stmt->bindValue(":gender", $student->getGender());
        $stmt->bindValue(":birthdate", $student->getBirthdate());
        $stmt->bindValue(":address", $student->getAddress());
        $stmt->bindValue(":contact_number", $student->getContactNumber());
        $stmt->bindValue(":email", $student->getEmail());
        $stmt->bindValue(":grade_level", $student->getGradeLevel());
        $stmt->bindValue(":status", $student->getStatus());
        $stmt->bindValue(":father_name", $student->getFatherName());
        $stmt->bindValue(":father_contact_number", $student->getFatherContactNumber());
        $stmt->bindValue(":father_occupation", $student->getFatherOccupation());
        $stmt->bindValue(":mother_name", $student->getMotherName());
        $stmt->bindValue(":mother_contact_number", $student->getMotherContactNumber());
        $stmt->bindValue(":mother_occupation", $student->getMotherOccupation());
        $stmt->bindValue(":guardian_name", $student->getGuardianName());
        $stmt->bindValue(":guardian_relationship", $student->getGuardianRelationship());
        $stmt->bindValue(":guardian_contact_number", $student->getGuardianContactNumber());
        $stmt->bindValue(":guardian_address", $student->getGuardianAddress());
        $stmt->bindValue(":emergency_contact_name", $student->getEmergencyContactName());
        $stmt->bindValue(":emergency_contact_relationship", $student->getEmergencyContactRelationship());
        $stmt->bindValue(":emergency_contact_number", $student->getEmergencyContactNumber());

        return $stmt->execute();

    }





    // GET ACTIVE STUDENTS ONLY

    public function getAll() {


        $query = "

        SELECT * FROM students

        WHERE status = 'Active'

        ORDER BY student_id DESC

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // SEARCH / FILTER STUDENTS
    // Joins each student's current enrollment (status = 'Enrolled') so we can
    // filter by track, strand, and section. A student with no active
    // enrollment yet will still show up, just with blank track/strand/section.
    //
    // $filters (all optional):
    //   keyword     - matches student_number, lrn, first_name, last_name
    //   track_id
    //   strand_id
    //   grade_level - '11' or '12'
    //   section_id

    public function search($filters = []) {

        $query = "

        SELECT

            s.*,
            cs.section_id,
            cs.section_name,
            cs.school_year,
            e.semester,
            st.strand_id,
            st.strand_code,
            st.strand_name,
            t.track_id,
            t.track_code,
            t.track_name

        FROM students s

        LEFT JOIN enrollments e
            ON s.student_id = e.student_id AND e.status = 'Enrolled'

        LEFT JOIN class_sections cs
            ON e.section_id = cs.section_id

        LEFT JOIN strands st
            ON cs.strand_id = st.strand_id

        LEFT JOIN tracks t
            ON st.track_id = t.track_id

        WHERE s.status = 'Active'

        ";

        $params = [];

        if (!empty($filters["keyword"])) {

            $query .= " AND (
                s.student_number LIKE :keyword
                OR s.lrn LIKE :keyword
                OR s.first_name LIKE :keyword
                OR s.last_name LIKE :keyword
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

            $query .= " AND s.grade_level = :grade_level ";
            $params[":grade_level"] = $filters["grade_level"];

        }

        if (!empty($filters["section_id"])) {

            $query .= " AND cs.section_id = :section_id ";
            $params[":section_id"] = $filters["section_id"];

        }

        $query .= " ORDER BY s.last_name, s.first_name ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // GET STUDENT BY ID

    public function getById($id) {


        $query = "

        SELECT * FROM students

        WHERE student_id = :id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        $stmt->execute();


        return $stmt->fetch(PDO::FETCH_ASSOC);

    }





    // UPDATE STUDENT

    public function update(Student $student) {


        $query = "

        UPDATE students SET

        lrn = :lrn,
        first_name = :first_name,
        middle_name = :middle_name,
        last_name = :last_name,
        gender = :gender,
        birthdate = :birthdate,
        address = :address,
        contact_number = :contact_number,
        email = :email,
        grade_level = :grade_level,
        status = :status,
        father_name = :father_name,
        father_contact_number = :father_contact_number,
        father_occupation = :father_occupation,
        mother_name = :mother_name,
        mother_contact_number = :mother_contact_number,
        mother_occupation = :mother_occupation,
        guardian_name = :guardian_name,
        guardian_relationship = :guardian_relationship,
        guardian_contact_number = :guardian_contact_number,
        guardian_address = :guardian_address,
        emergency_contact_name = :emergency_contact_name,
        emergency_contact_relationship = :emergency_contact_relationship,
        emergency_contact_number = :emergency_contact_number

        WHERE student_id = :student_id


        ";


        $stmt = $this->conn->prepare($query);



        $stmt->bindValue(":student_id", $student->getStudentId());
        $stmt->bindValue(":lrn", $student->getLrn());
        $stmt->bindValue(":first_name", $student->getFirstName());
        $stmt->bindValue(":middle_name", $student->getMiddleName());
        $stmt->bindValue(":last_name", $student->getLastName());
        $stmt->bindValue(":gender", $student->getGender());
        $stmt->bindValue(":birthdate", $student->getBirthdate());
        $stmt->bindValue(":address", $student->getAddress());
        $stmt->bindValue(":contact_number", $student->getContactNumber());
        $stmt->bindValue(":email", $student->getEmail());
        $stmt->bindValue(":grade_level", $student->getGradeLevel());
        $stmt->bindValue(":status", $student->getStatus());
        $stmt->bindValue(":father_name", $student->getFatherName());
        $stmt->bindValue(":father_contact_number", $student->getFatherContactNumber());
        $stmt->bindValue(":father_occupation", $student->getFatherOccupation());
        $stmt->bindValue(":mother_name", $student->getMotherName());
        $stmt->bindValue(":mother_contact_number", $student->getMotherContactNumber());
        $stmt->bindValue(":mother_occupation", $student->getMotherOccupation());
        $stmt->bindValue(":guardian_name", $student->getGuardianName());
        $stmt->bindValue(":guardian_relationship", $student->getGuardianRelationship());
        $stmt->bindValue(":guardian_contact_number", $student->getGuardianContactNumber());
        $stmt->bindValue(":guardian_address", $student->getGuardianAddress());
        $stmt->bindValue(":emergency_contact_name", $student->getEmergencyContactName());
        $stmt->bindValue(":emergency_contact_relationship", $student->getEmergencyContactRelationship());
        $stmt->bindValue(":emergency_contact_number", $student->getEmergencyContactNumber());


        return $stmt->execute();

    }





    // SOFT DELETE STUDENT
    // Changes status from Active -> Inactive

    public function delete($id) {


        $query = "

        UPDATE students

        SET status = 'Inactive'

        WHERE student_id = :id


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // RESTORE STUDENT

    public function restore($id) {


        $query = "

        UPDATE students

        SET status = 'Active'

        WHERE student_id = :id


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // GET INACTIVE STUDENTS

    public function getInactive() {


        $query = "

        SELECT * FROM students

        WHERE status = 'Inactive'

        ORDER BY student_id DESC


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


}

?>
