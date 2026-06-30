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
            student_number,
            first_name,
            last_name,
            gender,
            birthdate,
            address,
            contact_number,
            email,
            year_level,
            status

        )

        VALUES

        (
            :student_number,
            :first_name,
            :last_name,
            :gender,
            :birthdate,
            :address,
            :contact_number,
            :email,
            :year_level,
            :status

        )

        ";


        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":student_number", $student->getStudentNumber());
        $stmt->bindValue(":first_name", $student->getFirstName());
        $stmt->bindValue(":last_name", $student->getLastName());
        $stmt->bindValue(":gender", $student->getGender());
        $stmt->bindValue(":birthdate", $student->getBirthdate());
        $stmt->bindValue(":address", $student->getAddress());
        $stmt->bindValue(":contact_number", $student->getContactNumber());
        $stmt->bindValue(":email", $student->getEmail());
        $stmt->bindValue(":year_level", $student->getYearLevel());
        $stmt->bindValue(":status", $student->getStatus());

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


        first_name = :first_name,
        last_name = :last_name,
        gender = :gender,
        birthdate = :birthdate,
        address = :address,
        contact_number = :contact_number,
        email = :email,
        year_level = :year_level,
        status = :status


        WHERE student_id = :student_id


        ";


        $stmt = $this->conn->prepare($query);



        $stmt->bindValue(":student_id", $student->getStudentId());
        $stmt->bindValue(":first_name", $student->getFirstName());
        $stmt->bindValue(":last_name", $student->getLastName());
        $stmt->bindValue(":gender", $student->getGender());
        $stmt->bindValue(":birthdate", $student->getBirthdate());
        $stmt->bindValue(":address", $student->getAddress());
        $stmt->bindValue(":contact_number", $student->getContactNumber());
        $stmt->bindValue(":email", $student->getEmail());
        $stmt->bindValue(":year_level", $student->getYearLevel());
        $stmt->bindValue(":status", $student->getStatus());


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