<?php

require_once "../Dao/TeacherDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $id = isset($_GET["id"]) ? $_GET["id"] : null;

    if (empty($id)) {

        echo json_encode(["error" => "Missing teacher id"]);
        exit;

    }

    $dao = new TeacherDAO();

    $teacher = $dao->getById($id);

    if ($teacher) {

        echo json_encode($teacher);

    } else {

        echo json_encode(["error" => "Teacher not found"]);

    }

}

?>
