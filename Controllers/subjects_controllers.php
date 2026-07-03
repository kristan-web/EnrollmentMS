<?php

require_once "../Dao/SubjectDAO.php";
require_once "../Models/subjects_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new SubjectDAO();

if ($method == "GET") {

    header("Content-Type: application/json");

    // action=get     -> single subject by id
    // action=meta    -> dropdown data (subject types, grade levels, semesters, strands)
    // action=list (default) -> filtered list of subjects
    $action = isset($_GET["action"]) ? $_GET["action"] : (isset($_GET["id"]) ? "get" : "list");

    if ($action == "get") {

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

    } else if ($action == "meta") {

        echo json_encode([
            "subject_types" => Subject::allowedSubjectTypes(),
            "grade_levels"  => Subject::allowedGradeLevels(),
            "semesters"     => Subject::allowedSemesters(),
            "strands"       => $dao->getStrands(),
        ]);

    } else if ($action == "list") {

        $filters = [
            "keyword"      => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "subject_type" => isset($_GET["subject_type"]) ? $_GET["subject_type"] : null,
            "grade_level"  => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "semester"     => isset($_GET["semester"]) ? $_GET["semester"] : null,
            "strand_id"    => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
            "status"       => isset($_GET["status"]) ? $_GET["status"] : "Active",
        ];

        echo json_encode($dao->search($filters));

    } else {

        echo json_encode(["error" => "Invalid action"]);

    }

} else if ($method == "POST") {

    // action=delete  -> soft delete a subject (Active -> Inactive)
    // action=restore -> restore a subject (Inactive -> Active)
    // action=update  -> update existing subject (requires subject_id)
    // action=create (default) -> insert new subject
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["subject_id"]) ? "update" : "create");

    if ($action == "delete") {

        $id = isset($_POST["id"]) ? $_POST["id"] : (isset($_POST["subject_id"]) ? $_POST["subject_id"] : null);

        if (empty($id)) {
            echo "DELETE FAILED: missing subject id";
            exit;
        }

        if ($dao->delete($id)) {
            echo "DELETE SUCCESS";
        } else {
            echo "DELETE FAILED";
        }

    } else if ($action == "restore") {

        $id = isset($_POST["id"]) ? $_POST["id"] : (isset($_POST["subject_id"]) ? $_POST["subject_id"] : null);

        if (empty($id)) {
            echo "RESTORE FAILED: missing subject id";
            exit;
        }

        if ($dao->restore($id)) {
            echo "RESTORE SUCCESS";
        } else {
            echo "RESTORE FAILED";
        }

    } else if ($action == "update") {

        if (empty($_POST["subject_id"])) {
            echo "UPDATE FAILED: missing subject_id";
            exit;
        }

        $errors = Subject::validate($_POST, true);

        if (!empty($errors)) {
            echo "UPDATE FAILED: " . implode(" ", $errors);
            exit;
        }

        $code = trim($_POST["subject_code"]);

        if ($dao->codeExists($code, $_POST["subject_id"])) {
            echo "UPDATE FAILED: Subject code is already in use by another subject.";
            exit;
        }

        $subjectType = trim($_POST["subject_type"]);
        $strandId    = ($subjectType == "Core") ? null : trim($_POST["strand_id"]);

        $subject = new Subject();

        $subject->setSubjectId($_POST["subject_id"]);
        $subject->setStrandId($strandId);
        $subject->setSubjectCode($code);
        $subject->setSubjectName(trim($_POST["subject_name"]));
        $subject->setSubjectType($subjectType);
        $subject->setGradeLevel(trim($_POST["grade_level"]));
        $subject->setSemester(trim($_POST["semester"]));
        $subject->setUnits(trim($_POST["units"]));
        $subject->setDescription(trim($_POST["description"] ?? ""));
        $subject->setStatus($_POST["status"]);

        try {

            if ($dao->update($subject)) {
                echo "UPDATE SUCCESS";
            } else {
                echo "UPDATE FAILED";
            }

        } catch (PDOException $e) {

            if ($e->getCode() == 23000) {
                echo "UPDATE FAILED: Subject code is already in use by another subject.";
            } else {
                echo "UPDATE FAILED: A database error occurred.";
            }

        }

    } else if ($action == "create") {

        $errors = Subject::validate($_POST, false);

        if (!empty($errors)) {
            echo "INSERT FAILED: " . implode(" ", $errors);
            exit;
        }

        $code = trim($_POST["subject_code"]);

        if ($dao->codeExists($code)) {
            echo "INSERT FAILED: Subject code is already in use.";
            exit;
        }

        $subjectType = trim($_POST["subject_type"]);
        $strandId    = ($subjectType == "Core") ? null : trim($_POST["strand_id"]);

        $subject = new Subject();

        $subject->setStrandId($strandId);
        $subject->setSubjectCode($code);
        $subject->setSubjectName(trim($_POST["subject_name"]));
        $subject->setSubjectType($subjectType);
        $subject->setGradeLevel(trim($_POST["grade_level"]));
        $subject->setSemester(trim($_POST["semester"]));
        $subject->setUnits(trim($_POST["units"]));
        $subject->setDescription(trim($_POST["description"] ?? ""));

        // default value
        $subject->setStatus("Active");

        try {

            if ($dao->insert($subject)) {
                echo "INSERT SUCCESS";
            } else {
                echo "INSERT FAILED";
            }

        } catch (PDOException $e) {

            if ($e->getCode() == 23000) {
                echo "INSERT FAILED: Subject code is already in use.";
            } else {
                echo "INSERT FAILED: A database error occurred.";
            }

        }

    } else {

        echo "Invalid action";

    }

} else {

    echo "Method not allowed";

}

?>