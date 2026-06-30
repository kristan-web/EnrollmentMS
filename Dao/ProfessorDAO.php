<?php

require_once "../config/db.php";
require_once "../Models/professors_model.php";

class ProfessorDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }

    // INSERT PROFESSOR

    public function insert(Professor $professor) {

        $query = "

        INSERT INTO professors

        (
            department_id,
            first_name,
            last_name,
            email,
            contact_number,
            status

        )

        VALUES

        (
            :department_id,
            :first_name,
            :last_name,
            :email,
            :contact_number,
            :status

        )

        ";


        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":department_id", $professor->getDepartmentId());
        $stmt->bindValue(":first_name", $professor->getFirstName());
        $stmt->bindValue(":last_name", $professor->getLastName());
        $stmt->bindValue(":email", $professor->getEmail());
        $stmt->bindValue(":contact_number", $professor->getContactNumber());
        $stmt->bindValue(":status", $professor->getStatus());

        return $stmt->execute();

    }





    // GET ACTIVE PROFESSORS ONLY

    public function getAll() {


        $query = "

        SELECT * FROM professors

        WHERE status = 'Active'

        ORDER BY professor_id DESC

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }





    // GET PROFESSOR BY ID

    public function getById($id) {


        $query = "

        SELECT * FROM professors

        WHERE professor_id = :id

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        $stmt->execute();


        return $stmt->fetch(PDO::FETCH_ASSOC);

    }





    // UPDATE PROFESSOR

    public function update(Professor $professor) {


        $query = "

        UPDATE professors SET


        department_id = :department_id,
        first_name = :first_name,
        last_name = :last_name,
        email = :email,
        contact_number = :contact_number,
        status = :status


        WHERE professor_id = :professor_id


        ";


        $stmt = $this->conn->prepare($query);



        $stmt->bindValue(":professor_id", $professor->getProfessorId());
        $stmt->bindValue(":department_id", $professor->getDepartmentId());
        $stmt->bindValue(":first_name", $professor->getFirstName());
        $stmt->bindValue(":last_name", $professor->getLastName());
        $stmt->bindValue(":email", $professor->getEmail());
        $stmt->bindValue(":contact_number", $professor->getContactNumber());
        $stmt->bindValue(":status", $professor->getStatus());


        return $stmt->execute();

    }





    // SOFT DELETE PROFESSOR
    // Changes status from Active -> Inactive

    public function delete($id) {


        $query = "

        UPDATE professors

        SET status = 'Inactive'

        WHERE professor_id = :id


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // RESTORE PROFESSOR

    public function restore($id) {


        $query = "

        UPDATE professors

        SET status = 'Active'

        WHERE professor_id = :id


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->bindValue(":id", $id);


        return $stmt->execute();

    }





    // GET INACTIVE PROFESSORS

    public function getInactive() {


        $query = "

        SELECT * FROM professors

        WHERE status = 'Inactive'

        ORDER BY professor_id DESC


        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


}

?>
