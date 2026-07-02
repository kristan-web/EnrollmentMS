<?php

require_once "../Dao/TeacherDAO.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $id = isset($_POST["id"]) ? $_POST["id"] : null;

    if (empty($id)) {

        echo "DELETE FAILED: missing teacher id";
        exit;

    }

    $dao = new TeacherDAO();

    if ($dao->delete($id)) {

        echo "DELETE SUCCESS";

    } else {

        echo "DELETE FAILED";

    }

}

?>
