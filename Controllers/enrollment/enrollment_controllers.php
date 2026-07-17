<?php

require_once __DIR__."/../../Dao/enrollment/EnrollmentDAO.php";
require_once __DIR__."/../../Models/enrollment/enrollment_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new EnrollmentDAO();

if ($method == "GET") {

    header("Content-Type: application/json");

    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        ];
        echo json_encode($dao->getMasterlist($filters));

    } else if ($action == "strands") {
        echo json_encode($dao->getStrands());

    } else if ($action == "school_years") {
        echo json_encode($dao->getSchoolYears());

    } else if ($action == "active_school_year") {
        echo json_encode($dao->getActiveSchoolYear());

    } else if ($action == "search_students") {
        $keyword = isset($_GET["keyword"]) ? trim($_GET["keyword"]) : "";
        if ($keyword === "") {
            echo json_encode([]);
            exit;
        }
        echo json_encode($dao->searchStudents($keyword));

    } else if ($action == "sections") {
        $strand     = isset($_GET["strand"]) ? $_GET["strand"] : null;
        $grade      = isset($_GET["grade"]) ? $_GET["grade"] : null;
        $schoolYearId = isset($_GET["school_year_id"]) ? $_GET["school_year_id"] : null;

        if (empty($strand) || empty($grade) || empty($schoolYearId)) {
            echo json_encode(["error" => "Missing strand, grade, or school year"]);
            exit;
        }

        echo json_encode($dao->getAvailableSections($strand, $grade, $schoolYearId));

    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing enrollment id"]);
            exit;
        }
        $enrollment = $dao->getById($id);
        if ($enrollment) {
            echo json_encode($enrollment);
        } else {
            echo json_encode(["error" => "Enrollment not found"]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {

    $action = isset($_POST["action"]) ? $_POST["action"] : "create";

    if ($action == "drop") {
        $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
        if (empty($id)) {
            echo "DROP FAILED: missing enrollment_id";
            exit;
        }
        if ($dao->drop($id)) {
            echo "DROP SUCCESS";
        } else {
            echo "DROP FAILED";
        }

    } else if ($action == "delete") {
        $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
        if (empty($id)) {
            echo "DELETE FAILED: missing enrollment_id";
            exit;
        }
        if ($dao->delete($id)) {
            echo "DELETE SUCCESS";
        } else {
            echo "DELETE FAILED";
        }

    } else if ($action == "create") {
        $errors = Enrollment::validate($_POST);
        if (!empty($errors)) {
            echo "INSERT FAILED: " . implode(" ", $errors);
            exit;
        }

        // Get the school year string from the ID
        $schoolYearId = $_POST["school_year_id"];
        $schoolYearData = $dao->getSchoolYearById($schoolYearId);
        if (!$schoolYearData) {
            echo "INSERT FAILED: Invalid school year selected.";
            exit;
        }

        // Re-check duplicate
        if ($dao->isDuplicate($_POST["student_id"], $schoolYearId, $_POST["semester"])) {
            echo "INSERT FAILED: This student is already enrolled for that semester and school year.";
            exit;
        }

        // Check capacity
        $capacity = $dao->getSectionCapacity($_POST["section_id"]);
        if (!$capacity) {
            echo "INSERT FAILED: Section not found.";
            exit;
        }
        if ($capacity["enrolled_count"] >= $capacity["max_slots"]) {
            echo "INSERT FAILED: That section is already full.";
            exit;
        }

        $enrollment = new Enrollment();
        $enrollment->setStudentId($_POST["student_id"]);
        $enrollment->setSectionId($_POST["section_id"]);
        $enrollment->setSchoolYearId($schoolYearId);
        $enrollment->setSchoolYear($schoolYearData['year']);
        $enrollment->setSemester($_POST["semester"]);
        $enrollment->setStatus("Enrolled");

        if ($dao->insert($enrollment)) {
            echo "INSERT SUCCESS";
        } else {
            echo "INSERT FAILED";
        }

    } else {
        echo "Invalid action";
    }

} else {
    echo "Method not allowed";
}