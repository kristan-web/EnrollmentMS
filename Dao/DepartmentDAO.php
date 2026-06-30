<?php

require_once "../config/db.php";
require_once "../Models/departments_model.php";

class DepartmentDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }


    // GET ALL DEPARTMENTS

    public function getAll() {


        $query = "

        SELECT * FROM departments

        ORDER BY department_name ASC

        ";


        $stmt = $this->conn->prepare($query);


        $stmt->execute();


        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


}

?>
