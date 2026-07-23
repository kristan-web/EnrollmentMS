<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";
require_once "$projectFilePath/config/session.php";
safeStartSession();

require_once __DIR__."/../DAO/ApplicantDAO.php";
require_once __DIR__."/../Model/applicant_model.php";
require_once __DIR__."/../../../config/mailer/email_functions.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new ApplicantDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "list";

    if ($action == "list") {
        $filters = [
            "status" => isset($_GET["status"]) ? $_GET["status"] : null,
            "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null
        ];
        $applicants = $dao->getAll($filters);
        echo json_encode($applicants);

    } else if ($action == "get") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing applicant id"]);
            exit;
        }
        $applicant = $dao->getById($id);
        if ($applicant) {
            echo json_encode($applicant);
        } else {
            echo json_encode(["error" => "Applicant not found"]);
        }

    } else if ($action == "get_document") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing document id"]);
            exit;
        }
        $doc = $dao->getDocumentById($id);
        if ($doc) {
            echo json_encode($doc);
        } else {
            echo json_encode(["error" => "Document not found"]);
        }

    } else if ($action == "serve-document") {
        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing document id"]);
            exit;
        }
        $doc = $dao->getDocumentById($id);
        if (!$doc) {
            echo json_encode(["error" => "Document not found"]);
            exit;
        }
        $fullPath = $doc["file_path"];
        if (file_exists($fullPath)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $fullPath);
            finfo_close($finfo);
            
            header("Content-Type: $mime");
            header("Content-Disposition: " . (isset($_GET['download']) ? "attachment" : "inline") . "; filename=\"" . basename($fullPath) . "\"");
            readfile($fullPath);
            exit;
        } else {
            echo json_encode(["error" => "File not found on disk"]);
        }

    } else {
        echo json_encode(["error" => "Invalid action: " . $action]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "update_status";

    if ($action == "update_status") {
        $applicantId = isset($_POST["applicant_id"]) ? $_POST["applicant_id"] : null;
        $status = isset($_POST["status"]) ? $_POST["status"] : null;
        $rejectionReason = isset($_POST["rejection_reason"]) ? $_POST["rejection_reason"] : null;  // Changed from refusal_reason

        if (empty($applicantId)) {
            echo json_encode(["success" => false, "message" => "Missing applicant_id"]);
            exit;
        }

        // Changed from "Refused" to "Rejected"
        if (empty($status) || !in_array($status, ["Approved", "Rejected"])) {
            echo json_encode(["success" => false, "message" => "Invalid status. Must be Approved or Rejected"]);
            exit;
        }

        if ($status === "Rejected" && empty($rejectionReason)) {  // Changed from "Refused"
            echo json_encode(["success" => false, "message" => "Please provide a reason for rejecting this application"]);
            exit;
        }

        // Get applicant info for email
        $applicant = $dao->getById($applicantId);
        if (!$applicant) {
            echo json_encode(["success" => false, "message" => "Applicant not found"]);
            exit;
        }

        try {
            // Update status
            $success = $dao->updateStatus($applicantId, $status, $rejectionReason, $_SESSION['user_id'] ?? null);
            
            if ($success) {
                // Send email notification
                $name = $applicant['first_name'] . ' ' . $applicant['last_name'];
                $email = $applicant['email'];
                $referenceNumber = $applicant['reference_number'];

                if ($status === "Approved") {
                    sendApprovalEmail($email, $name, $referenceNumber);
                } else if ($status === "Rejected") {  // Changed from "Refused"
                    sendRefusalEmail($email, $name, $referenceNumber, $rejectionReason);
                }

                echo json_encode(["success" => true, "message" => "Application $status successfully and email sent!"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed to update application status"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }

    } else {
        echo json_encode(["error" => "Invalid action: " . $action]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}
?>