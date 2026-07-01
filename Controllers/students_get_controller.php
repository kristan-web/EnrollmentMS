<?php

require_once "../dao/StudentDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $id = isset($_GET["id"]) ? $_GET["id"] : null;

    if (empty($id)) {

        echo json_encode(["error" => "Missing student id"]);
        exit;

    }

    $dao = new StudentDAO();

    $student = $dao->getById($id);

    if ($student) {

        echo json_encode($student);

    } else {

        echo json_encode(["error" => "Student not found"]);

    }

}

?>
