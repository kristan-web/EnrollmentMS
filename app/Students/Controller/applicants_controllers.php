<?php
// ============================================
// DEBUGGING: Log all incoming data
// ============================================
$debugLog = "C:/xampp/htdocs/EnrollmentMS/debug.log";
file_put_contents($debugLog, "=== NEW REQUEST ===\n", FILE_APPEND);
file_put_contents($debugLog, "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);
file_put_contents($debugLog, "QUERY_STRING: " . $_SERVER['QUERY_STRING'] . "\n", FILE_APPEND);
file_put_contents($debugLog, "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);
file_put_contents($debugLog, "GET: " . print_r($_GET, true) . "\n", FILE_APPEND);
file_put_contents($debugLog, "POST: " . print_r($_POST, true) . "\n", FILE_APPEND);
// ============================================

// Keep this endpoint's response body pure JSON no matter what: don't let
// PHP print warnings/notices/fatals as HTML into the output, log them
// instead, and turn any fatal into a clean JSON error.
ini_set("display_errors", "0");
error_reporting(E_ALL);

set_error_handler(function ($severity, $message, $file, $line) {
    error_log("[applicants_controllers] $message in $file:$line");
    return true; // suppress default HTML output for this error
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log("[applicants_controllers] FATAL: {$error['message']} in {$error['file']}:{$error['line']}");
        if (!headers_sent()) {
            http_response_code(500);
            header("Content-Type: application/json");
        }
        echo json_encode(["error" => "A server error occurred. Check the PHP error log for details."]);
    }
});

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/config/session.php"; //safeStartSession
require_once "$projectFilePath/app/Students/DAO/ApplicantDAO.php"; //ApplicantDAO
require_once "$projectFilePath/app/Strands/DAO/StrandDAO.php"; //StrandDAO
require_once "$projectFilePath/app/SchoolYears/DAO/SchoolYearDAO.php"; //SchoolYearDAO
require_once "$projectFilePath/app/Admission/Model/applicant_model.php";  //applicant_model

//safeStartSession();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$VALID_APPLICANT_TYPES = ["New Student", "Transferee"];
$VALID_GENDERS = ["Male", "Female", "Other"];
$VALID_GRADE_LEVELS = ["11", "12"];
$VALID_APPLICANT_STATUSES = ["Pending", "Under Review", "Approved", "Rejected", "Enrolled"];
$PH_MOBILE_PATTERN = "/^09[0-9]{9}$/";

// "list", "get", and "update-status" are admin-only (used by the
// Applications dashboard). "strands", "school-year", "status", and "submit"
// stay public — they back the public apply.php / check-status.php pages.
function requireStaffSession() {
    if (empty($_SESSION["user_id"])) {
        echo json_encode(["error" => "You must be logged in to do that."]);
        exit;
    }
}

// Trims a value and converts "" to null so optional columns store NULL
// instead of an empty string.
function nullableTrim($value) {
    if (!isset($value)) return null;
    $trimmed = trim((string) $value);
    return $trimmed === "" ? null : $trimmed;
}

// Validates the incoming applicant payload. Returns an array of error
// messages; an empty array means the payload is valid.
function validateApplicantPayload($d, StrandDAO $strandDao) {
    global $VALID_APPLICANT_TYPES, $VALID_GENDERS, $VALID_GRADE_LEVELS, $PH_MOBILE_PATTERN;
    $errors = [];

    if (!in_array($d["applicantType"] ?? "", $VALID_APPLICANT_TYPES, true)) {
        $errors[] = "Invalid applicant type.";
    }
    foreach (["lastName" => "Last name", "firstName" => "First name", "address" => "Address"] as $field => $label) {
        if (empty(trim((string) ($d[$field] ?? "")))) $errors[] = "$label is required.";
    }
    if (!in_array($d["gender"] ?? "", $VALID_GENDERS, true)) {
        $errors[] = "Invalid gender.";
    }
    if (empty($d["birthDate"] ?? "") || !strtotime($d["birthDate"])) {
        $errors[] = "A valid birth date is required.";
    }
    if (empty($d["email"] ?? "") || !filter_var($d["email"], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "A valid email address is required.";
    }
    if (($d["applicantType"] ?? "") === "Transferee" && empty(trim((string) ($d["lrn"] ?? "")))) {
        $errors[] = "LRN is required for transferees.";
    }
    if (!in_array($d["desiredGradeLevel"] ?? "", $VALID_GRADE_LEVELS, true)) {
        $errors[] = "Invalid grade level.";
    }
    $strand = !empty($d["desiredStrandId"] ?? null) ? $strandDao->getById($d["desiredStrandId"]) : null;
    if (!$strand) {
        $errors[] = "Invalid strand selected.";
    }
    if (empty(trim((string) ($d["schoolYear"] ?? "")))) {
        $errors[] = "School year is required.";
    }
    foreach ([
        "emergencyName" => "Emergency contact name",
        "emergencyRelationship" => "Emergency contact relationship",
        "emergencyContact" => "Emergency contact number",
    ] as $field => $label) {
        if (empty(trim((string) ($d[$field] ?? "")))) $errors[] = "$label is required.";
    }
    foreach (["emergencyContact", "fatherContact", "motherContact", "guardianContact", "contact"] as $field) {
        $value = trim((string) ($d[$field] ?? ""));
        if ($value !== "" && !preg_match($PH_MOBILE_PATTERN, $value)) {
            $errors[] = "Contact numbers must be an 11-digit PH mobile number (e.g. 09XXXXXXXXX).";
            break;
        }
    }

    return $errors;
}

$method = $_SERVER["REQUEST_METHOD"];

// Try to initialize DAOs with error handling
try {
    $dao = new ApplicantDAO();
    $strandDao = new StrandDAO();
    $schoolYearDao = new SchoolYearDAO();
} catch (Exception $e) {
    echo json_encode(["error" => "Failed to initialize DAOs: " . $e->getMessage()]);
    exit;
}

// ============================================
// FIX: Get action from multiple sources
// ============================================
// Try GET, then POST, then PATH_INFO, then REQUEST_URI
$action = isset($_GET['action']) ? $_GET['action'] : '';

if (empty($action)) {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
}

if (empty($action)) {
    // Check PATH_INFO
    if (isset($_SERVER['PATH_INFO'])) {
        $pathInfo = trim($_SERVER['PATH_INFO'], '/');
        $action = $pathInfo;
    }
}

if (empty($action)) {
    // Check REQUEST_URI for patterns like /list or /get
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $segments = explode('/', trim($path, '/'));
    $lastSegment = end($segments);
    
    // If the last segment is a known action
    $knownActions = ['list', 'get', 'status', 'strands', 'school-year', 'serve-document', 'submit', 'update-status'];
    if (in_array($lastSegment, $knownActions)) {
        $action = $lastSegment;
    }
}

// If still empty, default to empty string
if (empty($action)) {
    $action = '';
}

// Log the resolved action for debugging
$debugLog = "C:/xampp/htdocs/EnrollmentMS/debug.log";
file_put_contents($debugLog, "RESOLVED ACTION: " . $action . "\n", FILE_APPEND);
file_put_contents($debugLog, "=== END REQUEST ===\n\n", FILE_APPEND);
// ============================================

if ($method == "GET") {
    // Use the resolved $action
    if ($action == "strands") {
        // Populates the strand dropdown in Step 3
        echo json_encode($strandDao->getAll());

    } else if ($action == "school-year") {
        // Populates the read-only school year field in Step 3
        $active = $schoolYearDao->getActive();
        echo json_encode($active ?: ["year" => null]);

    } else if ($action == "status") {
        // Used by the "Check Status" page
        $referenceNumber = isset($_GET["reference_number"]) ? trim($_GET["reference_number"]) : "";
        $email = isset($_GET["email"]) ? trim($_GET["email"]) : "";

        if (empty($referenceNumber) || empty($email)) {
            echo json_encode(["error" => "Both reference number and email address are required."]);
            exit;
        }

        $applicant = $dao->findByReferenceAndEmail($referenceNumber, $email);
        if (!$applicant) {
            echo json_encode(["error" => "No application found for that reference number and email combination."]);
            exit;
        }
        echo json_encode(["applicant" => $applicant]);

    } else if ($action == "list") {
        // Used by the admin "Applications" dashboard tab
        //requireStaffSession();

        $filters = [
            "status" => isset($_GET["status"]) ? trim($_GET["status"]) : null,
            "keyword" => isset($_GET["keyword"]) ? trim($_GET["keyword"]) : null,
        ];
        echo json_encode($dao->getAll($filters));

    } else if ($action == "get") {
        // Used by the admin review modal
        //requireStaffSession();

        $id = isset($_GET["id"]) ? $_GET["id"] : null;
        if (empty($id)) {
            echo json_encode(["error" => "Missing applicant id"]);
            exit;
        }
        $applicant = $dao->getById($id);
        if ($applicant) {
            echo json_encode(["applicant" => $applicant]);
        } else {
            echo json_encode(["error" => "Applicant not found"]);
        }

    } else if ($action == "serve-document") {
        // Serve a document file for viewing/download
        $filePath = isset($_GET["path"]) ? $_GET["path"] : "";
        $isDownload = isset($_GET["download"]) && $_GET["download"] == "1";
        
        if (empty($filePath)) {
            http_response_code(400);
            echo json_encode(["error" => "File path is required"]);
            exit;
        }
        
        // Security: Only allow files from the enrollment_uploads directory
        $baseUploadPath = "C:/xampp/enrollment_uploads/";
        $realBasePath = realpath($baseUploadPath);
        $realFilePath = realpath($filePath);
        
        // Check if the file exists and is within the uploads directory
        if (!$realFilePath || !file_exists($realFilePath) || strpos($realFilePath, $realBasePath) !== 0) {
            http_response_code(404);
            echo json_encode(["error" => "File not found or access denied"]);
            exit;
        }
        
        // Get file info
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $realFilePath);
        finfo_close($finfo);
        
        // Set headers for file download/view
        if ($isDownload) {
            header("Content-Type: application/octet-stream");
            header("Content-Disposition: attachment; filename=\"" . basename($filePath) . "\"");
        } else {
            header("Content-Type: " . $mimeType);
            header("Content-Disposition: inline; filename=\"" . basename($filePath) . "\"");
        }
        
        header("Content-Length: " . filesize($realFilePath));
        header("Cache-Control: public, max-age=86400");
        
        // Output the file
        readfile($realFilePath);
        exit; // Important: Stop execution after serving file

    } else {
        echo json_encode(["error" => "Invalid action: " . $action]);
    }

} else if ($method == "POST") {
    $action = isset($_POST["action"]) ? $_POST["action"] : "submit";

    if ($action == "submit") {
        // Accept either JSON or a regular form-encoded POST body
        $d = $_POST;
        if (empty($d)) {
            $raw = file_get_contents("php://input");
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) $d = $decoded;
        }

        $errors = validateApplicantPayload($d, $strandDao);
        if (!empty($errors)) {
            echo json_encode(["success" => false, "message" => implode(" ", $errors)]);
            exit;
        }

        $applicant = new Applicant();
        $applicant->setReferenceNumber($dao->generateUniqueReferenceNumber());
        $applicant->setApplicantType($d["applicantType"]);
        $applicant->setFirstName(trim($d["firstName"]));
        $applicant->setLastName(trim($d["lastName"]));
        $applicant->setMiddleName(nullableTrim($d["middleName"] ?? null));
        $applicant->setGender($d["gender"]);
        $applicant->setBirthdate(date("Y-m-d", strtotime($d["birthDate"])));
        $applicant->setAddress(trim($d["address"]));
        $applicant->setContactNumber(nullableTrim($d["contact"] ?? null));
        $applicant->setEmail(trim($d["email"]));
        $applicant->setLrn(nullableTrim($d["lrn"] ?? null));
        $applicant->setDesiredGradeLevel($d["desiredGradeLevel"]);
        $applicant->setDesiredStrandId($d["desiredStrandId"]);
        $applicant->setSchoolYear(trim($d["schoolYear"]));
        $applicant->setFatherName(nullableTrim($d["fatherName"] ?? null));
        $applicant->setFatherContactNumber(nullableTrim($d["fatherContact"] ?? null));
        $applicant->setMotherName(nullableTrim($d["motherName"] ?? null));
        $applicant->setMotherContactNumber(nullableTrim($d["motherContact"] ?? null));
        $applicant->setGuardianName(nullableTrim($d["guardianName"] ?? null));
        $applicant->setGuardianRelationship(nullableTrim($d["guardianRelationship"] ?? null));
        $applicant->setGuardianContactNumber(nullableTrim($d["guardianContact"] ?? null));
        $applicant->setEmergencyContactName(trim($d["emergencyName"]));
        $applicant->setEmergencyContactRelationship(trim($d["emergencyRelationship"]));
        $applicant->setEmergencyContactNumber(trim($d["emergencyContact"]));

        try {
            $newId = $dao->insert($applicant);
        } catch (PDOException $e) {
            // Reference number collisions are practically impossible (checked up
            // front) but guard anyway rather than leak a raw DB error.
            echo json_encode(["success" => false, "message" => "Could not save the application. Please try again."]);
            exit;
        }

        if ($newId) {
            echo json_encode([
                "success" => true,
                "applicant_id" => $newId,
                "reference_number" => $applicant->getReferenceNumber(),
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to save application"]);
        }

    } else if ($action == "update-status") {
        // Used by the admin review modal to change an applicant's status
        //requireStaffSession();

        $applicantId = $_POST["applicant_id"] ?? null;
        $status = $_POST["status"] ?? "";
        $rejectionReason = nullableTrim($_POST["rejection_reason"] ?? null);

        if (empty($applicantId)) {
            echo json_encode(["success" => false, "message" => "Missing applicant_id"]);
            exit;
        }
        if (!in_array($status, $VALID_APPLICANT_STATUSES, true)) {
            echo json_encode(["success" => false, "message" => "Invalid status."]);
            exit;
        }
        if ($status === "Rejected" && empty($rejectionReason)) {
            echo json_encode(["success" => false, "message" => "A rejection reason is required when rejecting an application."]);
            exit;
        }
        // Only keep a rejection reason when the applicant is actually rejected.
        if ($status !== "Rejected") {
            $rejectionReason = null;
        }

        $reviewedBy = $_SESSION["user_id"] ?? null;

        if ($dao->updateStatus($applicantId, $status, $rejectionReason, $reviewedBy)) {
            echo json_encode(["success" => true, "message" => "Application status updated."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update application status."]);
        }

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}
?>