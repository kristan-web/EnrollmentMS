<?php

require_once "../Dao/TeacherDAO.php";
require_once "../Models/teachers_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new TeacherDAO();

if ($method == "GET") {

    header("Content-Type: application/json");

    // action=get     -> single teacher by id
    // action=filters -> distinct specializations for the filter dropdown
    // action=list (default) -> filtered list of teachers
    $action = isset($_GET["action"]) ? $_GET["action"] : (isset($_GET["id"]) ? "get" : "list");

    if ($action == "get") {

        $id = isset($_GET["id"]) ? $_GET["id"] : null;

        if (empty($id)) {
            echo json_encode(["error" => "Missing teacher id"]);
            exit;
        }

        $teacher = $dao->getById($id);

        if ($teacher) {
            echo json_encode($teacher);
        } else {
            echo json_encode(["error" => "Teacher not found"]);
        }

    } else if ($action == "filters") {

        echo json_encode($dao->getSpecializations());

    } else if ($action == "list") {

        $filters = [
            "keyword"        => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "specialization" => isset($_GET["specialization"]) ? $_GET["specialization"] : null,
        ];

        echo json_encode($dao->search($filters));

    } else {

        echo json_encode(["error" => "Invalid action"]);

    }

} else if ($method == "POST") {

    // action=delete -> soft delete a teacher
    // action=update -> update existing teacher (requires teacher_id)
    // action=create (default) -> insert new teacher
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["teacher_id"]) ? "update" : "create");

    if ($action == "delete") {

        $id = isset($_POST["id"]) ? $_POST["id"] : (isset($_POST["teacher_id"]) ? $_POST["teacher_id"] : null);

        if (empty($id)) {
            echo "DELETE FAILED: missing teacher id";
            exit;
        }

        if ($dao->delete($id)) {
            echo "DELETE SUCCESS";
        } else {
            echo "DELETE FAILED";
        }

    } else if ($action == "update") {

        if (empty($_POST["teacher_id"])) {
            echo "UPDATE FAILED: missing teacher_id";
            exit;
        }

        $errors = Teacher::validate($_POST, true);

        if (!empty($errors)) {
            echo "UPDATE FAILED: " . implode(" ", $errors);
            exit;
        }

        $teacher = new Teacher();

        $teacher->setTeacherId($_POST["teacher_id"]);
        $teacher->setFirstName(trim($_POST["first_name"]));
        $teacher->setLastName(trim($_POST["last_name"]));
        $teacher->setEmail(trim($_POST["email"]));
        $teacher->setContactNumber(trim($_POST["contact_number"]));
        $teacher->setSpecialization(trim($_POST["specialization"]));
        $teacher->setStatus($_POST["status"]);

        if ($dao->update($teacher)) {
            echo "UPDATE SUCCESS";
        } else {
            echo "UPDATE FAILED";
        }

    } else if ($action == "create") {

        $errors = Teacher::validate($_POST, false);

        if (!empty($errors)) {
            echo "INSERT FAILED: " . implode(" ", $errors);
            exit;
        }

        $teacher = new Teacher();

        $teacher->setFirstName(trim($_POST["first_name"]));
        $teacher->setLastName(trim($_POST["last_name"]));
        $teacher->setEmail(trim($_POST["email"]));
        $teacher->setContactNumber(trim($_POST["contact_number"]));
        $teacher->setSpecialization(trim($_POST["specialization"]));

        // default value
        $teacher->setStatus("Active");

        if ($dao->insert($teacher)) {
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