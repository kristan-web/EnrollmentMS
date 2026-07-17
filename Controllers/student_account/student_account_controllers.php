<?php
// Student portal accounts: register, login, logout, and "who am I".
// Follows the flowchart: register writes the account to the database, then the
// student logs in (credentials are checked against the database) before they
// can reach the admission form / dashboard.

session_start();

require_once __DIR__ . '/../../Models/student_account/student_account_model.php';
require_once __DIR__ . '/../../Dao/student_account/StudentAccountDAO.php';

header('Content-Type: application/json');

$dao = new StudentAccountDAO();
$method = $_SERVER['REQUEST_METHOD'];

// ---- GET: session lookup (used by page guards and to prefill the apply form)
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'me';
    if ($action === 'me') {
        if (!empty($_SESSION['student_account_id'])) {
            echo json_encode([
                "authenticated" => true,
                "account" => [
                    "account_id" => $_SESSION['student_account_id'],
                    "full_name"  => $_SESSION['student_name'] ?? '',
                    "email"      => $_SESSION['student_email'] ?? ''
                ]
            ]);
        } else {
            echo json_encode(["authenticated" => false]);
        }
        exit;
    }
    echo json_encode(["success" => false, "message" => "Invalid action"]);
    exit;
}

if ($method !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$formType = $_POST['form_type'] ?? '';

// ---- Register a new student account ------------------------------------
if ($formType === 'register') {
    $fullname = trim($_POST['fullname'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm  = $_POST['confirm'] ?? '';

    // "Completed all the required fields?" — server-side gate from the flowchart.
    $errors = [];
    if ($fullname === '')                                   $errors[] = "Full name is required.";
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "A valid email address is required.";
    if (strlen($password) < 6)                              $errors[] = "Password must be at least 6 characters.";
    if ($password !== $confirm)                             $errors[] = "Passwords do not match.";

    if ($errors) {
        echo json_encode(["success" => false, "message" => implode(" ", $errors)]);
        exit;
    }

    if ($dao->findByEmail($email)) {
        echo json_encode(["success" => false, "message" => "An account with this email already exists. Please log in instead."]);
        exit;
    }

    $account = new StudentAccount();
    $account->setFullname($fullname);
    $account->setEmail($email);
    $account->setPassword(password_hash($password, PASSWORD_DEFAULT));

    if ($dao->create($account)) {
        // Flowchart: after the account goes into the database, the student is
        // sent to the login page.
        echo json_encode([
            "success"  => true,
            "message"  => "Account created! Please log in to continue.",
            "redirect" => "login.html"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not create your account. Please try again."]);
    }
    exit;
}

// ---- Log in ------------------------------------------------------------
if ($formType === 'login') {
    $email    = trim($_POST['email'] ?? ($_POST['identifier'] ?? ''));
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        echo json_encode(["success" => false, "message" => "Please enter your email and password."]);
        exit;
    }

    $row = $dao->findByEmail($email);
    // "Is account valid?" — email must exist AND the password must match.
    if (!$row || !password_verify($password, $row['password_hash'])) {
        echo json_encode(["success" => false, "message" => "Incorrect email or password. Please try again."]);
        exit;
    }

    // Start the session so the dashboard and apply form know who is signed in.
    session_regenerate_id(true);
    $_SESSION['student_account_id'] = $row['account_id'];
    $_SESSION['student_name']       = $row['full_name'];
    $_SESSION['student_email']      = $row['email'];

    echo json_encode([
        "success"  => true,
        "message"  => "Signed in successfully. Redirecting…",
        "redirect" => "dashboard.html"
    ]);
    exit;
}

// ---- Log out -----------------------------------------------------------
if ($formType === 'logout') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(["success" => true, "redirect" => "login.html"]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
?>
