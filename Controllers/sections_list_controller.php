<?php

require_once "../dao/SectionDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $filters = [
        "keyword"     => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        "track_id"    => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
        "strand_id"   => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
        "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
        "school_year" => isset($_GET["school_year"]) ? $_GET["school_year"] : null,
        "status"      => isset($_GET["status"]) ? $_GET["status"] : null,
    ];

    $dao = new SectionDAO();

    $sections = $dao->search($filters);

    echo json_encode($sections);

}

?>
