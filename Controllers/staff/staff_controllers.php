<?php
// Staff account management for the admin console — a fuller manager than the
// existing User Settings page (which only creates + resets). Lists staff,
// creates with a role, edits name/email/role, resets password, and deletes.
// Every change is written to the audit log. Admin-only (see guard.php).
//
//   GET  ?action=list[&role=&keyword=]  -> staff accounts + role counts
//   POST action=create                  -> new account (name,email,password,role)
//   POST action=update                  -> edit name/email/role
//   POST action=reset_password          -> set a new password
//   POST action=delete                  -> remove an account

require_once __DIR__ . "/../admin_console/guard.php";
require_once __DIR__ . "/../../Models/staff/staff_model.php";

header("Content-Type: application/json");

$dao      = new StaffDAO();
$method   = $_SERVER["REQUEST_METHOD"];

function fail($message) {
    echo json_encode(["success" => false, "message" => $message]);
    exit;
}

if ($method === "GET") {
    $action = $_GET["action"] ?? "list";

    if ($action === "list") {
        $filters = [
            "role"    => trim($_GET["role"] ?? ""),
            "keyword" => trim($_GET["keyword"] ?? "")
        ];
        $counts = [];
        foreach (StaffDAO::ROLES as $r) $counts[$r] = $dao->countByRole($r);

        echo json_encode([
            "authenticated" => true,
            "success"       => true,
            "staff"         => $dao->getAll($filters),
            "counts"        => $counts,
            "roles"         => StaffDAO::ROLES,
            "current_user"  => null
        ]);
        exit;
    }

    fail("Invalid action.");
}

if ($method === "POST") {
    $action = $_POST["action"] ?? "";

    if ($action === "create") {
        $errors = StaffAccount::validate($_POST, false);
        if (!empty($errors)) fail(implode(" ", $errors));

        $name  = trim($_POST["full_name"]);
        $email = trim($_POST["email"]);
        $role  = $_POST["role"];

        if ($dao->emailExists($email)) fail("That email is already in use.");

        $id = $dao->create($name, $email, password_hash($_POST["password"], PASSWORD_DEFAULT), $role);
        if (!$id) fail("Could not create the account. Please try again.");

        auditAs("create_account", "user", $id, "Created " . $role . " account '" . $name . "' (" . $email . ")");
        echo json_encode(["success" => true, "message" => $role . " account created."]);
        exit;
    }

    if ($action === "update") {
        $id = isset($_POST["user_id"]) ? (int) $_POST["user_id"] : 0;
        $existing = $id > 0 ? $dao->getById($id) : null;
        if (!$existing) fail("That account could not be found.");

        $errors = StaffAccount::validate($_POST, true);
        if (!empty($errors)) fail(implode(" ", $errors));

        $name  = trim($_POST["full_name"]);
        $email = trim($_POST["email"]);
        $role  = $_POST["role"];

        if ($dao->emailExists($email, $id)) fail("That email is already used by another account.");

        // Don't let the last Admin be demoted — it would lock everyone out.
        if ($existing["role"] === "Admin" && $role !== "Admin" && $dao->countByRole("Admin") <= 1) {
            fail("This is the only Admin account — change another account to Admin first.");
        }

        if (!$dao->update($id, $name, $email, $role)) fail("Could not save the account. Please try again.");

        $changes = [];
        if ($existing["full_name"] !== $name) $changes[] = "name";
        if ($existing["email"] !== $email)    $changes[] = "email";
        if ($existing["role"] !== $role)      $changes[] = "role -> " . $role;
        $summary = "Updated '" . $name . "'" . (count($changes) ? " (" . implode(", ", $changes) . ")" : "");

        auditAs("update_account", "user", $id, $summary);
        echo json_encode(["success" => true, "message" => "Account updated."]);
        exit;
    }

    if ($action === "reset_password") {
        $id = isset($_POST["user_id"]) ? (int) $_POST["user_id"] : 0;
        $existing = $id > 0 ? $dao->getById($id) : null;
        if (!$existing) fail("That account could not be found.");

        $errors = StaffAccount::validatePassword($_POST["password"] ?? "");
        if (!empty($errors)) fail(implode(" ", $errors));

        if (!$dao->resetPassword($id, password_hash($_POST["password"], PASSWORD_DEFAULT))) {
            fail("Could not reset the password. Please try again.");
        }

        auditAs("reset_password", "user", $id, "Reset password for '" . $existing["full_name"] . "'");
        echo json_encode(["success" => true, "message" => "Password reset."]);
        exit;
    }

    if ($action === "delete") {
        $id = isset($_POST["user_id"]) ? (int) $_POST["user_id"] : 0;
        $existing = $id > 0 ? $dao->getById($id) : null;
        if (!$existing) fail("That account could not be found.");

        // Guard: never delete the last Admin, or the console locks everyone out.
        if ($existing["role"] === "Admin" && $dao->countByRole("Admin") <= 1) {
            fail("This is the only Admin account and can't be deleted.");
        }

        if (!$dao->delete($id)) fail("Could not delete the account. Please try again.");

        auditAs("delete_account", "user", $id, "Deleted " . $existing["role"] . " account '" . $existing["full_name"] . "' (" . $existing["email"] . ")");
        echo json_encode(["success" => true, "message" => "Account deleted."]);
        exit;
    }

    fail("Invalid request.");
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
