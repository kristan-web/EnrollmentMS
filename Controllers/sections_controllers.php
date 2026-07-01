<?php

require_once "../dao/SectionDAO.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $dao = new SectionDAO();

    $section = new Section(
        $_POST["strand_id"],
        !empty($_POST["adviser_id"]) ? $_POST["adviser_id"] : null,
        $_POST["grade_level"],
        $_POST["section_name"],
        $_POST["school_year"],
        $_POST["max_slots"],
        $_POST["status"]
    );

    // section_id present + not empty = editing an existing section
    if (!empty($_POST["section_id"])) {

        $section->setSectionId($_POST["section_id"]);

        if ($dao->update($section)) {
            echo "Section updated successfully.";
        } else {
            echo "Failed to update section.";
        }

    } else {

        if ($dao->insert($section)) {
            echo "Section added successfully.";
        } else {
            echo "Failed to add section.";
        }

    }

}

?>
