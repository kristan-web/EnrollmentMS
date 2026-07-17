<?php
// Admin console sign-in gate for the protected pages (Staff Accounts, Audit
// Logs). Verifies an Admin `users` account and opens the console_* session.
//
//   GET  ?action=me            -> who's signed in (page guard)
//   POST form_type=login       -> verify Admin credentials, open the session
//   POST form_type=logout      -> end the console session

require_once __DIR__ . "/guard.php";

header("Content-Type: application/json");

$staffDao = new StaffDAO();
$auditDao = new AuditDAO();
$method   = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
    $action = $_GET["action"] ?? "me";
    if ($action === "me") {
        $user = consoleUser();
        echo json_encode($user ? ["authenticated" => true, "user" => $user] : ["authenticated" => false]);
        exit;
    }
    echo json_encode(["success" => false, "message" => "Invalid action."]);
    exit;
}

if ($method === "POST") {
    $formType = $_POST["form_type"] ?? "";

    if ($formType === "login") {
        $email    = trim($_POST["email"] ?? "");
        $password = $_POST["password"] ?? "";

        if ($email === "" || $password === "") {
            echo json_encode(["success" => false, "message" => "Enter your email and password."]);
            exit;
        }

        $user = $staffDao->findByEmail($email);
        if (!$user || !password_verify($password, $user["password_hash"])) {
            echo json_encode(["success" => false, "message" => "Incorrect email or password."]);
            exit;
        }
        // Only Admins may enter the console. (Registrar/Accounting use their own consoles.)
        if ($user["role"] !== "Admin") {
            echo json_encode(["success" => false, "message" => "This area is for Admin accounts only."]);
            exit;
        }

        session_regenerate_id(true);
        $_SESSION["console_user_id"] = $user["user_id"];
        $_SESSION["console_name"]    = $user["full_name"];
        $_SESSION["console_role"]    = $user["role"];

        // Audit the sign-in.
        $auditDao->record($user["user_id"], $user["full_name"], $user["role"],
            "login", "session", null, "Signed in to the admin console", clientIp());

        echo json_encode([
            "success" => true,
            "user" => ["user_id" => $user["user_id"], "full_name" => $user["full_name"], "role" => $user["role"]]
        ]);
        exit;
    }

    if ($formType === "logout") {
        if (!empty($_SESSION["console_user_id"])) {
            $auditDao->record($_SESSION["console_user_id"], $_SESSION["console_name"] ?? null,
                $_SESSION["console_role"] ?? null, "logout", "session", null, "Signed out of the admin console", clientIp());
        }
        $_SESSION = [];
        session_destroy();
        echo json_encode(["success" => true]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid request."]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
