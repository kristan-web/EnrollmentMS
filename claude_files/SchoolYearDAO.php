<?php

require_once "../config/db.php";

class SchoolYearDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET THE SCHOOL YEAR CURRENTLY OPEN FOR APPLICATIONS
    public function getActive() {
        $query = "SELECT school_year_id, year, status FROM school_years WHERE status = 'active' LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
