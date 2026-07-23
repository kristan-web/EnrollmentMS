<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON header for all responses
header('Content-Type: application/json');

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";
require_once "$projectFilePath/app/Admission/DAO/ApplicantDAO.php";

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $dao = new ApplicantDAO();

    if ($method == "GET") {
        $action = isset($_GET["action"]) ? $_GET["action"] : "";

        if ($action == "status") {
            $referenceNumber = isset($_GET["reference_number"]) ? trim($_GET["reference_number"]) : "";
            $email = isset($_GET["email"]) ? trim($_GET["email"]) : "";

            // Validate inputs
            if (empty($referenceNumber) || empty($email)) {
                echo json_encode([
                    "error" => "Please provide both reference number and email address."
                ]);
                exit;
            }

            // Find applicant with documents
            $applicant = $dao->findByReferenceAndEmail($referenceNumber, $email);

            if (!$applicant) {
                echo json_encode([
                    "error" => "No application found with the provided reference number and email address. Please check your information and try again."
                ]);
                exit;
            }

            // Add document preview URLs
            if (isset($applicant['documents']) && is_array($applicant['documents'])) {
                foreach ($applicant['documents'] as &$doc) {
                    // Add preview URL
                    $doc['preview_url'] = "/EnrollmentMS/app/Admission/Controller/document_preview_controller.php?document_id=" . $doc['document_id'];
                    // Add thumbnail URL (for images)
                    $doc['thumbnail_url'] = "/EnrollmentMS/app/Admission/Controller/document_preview_controller.php?document_id=" . $doc['document_id'] . "&thumbnail=true";
                    // Determine if it's an image
                    $doc['is_image'] = strpos($doc['mime_type'], 'image/') === 0;
                    // Determine if it's a PDF
                    $doc['is_pdf'] = $doc['mime_type'] === 'application/pdf';
                }
            }

            // Return in the format check-status.js expects
            echo json_encode([
                "applicant" => $applicant
            ]);
            exit;
        }

        echo json_encode([
            "error" => "Invalid action. Use 'status' to check application status."
        ]);
        exit;

    } else {
        echo json_encode([
            "error" => "Method not allowed. Please use GET."
        ]);
        exit;
    }

} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "error" => "An error occurred while processing your request. Please try again later."
    ]);
} catch (Error $e) {
    error_log('Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "error" => "An error occurred while processing your request. Please try again later."
    ]);
}