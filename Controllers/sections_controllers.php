<?php

require_once "../Dao/SectionDAO.php";
require_once "../Models/sections_model.php";

$method = $_SERVER["REQUEST_METHOD"];
$dao    = new SectionDAO();

if ($method == "GET") {

    header("Content-Type: application/json");

    // action=lookup -> strand + teacher dropdown data
    // action=list (default) -> filtered list of sections
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "lookup") {

        echo json_encode([
            "strands"  => $dao->getAllStrands(),
            "teachers" => $dao->getAllTeachers(),
        ]);

    } else if ($action == "list") {

        $filters = [
            "keyword"     => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
            "track_id"    => isset($_GET["track_id"]) ? $_GET["track_id"] : null,
            "strand_id"   => isset($_GET["strand_id"]) ? $_GET["strand_id"] : null,
            "grade_level" => isset($_GET["grade_level"]) ? $_GET["grade_level"] : null,
            "school_year" => isset($_GET["school_year"]) ? $_GET["school_year"] : null,
            "status"      => isset($_GET["status"]) ? $_GET["status"] : null,
        ];

        echo json_encode($dao->search($filters));

    } else {

        echo json_encode(["error" => "Invalid action"]);

    }

} else if ($method == "POST") {

    // action=delete / action=restore -> soft delete or restore a section
    // action=update -> update existing section (requires section_id)
    // action=create (default) -> insert new section
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["section_id"]) ? "update" : "create");

    if ($action == "delete" || $action == "restore") {

        $id = isset($_POST["section_id"]) ? $_POST["section_id"] : null;

        if (!$id) {
            echo "No section specified.";
            exit;
        }

        try {

            if ($action == "restore") {

                echo $dao->restore($id)
                    ? "Section restored successfully."
                    : "Failed to restore section.";

            } else {

                // soft delete only (status -> Cancelled), so the enrollments
                // FK (ON DELETE RESTRICT) never actually gets triggered here.
                // This catch is kept in case delete() is ever changed to a hard DELETE.
                echo $dao->delete($id)
                    ? "Section cancelled successfully."
                    : "Failed to cancel section.";

            }

        } catch (PDOException $e) {

            echo "This section cannot be removed because it already has enrolled students.";

        }

    } else if ($action == "create" || $action == "update") {

        $section = new Section();

        $section->setStrandId($_POST["strand_id"]);
        $section->setAdviserId(!empty($_POST["adviser_id"]) ? $_POST["adviser_id"] : null);
        $section->setGradeLevel($_POST["grade_level"]);
        $section->setSectionName($_POST["section_name"]);
        $section->setSchoolYear($_POST["school_year"]);
        $section->setMaxSlots($_POST["max_slots"]);
        $section->setStatus($_POST["status"]);

        try {

            if ($action == "update") {

                if (empty($_POST["section_id"])) {
                    echo "UPDATE FAILED: missing section_id";
                    exit;
                }

                $section->setSectionId($_POST["section_id"]);

                echo $dao->update($section)
                    ? "UPDATE SUCCESS"
                    : "UPDATE FAILED";

            } else {

                echo $dao->insert($section)
                    ? "INSERT SUCCESS"
                    : "INSERT FAILED";

            }

        } catch (PDOException $e) {

            echo "Unable to save section. Please check your inputs.";

        }

    } else {

        echo "Invalid action";

    }

} else {

    echo "Method not allowed";

}

?>
