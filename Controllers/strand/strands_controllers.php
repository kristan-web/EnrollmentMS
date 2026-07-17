<?php

require_once __DIR__."/../../Dao/strand/StrandDAO.php";
require_once __DIR__."/../../Models/strand/strands_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new StrandDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "lookup") {
        echo json_encode([
            "tracks" => $dao->getAllTracks()
        ]);
    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing strand id"]);
            exit;
        }
        $strand = $dao->getById($id);
        if ($strand) {
            echo json_encode($strand);
        } else {
            echo json_encode(["error" => "Strand not found"]);
        }
    } else if ($action == "list") {
        $filters = [
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
        ];
        echo json_encode($dao->search($filters));
    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : (!empty($_POST["strand_id"]) ? "update" : "create");

    if ($action == "delete") {
        $id = isset($_POST["strand_id"]) ? $_POST["strand_id"] : null;
        if (!$id) {
            echo json_encode(["success" => false, "message" => "No strand specified."]);
            exit;
        }

        // Check if strand has sections
        if ($dao->hasSections($id)) {
            echo json_encode([
                "success" => false,
                "message" => "This strand cannot be deleted because it has sections assigned."
            ]);
            exit;
        }

        if ($dao->hasSubjects($id)) {
            echo json_encode([
                "success" => false,
                "message" => "This strand cannot be deleted because it has subjects assigned."
            ]);
            exit;
        }

        try {
            $result = $dao->delete($id);
            echo json_encode([
                "success" => $result,
                "message" => $result ? "Strand deleted successfully." : "Failed to delete strand."
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete strand. It may be referenced by other records."
            ]);
        }

    } else if ($action == "create" || $action == "update") {
        $errors = Strand::validate($_POST);

        if (!empty($errors)) {
            echo json_encode([
                "success" => false,
                "message" => implode(" ", $errors)
            ]);
            exit;
        }

        // Get track_id
        $trackId = isset($_POST["track_id"]) ? $_POST["track_id"] : null;
        
        if (!$trackId) {
            echo json_encode([
                "success" => false,
                "message" => "Please select a track."
            ]);
            exit;
        }

        $strandCode = strtoupper(trim($_POST["strand_code"]));
        $excludeId = ($action == "update" && !empty($_POST["strand_id"])) ? $_POST["strand_id"] : null;

        if ($dao->isCodeTaken($strandCode, $excludeId)) {
            echo json_encode([
                "success" => false,
                "message" => "A strand with code \"$strandCode\" already exists."
            ]);
            exit;
        }

        $strand = new Strand();
        $strand->setTrackId($trackId);
        $strand->setStrandCode($strandCode);
        $strand->setStrandName(trim($_POST["strand_name"]));
        $strand->setDescription(!empty($_POST["description"]) ? trim($_POST["description"]) : null);

        try {
            if ($action == "update") {
                if (empty($_POST["strand_id"])) {
                    echo json_encode(["success" => false, "message" => "Missing strand_id"]);
                    exit;
                }
                $strand->setStrandId($_POST["strand_id"]);
                $result = $dao->update($strand);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Strand updated successfully" : "Failed to update strand"
                ]);
            } else {
                $result = $dao->insert($strand);
                echo json_encode([
                    "success" => $result,
                    "message" => $result ? "Strand created successfully" : "Failed to create strand"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Unable to save strand. Please check your inputs."
            ]);
        }
    } else {
        echo json_encode(["error" => "Invalid action"]);
    }
} else {
    echo json_encode(["error" => "Method not allowed"]);
}

?>