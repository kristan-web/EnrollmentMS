<?php

require_once "../dao/StudentDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $filters = [
        "keyword"     => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        "track_id"    => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
        "strand_id"   => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
        "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
        "section_id"  => isset($_GET["section_id"]) ? $_GET["section_id"] : null,
    ];

    $dao = new StudentDAO();

    $students = $dao->search($filters);

    echo json_encode($students);

}

?>
