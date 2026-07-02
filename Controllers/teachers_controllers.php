<?php

require_once "../Dao/TeacherDAO.php";
require_once "../Models/teachers_model.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

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

    $dao = new TeacherDAO();

    if ($dao->insert($teacher)) {

        echo "INSERT SUCCESS";

    } else {

        echo "INSERT FAILED";

    }

}

?>
