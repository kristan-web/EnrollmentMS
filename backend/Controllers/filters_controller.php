<?php

require_once "../Dao/FilterDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $dao = new FilterDAO();

    $type = isset($_GET["type"]) ? $_GET["type"] : null;

    if ($type == "tracks") {

        echo json_encode($dao->getTracks());

    } else if ($type == "strands") {

        $track_id = isset($_GET["track_id"]) ? $_GET["track_id"] : null;

        echo json_encode($dao->getStrands($track_id));

    } else if ($type == "sections") {

        $strand_id   = isset($_GET["strand_id"]) ? $_GET["strand_id"] : null;
        $grade_level = isset($_GET["grade_level"]) ? $_GET["grade_level"] : null;

        echo json_encode($dao->getSections($strand_id, $grade_level));

    } else {

        echo json_encode([]);

    }

}

?>
