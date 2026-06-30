<?php

require_once "../Dao/DepartmentDAO.php";
require_once "../Models/departments_model.php";

if($_SERVER["REQUEST_METHOD"] == "GET"){

    $dao = new DepartmentDAO();

    $departments = $dao->getAll();

    header("Content-Type: application/json");

    echo json_encode($departments);

}
?>
