<?php

require_once "../Dao/StudentDAO.php";
require_once "../Models/students_model.php";

if($_SERVER["REQUEST_METHOD"] == "POST"){

    $student = new Student();

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



    $dao = new StudentDAO();



    if($dao->insert($student)){

    echo "INSERT SUCCESS";

    }else{

        echo "INSERT FAILED";

    }
}
?>
