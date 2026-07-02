<?php

require_once "../Dao/StudentDAO.php";
require_once "../Models/students_model.php";

header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new StudentDAO();

if ($method == "GET") {

    // action=get -> single student by id
    // action=list (default) -> filtered list of students
    $action = isset($_GET["action"]) ? $_GET["action"] : (isset($_GET["id"]) ? "get" : "list");

    if ($action == "get") {

        $id = isset($_GET["id"]) ? $_GET["id"] : null;

        if (empty($id)) {
            echo json_encode(["error" => "Missing student id"]);
            exit;
        }

        $student = $dao->getById($id);

        if ($student) {
            echo json_encode($student);
        } else {
            echo json_encode(["error" => "Student not found"]);
        }

    } else if ($action == "list") {

        $filters = [
            "keyword"     => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "track_id"    => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
            "strand_id"   => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
            "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "section_id"  => isset($_GET["section_id"]) ? $_GET["section_id"] : null,
        ];

        $students = $dao->search($filters);

        echo json_encode($students);

    } else {

        echo json_encode(["error" => "Invalid action"]);

    }

} else if ($method == "POST") {

    // action=update -> update existing student (requires student_id)
    // action=create (default) -> insert new student
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["student_id"]) ? "update" : "create");

    $student = new Student();

    if ($action == "update") {

        if (empty($_POST["student_id"])) {
            echo json_encode(["success" => false, "message" => "UPDATE FAILED: missing student_id"]);
            exit;
        }

        $student->setStudentId($_POST["student_id"]);
        $student->setLrn($_POST["lrn"]);
        $student->setFirstName($_POST["first_name"]);
        $student->setMiddleName($_POST["middle_name"]);
        $student->setLastName($_POST["last_name"]);
        $student->setGender($_POST["gender"]);
        $student->setBirthdate($_POST["birthdate"]);
        $student->setAddress($_POST["address"]);
        $student->setContactNumber($_POST["contact_number"]);
        $student->setEmail($_POST["email"]);
        $student->setGradeLevel($_POST["grade_level"]);
        $student->setStatus($_POST["status"]);

        // Parent Information
        $student->setFatherName($_POST["father_name"]);
        $student->setFatherContactNumber($_POST["father_contact_number"]);
        $student->setFatherOccupation($_POST["father_occupation"]);
        $student->setMotherName($_POST["mother_name"]);
        $student->setMotherContactNumber($_POST["mother_contact_number"]);
        $student->setMotherOccupation($_POST["mother_occupation"]);

        // Guardian Information
        $student->setGuardianName($_POST["guardian_name"]);
        $student->setGuardianRelationship($_POST["guardian_relationship"]);
        $student->setGuardianContactNumber($_POST["guardian_contact_number"]);
        $student->setGuardianAddress($_POST["guardian_address"]);

        // Emergency Contact
        $student->setEmergencyContactName($_POST["emergency_contact_name"]);
        $student->setEmergencyContactRelationship($_POST["emergency_contact_relationship"]);
        $student->setEmergencyContactNumber($_POST["emergency_contact_number"]);

        if ($dao->update($student)) {
            echo json_encode(["success" => true, "message" => "UPDATE SUCCESS"]);
        } else {
            echo json_encode(["success" => false, "message" => "UPDATE FAILED"]);
        }

    } else if ($action == "create") {

        $student->setLrn($_POST["lrn"]);
        $student->setStudentNumber($_POST["student_number"]);
        $student->setFirstName($_POST["first_name"]);
        $student->setMiddleName($_POST["middle_name"]);
        $student->setLastName($_POST["last_name"]);
        $student->setGender($_POST["gender"]);
        $student->setBirthdate($_POST["birthdate"]);
        $student->setAddress($_POST["address"]);
        $student->setContactNumber($_POST["contact_number"]);
        $student->setEmail($_POST["email"]);
        $student->setGradeLevel($_POST["grade_level"]);

        // Parent Information
        $student->setFatherName($_POST["father_name"]);
        $student->setFatherContactNumber($_POST["father_contact_number"]);
        $student->setFatherOccupation($_POST["father_occupation"]);
        $student->setMotherName($_POST["mother_name"]);
        $student->setMotherContactNumber($_POST["mother_contact_number"]);
        $student->setMotherOccupation($_POST["mother_occupation"]);

        // Guardian Information
        $student->setGuardianName($_POST["guardian_name"]);
        $student->setGuardianRelationship($_POST["guardian_relationship"]);
        $student->setGuardianContactNumber($_POST["guardian_contact_number"]);
        $student->setGuardianAddress($_POST["guardian_address"]);

        // Emergency Contact (required)
        $student->setEmergencyContactName($_POST["emergency_contact_name"]);
        $student->setEmergencyContactRelationship($_POST["emergency_contact_relationship"]);
        $student->setEmergencyContactNumber($_POST["emergency_contact_number"]);

        // default values
        $student->setStatus("Active");

        if ($dao->insert($student)) {
            echo json_encode(["success" => true, "message" => "INSERT SUCCESS"]);
        } else {
            echo json_encode(["success" => false, "message" => "INSERT FAILED"]);
        }

    } else {

        echo json_encode(["error" => "Invalid action"]);

    }

} else {

    echo json_encode(["error" => "Method not allowed"]);

}

?>
