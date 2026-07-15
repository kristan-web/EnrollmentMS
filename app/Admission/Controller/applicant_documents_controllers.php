<?php
$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/app/Admission/DAO/ApplicantDocumentDAO.php";
require_once "$projectFilePath/app/Admission/DAO/DocumentTypeDAO.php";
require_once "$projectFilePath/app/Admission/Model/applicant_documents_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

// ============ Upload Validation Helpers ============
// Security-sensitive rules kept together here: allow-listed file types
// (checked by content, not extension), a size cap, and an unpredictable
// stored filename (no overwrite / path traversal).

$ALLOWED_MIME = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "application/pdf" => "pdf",
];
$MAX_UPLOAD_BYTES = 5242880; // 5MB

// Returns the sniffed mime type on success, or throws with a user-safe message.
function validateUploadedFile($file) {
    global $ALLOWED_MIME, $MAX_UPLOAD_BYTES;

    if (!isset($file["error"]) || is_array($file["error"])) {
        throw new Exception("Invalid upload.");
    }
    if ($file["error"] === UPLOAD_ERR_NO_FILE) {
        throw new Exception("No file was uploaded.");
    }
    if ($file["error"] !== UPLOAD_ERR_OK) {
        throw new Exception("Upload failed, please try again.");
    }
    if ($file["size"] > $MAX_UPLOAD_BYTES) {
        throw new Exception("File exceeds the 5MB limit.");
    }

    // Never trust the client-supplied type/extension — sniff actual bytes.
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $actualMime = finfo_file($finfo, $file["tmp_name"]);
    finfo_close($finfo);

    if (!isset($ALLOWED_MIME[$actualMime])) {
        throw new Exception("Only JPG, PNG, or PDF files are accepted.");
    }

    return $actualMime;
}

function generateStoredFilename($mimeType) {
    global $ALLOWED_MIME;
    $ext = $ALLOWED_MIME[$mimeType];
    return bin2hex(random_bytes(16)) . "." . $ext;
}

// Resolves (and creates if needed) the per-applicant upload folder, outside the web root.
function resolveApplicantFolder($referenceNumber) {
    $base = rtrim(getenv("UPLOAD_BASE_PATH") ?: "C:/xampp/enrollment_uploads/applicants", "/");
    $safeRef = preg_replace("/[^A-Za-z0-9\-]/", "", $referenceNumber);

    $folder = $base . "/" . $safeRef;
    if (!is_dir($folder) && !mkdir($folder, 0750, true) && !is_dir($folder)) {
        throw new Exception("Could not prepare storage folder.");
    }
    return $folder;
}

$method = $_SERVER["REQUEST_METHOD"];
$dao = new ApplicantDocumentDAO();
$typeDao = new DocumentTypeDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "checklist";

    if ($action == "checklist") {
        // Populates the upload form: one slot per active document type
        $applicantType = isset($_GET["applicant_type"]) ? $_GET["applicant_type"] : "New Student";
        $types = $typeDao->getActiveForApplicantType($applicantType);
        echo json_encode($types);

    } else if ($action == "list") {
        // Used by the admin review screen and the applicant "Check Status" page
        $applicantId = isset($_GET["applicant_id"]) ? $_GET["applicant_id"] : null;
        if (empty($applicantId)) {
            echo json_encode(["error" => "Missing applicant_id"]);
            exit;
        }
        $documents = $dao->getAllByApplicant($applicantId);
        echo json_encode($documents);

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "upload";

    if ($action == "upload") {
        $applicantId = $_POST["applicant_id"] ?? null;
        $documentTypeId = $_POST["document_type_id"] ?? null;
        $referenceNumber = $_POST["reference_number"] ?? "";

        if (empty($applicantId) || empty($documentTypeId)) {
            echo json_encode(["success" => false, "message" => "Missing applicant_id or document_type_id"]);
            exit;
        }

        $docType = $typeDao->getById($documentTypeId);
        if (!$docType || !$docType["is_active"]) {
            echo json_encode(["success" => false, "message" => "Unknown or inactive document type"]);
            exit;
        }

        if (empty($_FILES["document"])) {
            echo json_encode(["success" => false, "message" => "No file was uploaded"]);
            exit;
        }

        try {
            $mimeType = validateUploadedFile($_FILES["document"]);
            $folder = resolveApplicantFolder($referenceNumber);
            $storedName = generateStoredFilename($mimeType);
            $destination = $folder . "/" . $storedName;

            if (!move_uploaded_file($_FILES["document"]["tmp_name"], $destination)) {
                throw new Exception("Could not save the uploaded file.");
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
            exit;
        }

        // Re-upload for the same slot (e.g. admin rejected it) replaces the old file + row
        $existing = $dao->findByApplicantAndType($applicantId, $documentTypeId);
        if ($existing) {
            @unlink($existing["file_path"]);
            $dao->deleteById($existing["document_id"]);
        }

        $doc = new ApplicantDocument();
        $doc->setApplicantId($applicantId);
        $doc->setDocumentTypeId($documentTypeId);
        $doc->setFilePath($destination);
        $doc->setOriginalFilename($_FILES["document"]["name"]);
        $doc->setFileSize($_FILES["document"]["size"]);
        $doc->setMimeType($mimeType);

        $newId = $dao->insert($doc);
        if ($newId) {
            echo json_encode(["success" => true, "document_id" => $newId, "status" => "Pending"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to save document record"]);
        }

    } else if ($action == "verify") {
        if (empty($_POST["document_id"])) {
            echo json_encode(["success" => false, "message" => "Missing document_id"]);
            exit;
        }
        if ($dao->updateStatus($_POST["document_id"], "Verified")) {
            echo json_encode(["success" => true, "message" => "Document verified"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to verify document"]);
        }

    } else if ($action == "reject") {
        if (empty($_POST["document_id"])) {
            echo json_encode(["success" => false, "message" => "Missing document_id"]);
            exit;
        }
        $remarks = $_POST["remarks"] ?? "Rejected";
        if ($dao->updateStatus($_POST["document_id"], "Rejected", $remarks)) {
            echo json_encode(["success" => true, "message" => "Document rejected"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to reject document"]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}
?>
