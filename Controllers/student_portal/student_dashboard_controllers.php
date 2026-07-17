<?php
// Student dashboard data + actions.
// GET  ?action=snapshot      -> everything the dashboard renders (admission
//                               status, assigned section, enrollment status,
//                               payment status), scoped to the logged-in student.
// POST  action=upload_proof  -> store a proof-of-payment file for the student.
//
// All endpoints require an active student session (see student_account_controllers).

session_start();

require_once __DIR__ . '/../../Dao/student_portal/StudentPortalDAO.php';

header('Content-Type: application/json');

// --- Auth guard ---------------------------------------------------------
if (empty($_SESSION['student_account_id'])) {
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "Please log in to view your dashboard."]);
    exit;
}

$accountId = $_SESSION['student_account_id'];
$email     = $_SESSION['student_email'] ?? '';
$fullName  = $_SESSION['student_name'] ?? '';

$dao    = new StudentPortalDAO();
$method = $_SERVER['REQUEST_METHOD'];

// Admission status shown to the student: if the application was approved and
// the student now has an "Enrolled" enrollment, surface "Enrolled".
function effectiveStatus($application, $enrollment) {
    $status = $application['status'] ?? 'Pending';
    if ($status === 'Approved' && $enrollment && ($enrollment['status'] ?? '') === 'Enrolled') {
        return 'Enrolled';
    }
    return $status;
}

// ---- Upload proof of payment -------------------------------------------
if ($method === 'POST' && ($_POST['action'] ?? '') === 'upload_proof') {
    $ALLOWED_MIME = [
        "image/jpeg" => "jpg",
        "image/png"  => "png",
        "application/pdf" => "pdf",
    ];
    $MAX_UPLOAD_BYTES = 5242880; // 5MB

    if (empty($_FILES['proof'])) {
        echo json_encode(["success" => false, "message" => "Please choose a file to upload."]);
        exit;
    }

    $file = $_FILES['proof'];
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["success" => false, "message" => "Upload failed, please try again."]);
        exit;
    }
    if ($file['size'] > $MAX_UPLOAD_BYTES) {
        echo json_encode(["success" => false, "message" => "File exceeds the 5MB limit."]);
        exit;
    }

    // Sniff the real type instead of trusting the extension.
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!isset($ALLOWED_MIME[$mime])) {
        echo json_encode(["success" => false, "message" => "Only JPG, PNG, or PDF files are accepted."]);
        exit;
    }

    $base = rtrim(getenv("UPLOAD_BASE_PATH") ?: "C:/xampp/enrollment_uploads", "/") . "/payment_proofs/" . (int) $accountId;
    if (!is_dir($base) && !mkdir($base, 0750, true) && !is_dir($base)) {
        echo json_encode(["success" => false, "message" => "Could not prepare storage folder."]);
        exit;
    }

    $storedName  = bin2hex(random_bytes(16)) . "." . $ALLOWED_MIME[$mime];
    $destination = $base . "/" . $storedName;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode(["success" => false, "message" => "Could not save the uploaded file."]);
        exit;
    }

    $newId = $dao->insertProof($accountId, [
        "reference_number"  => trim($_POST['reference_number'] ?? '') ?: null,
        "amount"            => is_numeric($_POST['amount'] ?? '') ? $_POST['amount'] : null,
        "method"            => trim($_POST['method'] ?? '') ?: null,
        "payment_reference" => trim($_POST['payment_reference'] ?? '') ?: null,
        "file_path"         => $destination,
        "original_filename" => $file['name'],
        "file_size"         => $file['size'],
        "mime_type"         => $mime,
    ]);

    if ($newId) {
        echo json_encode(["success" => true, "message" => "Proof of payment uploaded. The accounting office will verify it shortly."]);
    } else {
        @unlink($destination);
        echo json_encode(["success" => false, "message" => "Could not record your upload. Please try again."]);
    }
    exit;
}

// ---- Snapshot (default GET) --------------------------------------------
$applications = $dao->getApplicationsByEmail($email);
$application  = $applications[0] ?? null;

$documents = $application ? $dao->getDocumentsByApplicant($application['applicant_id']) : [];

$student = null;
if ($application && !empty($application['converted_student_id'])) {
    $student = $dao->getStudentById($application['converted_student_id']);
}

$enrollment = $student ? $dao->getEnrollmentByStudent($student['student_id']) : null;

$payments = $enrollment ? $dao->getPaymentsByEnrollment($enrollment['enrollment_id']) : [];
$proofs   = $dao->getProofsByAccount($accountId);

echo json_encode([
    "authenticated" => true,
    "account"       => ["account_id" => $accountId, "full_name" => $fullName, "email" => $email],
    "application"   => $application,
    "admission_status" => $application ? effectiveStatus($application, $enrollment) : null,
    "documents"     => $documents,
    "student"       => $student,
    "enrollment"    => $enrollment,
    "payments"      => $payments,
    "proofs"        => $proofs
]);
?>
