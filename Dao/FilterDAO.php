<?php

require_once "../config/db.php";

class FilterDAO {

    private $conn;


    public function __construct() {

        $database = new Database();

        $this->conn = $database->connect();

    }


    // GET ALL TRACKS

    public function getTracks() {

        $query = "

        SELECT track_id, track_code, track_name

        FROM tracks

        ORDER BY track_name

        ";

        $stmt = $this->conn->prepare($query);

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


    // GET STRANDS, OPTIONALLY FILTERED BY TRACK

    public function getStrands($track_id = null) {

        $query = "

        SELECT strand_id, track_id, strand_code, strand_name

        FROM strands

        WHERE 1 = 1

        ";

        $params = [];

        if (!empty($track_id)) {

            $query .= " AND track_id = :track_id ";
            $params[":track_id"] = $track_id;

        }

        $query .= " ORDER BY strand_name ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }


    // GET CLASS SECTIONS, OPTIONALLY FILTERED BY STRAND AND/OR GRADE LEVEL

    public function getSections($strand_id = null, $grade_level = null) {

        $query = "

        SELECT section_id, strand_id, grade_level, section_name, school_year, status

        FROM class_sections

        WHERE status = 'Open'

        ";

        $params = [];

        if (!empty($strand_id)) {

            $query .= " AND strand_id = :strand_id ";
            $params[":strand_id"] = $strand_id;

        }

        if (!empty($grade_level)) {

            $query .= " AND grade_level = :grade_level ";
            $params[":grade_level"] = $grade_level;

        }

        $query .= " ORDER BY section_name ";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);

    }

}

?>
