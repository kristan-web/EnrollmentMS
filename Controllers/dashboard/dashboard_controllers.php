<?php
// Admin dashboard analytics data.
//   GET ?action=analytics -> totals + the three chart datasets

require_once __DIR__ . "/../../Dao/dashboard/DashboardDAO.php";

header("Content-Type: application/json");

$dao = new DashboardDAO();

$action = $_GET["action"] ?? "analytics";

if ($action === "analytics") {
    echo json_encode([
        "success"             => true,
        "totals"              => $dao->totals(),
        "applicants_status"   => $dao->applicantsByStatus(),
        "enrollments_strand"  => $dao->enrollmentsByStrand(),
        "students_grade"      => $dao->studentsByGrade()
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid action."]);
?>
