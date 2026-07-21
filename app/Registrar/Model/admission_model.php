<?php

// Registrar-side admission review models.
//
// AdmissionReview covers the decision the registrar makes on a submitted
// application (approve / reject / request corrections). AdmissionAssignment
// covers what the registrar assigns once the application is approved
// (strand, section, semester, and the LRN if the applicant never supplied one).
//
// Validation lives here rather than in the controller, matching
// Enrollment::validate() in app/Enrollment/Model/enrollment_model.php.

class AdmissionReview {

    // Mirrors the applicants.status enum.
    const STATUS_PENDING      = "Pending";
    const STATUS_UNDER_REVIEW = "Under Review";
    const STATUS_APPROVED     = "Approved";
    const STATUS_REJECTED     = "Rejected";
    const STATUS_ENROLLED     = "Enrolled";

    // Mirrors the applicant_documents.status enum.
    const DOC_PENDING  = "Pending";
    const DOC_VERIFIED = "Verified";
    const DOC_REJECTED = "Rejected";

    private $applicantId;
    private $status;
    private $rejectionReason;
    private $reviewerId;

    public function __construct($applicantId = null, $status = null, $reviewerId = null, $rejectionReason = null) {
        $this->applicantId     = $applicantId;
        $this->status          = $status;
        $this->reviewerId      = $reviewerId;
        $this->rejectionReason = $rejectionReason;
    }

    // ---- Getters ----
    public function getApplicantId()     { return $this->applicantId; }
    public function getStatus()          { return $this->status; }
    public function getRejectionReason() { return $this->rejectionReason; }
    public function getReviewerId()      { return $this->reviewerId; }

    // ---- Setters ----
    public function setApplicantId($v)     { $this->applicantId = $v; }
    public function setStatus($v)          { $this->status = $v; }
    public function setRejectionReason($v) { $this->rejectionReason = $v; }
    public function setReviewerId($v)      { $this->reviewerId = $v; }

    public static function allStatuses() {
        return [
            self::STATUS_PENDING,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_ENROLLED,
        ];
    }

    // A decision can only be made while the application is still open. Once it
    // is Enrolled the applicant has a student record and an enrollment row, so
    // re-deciding would leave those orphaned.
    public static function isDecidable($currentStatus) {
        return in_array($currentStatus, [
            self::STATUS_PENDING,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ], true);
    }

    // Validates a verify/reject decision on a single uploaded document.
    // Returns an array of error messages; empty means valid.
    public static function validateDocumentDecision($d) {
        $errors = [];

        if (empty($d["document_id"])) {
            $errors[] = "Missing document reference.";
        }
        $decision = $d["decision"] ?? "";
        if (!in_array($decision, [self::DOC_VERIFIED, self::DOC_REJECTED], true)) {
            $errors[] = "Choose whether to verify or reject the document.";
        }
        // A rejection the applicant can't act on is useless — remarks explain
        // what to re-upload, and the Check Status page shows them.
        if ($decision === self::DOC_REJECTED && trim((string) ($d["remarks"] ?? "")) === "") {
            $errors[] = "Add remarks so the applicant knows what to correct.";
        }

        return $errors;
    }

    // Validates an approve / reject / request-corrections decision.
    public static function validateDecision($d) {
        $errors = [];

        if (empty($d["applicant_id"])) {
            $errors[] = "Missing applicant reference.";
        }
        $decision = $d["decision"] ?? "";
        if (!in_array($decision, ["approve", "reject", "corrections"], true)) {
            $errors[] = "Invalid decision.";
        }
        if ($decision === "reject" && trim((string) ($d["reason"] ?? "")) === "") {
            $errors[] = "A reason is required when rejecting an application.";
        }
        if ($decision === "corrections" && trim((string) ($d["reason"] ?? "")) === "") {
            $errors[] = "Describe what the applicant needs to correct.";
        }
        // applicants.rejection_reason is varchar(255).
        if (strlen(trim((string) ($d["reason"] ?? ""))) > 255) {
            $errors[] = "Keep the note to 255 characters or fewer.";
        }

        return $errors;
    }
}


// Rules for what the registrar assigns when turning an approved applicant into
// an enrolled student. Kept separate from AdmissionReview because it maps onto
// different tables (students + enrollments rather than applicants).
//
// The resulting rows are built from the existing Student and Enrollment models,
// so this holds no state of its own — just the rules the controller checks
// before writing, in the same spirit as Enrollment::validate().
class AdmissionAssignment {

    const SEMESTERS = ["1st Semester", "2nd Semester"];

    // $existingLrn is the LRN already on the applicant row (may be null for a
    // New Student). students.lrn is NOT NULL UNIQUE, so if the applicant never
    // gave one the registrar has to supply it here.
    public static function validate($d, $existingLrn = null) {
        $errors = [];

        if (empty($d["applicant_id"])) {
            $errors[] = "Missing applicant reference.";
        }
        if (empty($d["strand_id"])) {
            $errors[] = "Select a strand.";
        }
        if (empty($d["section_id"])) {
            $errors[] = "Select a section.";
        }
        if (!in_array($d["semester"] ?? "", self::SEMESTERS, true)) {
            $errors[] = "Select a valid semester.";
        }

        $lrn = trim((string) ($d["lrn"] ?? ""));
        if ($lrn === "") {
            $lrn = trim((string) $existingLrn);
        }
        if ($lrn === "") {
            $errors[] = "An LRN is required before a student record can be created.";
        } else if (!preg_match("/^[0-9]{12}$/", $lrn)) {
            $errors[] = "LRN must be exactly 12 digits.";
        }

        return $errors;
    }

    // The LRN to persist: what the registrar typed, else what the applicant gave.
    public static function resolveLrn($d, $existingLrn = null) {
        $lrn = trim((string) ($d["lrn"] ?? ""));
        return $lrn !== "" ? $lrn : trim((string) $existingLrn);
    }
}


// Rules for the walk-in enrollment path (flowchart: "Walk in? -> YES").
// Unlike an online applicant, a walk-in has no application row — the registrar
// types the student's credentials in front of them. This validates that typed
// input ("Complete and valid?"); an empty return means it's ready to save.
class WalkInEnrollment {

    const GENDERS   = ["Male", "Female", "Other"];
    const GRADES    = ["11", "12"];
    const SEMESTERS = ["1st Semester", "2nd Semester"];
    const PH_MOBILE = "/^09[0-9]{9}$/";

    // Trims to null so optional columns store NULL, not "".
    public static function clean($value) {
        if (!isset($value)) return null;
        $t = trim((string) $value);
        return $t === "" ? null : $t;
    }

    public static function validate($d) {
        $errors = [];

        // "Input Student credentials" — the required identity fields.
        foreach (["firstName" => "First name", "lastName" => "Last name", "address" => "Address"] as $field => $label) {
            if (trim((string) ($d[$field] ?? "")) === "") $errors[] = "$label is required.";
        }
        if (!in_array($d["gender"] ?? "", self::GENDERS, true)) {
            $errors[] = "Select a valid gender.";
        }
        if (empty($d["birthdate"] ?? "") || !strtotime($d["birthdate"])) {
            $errors[] = "A valid birthdate is required.";
        }
        if (empty($d["email"] ?? "") || !filter_var($d["email"], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "A valid email address is required.";
        }
        // students.lrn is NOT NULL UNIQUE — a walk-in must always supply one.
        $lrn = trim((string) ($d["lrn"] ?? ""));
        if ($lrn === "") {
            $errors[] = "LRN is required.";
        } else if (!preg_match("/^[0-9]{12}$/", $lrn)) {
            $errors[] = "LRN must be exactly 12 digits.";
        }
        if (!in_array($d["gradeLevel"] ?? "", self::GRADES, true)) {
            $errors[] = "Select a valid grade level.";
        }

        // "Select Grade level and section" — needs a strand + open section.
        // These two arrive snake_cased (the controller reads the same keys, and
        // the section id is set programmatically when a section row is picked).
        if (empty($d["strand_id"] ?? "")) {
            $errors[] = "Select a strand.";
        }
        if (empty($d["section_id"] ?? "")) {
            $errors[] = "Select a section.";
        }
        if (!in_array($d["semester"] ?? "", self::SEMESTERS, true)) {
            $errors[] = "Select a valid semester.";
        }

        // Emergency contact is required on the students table.
        foreach ([
            "emergencyName"         => "Emergency contact name",
            "emergencyRelationship" => "Emergency contact relationship",
            "emergencyContact"      => "Emergency contact number",
        ] as $field => $label) {
            if (trim((string) ($d[$field] ?? "")) === "") $errors[] = "$label is required.";
        }

        // Any contact number provided must be a PH mobile number.
        foreach (["contact", "emergencyContact", "fatherContact", "motherContact", "guardianContact"] as $field) {
            $value = trim((string) ($d[$field] ?? ""));
            if ($value !== "" && !preg_match(self::PH_MOBILE, $value)) {
                $errors[] = "Contact numbers must be an 11-digit PH mobile number (e.g. 09XXXXXXXXX).";
                break;
            }
        }

        return $errors;
    }
}
?>
