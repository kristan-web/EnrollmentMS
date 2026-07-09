<?php

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../Models/strand/strands_model.php";

class StrandDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // INSERT STRAND
    public function insert(Strand $strand) {
        $query = "
        INSERT INTO strands
        (
            track_id,
            strand_code,
            strand_name,
            description
        )
        VALUES
        (
            :track_id,
            :strand_code,
            :strand_name,
            :description
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":track_id", $strand->getTrackId());
        $stmt->bindValue(":strand_code", $strand->getStrandCode());
        $stmt->bindValue(":strand_name", $strand->getStrandName());
        $stmt->bindValue(":description", $strand->getDescription());

        return $stmt->execute();
    }

    // GET ALL STRANDS (with track info)
    public function getAll() {
        $query = "
        SELECT
            s.*,
            t.track_id AS track_id,
            t.track_code,
            t.track_name,
            (
                SELECT COUNT(*) FROM class_sections cs
                WHERE cs.strand_id = s.strand_id
                AND cs.status <> 'Cancelled'
            ) AS section_count,
            (
                SELECT COUNT(*) FROM subjects sub
                WHERE sub.strand_id = s.strand_id
                AND sub.status = 'Active'
            ) AS subject_count
        FROM strands s
        JOIN tracks t
            ON s.track_id = t.track_id
        ORDER BY t.track_name, s.strand_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // SEARCH / FILTER STRANDS
    public function search($filters = []) {
        $query = "
        SELECT
            s.*,
            t.track_id AS track_id,
            t.track_code,
            t.track_name,
            (
                SELECT COUNT(*) FROM class_sections cs
                WHERE cs.strand_id = s.strand_id
                AND cs.status <> 'Cancelled'
            ) AS section_count,
            (
                SELECT COUNT(*) FROM subjects sub
                WHERE sub.strand_id = s.strand_id
                AND sub.status = 'Active'
            ) AS subject_count
        FROM strands s
        JOIN tracks t
            ON s.track_id = t.track_id
        WHERE 1 = 1
        ";

        $params = [];

        if (!empty($filters["keyword"])) {
            $query .= " AND (
                s.strand_code LIKE :keyword
                OR s.strand_name LIKE :keyword
                OR s.description LIKE :keyword
            ) ";
            $params[":keyword"] = "%" . $filters["keyword"] . "%";
        }

        $query .= " ORDER BY t.track_name, s.strand_name ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET STRAND BY ID
    public function getById($id) {
        $query = "
        SELECT
            s.*,
            t.track_id AS track_id,
            t.track_code,
            t.track_name,
            (
                SELECT COUNT(*) FROM class_sections cs
                WHERE cs.strand_id = s.strand_id
                AND cs.status <> 'Cancelled'
            ) AS section_count,
            (
                SELECT COUNT(*) FROM subjects sub
                WHERE sub.strand_id = s.strand_id
                AND sub.status = 'Active'
            ) AS subject_count
        FROM strands s
        JOIN tracks t
            ON s.track_id = t.track_id
        WHERE s.strand_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET STRAND BASE DATA (for edit form)
    public function getBaseById($id) {
        $query = "SELECT * FROM strands WHERE strand_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // UPDATE STRAND
    public function update(Strand $strand) {
        $query = "
        UPDATE strands SET
            track_id = :track_id,
            strand_code = :strand_code,
            strand_name = :strand_name,
            description = :description
        WHERE strand_id = :strand_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":strand_id", $strand->getStrandId());
        $stmt->bindValue(":track_id", $strand->getTrackId());
        $stmt->bindValue(":strand_code", $strand->getStrandCode());
        $stmt->bindValue(":strand_name", $strand->getStrandName());
        $stmt->bindValue(":description", $strand->getDescription());

        return $stmt->execute();
    }

    // DELETE STRAND
    public function delete($id) {
        $query = "DELETE FROM strands WHERE strand_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // GET ALL TRACKS (for dropdown)
    public function getAllTracks() {
        $query = "
        SELECT track_id, track_code, track_name
        FROM tracks
        ORDER BY track_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // DUPLICATE CODE CHECK
    public function isCodeTaken($code, $excludeId = null) {
        $query = "SELECT COUNT(*) FROM strands WHERE strand_code = :code";
        if ($excludeId) {
            $query .= " AND strand_id <> :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":code", $code);
        if ($excludeId) {
            $stmt->bindValue(":exclude_id", $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK IF STRAND HAS SECTIONS
    public function hasSections($id) {
        $query = "
        SELECT COUNT(*) FROM class_sections
        WHERE strand_id = :id
        AND status <> 'Cancelled'
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK IF STRAND HAS SUBJECTS
    public function hasSubjects($id) {
        $query = "
        SELECT COUNT(*) FROM subjects
        WHERE strand_id = :id
        AND status = 'Active'
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
}

?>