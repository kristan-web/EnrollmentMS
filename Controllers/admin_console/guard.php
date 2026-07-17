<?php
// Shared helpers for the admin console's Staff Accounts + Audit Logs pages.
//
// These pages are reached from the admin dashboard and are open like the rest
// of the admin app (no separate sign-in) — there is no server session to
// identify the admin, so account-change audit entries are attributed to a
// generic "Admin" actor. Staff sign-ins on the registrar/cashier consoles are
// still logged with their real identity from their own sessions.

require_once __DIR__ . "/../../Dao/staff/StaffDAO.php";
require_once __DIR__ . "/../../Dao/audit/AuditDAO.php";

function clientIp() {
    return $_SERVER["REMOTE_ADDR"] ?? null;
}

// Write an audit entry for an admin-console action. No login = generic actor.
function auditAs($action, $entity = null, $entityId = null, $details = null) {
    (new AuditDAO())->record(null, "Admin", "Admin", $action, $entity, $entityId, $details, clientIp());
}
?>
