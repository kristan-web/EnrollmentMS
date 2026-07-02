<?php

require_once "../Dao/TeacherDAO.php";
require_once "../Models/teachers_model.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

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

    $dao = new TeacherDAO();

    if ($dao->update($teacher)) {

        echo "UPDATE SUCCESS";

    } else {

        echo "UPDATE FAILED";

    }

}

?>
