<?php

require_once __DIR__."/../../../config/db.php";
require_once __DIR__."/../Model/room_model.php";

class RoomsDAO {

    private $conn;

    public function __construct() {
        try {
            $database = new Database();
            $this->conn = $database->connect();
            if (!$this->conn) {
                throw new Exception('Database connection failed');
            }
        } catch (Exception $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw $e;
        }
    }

    // ============ ROOM QUERIES ============

    // GET ALL ROOMS (with optional keyword search on room name / building)
    public function getRooms($filters = []) {
        $params = [];

        $query = "
        SELECT
            room_id,
            room_name,
            building,
            capacity,
            created_at
        FROM rooms
        WHERE 1=1
        ";

        if (!empty($filters["keyword"])) {
            $query .= " AND (
                room_name LIKE :kw1
                OR building LIKE :kw2
            ) ";
            $likeKeyword = "%" . $filters["keyword"] . "%";
            $params[":kw1"] = $likeKeyword;
            $params[":kw2"] = $likeKeyword;
        }

        $query .= " ORDER BY building, room_name ";

        try {
            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log('getRooms returned ' . count($result) . ' records');
            return $result;
        } catch (PDOException $e) {
            error_log('SQL Error in getRooms: ' . $e->getMessage());
            error_log('Query: ' . $query);
            error_log('Params: ' . print_r($params, true));
            return [];
        }
    }

    // GET ROOM BY ID
    public function getRoomById($id) {
        $query = "
        SELECT room_id, room_name, building, capacity, created_at
        FROM rooms
        WHERE room_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // DUPLICATE CHECK (same room name within the same building)
    public function isDuplicate($roomName, $building, $excludeId = null) {
        $query = "
        SELECT COUNT(*) FROM rooms
        WHERE room_name = :room_name
        AND building = :building
        ";

        if (!empty($excludeId)) {
            $query .= " AND room_id != :exclude_id ";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":room_name", $roomName);
        $stmt->bindValue(":building", $building);
        if (!empty($excludeId)) {
            $stmt->bindValue(":exclude_id", $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK IF ROOM IS CURRENTLY USED IN ANY SCHEDULE
    public function isRoomInUse($id) {
        $query = "
        SELECT COUNT(*) FROM schedules
        WHERE room_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // ============ ROOM CRUD OPERATIONS ============

    // CREATE ROOM
    public function insert(Rooms $room) {
        $query = "
        INSERT INTO rooms
        (
            room_name,
            building,
            capacity
        )
        VALUES
        (
            :room_name,
            :building,
            :capacity
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":room_name", $room->getRoomName());
        $stmt->bindValue(":building", $room->getBuilding());
        $stmt->bindValue(":capacity", $room->getCapacity(), PDO::PARAM_INT);

        $result = $stmt->execute();
        error_log('Insert room result: ' . ($result ? 'SUCCESS' : 'FAILED'));

        return $result;
    }

    // UPDATE ROOM
    public function update($id, Rooms $room) {
        $query = "
        UPDATE rooms
        SET room_name = :room_name,
            building = :building,
            capacity = :capacity
        WHERE room_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":room_name", $room->getRoomName());
        $stmt->bindValue(":building", $room->getBuilding());
        $stmt->bindValue(":capacity", $room->getCapacity(), PDO::PARAM_INT);
        $stmt->bindValue(":id", $id);

        return $stmt->execute();
    }

    // DELETE ROOM
    public function delete($id) {
        $query = "
        DELETE FROM rooms
        WHERE room_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }
}

?>