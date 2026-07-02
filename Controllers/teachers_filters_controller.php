<?php

require_once "../Dao/TeacherDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $dao = new TeacherDAO();

    echo json_encode($dao->getSpecializations());

}

?>
