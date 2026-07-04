<?php

require_once __DIR__ . "/../Dao/SchoolYearDAO.php";
require_once __DIR__ . "/../Models/school_year_model.php";

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new SchoolYearDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        ];
        echo json_encode($dao->getAll($filters));

    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing school year id"]);
            exit;
        }
        $schoolYear = $dao->getById($id);
        if ($schoolYear) {
            echo json_encode($schoolYear);
        } else {
            echo json_encode(["error" => "School year not found"]);
        }

    } else if ($action == "active") {
        $active = $dao->getActive();
        echo json_encode($active ?: null);

    } else if ($action == "suggest") {
        echo json_encode([
            "suggested" => $dao->suggestNextYear()
        ]);

    } else if ($action == "check_year") {
        $year = isset($_GET["year"]) ? $_GET["year"] : null;
        if (empty($year)) {
            echo json_encode(["error" => "Missing year"]);
            exit;
        }
        $exists = $dao->isYearTaken($year);
        echo json_encode(["taken" => $exists]);

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "create";

    if ($action == "create" || $action == "update") {
        $errors = SchoolYear::validate($_POST);

        if (!empty($errors)) {
            echo json_encode([
                "success" => false,
                "message" => implode(" ", $errors)
            ]);
            exit;
        }

        $year = trim($_POST["year"]);
        $status = isset($_POST["status"]) ? $_POST["status"] : "closed";
        $makeActive = isset($_POST["makeActive"]) && $_POST["makeActive"] === "true";

        // Check if year already exists
        $excludeId = ($action == "update" && !empty($_POST["school_year_id"])) ? $_POST["school_year_id"] : null;
        if ($dao->isYearTaken($year, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "School year \"$year\" already exists."
            ]);
            exit;
        }

        // If making active, deactivate all others first
        if ($makeActive || $status === "active") {
            $dao->deactivateAll();
        }

        $schoolYear = new SchoolYear();
        $schoolYear->setYear($year);

        if ($makeActive) {
            $schoolYear->setStatus("active");
        } else {
            $schoolYear->setStatus("closed");
        }

        try {
            if ($action == "update") {
                if (empty($_POST["school_year_id"])) {
                    echo json_encode(["success" => false, "message" => "Missing school_year_id"]);
                    exit;
                }
                $schoolYear->setSchoolYearId($_POST["school_year_id"]);
                $result = $dao->update($schoolYear);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "School year updated successfully" : "Failed to update school year"
                ]);
            } else {
                $result = $dao->insert($schoolYear);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "School year created successfully" : "Failed to create school year"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to save school year. Please check your inputs."
            ]);
        }

    } else if ($action == "open") {
        $id = isset($_POST["school_year_id"]) ? $_POST["school_year_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing school year id"]);
            exit;
        }

        $schoolYear = $dao->getById($id);
        if (!$schoolYear) {
            echo json_encode(["success" => false, "message" => "School year not found"]);
            exit;
        }

        try {
            // Deactivate all others, activate this one
            $dao->deactivateAll();
            $update = new SchoolYear();
            $update->setSchoolYearId($id);
            $update->setYear($schoolYear['year']);
            $update->setStatus("active");
            $result = $dao->update($update);

            echo json_encode([
                "success" => $result,
                "message" => $result ? "School year opened successfully" : "Failed to open school year"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to open school year."
            ]);
        }

    } else if ($action == "close") {
        $id = isset($_POST["school_year_id"]) ? $_POST["school_year_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing school year id"]);
            exit;
        }

        $schoolYear = $dao->getById($id);
        if (!$schoolYear) {
            echo json_encode(["success" => false, "message" => "School year not found"]);
            exit;
        }

        try {
            $update = new SchoolYear();
            $update->setSchoolYearId($id);
            $update->setYear($schoolYear['year']);
            $update->setStatus("closed");
            $result = $dao->update($update);

            echo json_encode([
                "success" => $result,
                "message" => $result ? "School year closed successfully" : "Failed to close school year"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to close school year."
            ]);
        }

    } else if ($action == "delete") {
        $id = isset($_POST["school_year_id"]) ? $_POST["school_year_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing school year id"]);
            exit;
        }

        $schoolYear = $dao->getById($id);
        if (!$schoolYear) {
            echo json_encode(["success" => false, "message" => "School year not found"]);
            exit;
        }

        // Check if it has enrollments
        if ($dao->hasEnrollments($schoolYear['year'])) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete school year with existing enrollments."
            ]);
            exit;
        }

        try {
            $result = $dao->delete($id);
            echo json_encode([
                "success" => $result,
                "message" => $result ? "School year deleted successfully" : "Failed to delete school year"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete school year. It may be referenced by other records."
            ]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}