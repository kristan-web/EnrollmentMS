<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";
require_once "$projectFilePath/config/db.php";

try {
    $documentId = isset($_GET['document_id']) ? (int)$_GET['document_id'] : 0;
    $thumbnail = isset($_GET['thumbnail']) && $_GET['thumbnail'] === 'true';
    
    if ($documentId <= 0) {
        http_response_code(400);
        echo "Invalid document ID";
        exit;
    }

    // Connect to database
    $database = new Database();
    $conn = $database->connect();

    // Get document info
    $query = "
    SELECT file_path, mime_type, original_filename
    FROM applicant_documents
    WHERE document_id = :document_id
    ";
    $stmt = $conn->prepare($query);
    $stmt->bindValue(":document_id", $documentId);
    $stmt->execute();
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$doc || !file_exists($doc['file_path'])) {
        http_response_code(404);
        echo "Document not found";
        exit;
    }

    $filePath = $doc['file_path'];
    $mimeType = $doc['mime_type'];
    $filename = $doc['original_filename'];

    // Set headers
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
    header('Cache-Control: public, max-age=86400');

    // Read and output file
    readfile($filePath);
    exit;

} catch (Exception $e) {
    error_log('Document preview error: ' . $e->getMessage());
    http_response_code(500);
    echo "Error loading document";
    exit;
}
?>