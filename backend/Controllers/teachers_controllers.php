<?php
// teachers_controllers.php - Updated with proper error handling and JSON responses
// This file handles all teacher CRUD operations via REST-like API

// Enable error reporting for development, but handle gracefully
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON content type for GET requests
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    header("Content-Type: application/json");
}

require_once "../Dao/TeacherDAO.php";
require_once "../Models/teachers_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao = new TeacherDAO();

// ============ HELPERS ============
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
}

function sendTextResponse($message, $isSuccess = true) {
    echo $isSuccess ? "SUCCESS: " . $message : "ERROR: " . $message;
    exit;
}

function getPostData() {
    // Handle both form data and JSON
    if ($_SERVER["CONTENT_TYPE"] === "application/json") {
        $json = file_get_contents("php://input");
        return json_decode($json, true) ?? [];
    }
    return $_POST;
}

// ============ GET REQUESTS ============
if ($method === "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    switch ($action) {
        case "get":
            $id = isset($_GET["id"]) ? $_GET["id"] : null;
            if (empty($id)) {
                sendJsonResponse(["error" => "Missing teacher ID"], 400);
            }

            $teacher = $dao->getById($id);
            if ($teacher) {
                sendJsonResponse($teacher);
            } else {
                sendJsonResponse(["error" => "Teacher not found"], 404);
            }
            break;

        case "filters":
            sendJsonResponse($dao->getSpecializations());
            break;

        case "list":
        default:
            $filters = [
                "keyword" => isset($_GET["keyword"]) ? trim($_GET["keyword"]) : null,
                "specialization" => isset($_GET["specialization"]) ? trim($_GET["specialization"]) : null,
            ];
            // Remove empty filters
            $filters = array_filter($filters, function($v) { return $v !== null && $v !== ""; });
            sendJsonResponse($dao->search($filters));
            break;
    }
}

// ============ POST REQUESTS ============
if ($method === "POST") {
    $postData = getPostData();

    // Determine action: explicit action parameter, or infer from presence of teacher_id
    $action = isset($postData["action"]) ? $postData["action"] : null;

    if (!$action) {
        if (isset($postData["teacher_id"]) && !empty($postData["teacher_id"])) {
            $action = "update";
        } else {
            $action = "create";
        }
    }

    switch ($action) {
        case "delete":
            $id = $postData["id"] ?? $postData["teacher_id"] ?? null;
            if (empty($id)) {
                sendTextResponse("Missing teacher ID for deletion", false);
            }

            if ($dao->delete($id)) {
                sendTextResponse("Teacher deleted successfully", true);
            } else {
                sendTextResponse("Failed to delete teacher", false);
            }
            break;

        case "update":
            if (empty($postData["teacher_id"])) {
                sendTextResponse("Missing teacher_id for update", false);
            }

            $errors = Teacher::validate($postData, true);
            if (!empty($errors)) {
                sendTextResponse(implode("; ", $errors), false);
            }

            $teacher = new Teacher();
            $teacher->setTeacherId($postData["teacher_id"]);
            $teacher->setFirstName(trim($postData["first_name"]));
            $teacher->setLastName(trim($postData["last_name"]));
            $teacher->setEmail(trim($postData["email"]));
            $teacher->setContactNumber(trim($postData["contact_number"]));
            $teacher->setSpecialization(trim($postData["specialization"]));
            $teacher->setStatus($postData["status"] ?? "Active");

            if ($dao->update($teacher)) {
                sendTextResponse("Teacher updated successfully", true);
            } else {
                sendTextResponse("Failed to update teacher", false);
            }
            break;

        case "create":
        default:
            $errors = Teacher::validate($postData, false);
            if (!empty($errors)) {
                sendTextResponse(implode("; ", $errors), false);
            }

            $teacher = new Teacher();
            $teacher->setFirstName(trim($postData["first_name"]));
            $teacher->setLastName(trim($postData["last_name"]));
            $teacher->setEmail(trim($postData["email"]));
            $teacher->setContactNumber(trim($postData["contact_number"]));
            $teacher->setSpecialization(trim($postData["specialization"]));
            $teacher->setStatus("Active");

            if ($dao->insert($teacher)) {
                sendTextResponse("Teacher created successfully", true);
            } else {
                sendTextResponse("Failed to create teacher", false);
            }
            break;
    }
}

// ============ OTHER METHODS ============
header("HTTP/1.1 405 Method Not Allowed");
echo "Method not allowed";
exit;