<?php
// Read-only audit log for the admin console. Admin-only (see guard.php).
//
//   GET ?action=list[&action_filter=&keyword=&from=&to=] -> log entries + filters

require_once __DIR__ . "/../admin_console/guard.php";

header("Content-Type: application/json");

$dao    = new AuditDAO();
$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
    $action = $_GET["action"] ?? "list";

    if ($action === "list") {
        $filters = [
            "action"  => trim($_GET["action_filter"] ?? ""),
            "keyword" => trim($_GET["keyword"] ?? ""),
            "from"    => trim($_GET["from"] ?? ""),
            "to"      => trim($_GET["to"] ?? "")
        ];

        echo json_encode([
            "authenticated" => true,
            "success"       => true,
            "logs"          => $dao->getAll($filters),
            "actions"       => $dao->distinctActions()
        ]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid action."]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
