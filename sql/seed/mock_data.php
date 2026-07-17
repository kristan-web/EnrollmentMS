<?php
// Mock data for testing the Admission, Registrar, and Accounting (cashier) flows.
//
// This is a plain .sql file's job everywhere else in this project, but the
// applicant documents and payment proofs are real files on disk that the
// consoles open — SQL alone can't create those. So this seeder writes the
// files AND the rows, through the same config/db.php the app uses.
//
// Run it:
//   cd "c:\...\EnrollmentMS-Fixed-File-structure"
//   "C:\Xampp download\php\php.exe" sql/seed/mock_data.php
//
// Wipe it again (removes only the mock rows and their files):
//   "C:\Xampp download\php\php.exe" sql/seed/mock_data.php clear
//
// Safe to re-run: it clears its own rows first, so you always get a clean set.
// It only ever touches rows it created — everything mock is tagged:
//   applicants.reference_number  LIKE 'MOCK-%'
//   users / students / student_accounts .email  LIKE '%@mock.school'
// Your real records are never read or written.

require_once __DIR__ . "/../../config/db.php";

$UPLOAD_BASE = rtrim(getenv("UPLOAD_BASE_PATH") ?: "C:/xampp/enrollment_uploads", "/");
$APPLICANT_UPLOADS = $UPLOAD_BASE . "/applicants";
$PROOF_UPLOADS     = $UPLOAD_BASE . "/payment_proofs";

$STAFF_PASSWORD   = "Password123!";
$STUDENT_PASSWORD = "Student123!";

$db = new Database();
$conn = $db->connect();
if (!$conn) {
    fwrite(STDERR, "Could not connect to the database. Is MySQL running?\n");
    exit(1);
}
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$isClearOnly = in_array($argv[1] ?? "", ["clear", "--clear", "-c"], true);

// ---------------------------------------------------------------- helpers

function say($line = "") { echo $line . "\n"; }

function run($conn, $sql, $params = []) {
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function rmdirTree($dir) {
    if (!is_dir($dir)) return;
    foreach (scandir($dir) as $f) {
        if ($f === "." || $f === "..") continue;
        $path = $dir . "/" . $f;
        is_dir($path) ? rmdirTree($path) : @unlink($path);
    }
    @rmdir($dir);
}

function escPdf($s) {
    return str_replace(["\\", "(", ")"], ["\\\\", "\\(", "\\)"], $s);
}

// Builds a small but genuinely valid one-page PDF (correct xref offsets), so
// the registrar's "View file" opens something readable instead of a broken tab.
function makePdf($title, $lines) {
    $content = "BT /F1 17 Tf 57 780 Td (" . escPdf($title) . ") Tj ET\n";
    $y = 748;
    foreach ($lines as $line) {
        $content .= "BT /F1 11 Tf 57 " . $y . " Td (" . escPdf($line) . ") Tj ET\n";
        $y -= 17;
    }

    $objs = [
        1 => "<</Type/Catalog/Pages 2 0 R>>",
        2 => "<</Type/Pages/Kids[3 0 R]/Count 1>>",
        3 => "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
        4 => "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
        5 => "<</Length " . strlen($content) . ">>stream\n" . $content . "endstream",
    ];

    $pdf = "%PDF-1.4\n";
    $offsets = [];
    foreach ($objs as $n => $body) {
        $offsets[$n] = strlen($pdf);
        $pdf .= $n . " 0 obj\n" . $body . "\nendobj\n";
    }

    $xrefPos = strlen($pdf);
    $count = count($objs) + 1;
    $pdf .= "xref\n0 " . $count . "\n0000000000 65535 f \n";
    foreach ($objs as $n => $_) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$n]);
    }
    $pdf .= "trailer\n<</Size " . $count . "/Root 1 0 R>>\nstartxref\n" . $xrefPos . "\n%%EOF\n";

    return $pdf;
}

function writeFile($path, $bytes) {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    file_put_contents($path, $bytes);
    return strlen($bytes);
}

// ---------------------------------------------------------------- clear

// Order matters: payments -> enrollments -> students is RESTRICT, and the
// applicants/users links are SET NULL, so applicants must go before students.
function clearMock($conn, $applicantUploads, $proofUploads) {
    $mockApplicantRefs = $conn->query("SELECT reference_number FROM applicants WHERE reference_number LIKE 'MOCK-%'")->fetchAll(PDO::FETCH_COLUMN);
    $mockAccountIds    = $conn->query("SELECT account_id FROM student_accounts WHERE email LIKE '%@mock.school'")->fetchAll(PDO::FETCH_COLUMN);

    run($conn, "DELETE FROM payments WHERE enrollment_id IN (
                    SELECT e.enrollment_id FROM enrollments e
                    JOIN students s ON s.student_id = e.student_id
                    WHERE s.email LIKE '%@mock.school')");
    run($conn, "DELETE FROM enrollments WHERE student_id IN (SELECT student_id FROM students WHERE email LIKE '%@mock.school')");
    run($conn, "DELETE FROM applicants WHERE reference_number LIKE 'MOCK-%'");        // cascades applicant_documents
    run($conn, "DELETE FROM students WHERE email LIKE '%@mock.school'");
    run($conn, "DELETE FROM student_accounts WHERE email LIKE '%@mock.school'");      // cascades payment_proofs
    run($conn, "DELETE FROM users WHERE email LIKE '%@mock.school'");

    foreach ($mockApplicantRefs as $ref) rmdirTree($applicantUploads . "/" . $ref);
    foreach ($mockAccountIds as $id)     rmdirTree($proofUploads . "/" . $id);

    return count($mockApplicantRefs);
}

$removed = clearMock($conn, $APPLICANT_UPLOADS, $PROOF_UPLOADS);

if ($isClearOnly) {
    say("Removed mock data (" . $removed . " mock applicants and their files).");
    say("Your real records were not touched.");
    exit(0);
}

// ---------------------------------------------------------------- staff users

$staff = [
    ["Rosa Delgado",   "registrar@mock.school", "Registrar"],
    ["Ben Aquino",     "cashier@mock.school",   "Accounting"],
    ["Grace Tolentino", "admin@mock.school",    "Admin"],
];

foreach ($staff as $s) {
    run($conn,
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (:n, :e, :p, :r)",
        [":n" => $s[0], ":e" => $s[1], ":p" => password_hash($STAFF_PASSWORD, PASSWORD_DEFAULT), ":r" => $s[2]]
    );
}
$registrarId = $conn->query("SELECT user_id FROM users WHERE email = 'registrar@mock.school'")->fetchColumn();

// ---------------------------------------------------------------- applicants

// Document types already seeded: 1 Form 138, 2 Good Moral, 3 PSA, 4 2x2 Photo,
// 5 Transfer Certificate (Transferee only).
$SY = "2026-2027";

// Each entry describes one applicant plus the state we want them parked in, so
// every screen in the three consoles has something realistic to act on.
$applicants = [
    [
        "ref" => "MOCK-2026-001", "type" => "New Student", "first" => "Althea", "last" => "Bonifacio", "middle" => "Cruz",
        "gender" => "Female", "birth" => "2009-04-12", "lrn" => "990000000001", "grade" => "11", "strand" => 1,
        "status" => "Pending", "docs" => [1 => "Pending", 2 => "Pending", 3 => "Pending", 4 => "Pending"],
        "note" => "Fresh submission, all documents in — review and approve this one.",
    ],
    [
        "ref" => "MOCK-2026-002", "type" => "New Student", "first" => "Rafael", "last" => "Ocampo", "middle" => "Lim",
        "gender" => "Male", "birth" => "2009-08-30", "lrn" => "990000000002", "grade" => "11", "strand" => 2,
        "status" => "Pending", "docs" => [1 => "Pending", 2 => "Pending", 3 => "Pending"],
        "note" => "Missing the 2x2 ID Photo - Approve is blocked, use Request corrections.",
    ],
    [
        "ref" => "MOCK-2026-003", "type" => "Transferee", "first" => "Danica", "last" => "Herrera", "middle" => "Reyes",
        "gender" => "Female", "birth" => "2008-02-19", "lrn" => "990000000003", "grade" => "12", "strand" => 3,
        "status" => "Under Review", "docs" => [1 => "Rejected", 2 => "Verified", 3 => "Verified", 4 => "Verified", 5 => "Pending"],
        "reason" => "Form 138 is unreadable. Please re-upload a clear copy of page 2.",
        "remarks" => [1 => "Blurry scan - page 2 is unreadable."],
        "note" => "Corrections already requested; Form 138 rejected with remarks.",
    ],
    [
        "ref" => "MOCK-2026-004", "type" => "New Student", "first" => "Kier", "last" => "Mabini", "middle" => "Santos",
        "gender" => "Male", "birth" => "2009-11-05", "lrn" => "990000000004", "grade" => "11", "strand" => 5,
        "status" => "Approved", "docs" => [1 => "Verified", 2 => "Verified", 3 => "Verified", 4 => "Verified"],
        "note" => "Approved, no seat yet - assign a strand and section.",
    ],
    [
        "ref" => "MOCK-2026-005", "type" => "New Student", "first" => "Jasmine", "last" => "Reyes", "middle" => null,
        "gender" => "Female", "birth" => "2009-06-23", "lrn" => null, "grade" => "11", "strand" => 6,
        "status" => "Approved", "docs" => [1 => "Verified", 2 => "Verified", 3 => "Verified", 4 => "Verified"],
        "note" => "Approved but has NO LRN - assigning asks you to type one first.",
    ],
    [
        "ref" => "MOCK-2026-006", "type" => "New Student", "first" => "Liza", "last" => "Gutierrez", "middle" => "Andrada",
        "gender" => "Female", "birth" => "2009-01-28", "lrn" => "990000000006", "grade" => "11", "strand" => 1,
        "status" => "Approved", "docs" => [1 => "Verified", 2 => "Verified", 3 => "Verified", 4 => "Verified"],
        "enroll" => ["section" => 1, "semester" => "1st Semester", "status" => "Pending", "paid" => 0],
        "account" => true, "proof" => ["amount" => 9650.00, "method" => "GCash", "status" => "Pending"],
        "note" => "Seat reserved, NOT paid - cashier has a proof to verify; Finalize is blocked.",
    ],
    [
        "ref" => "MOCK-2026-007", "type" => "Transferee", "first" => "Noel", "last" => "Villamor", "middle" => "Diaz",
        "gender" => "Male", "birth" => "2008-09-14", "lrn" => "990000000007", "grade" => "12", "strand" => 1,
        "status" => "Approved", "docs" => [1 => "Verified", 2 => "Verified", 3 => "Verified", 4 => "Verified", 5 => "Verified"],
        "enroll" => ["section" => 3, "semester" => "1st Semester", "status" => "Pending", "paid" => 5000.00],
        "note" => "Seat reserved and partly paid (PHP 5,000) - Finalize is ENABLED.",
    ],
    [
        "ref" => "MOCK-2026-008", "type" => "New Student", "first" => "Marites", "last" => "Dizon", "middle" => "Ong",
        "gender" => "Female", "birth" => "2008-12-01", "lrn" => "990000000008", "grade" => "12", "strand" => 2,
        "status" => "Rejected", "docs" => [1 => "Rejected", 2 => "Verified", 3 => "Rejected", 4 => "Verified"],
        "reason" => "Submitted records belong to a different student. Please re-apply with your own documents.",
        "remarks" => [1 => "Name on the report card does not match the application.", 3 => "PSA copy is for another person."],
        "note" => "Rejected with a reason - shows on the applicant's Check Status page.",
    ],
    [
        "ref" => "MOCK-2026-009", "type" => "New Student", "first" => "Paolo", "last" => "Sandoval", "middle" => "Vera",
        "gender" => "Male", "birth" => "2009-03-08", "lrn" => "990000000009", "grade" => "11", "strand" => 1,
        "status" => "Enrolled", "docs" => [1 => "Verified", 2 => "Verified", 3 => "Verified", 4 => "Verified"],
        "enroll" => ["section" => 1, "semester" => "1st Semester", "status" => "Enrolled", "paid" => 19300.00],
        "note" => "Fully paid and enrolled - the finished end state.",
    ],
];

$docTypeNames = [];
foreach ($conn->query("SELECT document_type_id, name FROM document_types")->fetchAll(PDO::FETCH_ASSOC) as $t) {
    $docTypeNames[$t["document_type_id"]] = $t["name"];
}

$sy = $conn->query("SELECT school_year_id, year FROM school_years WHERE year = '$SY' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$studentSeq = 100;   // mock student numbers start at 2026-0100 to stay clear of real ones
$made = ["applicants" => 0, "docs" => 0, "students" => 0, "enrollments" => 0, "payments" => 0, "proofs" => 0, "accounts" => 0];

foreach ($applicants as $a) {
    $email = strtolower($a["first"] . "." . $a["last"]) . "@mock.school";
    $isDecided = in_array($a["status"], ["Approved", "Rejected", "Enrolled"], true) || $a["status"] === "Under Review";

    run($conn, "
        INSERT INTO applicants
            (reference_number, applicant_type, first_name, last_name, middle_name, gender, birthdate,
             address, contact_number, email, lrn, desired_grade_level, desired_strand_id, school_year,
             father_name, father_contact_number, mother_name, mother_contact_number,
             guardian_name, guardian_relationship, guardian_contact_number,
             emergency_contact_name, emergency_contact_relationship, emergency_contact_number,
             status, rejection_reason, reviewed_by, reviewed_at, submitted_at)
        VALUES
            (:ref, :type, :first, :last, :middle, :gender, :birth,
             :address, :contact, :email, :lrn, :grade, :strand, :sy,
             :fname, :fcontact, :mname, :mcontact,
             :gname, :grel, :gcontact,
             :ename, :erel, :econtact,
             :status, :reason, :reviewer, :reviewed_at, :submitted_at)
    ", [
        ":ref" => $a["ref"], ":type" => $a["type"], ":first" => $a["first"], ":last" => $a["last"],
        ":middle" => $a["middle"], ":gender" => $a["gender"], ":birth" => $a["birth"],
        ":address" => "Blk " . rand(1, 40) . " Lot " . rand(1, 30) . ", Brgy. San Jose, Dasmarinas, Cavite",
        ":contact" => "0917" . rand(1000000, 9999999), ":email" => $email, ":lrn" => $a["lrn"],
        ":grade" => $a["grade"], ":strand" => $a["strand"], ":sy" => $SY,
        ":fname" => $a["last"] . ", Sr.", ":fcontact" => "0917" . rand(1000000, 9999999),
        ":mname" => "Corazon " . $a["last"], ":mcontact" => "0917" . rand(1000000, 9999999),
        ":gname" => "Corazon " . $a["last"], ":grel" => "Mother", ":gcontact" => "0917" . rand(1000000, 9999999),
        ":ename" => "Corazon " . $a["last"], ":erel" => "Mother", ":econtact" => "0917" . rand(1000000, 9999999),
        ":status" => $a["status"], ":reason" => $a["reason"] ?? null,
        ":reviewer" => $isDecided ? $registrarId : null,
        ":reviewed_at" => $isDecided ? date("Y-m-d H:i:s", strtotime("-" . rand(1, 5) . " days")) : null,
        ":submitted_at" => date("Y-m-d H:i:s", strtotime("-" . rand(6, 20) . " days")),
    ]);
    $applicantId = (int) $conn->lastInsertId();
    $made["applicants"]++;

    // Documents: a real PDF per uploaded requirement, stored the way the
    // upload controller stores them (random filename, per-reference folder).
    foreach ($a["docs"] as $typeId => $docStatus) {
        $typeName = $docTypeNames[$typeId] ?? ("Document " . $typeId);
        $stored = bin2hex(random_bytes(16)) . ".pdf";
        $path = $APPLICANT_UPLOADS . "/" . $a["ref"] . "/" . $stored;

        $size = writeFile($path, makePdf($typeName, [
            "MOCK DOCUMENT - for testing only.",
            "",
            "Applicant : " . $a["first"] . " " . $a["last"],
            "Reference : " . $a["ref"],
            "Requirement: " . $typeName,
            "School Year: " . $SY,
            "Grade Level: " . $a["grade"],
            "",
            "This file was generated by sql/seed/mock_data.php so the",
            "registrar's View file button opens a real document.",
        ]));

        run($conn, "
            INSERT INTO applicant_documents
                (applicant_id, document_type_id, file_path, original_filename, file_size, mime_type, status, remarks, uploaded_at)
            VALUES (:aid, :tid, :path, :orig, :size, 'application/pdf', :status, :remarks, :at)
        ", [
            ":aid" => $applicantId, ":tid" => $typeId, ":path" => $path,
            ":orig" => strtolower(str_replace([" ", "(", ")", "/"], ["-", "", "", "-"], $typeName)) . ".pdf",
            ":size" => $size, ":status" => $docStatus,
            ":remarks" => ($docStatus === "Rejected") ? ($a["remarks"][$typeId] ?? "Please re-upload a clearer copy.") : null,
            ":at" => date("Y-m-d H:i:s", strtotime("-" . rand(6, 20) . " days")),
        ]);
        $made["docs"]++;
    }

    // Applicants that already have a seat need the student + enrollment the
    // registrar's Assign step would have created.
    if (!empty($a["enroll"])) {
        $studentNumber = "2026-" . str_pad((string) (++$studentSeq), 4, "0", STR_PAD_LEFT);

        run($conn, "
            INSERT INTO students
                (lrn, student_number, first_name, middle_name, last_name, gender, birthdate, address,
                 contact_number, email, grade_level, status,
                 father_name, father_contact_number, mother_name, mother_contact_number,
                 guardian_name, guardian_relationship, guardian_contact_number,
                 emergency_contact_name, emergency_contact_relationship, emergency_contact_number)
            SELECT lrn, :num, first_name, middle_name, last_name, gender, birthdate, address,
                   contact_number, email, desired_grade_level, 'Active',
                   father_name, father_contact_number, mother_name, mother_contact_number,
                   guardian_name, guardian_relationship, guardian_contact_number,
                   emergency_contact_name, emergency_contact_relationship, emergency_contact_number
            FROM applicants WHERE applicant_id = :aid
        ", [":num" => $studentNumber, ":aid" => $applicantId]);

        $studentId = (int) $conn->lastInsertId();
        $made["students"]++;
        run($conn, "UPDATE applicants SET converted_student_id = :sid WHERE applicant_id = :aid", [":sid" => $studentId, ":aid" => $applicantId]);

        run($conn, "
            INSERT INTO enrollments (student_id, section_id, school_year_id, school_year, semester, status, date_enrolled)
            VALUES (:sid, :sec, :syid, :sy, :sem, :status, :at)
        ", [
            ":sid" => $studentId, ":sec" => $a["enroll"]["section"], ":syid" => $sy["school_year_id"],
            ":sy" => $SY, ":sem" => $a["enroll"]["semester"], ":status" => $a["enroll"]["status"],
            ":at" => date("Y-m-d H:i:s", strtotime("-" . rand(1, 4) . " days")),
        ]);
        $enrollmentId = (int) $conn->lastInsertId();
        $made["enrollments"]++;

        if ($a["enroll"]["paid"] > 0) {
            run($conn, "
                INSERT INTO payments (enrollment_id, amount, payment_method, payment_status, payment_date)
                VALUES (:eid, :amt, 'Cash', 'Paid', :at)
            ", [":eid" => $enrollmentId, ":amt" => $a["enroll"]["paid"], ":at" => date("Y-m-d H:i:s", strtotime("-1 day"))]);
            $made["payments"]++;
        }
    }

    // A student-portal account, so the portal login and the cashier's
    // proof-of-payment review have something to work with.
    if (!empty($a["account"])) {
        run($conn, "INSERT INTO student_accounts (full_name, email, password_hash) VALUES (:n, :e, :p)", [
            ":n" => $a["first"] . " " . $a["last"], ":e" => $email,
            ":p" => password_hash($STUDENT_PASSWORD, PASSWORD_DEFAULT),
        ]);
        $accountId = (int) $conn->lastInsertId();
        $made["accounts"]++;

        if (!empty($a["proof"])) {
            $stored = bin2hex(random_bytes(16)) . ".pdf";
            $path = $PROOF_UPLOADS . "/" . $accountId . "/" . $stored;
            $size = writeFile($path, makePdf("Proof of Payment", [
                "MOCK RECEIPT - for testing only.",
                "",
                "Payer  : " . $a["first"] . " " . $a["last"],
                "Amount : PHP " . number_format($a["proof"]["amount"], 2),
                "Method : " . $a["proof"]["method"],
                "Ref no.: " . strtoupper(bin2hex(random_bytes(4))),
            ]));

            run($conn, "
                INSERT INTO payment_proofs
                    (account_id, reference_number, amount, method, payment_reference, file_path,
                     original_filename, file_size, mime_type, status, uploaded_at)
                VALUES (:acc, :ref, :amt, :method, :pref, :path, 'gcash-receipt.pdf', :size, 'application/pdf', :status, :at)
            ", [
                ":acc" => $accountId, ":ref" => $a["ref"], ":amt" => $a["proof"]["amount"],
                ":method" => $a["proof"]["method"], ":pref" => strtoupper(bin2hex(random_bytes(5))),
                ":path" => $path, ":size" => $size, ":status" => $a["proof"]["status"],
                ":at" => date("Y-m-d H:i:s", strtotime("-1 day")),
            ]);
            $made["proofs"]++;
        }
    }
}

// Some of the school's existing applicants have document rows whose files were
// never on this machine, which makes "View file" 404. Their rows are left
// exactly as they are — this only writes the missing file each row points to.
$repaired = 0;
foreach ($conn->query("SELECT ad.file_path, dt.name FROM applicant_documents ad
                       JOIN document_types dt ON dt.document_type_id = ad.document_type_id
                       WHERE ad.file_path NOT LIKE '%mock%'")->fetchAll(PDO::FETCH_ASSOC) as $row) {
    if (is_file($row["file_path"])) continue;
    writeFile($row["file_path"], makePdf($row["name"], [
        "PLACEHOLDER - the original upload isn't on this machine.",
        "",
        "Requirement: " . $row["name"],
        "Written by sql/seed/mock_data.php so View file opens something.",
    ]));
    $repaired++;
}

// ---------------------------------------------------------------- summary

say("");
say("  Mock data loaded.");
say("  " . str_repeat("-", 62));
say("  applicants " . $made["applicants"] . " | documents " . $made["docs"] . " | students " . $made["students"] .
    " | enrollments " . $made["enrollments"] . " | payments " . $made["payments"] .
    " | portal accounts " . $made["accounts"] . " | proofs " . $made["proofs"]);
if ($repaired) {
    say("  Also wrote " . $repaired . " missing file(s) for pre-existing document rows.");
}
say("");
say("  LOG IN");
say("  " . str_repeat("-", 62));
say("  Registrar  registrar/index.html   registrar@mock.school  " . $STAFF_PASSWORD);
say("  Cashier    accounting/index.html  cashier@mock.school    " . $STAFF_PASSWORD);
say("  Admin      index.html             admin@mock.school      " . $STAFF_PASSWORD);
say("  Portal     student-portal/        liza.gutierrez@mock.school  " . $STUDENT_PASSWORD);
say("");
say("  WHAT TO TRY");
say("  " . str_repeat("-", 62));
foreach ($applicants as $a) {
    say("  " . str_pad($a["ref"], 15) . str_pad($a["first"] . " " . $a["last"], 20) . str_pad($a["status"], 13) . $a["note"]);
}
say("");
say("  Check Status (student-portal) works with any reference number above");
say("  plus that applicant's email, e.g. MOCK-2026-008 + marites.dizon@mock.school");
say("");
say("  Re-run to reset. Remove with:  php sql/seed/mock_data.php clear");
say("");
