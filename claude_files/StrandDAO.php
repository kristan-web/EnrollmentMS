<?php

require_once "../config/db.php";

class StrandDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET ALL STRANDS (for the apply-form dropdown)
    public function getAll() {
        $query = "SELECT strand_id, strand_code, strand_name, description FROM strands ORDER BY strand_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ONE STRAND BY ID (used to validate a submitted application)
    public function getById($id) {
        $query = "SELECT strand_id, strand_code, strand_name FROM strands WHERE strand_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
