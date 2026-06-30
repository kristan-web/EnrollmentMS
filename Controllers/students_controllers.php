<?php

require_once "../dao/StudentDAO.php";
require_once "../models/students_model.php";

if($_SERVER["REQUEST_METHOD"] == "POST"){

    $student = new Student();
    $student->setStudentNumber($_POST["student_number"]);
    $student->setYearLevel($_POST["year_level"]);
    $student->setFirstName($_POST["first_name"]);

    $student->setLastName($_POST["last_name"]);

    $student->setGender($_POST["gender"]);

    $student->setBirthdate($_POST["birthdate"]);

    $student->setAddress($_POST["address"]);

    $student->setContactNumber($_POST["contact_number"]);

    $student->setEmail($_POST["email"]);

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