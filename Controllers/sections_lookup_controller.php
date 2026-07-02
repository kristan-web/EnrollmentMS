<?php

// Feeds the Strand and Homeroom Adviser dropdowns on the Sections form,
// and the Strand filter dropdown on the Sections list.

require_once "../dao/SectionDAO.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "GET") {

    $dao = new SectionDAO();

    echo json_encode([
        "strands"  => $dao->getAllStrands(),
        "teachers" => $dao->getAllTeachers(),
    ]);

}

?>
