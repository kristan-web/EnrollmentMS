<?php

require_once "../Dao/ApplicantDAO.php";
require_once "../Dao/StrandDAO.php";
require_once "../Dao/SchoolYearDAO.php";
require_once "../Models/applicant_model.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$VALID_APPLICANT_TYPES = ["New Student", "Transferee"];
$VALID_GENDERS = ["Male", "Female", "Other"];
$VALID_GRADE_LEVELS = ["11", "12"];
$PH_MOBILE_PATTERN = "/^09[0-9]{9}$/";

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
$dao = new ApplicantDAO();
$strandDao = new StrandDAO();
$schoolYearDao = new SchoolYearDAO();

if ($method == "GET") {
    $action = isset($_GET["action"]) ? $_GET["action"] : "";

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

    } else {
        echo json_encode(["error" => "Invalid action"]);
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

    } else {
        echo json_encode(["error" => "Invalid action"]);
    }

} else {
    echo json_encode(["error" => "Method not allowed"]);
}
?>
