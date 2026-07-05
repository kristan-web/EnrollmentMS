<?php

require_once "../Dao/SubjectDAO.php";
require_once "../Models/subjects_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new SubjectDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "subject_type" => isset($_GET["subject_type"]) ? $_GET["subject_type"] : null,
            "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "semester" => isset($_GET["semester"]) ? $_GET["semester"] : null,
            "status" => isset($_GET["status"]) ? $_GET["status"] : null,
        ];
        echo json_encode($dao->getAll($filters));

    } else if ($action == "lookup") {
        echo json_encode([
            "strands" => $dao->getAllStrands(),
            "types" => $dao->getAllTypes(),
            "semesters" => $dao->getAllSemesters(),
            "grade_levels" => ['11', '12']
        ]);

    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing subject id"]);
            exit;
        }
        $subject = $dao->getById($id);
        if ($subject) {
            echo json_encode($subject);
        } else {
            echo json_encode(["error" => "Subject not found"]);
        }

    } else if ($action == "by_strand") {
        $strandId = isset($_GET["strand_id"]) ? $_GET["strand_id"] : null;
        if (empty($strandId)) {
            echo json_encode(["error" => "Missing strand id"]);
            exit;
        }
        echo json_encode($dao->getByStrand($strandId));

    } else if ($action == "by_grade") {
        $gradeLevel = isset($_GET["grade_level"]) ? $_GET["grade_level"] : null;
        if (empty($gradeLevel)) {
            echo json_encode(["error" => "Missing grade level"]);
            exit;
        }
        echo json_encode($dao->getByGrade($gradeLevel));

    } else if ($action == "with_usage") {
        echo json_encode($dao->getSubjectsWithUsage());

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "create";

    if ($action == "delete") {
        $id = isset($_POST["subject_id"]) ? $_POST["subject_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing subject id"]);
            exit;
        }

        try {
            $result = $dao->delete($id);
            echo json_encode([
                "success" => $result,
                "message" => $result ? "Subject deactivated successfully" : "Failed to deactivate subject"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete subject. It may be referenced by other records."
            ]);
        }

    } else if ($action == "create" || $action == "update") {
        $errors = Subject::validate($_POST);

        if (!empty($errors)) {
            echo json_encode([
                "success" => false,
                "message" => implode(" ", $errors)
            ]);
            exit;
        }

        $subjectCode = strtoupper(trim($_POST["subject_code"]));
        $excludeId = ($action == "update" && !empty($_POST["subject_id"])) ? $_POST["subject_id"] : null;

        if ($dao->isCodeTaken($subjectCode, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "A subject with code \"$subjectCode\" already exists."
            ]);
            exit;
        }

        $subject = new Subject();
        $subject->setStrandId(!empty($_POST["strand_id"]) ? $_POST["strand_id"] : null);
        $subject->setSubjectCode($subjectCode);
        $subject->setSubjectName(trim($_POST["subject_name"]));
        $subject->setSubjectType($_POST["subject_type"]);
        $subject->setGradeLevel($_POST["grade_level"]);
        $subject->setSemester($_POST["semester"]);
        $subject->setUnits((float)$_POST["units"]);
        $subject->setDescription(!empty($_POST["description"]) ? trim($_POST["description"]) : null);
        $subject->setStatus($_POST["status"] ?? 'Active');

        try {
            if ($action == "update") {
                if (empty($_POST["subject_id"])) {
                    echo json_encode(["success" => false, "message" => "Missing subject_id"]);
                    exit;
                }
                $subject->setSubjectId($_POST["subject_id"]);
                $result = $dao->update($subject);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Subject updated successfully" : "Failed to update subject"
                ]);
            } else {
                $result = $dao->insert($subject);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Subject created successfully" : "Failed to create subject"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to save subject. Please check your inputs."
            ]);
        }

    } else if ($action == "hard_delete") {
        $id = isset($_POST["subject_id"]) ? $_POST["subject_id"] : null;
        if (empty($id)) {
            echo json_encode(["success" => false, "message" => "Missing subject id"]);
            exit;
        }

        try {
            $result = $dao->hardDelete($id);
            echo json_encode([
                "success" => $result,
                "message" => $result ? "Subject deleted permanently" : "Failed to delete subject"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete subject. It may be referenced by other records."
            ]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}