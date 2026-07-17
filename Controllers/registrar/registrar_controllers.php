<?php
// Registrar-side admission console — server routes.
// Implements the "Registrar-Side Flow Chart" branch that follows
// "Walk in? -> NO -> Click Online submission":
//
//   review admission details -> verify uploaded documents ->
//   approve / reject / request corrections -> assign strand -> assign section ->
//   finalize enrollment after payment is verified -> generate reports.
//
// Registrars sign in with an existing staff account from the `users` table, so
// this reuses the same credential check pattern as the cashier console. The
// session keys are namespaced (registrar_*) so a registrar session never mixes
// with the cashier, student-portal, or admin sessions.
//
//   GET  ?action=me                                   -> session lookup (page guard)
//   POST form_type=login                              -> validate staff credentials
//   POST form_type=logout                             -> end the registrar session
//   GET  ?action=queue[&status=&keyword=&school_year=]-> the review queue + tab counts
//   GET  ?action=detail&applicant_id=..               -> one application, documents, enrollment
//   GET  ?action=strands                              -> strand dropdown
//   GET  ?action=sections&strand_id=&grade=&school_year= -> open sections + live occupancy
//   GET  ?action=document&document_id=..              -> stream one uploaded file
//   GET  ?action=report[&school_year=]                -> enrollment / admission reports
//   POST action=review_document                       -> Verify/Reject one document
//   POST action=decide                                -> approve | reject | corrections
//   POST action=assign                                -> assign strand+section, reserve a seat
//   POST action=finalize                              -> finalize once payment is verified

session_start();

require_once __DIR__ . "/../../Dao/registrar/RegistrarDAO.php";
require_once __DIR__ . "/../../Dao/student/StudentDAO.php";
require_once __DIR__ . "/../../Dao/enrollment/EnrollmentDAO.php";
require_once __DIR__ . "/../../Models/registrar/admission_model.php";
require_once __DIR__ . "/../../Models/student/students_model.php";
require_once __DIR__ . "/../../Models/enrollment/enrollment_model.php";
// Single source of truth for the assessment total — the same schedule the
// cashier bills against, so both sides agree on what "paid" means.
require_once __DIR__ . "/../../accounting/api/Models/payment_model.php";

$dao           = new RegistrarDAO();
$studentDao    = new StudentDAO();
$enrollmentDao = new EnrollmentDAO();
$method        = $_SERVER["REQUEST_METHOD"];

// NOTE: no role check here, matching the cashier console — any staff account in
// `users` can work the queue. A `role` gate isn't enforceable yet: account
// creation stores the role "Staff", which isn't in the users.role enum
// ('Admin','Registrar','Accounting'), so MySQL silently writes '' instead and
// every existing account has a blank role. Fix that first, then gate here.

// ---- Helpers -----------------------------------------------------------

function jsonHeader() {
    header("Content-Type: application/json");
}

// Guard every action except the session probe. Mirrors requireCashier().
// Sets the JSON header itself: the ?action=document branch guards before it
// knows whether it's replying with a file or an error.
function requireRegistrar() {
    if (empty($_SESSION["registrar_user_id"])) {
        http_response_code(401);
        jsonHeader();
        echo json_encode(["authenticated" => false, "message" => "Please log in to use the admission console."]);
        exit;
    }
}

function fail($message) {
    echo json_encode(["success" => false, "message" => $message]);
    exit;
}

function money($n) {
    return round((float) $n, 2);
}

function nullableTrim($value) {
    if (!isset($value)) return null;
    $trimmed = trim((string) $value);
    return $trimmed === "" ? null : $trimmed;
}

// ---- GET ---------------------------------------------------------------

if ($method === "GET") {
    $action = $_GET["action"] ?? "me";

    // Streams an uploaded document. Files are stored outside the web root, so
    // PHP is the only way to read them back. Sent inline (no download prompt)
    // so the registrar can eyeball a PDF/image in the browser.
    if ($action === "document") {
        requireRegistrar();

        $documentId = isset($_GET["document_id"]) ? (int) $_GET["document_id"] : 0;
        $doc = $documentId > 0 ? $dao->getDocumentById($documentId) : null;

        if (!$doc || !is_file($doc["file_path"])) {
            http_response_code(404);
            jsonHeader();
            echo json_encode(["success" => false, "message" => "That file is no longer available."]);
            exit;
        }

        // Serve the stored mime type, never a client-supplied one, and pin the
        // filename so a crafted original_filename can't rewrite the header.
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', "_", $doc["original_filename"]);
        header("Content-Type: " . $doc["mime_type"]);
        header("Content-Length: " . filesize($doc["file_path"]));
        header("Content-Disposition: inline; filename=\"" . $safeName . "\"");
        header("X-Content-Type-Options: nosniff");
        readfile($doc["file_path"]);
        exit;
    }

    jsonHeader();

    if ($action === "me") {
        if (!empty($_SESSION["registrar_user_id"])) {
            echo json_encode([
                "authenticated" => true,
                "user" => [
                    "user_id"   => $_SESSION["registrar_user_id"],
                    "full_name" => $_SESSION["registrar_name"] ?? "",
                    "role"      => $_SESSION["registrar_role"] ?? ""
                ]
            ]);
        } else {
            echo json_encode(["authenticated" => false]);
        }
        exit;
    }

    if ($action === "queue") {
        requireRegistrar();

        $status = $_GET["status"] ?? "";
        if ($status === "All") $status = "";
        if ($status !== "" && !in_array($status, AdmissionReview::allStatuses(), true)) {
            fail("Unknown status filter.");
        }

        $filters = [
            "status"      => $status,
            "keyword"     => trim($_GET["keyword"] ?? ""),
            "school_year" => trim($_GET["school_year"] ?? ""),
        ];

        echo json_encode([
            "authenticated"      => true,
            "success"            => true,
            "applicants"         => $dao->listApplicants($filters),
            "counts"             => $dao->countsByStatus(),
            "school_years"       => $dao->getSchoolYears(),
            "active_school_year" => $dao->getActiveSchoolYear()
        ]);
        exit;
    }

    if ($action === "detail") {
        requireRegistrar();

        $applicantId = isset($_GET["applicant_id"]) ? (int) $_GET["applicant_id"] : 0;
        if ($applicantId <= 0) fail("Missing applicant reference.");

        $applicant = $dao->getApplicantDetail($applicantId);
        if (!$applicant) fail("That application could not be found.");

        $enrollment = $dao->getEnrollmentForApplicant($applicantId);

        // Payment state drives the Finalize button. Priced against the
        // enrollment's own term, so it agrees with what the cashier bills.
        $payment = null;
        if ($enrollment) {
            $assessment = money(FeeSchedule::total($enrollment["school_year"], $enrollment["semester"]));
            $paid       = money($enrollment["paid"]);
            $payment = [
                "assessment" => $assessment,
                "paid"       => $paid,
                "balance"    => money(max(0, $assessment - $paid)),
                "verified"   => $paid > 0,
                "fully_paid" => $paid >= $assessment
            ];
        }

        echo json_encode([
            "authenticated" => true,
            "success"       => true,
            "applicant"     => $applicant,
            "documents"     => $dao->getDocuments($applicantId),
            "missing"       => $dao->getMissingRequiredDocuments($applicantId, $applicant["applicant_type"]),
            "enrollment"    => $enrollment,
            "payment"       => $payment
        ]);
        exit;
    }

    if ($action === "strands") {
        requireRegistrar();
        echo json_encode($dao->getStrands());
        exit;
    }

    if ($action === "sections") {
        requireRegistrar();

        $strandId   = isset($_GET["strand_id"]) ? (int) $_GET["strand_id"] : 0;
        $grade      = trim($_GET["grade"] ?? "");
        $schoolYear = trim($_GET["school_year"] ?? "");

        if ($strandId <= 0 || $grade === "" || $schoolYear === "") {
            fail("Select a strand, grade level, and school year first.");
        }

        $sections = $dao->getOpenSections($strandId, $grade, $schoolYear);
        foreach ($sections as &$s) {
            $s["available"] = max(0, (int) $s["max_slots"] - (int) $s["occupied_count"]);
        }
        unset($s);

        echo json_encode(["success" => true, "sections" => $sections]);
        exit;
    }

    if ($action === "report") {
        requireRegistrar();

        $schoolYear = trim($_GET["school_year"] ?? "");
        if ($schoolYear === "") {
            $active = $dao->getActiveSchoolYear();
            $schoolYear = $active ? $active["year"] : "";
        }
        if ($schoolYear === "") fail("No school year to report on.");

        echo json_encode([
            "authenticated" => true,
            "success"       => true,
            "school_year"   => $schoolYear,
            "admission"     => $dao->getAdmissionReport($schoolYear),
            "sections"      => $dao->getSectionFillReport($schoolYear),
            "generated_at"  => date("Y-m-d H:i"),
            "generated_by"  => $_SESSION["registrar_name"] ?? ""
        ]);
        exit;
    }

    fail("Invalid action.");
}

// ---- POST --------------------------------------------------------------

if ($method === "POST") {
    jsonHeader();

    $formType = $_POST["form_type"] ?? "";

    // ---- Log in (flowchart: Input credentials -> All filled out? -> Account valid?)
    if ($formType === "login") {
        $email    = trim($_POST["email"] ?? "");
        $password = $_POST["password"] ?? "";

        // "All forms have been filled out?" — server-side gate.
        if ($email === "" || $password === "") {
            fail("Please enter your email and password.");
        }

        $user = $dao->findUserByEmail($email);
        // "Is account valid?" — the email must exist AND the password must match.
        if (!$user || !password_verify($password, $user["password_hash"])) {
            fail("Incorrect email or password. Please try again.");
        }

        session_regenerate_id(true);
        $_SESSION["registrar_user_id"] = $user["user_id"];
        $_SESSION["registrar_name"]    = $user["full_name"];
        $_SESSION["registrar_role"]    = $user["role"];

        // Additive: record the staff sign-in in the admin audit log.
        require_once __DIR__ . "/../../Dao/audit/AuditDAO.php";
        (new AuditDAO())->record($user["user_id"], $user["full_name"], $user["role"],
            "login", "session", null, "Signed in to the registrar console", $_SERVER["REMOTE_ADDR"] ?? null);

        // Relative to registrar/index.html, the login page that posts here.
        echo json_encode([
            "success"  => true,
            "message"  => "Signed in. Redirecting to the admission console…",
            "redirect" => "views/admission.html"
        ]);
        exit;
    }

    // ---- Log out
    if ($formType === "logout") {
        $_SESSION = [];
        session_destroy();
        // Relative to registrar/views/admission.html, the only page that logs out.
        echo json_encode(["success" => true, "redirect" => "../index.html"]);
        exit;
    }

    requireRegistrar();

    $action = $_POST["action"] ?? "";

    // ---- Verify uploaded documents (flowchart: "Complete and valid?")
    if ($action === "review_document") {
        $errors = AdmissionReview::validateDocumentDecision($_POST);
        if (!empty($errors)) fail(implode(" ", $errors));

        $documentId = (int) $_POST["document_id"];
        $decision   = $_POST["decision"];
        $remarks    = nullableTrim($_POST["remarks"] ?? null);

        $doc = $dao->getDocumentById($documentId);
        if (!$doc) fail("That document could not be found.");

        // Verifying clears any earlier rejection remarks so the applicant's
        // Check Status page doesn't keep showing a stale correction note.
        if ($decision === AdmissionReview::DOC_VERIFIED) {
            $remarks = null;
        }

        if (!$dao->updateDocumentStatus($documentId, $decision, $remarks)) {
            fail("Could not update the document. Please try again.");
        }

        echo json_encode([
            "success" => true,
            "message" => $decision === AdmissionReview::DOC_VERIFIED
                ? "Document marked as verified."
                : "Document marked as rejected."
        ]);
        exit;
    }

    // ---- Approve / reject / request corrections
    if ($action === "decide") {
        $errors = AdmissionReview::validateDecision($_POST);
        if (!empty($errors)) fail(implode(" ", $errors));

        $applicantId = (int) $_POST["applicant_id"];
        $decision    = $_POST["decision"];
        $reason      = nullableTrim($_POST["reason"] ?? null);

        $applicant = $dao->getApplicantDetail($applicantId);
        if (!$applicant) fail("That application could not be found.");

        if (!AdmissionReview::isDecidable($applicant["status"])) {
            fail("This applicant is already enrolled, so the decision can no longer be changed.");
        }

        if ($decision === "approve") {
            // Don't approve an application that is still missing required
            // documents or has ones the registrar already rejected.
            $missing = $dao->getMissingRequiredDocuments($applicantId, $applicant["applicant_type"]);
            if (!empty($missing)) {
                $names = array_map(function ($m) { return $m["name"]; }, $missing);
                fail("Still missing: " . implode(", ", $names) . ". Request corrections instead.");
            }
            foreach ($dao->getDocuments($applicantId) as $doc) {
                if ($doc["status"] === AdmissionReview::DOC_REJECTED) {
                    fail("\"" . $doc["document_type_name"] . "\" is marked rejected. Request corrections instead.");
                }
            }

            $status = AdmissionReview::STATUS_APPROVED;
            $reason = null; // an approval carries no note
            $message = "Application approved. Assign a strand and section next.";

        } else if ($decision === "reject") {
            $status  = AdmissionReview::STATUS_REJECTED;
            $message = "Application rejected. The applicant can see the reason on Check Status.";

        } else {
            // "Request corrections". The applicants.status enum has no
            // dedicated value, so the application goes back to Under Review and
            // the note rides in rejection_reason. What the applicant actually
            // acts on is the per-document remarks, which Check Status lists.
            $status  = AdmissionReview::STATUS_UNDER_REVIEW;
            $message = "Corrections requested. The applicant can re-upload the rejected documents.";
        }

        $review = new AdmissionReview($applicantId, $status, $_SESSION["registrar_user_id"], $reason);
        if (!$dao->updateStatus($review)) {
            fail("Could not save the decision. Please try again.");
        }

        echo json_encode(["success" => true, "message" => $message, "status" => $status]);
        exit;
    }

    // ---- Assign strand + section (flowchart: "Select Grade level and section")
    //
    // This is where an applicant becomes a real student. It creates the
    // `students` row (if one doesn't exist yet) and an `enrollments` row with
    // status 'Pending', which reserves the seat while the student settles with
    // the cashier. The registrar finalizes it afterwards.
    if ($action === "assign") {
        $applicantId = isset($_POST["applicant_id"]) ? (int) $_POST["applicant_id"] : 0;
        $applicant   = $applicantId > 0 ? $dao->getApplicantDetail($applicantId) : null;
        if (!$applicant) fail("That application could not be found.");

        if ($applicant["status"] !== AdmissionReview::STATUS_APPROVED) {
            fail("Approve the application before assigning a section.");
        }

        $errors = AdmissionAssignment::validate($_POST, $applicant["lrn"]);
        if (!empty($errors)) fail(implode(" ", $errors));

        $strandId = (int) $_POST["strand_id"];
        $sectionId = (int) $_POST["section_id"];
        $semester  = $_POST["semester"];
        $lrn       = AdmissionAssignment::resolveLrn($_POST, $applicant["lrn"]);

        // The section must exist, be open, match the applicant's strand/grade/
        // year, and still have a seat. Re-checked here (not just in the UI)
        // because the queue may be minutes stale.
        $section = $dao->getSectionCapacity($sectionId);
        if (!$section)                     fail("That section could not be found.");
        if ($section["status"] !== "Open") fail("That section is no longer open.");
        if ((int) $section["strand_id"] !== $strandId) {
            fail("That section doesn't belong to the selected strand.");
        }
        if ($section["grade_level"] !== $applicant["desired_grade_level"]) {
            fail("That section is for Grade " . $section["grade_level"] . ", but this applicant is entering Grade " . $applicant["desired_grade_level"] . ".");
        }
        if ($section["school_year"] !== $applicant["school_year"]) {
            fail("That section is for S.Y. " . $section["school_year"] . ", but this application is for S.Y. " . $applicant["school_year"] . ".");
        }
        if ((int) $section["occupied_count"] >= (int) $section["max_slots"]) {
            fail("That section is already full.");
        }

        $schoolYear = $dao->getSchoolYearByYear($applicant["school_year"]);
        if (!$schoolYear) {
            fail("S.Y. " . $applicant["school_year"] . " isn't set up yet. Add it under Settings first.");
        }

        // Reuse the student record if this applicant was already converted
        // (e.g. the registrar is re-assigning after a mistake).
        $studentId = $applicant["converted_student_id"] ? (int) $applicant["converted_student_id"] : null;

        if (!$studentId) {
            // students.lrn and students.email are UNIQUE. If a record already
            // exists, adopt it rather than failing on a duplicate-key error.
            $existing = $dao->findStudentByLrn($lrn);
            if (!$existing) {
                $byEmail = $dao->findStudentByEmail($applicant["email"]);
                if ($byEmail) {
                    fail("A student record already uses " . $applicant["email"] . " (" . $byEmail["student_number"] . "). Check for a duplicate application.");
                }
            }

            if ($existing) {
                $studentId = (int) $existing["student_id"];
            } else {
                $student = new Student();
                $student->setLrn($lrn);
                $student->setStudentNumber($dao->generateStudentNumber($applicant["school_year"]));
                $student->setFirstName($applicant["first_name"]);
                $student->setMiddleName($applicant["middle_name"]);
                $student->setLastName($applicant["last_name"]);
                $student->setGender($applicant["gender"]);
                $student->setBirthdate($applicant["birthdate"]);
                $student->setAddress($applicant["address"]);
                $student->setContactNumber($applicant["contact_number"]);
                $student->setEmail($applicant["email"]);
                $student->setGradeLevel($applicant["desired_grade_level"]);
                $student->setStatus("Active");
                $student->setFatherName($applicant["father_name"]);
                $student->setFatherContactNumber($applicant["father_contact_number"]);
                $student->setFatherOccupation(null);   // not collected on the application form
                $student->setMotherName($applicant["mother_name"]);
                $student->setMotherContactNumber($applicant["mother_contact_number"]);
                $student->setMotherOccupation(null);   // not collected on the application form
                $student->setGuardianName($applicant["guardian_name"]);
                $student->setGuardianRelationship($applicant["guardian_relationship"]);
                $student->setGuardianContactNumber($applicant["guardian_contact_number"]);
                $student->setGuardianAddress(null);    // not collected on the application form
                $student->setEmergencyContactName($applicant["emergency_contact_name"]);
                $student->setEmergencyContactRelationship($applicant["emergency_contact_relationship"]);
                $student->setEmergencyContactNumber($applicant["emergency_contact_number"]);

                try {
                    if (!$studentDao->insert($student)) {
                        fail("Could not create the student record. Please try again.");
                    }
                } catch (PDOException $e) {
                    fail("Could not create the student record — the LRN or email may already be in use.");
                }

                // StudentDAO::insert returns a bool, so read the new id back
                // via the LRN (UNIQUE, and we just wrote it).
                $created = $dao->findStudentByLrn($lrn);
                if (!$created) {
                    fail("The student record was saved but could not be read back. Please check the Students page.");
                }
                $studentId = (int) $created["student_id"];
            }

            $dao->linkConvertedStudent($applicantId, $studentId);
        }

        // Don't double-enroll for the same year + semester.
        $duplicate = $dao->findEnrollment($studentId, $schoolYear["school_year_id"], $semester);
        if ($duplicate) {
            fail("This student already has a " . strtolower($duplicate["status"]) . " enrollment for " . $semester . ", S.Y. " . $applicant["school_year"] . ".");
        }

        // Record the strand on the application, in case the registrar changed it.
        if ((int) $applicant["desired_strand_id"] !== $strandId) {
            $dao->updateDesiredStrand($applicantId, $strandId);
        }

        $enrollment = new Enrollment();
        $enrollment->setStudentId($studentId);
        $enrollment->setSectionId($sectionId);
        $enrollment->setSchoolYearId($schoolYear["school_year_id"]);
        $enrollment->setSchoolYear($schoolYear["year"]);
        $enrollment->setSemester($semester);
        // 'Pending' = seat reserved, not yet finalized. The cashier can see it
        // and take payment; Finalize flips it to 'Enrolled'.
        $enrollment->setStatus("Pending");

        try {
            if (!$enrollmentDao->insert($enrollment)) {
                fail("Could not reserve the section. Please try again.");
            }
        } catch (PDOException $e) {
            fail("Could not reserve the section. Please try again.");
        }

        echo json_encode([
            "success" => true,
            "message" => "Seat reserved in " . $section["section_name"] . ". The student can now pay at the cashier; finalize once payment is verified."
        ]);
        exit;
    }

    // ---- Finalize enrollment (only after payment is verified)
    if ($action === "finalize") {
        $applicantId = isset($_POST["applicant_id"]) ? (int) $_POST["applicant_id"] : 0;
        $applicant   = $applicantId > 0 ? $dao->getApplicantDetail($applicantId) : null;
        if (!$applicant) fail("That application could not be found.");

        if ($applicant["status"] === AdmissionReview::STATUS_ENROLLED) {
            fail("This applicant is already enrolled.");
        }
        if ($applicant["status"] !== AdmissionReview::STATUS_APPROVED) {
            fail("Approve the application and assign a section before finalizing.");
        }

        $enrollment = $dao->getEnrollmentForApplicant($applicantId);
        if (!$enrollment) fail("Assign a strand and section before finalizing.");

        // The payment gate: the cashier must have recorded at least one Paid
        // payment against this enrollment.
        $assessment = money(FeeSchedule::total($enrollment["school_year"], $enrollment["semester"]));
        $paid       = money($enrollment["paid"]);
        if ($paid <= 0) {
            fail("No verified payment yet. The cashier must record a payment before this enrollment can be finalized.");
        }

        if (!$dao->finalizeEnrollment($enrollment["enrollment_id"])) {
            fail("Could not finalize the enrollment. Please try again.");
        }

        $review = new AdmissionReview(
            $applicantId,
            AdmissionReview::STATUS_ENROLLED,
            $_SESSION["registrar_user_id"],
            null
        );
        $dao->updateStatus($review);

        $balance = money(max(0, $assessment - $paid));
        echo json_encode([
            "success" => true,
            "message" => $balance > 0
                ? "Enrollment finalized with a remaining balance of PHP " . number_format($balance, 2) . "."
                : "Enrollment finalized. This student is fully paid.",
            "balance" => $balance
        ]);
        exit;
    }

    // ---- Walk-in enrollment (flowchart: "Walk in? -> YES")
    //
    // The registrar types a walk-in student's credentials, picks a strand +
    // grade + section, and submits. This creates the `students` row ("Input to
    // database") and a 'Pending' enrollment ("Select grade level and section ->
    // Click submit"), then hands back everything the temporary report card
    // needs. The seat is reserved (Pending), so the cashier can still collect
    // payment and the registrar finalizes afterwards — the same gate as online.
    if ($action === "walkin_enroll") {
        $errors = WalkInEnrollment::validate($_POST);
        if (!empty($errors)) fail(implode(" ", $errors));   // "Inform student to complete documents"

        $strandId  = (int) $_POST["strand_id"];
        $sectionId = (int) $_POST["section_id"];
        $grade     = $_POST["gradeLevel"];
        $semester  = $_POST["semester"];
        $lrn       = trim($_POST["lrn"]);

        // Every walk-in enrolls into the active school year.
        $schoolYear = $dao->getActiveSchoolYear();
        if (!$schoolYear) {
            fail("No active school year is set. Add one under Settings first.");
        }

        // Validate the chosen section: open, right strand/grade/year, has a seat.
        $section = $dao->getSectionCapacity($sectionId);
        if (!$section)                     fail("That section could not be found.");
        if ($section["status"] !== "Open") fail("That section is no longer open.");
        if ((int) $section["strand_id"] !== $strandId) {
            fail("That section doesn't belong to the selected strand.");
        }
        if ($section["grade_level"] !== $grade) {
            fail("That section is for Grade " . $section["grade_level"] . ", but you selected Grade " . $grade . ".");
        }
        if ($section["school_year"] !== $schoolYear["year"]) {
            fail("That section is for S.Y. " . $section["school_year"] . ", not the active S.Y. " . $schoolYear["year"] . ".");
        }
        if ((int) $section["occupied_count"] >= (int) $section["max_slots"]) {
            fail("That section is already full.");
        }

        // students.lrn and students.email are UNIQUE — check up front for a
        // readable message instead of a duplicate-key exception.
        if ($dao->findStudentByLrn($lrn)) {
            fail("A student with LRN " . $lrn . " already exists. Enroll them from the Students page instead.");
        }
        if ($dao->findStudentByEmail(trim($_POST["email"]))) {
            fail("A student already uses that email address.");
        }

        $c = ["WalkInEnrollment", "clean"];   // trims "" -> null for optional columns

        $student = new Student();
        $student->setLrn($lrn);
        $student->setStudentNumber($dao->generateStudentNumber($schoolYear["year"]));
        $student->setFirstName(trim($_POST["firstName"]));
        $student->setMiddleName(call_user_func($c, $_POST["middleName"] ?? null));
        $student->setLastName(trim($_POST["lastName"]));
        $student->setGender($_POST["gender"]);
        $student->setBirthdate(date("Y-m-d", strtotime($_POST["birthdate"])));
        $student->setAddress(trim($_POST["address"]));
        $student->setContactNumber(call_user_func($c, $_POST["contact"] ?? null));
        $student->setEmail(trim($_POST["email"]));
        $student->setGradeLevel($grade);
        $student->setStatus("Active");
        $student->setFatherName(call_user_func($c, $_POST["fatherName"] ?? null));
        $student->setFatherContactNumber(call_user_func($c, $_POST["fatherContact"] ?? null));
        $student->setFatherOccupation(call_user_func($c, $_POST["fatherOccupation"] ?? null));
        $student->setMotherName(call_user_func($c, $_POST["motherName"] ?? null));
        $student->setMotherContactNumber(call_user_func($c, $_POST["motherContact"] ?? null));
        $student->setMotherOccupation(call_user_func($c, $_POST["motherOccupation"] ?? null));
        $student->setGuardianName(call_user_func($c, $_POST["guardianName"] ?? null));
        $student->setGuardianRelationship(call_user_func($c, $_POST["guardianRelationship"] ?? null));
        $student->setGuardianContactNumber(call_user_func($c, $_POST["guardianContact"] ?? null));
        $student->setGuardianAddress(call_user_func($c, $_POST["guardianAddress"] ?? null));
        $student->setEmergencyContactName(trim($_POST["emergencyName"]));
        $student->setEmergencyContactRelationship(trim($_POST["emergencyRelationship"]));
        $student->setEmergencyContactNumber(trim($_POST["emergencyContact"]));

        try {
            if (!$studentDao->insert($student)) {
                fail("Could not save the student record. Please try again.");
            }
        } catch (PDOException $e) {
            fail("Could not save the student — the LRN or email may already be in use.");
        }

        // insert() returns a bool; read the id back via the LRN (UNIQUE).
        $created = $dao->findStudentByLrn($lrn);
        if (!$created) {
            fail("The student was saved but could not be read back. Check the Students page.");
        }
        $studentId = (int) $created["student_id"];

        $enrollment = new Enrollment();
        $enrollment->setStudentId($studentId);
        $enrollment->setSectionId($sectionId);
        $enrollment->setSchoolYearId($schoolYear["school_year_id"]);
        $enrollment->setSchoolYear($schoolYear["year"]);
        $enrollment->setSemester($semester);
        // 'Pending' = seat reserved; the report card is "temporary" until the
        // cashier records payment and the registrar finalizes.
        $enrollment->setStatus("Pending");

        try {
            if (!$enrollmentDao->insert($enrollment)) {
                fail("The student was saved but the enrollment failed. Enroll them from the Enrollment page.");
            }
        } catch (PDOException $e) {
            fail("The student was saved but the enrollment failed. Enroll them from the Enrollment page.");
        }

        // The new enrollment id, to build the report card.
        $newEnrollment = $dao->findEnrollment($studentId, $schoolYear["school_year_id"], $semester);
        $detail = $newEnrollment ? $dao->getEnrollmentDetail($newEnrollment["enrollment_id"]) : null;

        echo json_encode([
            "success"      => true,
            "message"      => "Walk-in enrolled. Seat reserved in " . $section["section_name"] . ". Print the temporary report card below.",
            "student_number" => $created["student_number"],
            "report_card"  => $detail
        ]);
        exit;
    }

    fail("Invalid request.");
}

http_response_code(405);
jsonHeader();
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
