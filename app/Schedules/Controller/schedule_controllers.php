<?php

require_once __DIR__."/../DAO/ScheduleDAO.php";
require_once __DIR__."/../Model/schedule_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new ScheduleDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "section_id" => isset($_GET["section_id"]) ? $_GET["section_id"] : null,
            "term" => isset($_GET["term"]) ? $_GET["term"] : null,
            "teacher_id" => isset($_GET["teacher_id"]) ? $_GET["teacher_id"] : null,
            "day_of_week" => isset($_GET["day_of_week"]) ? $_GET["day_of_week"] : null,
        ];
        echo json_encode($dao->getAll($filters));

    } else if ($action == "lookup") {
        echo json_encode([
            "sections" => $dao->getAllSections(),
            "rooms" => $dao->getAllRooms(),
            "teachers" => $dao->getAllTeachers(),
            "class_subjects" => $dao->getAllClassSubjects([
                "section_id" => isset($_GET["section_id"]) ? $_GET["section_id"] : null,
                "term" => isset($_GET["term"]) ? $_GET["term"] : null,
            ])
        ]);

    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing schedule id"]);
            exit;
        }
        $schedule = $dao->getById($id);
        if ($schedule) {
            echo json_encode($schedule);
        } else {
            echo json_encode(["error" => "Schedule not found"]);
        }

    } else if ($action == "section_schedule") {
        $sectionId = isset($_GET["section_id"]) ? $_GET["section_id"] : null;
        $term = isset($_GET["term"]) ? $_GET["term"] : null;
        if (empty($sectionId)) {
            echo json_encode(["error" => "Missing section id"]);
            exit;
        }
        echo json_encode($dao->getBySection($sectionId, $term));

    } else if ($action == "check_conflicts") {
        $sectionId = isset($_GET["section_id"]) ? $_GET["section_id"] : null;
        $teacherId = isset($_GET["teacher_id"]) ? $_GET["teacher_id"] : null;
        $roomId = isset($_GET["room_id"]) ? $_GET["room_id"] : null;
        $dayOfWeek = isset($_GET["day_of_week"]) ? $_GET["day_of_week"] : null;
        $startTime = isset($_GET["start_time"]) ? $_GET["start_time"] : null;
        $endTime = isset($_GET["end_time"]) ? $_GET["end_time"] : null;
        $excludeId = isset($_GET["exclude_id"]) ? $_GET["exclude_id"] : null;

        $conflicts = [];

        if ($sectionId) {
            $conflicts['section'] = $dao->checkSectionConflict($sectionId, $dayOfWeek, $startTime, $endTime, $excludeId);
        }
        if ($teacherId) {
            $conflicts['teacher'] = $dao->checkTeacherConflict($teacherId, $dayOfWeek, $startTime, $endTime, $excludeId);
        }
        if ($roomId) {
            $conflicts['room'] = $dao->checkRoomConflict($roomId, $dayOfWeek, $startTime, $endTime, $excludeId);
        }

        echo json_encode($conflicts);

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "create";

    if ($action == "create" || $action == "update") {
        $errors = Schedule::validate($_POST);

        if (!empty($errors)) {
            echo json_encode([
                "success" => false,
                "message" => implode(" ", $errors)
            ]);
            exit;
        }

        // Get class subject details for conflict checking
        $classSubject = $dao->getClassSubjectById($_POST["class_subject_id"]);
        if (!$classSubject) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid class subject selected."
            ]);
            exit;
        }

        // Check for conflicts
        $excludeId = ($action == "update" && !empty($_POST["schedule_id"])) ? $_POST["schedule_id"] : null;

        // Check section conflict
        if ($dao->checkSectionConflict($classSubject['section_id'], $_POST["day_of_week"], $_POST["start_time"], $_POST["end_time"], $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This section already has a class at that time."
            ]);
            exit;
        }

        // Check teacher conflict
        if ($classSubject['teacher_id'] && $dao->checkTeacherConflict($classSubject['teacher_id'], $_POST["day_of_week"], $_POST["start_time"], $_POST["end_time"], $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This teacher is already assigned to another class at that time."
            ]);
            exit;
        }

        // Check room conflict
        if ($dao->checkRoomConflict($_POST["room_id"], $_POST["day_of_week"], $_POST["start_time"], $_POST["end_time"], $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This room is already occupied at that time."
            ]);
            exit;
        }

        $schedule = new Schedule();
        $schedule->setClassSubjectId($_POST["class_subject_id"]);
        $schedule->setRoomId($_POST["room_id"]);
        $schedule->setDayOfWeek($_POST["day_of_week"]);
        $schedule->setStartTime($_POST["start_time"]);
        $schedule->setEndTime($_POST["end_time"]);

        try {
            if ($action == "update") {
                if (empty($_POST["schedule_id"])) {
                    echo json_encode(["success" => false, "message" => "Missing schedule_id"]);
                    exit;
                }
                $schedule->setScheduleId($_POST["schedule_id"]);
                $result = $dao->update($schedule);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Schedule updated successfully" : "Failed to update schedule"
                ]);
            } else {
                $result = $dao->insert($schedule);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Schedule created successfully" : "Failed to create schedule"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to save schedule. Please check your inputs."
            ]);
        }

    } else if ($action == "delete") {
        $id = isset($_POST["schedule_id"]) ? $_POST["schedule_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing schedule id"]);
            exit;
        }

        try {
            $result = $dao->delete($id);
            echo json_encode([
                "success" => $result,
                "message" => $result ? "Schedule deleted successfully" : "Failed to delete schedule"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete schedule."
            ]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}