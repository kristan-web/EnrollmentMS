<?php

require_once "../Dao/EnrollmentDAO.php";
require_once "../Models/enrollment_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new EnrollmentDAO();

if ($method == "GET") {

    header("Content-Type: application/json");

    // action=list (default)   -> masterlist rows (joined student/section/strand info)
    // action=strands          -> strand list for the dropdown in step 2 of the enroll modal
    // action=search_students  -> student lookup for step 1 of the enroll modal
    // action=sections         -> open sections for a strand/grade/school year (step 3)
    // action=get              -> single enrollment by id
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {

        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        ];

        echo json_encode($dao->getMasterlist($filters));

    } else if ($action == "strands") {

        echo json_encode($dao->getStrands());

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
        $schoolYear = isset($_GET["school_year"]) ? $_GET["school_year"] : null;

        if (empty($strand) || empty($grade) || empty($schoolYear)) {
            echo json_encode(["error" => "Missing strand, grade, or school year"]);
            exit;
        }

        echo json_encode($dao->getAvailableSections($strand, $grade, $schoolYear));

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

    // action=drop   -> mark an enrollment Dropped (frees the section slot)
    // action=delete -> permanently remove an enrollment record
    // action=create (default) -> enroll a student into a section
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

        // Re-check duplicate & capacity server-side. The UI already checks
        // these against its own copy of the data, but that copy can be stale
        // or the request can be sent directly, so the real check has to
        // happen here against the live database.

        if ($dao->isDuplicate($_POST["student_id"], trim($_POST["school_year"]), $_POST["semester"])) {
            echo "INSERT FAILED: This student is already enrolled for that semester and school year.";
            exit;
        }

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
        $enrollment->setSchoolYear(trim($_POST["school_year"]));
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

?>
