<?php

require_once "../dao/SectionDAO.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $dao = new SectionDAO();

    $id = isset($_POST["section_id"]) ? $_POST["section_id"] : null;
    $action = isset($_POST["action"]) ? $_POST["action"] : "delete";

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

}

?>
