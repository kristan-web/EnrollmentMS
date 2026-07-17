<?php
require_once __DIR__."/../DAO/StudentDAO.php";
require_once __DIR__."/../Model/students_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new StudentDAO();

if ($method == "GET") {
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
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "track_id" => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
            "strand_id" => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
            "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "section_id" => isset($_GET["section_id"]) ? $_GET["section_id"] : null,
        ];
        $students = $dao->search($filters);
        echo json_encode($students);
    } else if ($action == "archived") {
        $students = $dao->getInactive();
        echo json_encode($students);
    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["student_id"]) ? "update" : "create");

    if ($action == "create") {
        // Validate required fields (student_number is now auto-generated, so it's not required)
        $required = ['lrn', 'first_name', 'last_name', 'gender', 'birthdate', 'email', 'grade_level', 'address', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_number'];
        foreach ($required as $field) {
            if (empty($_POST[$field])) {
                echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
                exit;
            }
        }

        $student = new Student();
        $student->setLrn($_POST["lrn"]);
        // Student number will be auto-generated in the DAO
        $student->setStudentNumber(null); // Let DAO generate it
        $student->setFirstName($_POST["first_name"]);
        $student->setMiddleName($_POST["middle_name"] ?? null);
        $student->setLastName($_POST["last_name"]);
        $student->setGender($_POST["gender"]);
        $student->setBirthdate($_POST["birthdate"]);
        $student->setAddress($_POST["address"]);
        $student->setContactNumber($_POST["contact_number"] ?? null);
        $student->setEmail($_POST["email"]);
        $student->setGradeLevel($_POST["grade_level"]);
        $student->setStatus("Active");
        $student->setFatherName($_POST["father_name"] ?? null);
        $student->setFatherContactNumber($_POST["father_contact_number"] ?? null);
        $student->setFatherOccupation($_POST["father_occupation"] ?? null);
        $student->setMotherName($_POST["mother_name"] ?? null);
        $student->setMotherContactNumber($_POST["mother_contact_number"] ?? null);
        $student->setMotherOccupation($_POST["mother_occupation"] ?? null);
        $student->setGuardianName($_POST["guardian_name"] ?? null);
        $student->setGuardianRelationship($_POST["guardian_relationship"] ?? null);
        $student->setGuardianContactNumber($_POST["guardian_contact_number"] ?? null);
        $student->setGuardianAddress($_POST["guardian_address"] ?? null);
        $student->setEmergencyContactName($_POST["emergency_contact_name"]);
        $student->setEmergencyContactRelationship($_POST["emergency_contact_relationship"]);
        $student->setEmergencyContactNumber($_POST["emergency_contact_number"]);

        if ($dao->insert($student)) {
            // Get the inserted student to return the generated student number
            $students = $dao->search(['keyword' => $_POST["lrn"]]);
            $newStudent = !empty($students) ? $students[0] : null;
            echo json_encode([
                "success" => true, 
                "message" => "Student created successfully",
                "student_number" => $newStudent ? $newStudent['student_number'] : null
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to create student"]);
        }

    } else if ($action == "update") {
        if (empty($_POST["student_id"])) {
            echo json_encode(["success" => false, "message" => "Missing student_id"]);
            exit;
        }

        $student = new Student();
        $student->setStudentId($_POST["student_id"]);
        $student->setLrn($_POST["lrn"]);
        $student->setStudentNumber($_POST["student_number"] ?? null); // Keep existing on update
        $student->setFirstName($_POST["first_name"]);
        $student->setMiddleName($_POST["middle_name"] ?? null);
        $student->setLastName($_POST["last_name"]);
        $student->setGender($_POST["gender"]);
        $student->setBirthdate($_POST["birthdate"]);
        $student->setAddress($_POST["address"]);
        $student->setContactNumber($_POST["contact_number"] ?? null);
        $student->setEmail($_POST["email"]);
        $student->setGradeLevel($_POST["grade_level"]);
        $student->setStatus($_POST["status"] ?? "Active");
        $student->setFatherName($_POST["father_name"] ?? null);
        $student->setFatherContactNumber($_POST["father_contact_number"] ?? null);
        $student->setFatherOccupation($_POST["father_occupation"] ?? null);
        $student->setMotherName($_POST["mother_name"] ?? null);
        $student->setMotherContactNumber($_POST["mother_contact_number"] ?? null);
        $student->setMotherOccupation($_POST["mother_occupation"] ?? null);
        $student->setGuardianName($_POST["guardian_name"] ?? null);
        $student->setGuardianRelationship($_POST["guardian_relationship"] ?? null);
        $student->setGuardianContactNumber($_POST["guardian_contact_number"] ?? null);
        $student->setGuardianAddress($_POST["guardian_address"] ?? null);
        $student->setEmergencyContactName($_POST["emergency_contact_name"]);
        $student->setEmergencyContactRelationship($_POST["emergency_contact_relationship"]);
        $student->setEmergencyContactNumber($_POST["emergency_contact_number"]);

        if ($dao->update($student)) {
            echo json_encode(["success" => true, "message" => "Student updated successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update student"]);
        }

    } else if ($action == "archive") {
        if (empty($_POST["student_id"])) {
            echo json_encode(["success" => false, "message" => "Missing student_id"]);
            exit;
        }
        $reason = $_POST["reason"] ?? "Archived";
        if ($dao->archive($_POST["student_id"], $reason)) {
            echo json_encode(["success" => true, "message" => "Student archived successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to archive student"]);
        }

    } else if ($action == "restore") {
        if (empty($_POST["student_id"])) {
            echo json_encode(["success" => false, "message" => "Missing student_id"]);
            exit;
        }
        if ($dao->restore($_POST["student_id"])) {
            echo json_encode(["success" => true, "message" => "Student restored successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to restore student"]);
        }

    } else if ($action == "delete") {
        if (empty($_POST["student_id"])) {
            echo json_encode(["success" => false, "message" => "Missing student_id"]);
            exit;
        }
        if ($dao->hardDelete($_POST["student_id"])) {
            echo json_encode(["success" => true, "message" => "Student deleted successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete student"]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}
?>