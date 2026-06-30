<?php

require_once "../Dao/ProfessorDAO.php";
require_once "../Models/professors_model.php";

if($_SERVER["REQUEST_METHOD"] == "POST"){

    $professor = new Professor();
    $professor->setDepartmentId($_POST["department_id"]);
    $professor->setFirstName($_POST["first_name"]);
    $professor->setLastName($_POST["last_name"]);
    $professor->setEmail($_POST["email"]);
    $professor->setContactNumber($_POST["contact_number"]);

    // default values

    $professor->setStatus("Active");


    $dao = new ProfessorDAO();


    if($dao->insert($professor)){

        echo "INSERT SUCCESS";

    }else{

        echo "INSERT FAILED";

    }
}
?>
