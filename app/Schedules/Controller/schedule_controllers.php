<?php

require_once __DIR__."/../DAO/ScheduleDAO.php";
require_once __DIR__."/../Model/schedule_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
        
        // DEBUG: Log the filters
        error_log("=== LIST ACTION FILTERS ===");
        error_log(print_r($filters, true));
        
        try {
            $results = $dao->getAll($filters);
            
            // DEBUG: Log the results
            error_log("=== LIST ACTION RESULTS ===");
            error_log("Count: " . count($results));
            if (count($results) > 0) {
                error_log("First result: " . print_r($results[0], true));
            }
            
            // Make sure we're returning an array
            if (!is_array($results)) {
                error_log("ERROR: getAll did not return an array!");
                $results = [];
            }
            
            echo json_encode($results);
        } catch (Exception $e) {
            error_log("EXCEPTION in list action: " . $e->getMessage());
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;

    } else if ($action == "lookup") {
        $sectionId = isset($_GET["section_id"]) ? $_GET["section_id"] : null;
        $term = isset($_GET["term"]) ? $_GET["term"] : null;

        // Debug: Log what we're getting
        error_log("=== LOOKUP REQUEST ===");
        error_log("section_id: " . ($sectionId ?? 'null'));
        error_log("term: " . ($term ?? 'null'));

        $sections = $dao->getAllSections();
        $rooms = $dao->getAllRooms();
        $teachers = $dao->getAllTeachers();
        
        // Debug: Log counts
        error_log("Sections found: " . count($sections));
        error_log("Rooms found: " . count($rooms));
        error_log("Teachers found: " . count($teachers));

        $response = [
            "sections" => $sections,
            "rooms" => $rooms,
            "teachers" => $teachers,
            "subjects" => []
        ];

        if ($sectionId) {
            // Get section info for debugging
            $sectionInfo = $dao->getSectionInfo($sectionId);
            error_log("Section Info: " . print_r($sectionInfo, true));
            
            $subjects = $dao->getSubjectsForSection($sectionId, $term);
            error_log("Subjects found: " . count($subjects));
            if (count($subjects) > 0) {
                error_log("First subject: " . print_r($subjects[0], true));
            }
            
            $response["subjects"] = $subjects;
        } else {
            error_log("No section_id provided, skipping subject lookup");
        }

        // If teachers or subjects are empty, add debug info to response
        if (empty($teachers)) {
            $response["_debug_teachers"] = "No active teachers found in database";
        }
        if (empty($response["subjects"])) {
            $response["_debug_subjects"] = "No subjects match the section criteria";
        }

        echo json_encode($response);

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
        $subjectId = isset($_GET["subject_id"]) ? $_GET["subject_id"] : null;
        $excludeId = isset($_GET["exclude_id"]) ? $_GET["exclude_id"] : null;

        $conflicts = [];

        // Check duplicate subject for the same section on the same day
        if ($sectionId && $subjectId && $dayOfWeek) {
            $conflicts['duplicate_subject'] = $dao->checkDuplicateSubject($sectionId, $subjectId, $dayOfWeek, $excludeId);
        }

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

    } else if ($action == "debug_schedules") {
        $schedules = $dao->debugGetAllSchedules();
        echo json_encode([
            "count" => count($schedules),
            "schedules" => $schedules
        ]);
        exit;

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

        $sectionId = $_POST["section_id"];
        $subjectId = $_POST["subject_id"];
        $teacherId = $_POST["teacher_id"];
        $roomId = $_POST["room_id"];
        $dayOfWeek = $_POST["day_of_week"];
        $startTime = $_POST["start_time"];
        $endTime = $_POST["end_time"];

        // Additional validation: School hours (9:00 AM - 5:00 PM)
        if (!Schedule::isWithinSchoolHours($startTime, $endTime)) {
            echo json_encode([
                "success" => false,
                "message" => "School hours are from 9:00 AM to 5:00 PM only. Please adjust the time."
            ]);
            exit;
        }
        // After the school hours validation
        $start = new DateTime($startTime);
        $end = new DateTime($endTime);
        $diff = $start->diff($end);
        $minutes = $diff->h * 60 + $diff->i;

        if ($minutes < 60) {
            echo json_encode([
                "success" => false,
                "message" => "Class duration must be at least 1 hour (60 minutes)."
            ]);
            exit;
        }

        // Check for conflicts
        $excludeId = ($action == "update" && !empty($_POST["schedule_id"])) ? $_POST["schedule_id"] : null;

        // Check duplicate subject for the same section on the same day
        if ($dao->checkDuplicateSubject($sectionId, $subjectId, $dayOfWeek, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This section already has this subject scheduled on $dayOfWeek. A section cannot have the same subject twice on the same day."
            ]);
            exit;
        }

        // Check section conflict (time overlap)
        if ($dao->checkSectionConflict($sectionId, $dayOfWeek, $startTime, $endTime, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This section already has a class at that time."
            ]);
            exit;
        }

        // Check teacher conflict
        if ($teacherId && $dao->checkTeacherConflict($teacherId, $dayOfWeek, $startTime, $endTime, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This teacher is already assigned to another class at that time."
            ]);
            exit;
        }

        // Check room conflict
        if ($dao->checkRoomConflict($roomId, $dayOfWeek, $startTime, $endTime, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "This room is already occupied at that time."
            ]);
            exit;
        }

        $schedule = new Schedule();
        $schedule->setSectionId($sectionId);
        $schedule->setSubjectId($subjectId);
        $schedule->setTeacherId($teacherId);
        $schedule->setRoomId($roomId);
        $schedule->setDayOfWeek($dayOfWeek);
        $schedule->setStartTime($startTime);
        $schedule->setEndTime($endTime);

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
            error_log("PDOException in save: " . $e->getMessage());
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