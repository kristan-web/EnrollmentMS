<?php
// TeacherDAO.php - Updated with bug fixes and improvements

require_once __DIR__."/../../../config/db.php";
require_once __DIR__."/../Model/teachers_model.php";

class TeacherDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // INSERT TEACHER
    public function insert(Teacher $teacher) {
        $query = "
            INSERT INTO teachers
            (first_name, last_name, email, contact_number, specialization, status)
            VALUES
            (:first_name, :last_name, :email, :contact_number, :specialization, :status)
        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":first_name", $teacher->getFirstName());
        $stmt->bindValue(":last_name", $teacher->getLastName());
        $stmt->bindValue(":email", $teacher->getEmail());
        $stmt->bindValue(":contact_number", $teacher->getContactNumber());
        $stmt->bindValue(":specialization", $teacher->getSpecialization());
        $stmt->bindValue(":status", $teacher->getStatus() ?: "Active");

        return $stmt->execute();
    }

    // GET ACTIVE TEACHERS ONLY
    public function getAll() {
        $query = "
            SELECT * FROM teachers
            WHERE status = 'Active'
            ORDER BY last_name, first_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // SEARCH / FILTER TEACHERS
    public function search($filters = []) {
        $query = "
            SELECT * FROM teachers
            WHERE status = 'Active'
        ";

        $params = [];

        if (!empty($filters["keyword"])) {
            $query .= " AND (
                first_name LIKE :keyword
                OR last_name LIKE :keyword
                OR email LIKE :keyword
            )";
            $params[":keyword"] = "%" . $filters["keyword"] . "%";
        }

        if (!empty($filters["specialization"])) {
            $query .= " AND specialization = :specialization";
            $params[":specialization"] = $filters["specialization"];
        }

        $query .= " ORDER BY last_name, first_name";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET TEACHER BY ID
    public function getById($id) {
        $query = "SELECT * FROM teachers WHERE teacher_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // UPDATE TEACHER
    public function update(Teacher $teacher) {
        $query = "
            UPDATE teachers SET
            first_name = :first_name,
            last_name = :last_name,
            email = :email,
            contact_number = :contact_number,
            specialization = :specialization,
            status = :status
            WHERE teacher_id = :teacher_id
        ";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":teacher_id", $teacher->getTeacherId());
        $stmt->bindValue(":first_name", $teacher->getFirstName());
        $stmt->bindValue(":last_name", $teacher->getLastName());
        $stmt->bindValue(":email", $teacher->getEmail());
        $stmt->bindValue(":contact_number", $teacher->getContactNumber());
        $stmt->bindValue(":specialization", $teacher->getSpecialization());
        $stmt->bindValue(":status", $teacher->getStatus() ?: "Active");

        return $stmt->execute();
    }

    // SOFT DELETE TEACHER
    public function delete($id) {
        $query = "
            UPDATE teachers
            SET status = 'Inactive'
            WHERE teacher_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // RESTORE TEACHER
    public function restore($id) {
        $query = "
            UPDATE teachers
            SET status = 'Active'
            WHERE teacher_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // GET INACTIVE TEACHERS
    public function getInactive() {
        $query = "
            SELECT * FROM teachers
            WHERE status = 'Inactive'
            ORDER BY last_name, first_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET DISTINCT SPECIALIZATIONS
    public function getSpecializations() {
        $query = "
            SELECT DISTINCT specialization
            FROM teachers
            WHERE status = 'Active' AND specialization IS NOT NULL AND specialization != ''
            ORDER BY specialization
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Return simple array for easier frontend use
        return array_map(function($row) {
            return $row["specialization"];
        }, $results);
    }
}