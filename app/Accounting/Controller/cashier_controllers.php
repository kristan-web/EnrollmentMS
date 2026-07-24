<?php
// Accounting-side (cashier) console — server routes.
// Implements the "Accounting-side Flow Chart":
//   Login -> validate credentials -> transaction console -> fetch student ->
//   take payment -> Fully Paid? -> update status -> print receipt.
//
// Cashiers sign in with an existing staff account from the `users` table, so
// this reuses the same credential check pattern as the admin app. The session
// keys are namespaced (cashier_*) so a cashier session never mixes with the
// student-portal or admin sessions.
//
//   GET  ?action=me                       -> session lookup (page guard)
//   POST form_type=login                  -> validate staff credentials
//   POST form_type=logout                 -> end the cashier session
//   GET  ?action=awaiting[&q=..]          -> students with an outstanding balance
//   GET  ?action=student&enrollment_id=.. -> one student's SOA, payments, proofs
//   POST action=record_payment            -> record a payment, recompute status
//   POST action=verify_proof              -> Verify/Reject an uploaded proof

session_start();

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/app/Accounting/DAO/CashierDAO.php";
// FeeSchedule is the single source of truth for the assessment breakdown/total.
// It is self-contained (no PayMongo constants used at load time).
require_once "$projectFilePath/app/Accounting/Model/payment_model.php";

header('Content-Type: application/json');

$dao    = new CashierDAO();
$method  = $_SERVER['REQUEST_METHOD'];

// Payment methods the cashier can record (matches the payments.payment_method enum).
$ALLOWED_METHODS = ['Cash', 'PayMongo'];

// ---- Helpers -----------------------------------------------------------
function money($n) {
    return round((float) $n, 2);
}

// Fully Paid once nothing is left; Partial once something is paid; else Unpaid.
function paymentStatus($assessment, $paid) {
    $balance = money($assessment - $paid);
    if ($paid <= 0)       return 'Unpaid';
    if ($balance <= 0)    return 'Fully Paid';
    return 'Partial';
}

function receiptNo($paymentId) {
    return 'OR-' . str_pad((string) $paymentId, 6, '0', STR_PAD_LEFT);
}

// Guard the members-only actions.
function requireCashier() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(["authenticated" => false, "message" => "Please log in to use the cashier console."]);
        exit;
    }
}

// Everything the detail panel needs for one enrollment.
function studentPayload(CashierDAO $dao, $enrollmentId) {
    $detail = $dao->getEnrollmentDetail($enrollmentId);
    if (!$detail) {
        return null;
    }

    // Price against this student's own term, since acct_fees is per term.
    $assessment = money(FeeSchedule::total($detail['school_year'], $detail['semester']));
    $paid       = money($dao->sumPaid($enrollmentId));
    $balance    = money(max(0, $assessment - $paid));

    return [
        "enrollment" => $detail,
        "soa" => [
            "items"      => FeeSchedule::items($detail['school_year'], $detail['semester']),
            "assessment" => $assessment,
            "currency"   => "PHP"
        ],
        "payments" => $dao->getPaymentsByEnrollment($enrollmentId),
        "paid"     => $paid,
        "balance"  => $balance,
        "status"   => paymentStatus($assessment, $paid),
        "proofs"   => $dao->getProofsForEmail($detail['email'] ?? '')
    ];
}

// ---- GET ---------------------------------------------------------------
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'me';

    if ($action === 'me') {
        if (!empty($_SESSION['user_id'])) {
            echo json_encode([
                "authenticated" => true,
                "cashier" => [
                    "user_id"   => $_SESSION['user_id'],
                    "full_name" => $_SESSION['name'] ?? '',
                    "role"      => $_SESSION['role'] ?? ''
                ]
            ]);
        } else {
            echo json_encode(["authenticated" => false]);
        }
        exit;
    }

    if ($action === 'awaiting') {
        requireCashier();
        $q = trim($_GET['q'] ?? '');

        $rows = $dao->listAwaiting($q);
        $students = [];
        foreach ($rows as $r) {
            // Each row carries its own term; FeeSchedule caches per term, so
            // this doesn't re-query for every student.
            $assessment = money(FeeSchedule::total($r['school_year'], $r['semester']));
            $paid    = money($r['paid']);
            $balance = money(max(0, $assessment - $paid));
            if ($balance <= 0) {
                continue; // fully settled — not awaiting payment
            }
            $students[] = [
                "enrollment_id"  => (int) $r['enrollment_id'],
                "student_id"     => (int) $r['student_id'],
                "student_number" => $r['student_number'],
                "full_name"      => trim($r['first_name'] . ' ' . $r['last_name']),
                "section_name"   => $r['section_name'],
                "school_year"    => $r['school_year'],
                "semester"       => $r['semester'],
                "assessment"     => $assessment,
                "paid"           => $paid,
                "balance"        => $balance,
                "status"         => paymentStatus($assessment, $paid)
            ];
        }

        // No global "assessment" here: each student is priced against their own
        // term and carries it in their own row.
        echo json_encode(["authenticated" => true, "students" => $students]);
        exit;
    }

    if ($action === 'student') {
        requireCashier();
        $enrollmentId = isset($_GET['enrollment_id']) ? (int) $_GET['enrollment_id'] : 0;
        if ($enrollmentId <= 0) {
            echo json_encode(["success" => false, "message" => "Missing enrollment reference."]);
            exit;
        }
        $payload = studentPayload($dao, $enrollmentId);
        if (!$payload) {
            echo json_encode(["success" => false, "message" => "That student could not be found."]);
            exit;
        }
        echo json_encode(array_merge(["success" => true, "authenticated" => true], $payload));
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid action."]);
    exit;
}

// ---- POST --------------------------------------------------------------
if ($method === 'POST') {
    $formType = $_POST['form_type'] ?? '';
    $action   = $_POST['action'] ?? '';

    // ---- Log in (flowchart: Input Credentials -> All filled out? -> Account valid?)
    if ($formType === 'login') {
        $email    = trim($_POST['email'] ?? ($_POST['emailLogin'] ?? ''));
        $password = $_POST['password'] ?? ($_POST['passwordLogin'] ?? '');

        // "All filled out?" — server-side gate.
        if ($email === '' || $password === '') {
            echo json_encode(["success" => false, "message" => "Please enter your email and password."]);
            exit;
        }

        $user = $dao->findUserByEmail($email);
        // "Account valid?" — email must exist AND the password must match.
        if (!$user || !password_verify($password, $user['password_hash'])) {
            echo json_encode(["success" => false, "message" => "Incorrect email or password. Please try again."]);
            exit;
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['name']    = $user['full_name'];
        $_SESSION['role']    = $user['role'];

        // Additive: record the staff sign-in in the admin audit log.
        require_once "$projectFilePath/app/Accounts/DAO/AuditDAO.php";
        (new AuditDAO())->record($user['user_id'], $user['full_name'], $user['role'],
            'login', 'session', null, 'Signed in to the cashier console', $_SERVER['REMOTE_ADDR'] ?? null);

        // Absolute, so it does not depend on which View/ page posted here.
        echo json_encode([
            "success"  => true,
            "message"  => "Signed in. Redirecting to the cashier console…",
            "redirect" => "/EnrollmentMS/app/Accounting/View/cashier.php"
        ]);
        exit;
    }

    // ---- Log out
    if ($formType === 'logout') {
        $_SESSION = [];
        session_destroy();
        // Absolute, so it does not depend on which View/ page logged out.
        echo json_encode(["success" => true, "redirect" => "/EnrollmentMS/app/Accounting/View/index.php"]);
        exit;
    }

    // ---- Take student payment (flowchart: Take payment -> Fully paid? -> status)
    if ($action === 'record_payment') {
        requireCashier();

        $enrollmentId = isset($_POST['enrollment_id']) ? (int) $_POST['enrollment_id'] : 0;
        $amount       = isset($_POST['amount']) ? money($_POST['amount']) : 0;
        $methodIn     = trim($_POST['method'] ?? '');

        if ($enrollmentId <= 0) {
            echo json_encode(["success" => false, "message" => "Missing student. Please pick a student first."]);
            exit;
        }
        if (!in_array($methodIn, $ALLOWED_METHODS, true)) {
            echo json_encode(["success" => false, "message" => "Please choose a valid payment method."]);
            exit;
        }

        $detail = $dao->getEnrollmentDetail($enrollmentId);
        if (!$detail) {
            echo json_encode(["success" => false, "message" => "That student could not be found."]);
            exit;
        }

        $assessment = money(FeeSchedule::total($detail['school_year'], $detail['semester']));
        $paidBefore = money($dao->sumPaid($enrollmentId));
        $balance    = money(max(0, $assessment - $paidBefore));

        if ($balance <= 0) {
            echo json_encode(["success" => false, "message" => "This student is already fully paid."]);
            exit;
        }
        if ($amount <= 0) {
            echo json_encode(["success" => false, "message" => "Enter an amount greater than zero."]);
            exit;
        }
        if ($amount > $balance) {
            echo json_encode(["success" => false, "message" => "Amount is more than the remaining balance of PHP " . number_format($balance, 2) . "."]);
            exit;
        }

        $paymentId = $dao->insertPayment($enrollmentId, $amount, $methodIn);
        if (!$paymentId) {
            echo json_encode(["success" => false, "message" => "Could not record the payment. Please try again."]);
            exit;
        }

        $paidAfter    = money($paidBefore + $amount);
        $newBalance   = money(max(0, $assessment - $paidAfter));
        $status       = paymentStatus($assessment, $paidAfter);
        $fullyPaid    = ($newBalance <= 0);

        // Flowchart: "Fully Paid? -> update status". On full settlement, confirm
        // the enrollment and move the student into the registrar's Enrolled tab
        // so the registrar doesn't have to finalize a student who has already
        // paid in full. Best-effort: a failure here doesn't undo the payment.
        if ($fullyPaid) {
            $dao->markEnrolledOnFullPayment($enrollmentId, (int) $detail['student_id']);
        }

        echo json_encode([
            "success"    => true,
            "message"    => $fullyPaid
                ? "Payment recorded. This student is now Fully Paid and enrolled."
                : "Payment recorded. Remaining balance: PHP " . number_format($newBalance, 2) . ".",
            "receipt" => [
                "receipt_no"     => receiptNo($paymentId),
                "payment_id"     => (int) $paymentId,
                "student_name"   => trim($detail['first_name'] . ' ' . $detail['last_name']),
                "student_number" => $detail['student_number'],
                "school_year"    => $detail['school_year'],
                "semester"       => $detail['semester'],
                "amount"         => $amount,
                "method"         => $methodIn,
                "assessment"     => $assessment,
                "paid_total"     => $paidAfter,
                "balance"        => $newBalance,
                "status"         => $status,
                "cashier"        => $_SESSION['cashier_name'] ?? '',
                "date"           => date('Y-m-d H:i')
            ],
            "paid"       => $paidAfter,
            "balance"    => $newBalance,
            "status"     => $status,
            "fully_paid" => $fullyPaid
        ]);
        exit;
    }

    // ---- Verify an uploaded proof of payment
    if ($action === 'verify_proof') {
        requireCashier();

        $proofId  = isset($_POST['proof_id']) ? (int) $_POST['proof_id'] : 0;
        $decision = trim($_POST['decision'] ?? '');
        $remarks  = trim($_POST['remarks'] ?? '');

        if ($proofId <= 0) {
            echo json_encode(["success" => false, "message" => "Missing proof reference."]);
            exit;
        }
        if (!in_array($decision, ['Verified', 'Rejected'], true)) {
            echo json_encode(["success" => false, "message" => "Choose whether to verify or reject the proof."]);
            exit;
        }

        if ($dao->updateProofStatus($proofId, $decision, $remarks ?: null)) {
            echo json_encode([
                "success" => true,
                "message" => $decision === 'Verified'
                    ? "Proof marked as verified."
                    : "Proof marked as rejected."
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Could not update the proof. Please try again."]);
        }
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid request."]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
