<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

// Set JSON header for all responses
header('Content-Type: application/json');

require_once __DIR__."/../DAO/roomDAO.php";
require_once __DIR__."/../Model/room_model.php";

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $dao    = new RoomsDAO();

    if ($method == "GET") {
        $action = isset($_GET["action"]) ? $_GET["action"] : "list";

        // Get rooms list
        if ($action == "list") {
            $filters = [
                "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null
            ];
            echo json_encode($dao->getRooms($filters));

        // Get room details by ID
        } else if ($action == "get") {
            $id = isset($_GET["id"]) ? $_GET["id"] : null;
            if (empty($id)) {
                echo json_encode(["error" => "Missing room id"]);
                exit;
            }
            $room = $dao->getRoomById($id);
            if ($room) {
                echo json_encode($room);
            } else {
                echo json_encode(["error" => "Room not found"]);
            }

        // Invalid action
        } else {
            echo json_encode(["error" => "Invalid action: " . $action]);
        }

    // Handle POST requests
    } else if ($method == "POST") {
        $action = isset($_POST["action"]) ? $_POST["action"] : "create";

        // Create new room
        if ($action == "create") {
            $errors = Rooms::validate($_POST);
            if (!empty($errors)) {
                echo "INSERT FAILED: " . implode(" ", $errors);
                exit;
            }

            // Check duplicate room in the same building
            if ($dao->isDuplicate($_POST["room_name"], $_POST["building"])) {
                echo "INSERT FAILED: A room with that name already exists in that building.";
                exit;
            }

            $room = new Rooms();
            $room->setRoomName(trim($_POST["room_name"]));
            $room->setBuilding(trim($_POST["building"]));
            $room->setCapacity((int)$_POST["capacity"]);

            if ($dao->insert($room)) {
                echo "INSERT SUCCESS";
            } else {
                echo "INSERT FAILED";
            }

        // Update existing room
        } else if ($action == "update") {
            $id = isset($_POST["room_id"]) ? $_POST["room_id"] : null;
            if (empty($id)) {
                echo "UPDATE FAILED: missing room_id";
                exit;
            }

            $errors = Rooms::validate($_POST);
            if (!empty($errors)) {
                echo "UPDATE FAILED: " . implode(" ", $errors);
                exit;
            }

            $existing = $dao->getRoomById($id);
            if (!$existing) {
                echo "UPDATE FAILED: Room not found.";
                exit;
            }

            // Check duplicate room in the same building (excluding this room)
            if ($dao->isDuplicate($_POST["room_name"], $_POST["building"], $id)) {
                echo "UPDATE FAILED: A room with that name already exists in that building.";
                exit;
            }

            $room = new Rooms();
            $room->setRoomId($id);
            $room->setRoomName(trim($_POST["room_name"]));
            $room->setBuilding(trim($_POST["building"]));
            $room->setCapacity((int)$_POST["capacity"]);

            if ($dao->update($id, $room)) {
                echo "UPDATE SUCCESS";
            } else {
                echo "UPDATE FAILED";
            }

        // Delete room
        } else if ($action == "delete") {
            $id = isset($_POST["room_id"]) ? $_POST["room_id"] : null;
            if (empty($id)) {
                echo "DELETE FAILED: missing room_id";
                exit;
            }

            // Prevent deleting a room that's currently used in a schedule
            if ($dao->isRoomInUse($id)) {
                echo "DELETE FAILED: This room is currently assigned to one or more class schedules.";
                exit;
            }

            if ($dao->delete($id)) {
                echo "DELETE SUCCESS";
            } else {
                echo "DELETE FAILED";
            }

        // Invalid action
        } else {
            echo "Invalid action: " . $action;
        }

    } else {
        echo "Method not allowed";
    }

} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Error $e) {
    error_log('Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>