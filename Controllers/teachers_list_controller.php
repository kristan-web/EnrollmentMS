<?php

require_once "../Dao/TeacherDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $filters = [
        "keyword"        => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        "specialization" => isset($_GET["specialization"]) ? $_GET["specialization"] : null,
    ];

    $dao = new TeacherDAO();

    $teachers = $dao->search($filters);

    echo json_encode($teachers);

}

?>
