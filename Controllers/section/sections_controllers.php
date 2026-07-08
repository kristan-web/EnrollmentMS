<?php

require_once __DIR__."/../../Dao/section/SectionDAO.php";
require_once __DIR__."/../../Models/section/sections_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new SectionDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "lookup") {
        // Get school years from the database
        $schoolYears = $dao->getAllSchoolYears();
        
        echo json_encode([
            "strands" => $dao->getAllStrands(),
            "teachers" => $dao->getAllTeachers(),
            "school_years" => $schoolYears,
        ]);
    } else if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "track_id" => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
            "strand_id" => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
            "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "school_year" => isset($_GET["school_year"]) ? $_GET["school_year"] : null,
            "status" => isset($_GET["status"]) ? $_GET["status"] : null,
        ];
        echo json_encode($dao->search($filters));
    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["section_id"]) ? "update" : "create");

    if ($action == "delete" || $action == "restore") {
        $id = isset($_POST["section_id"]) ? $_POST["section_id"] : null;

        if (!$id) {
            echo json_encode(["success" => false, "message" => "No section specified."]);
            exit;
        }

        try {
            if ($action == "restore") {
                $result = $dao->restore($id);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Section restored successfully." : "Failed to restore section."
                ]);
            } else {
                $enrolled = $dao->getEnrolledCount($id);
                if ($enrolled > 0) {
                    echo json_encode([
                        "success" => false,
                        "message" => "This section has $enrolled enrolled student" . ($enrolled === 1 ? "" : "s") . " and cannot be cancelled."
                    ]);
                    exit;
                }
                $result = $dao->delete($id);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Section cancelled successfully." : "Failed to cancel section."
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "This section cannot be removed because it already has enrolled students."
            ]);
        }

    } else if ($action == "create" || $action == "update") {
        $errors = Section::validate($_POST);

        if (!empty($errors)) {
            echo json_encode([
                "success" => false,
                "message" => implode(" ", $errors)
            ]);
            exit;
        }

        // REQUIRE TEACHER
        if (empty($_POST["adviser_id"])) {
            echo json_encode([
                "success" => false,
                "message" => "Please select an adviser for this section."
            ]);
            exit;
        }

        $sectionName = trim($_POST["section_name"]);
        $schoolYear = trim($_POST["school_year"]);
        $excludeId = ($action == "update" && !empty($_POST["section_id"])) ? $_POST["section_id"] : null;

        if ($dao->isNameTaken($sectionName, $schoolYear, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "A section named \"$sectionName\" already exists for $schoolYear."
            ]);
            exit;
        }

        if ($action == "update") {
            if (empty($_POST["section_id"])) {
                echo json_encode(["success" => false, "message" => "Missing section_id"]);
                exit;
            }

            $enrolled = $dao->getEnrolledCount($_POST["section_id"]);
            if ((int) $_POST["max_slots"] < $enrolled) {
                echo json_encode([
                    "success" => false,
                    "message" => "$enrolled student" . ($enrolled === 1 ? " is" : "s are") . " currently enrolled — capacity cannot be lower than that."
                ]);
                exit;
            }
        }

        $section = new Section();
        $section->setStrandId($_POST["strand_id"]);
        $section->setAdviserId($_POST["adviser_id"]);
        $section->setGradeLevel($_POST["grade_level"]);
        $section->setSectionName($sectionName);
        $section->setSchoolYear($schoolYear);
        $section->setMaxSlots($_POST["max_slots"]);
        $section->setStatus($_POST["status"]);

        try {
            if ($action == "update") {
                $section->setSectionId($_POST["section_id"]);
                $result = $dao->update($section);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "UPDATE SUCCESS" : "UPDATE FAILED"
                ]);
            } else {
                $result = $dao->insert($section);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "INSERT SUCCESS" : "INSERT FAILED"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to save section. Please check your inputs."
            ]);
        }
    } else {
        echo json_encode(["error" => "Invalid action"]);
    }
} else {
    echo json_encode(["error" => "Method not allowed"]);
}

?>