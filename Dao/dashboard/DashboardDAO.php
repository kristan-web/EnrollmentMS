<?php
// Aggregate stats for the admin dashboard analytics. Read-only.

require_once __DIR__ . "/../../config/db.php";

class DashboardDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    private function scalar($sql) {
        $stmt = $this->conn->query($sql);
        return $stmt ? $stmt->fetchColumn() : 0;
    }

    // ---- Headline counts (stat tiles) ----
    public function totals() {
        return [
            "applicants"      => (int) $this->scalar("SELECT COUNT(*) FROM applicants"),
            "enrolled"        => (int) $this->scalar("SELECT COUNT(*) FROM enrollments WHERE status = 'Enrolled'"),
            "active_students" => (int) $this->scalar("SELECT COUNT(*) FROM students WHERE status = 'Active'"),
            "open_sections"   => (int) $this->scalar("SELECT COUNT(*) FROM class_sections WHERE status = 'Open'"),
            "collected"       => (float) $this->scalar("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'Paid'")
        ];
    }

    // ---- Applicants by admission status (fixed order = the funnel) ----
    public function applicantsByStatus() {
        $order = ["Pending", "Under Review", "Approved", "Rejected", "Enrolled"];
        $counts = array_fill_keys($order, 0);

        $stmt = $this->conn->query("SELECT status, COUNT(*) AS n FROM applicants GROUP BY status");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            if (isset($counts[$r["status"]])) $counts[$r["status"]] = (int) $r["n"];
        }

        $out = [];
        foreach ($order as $s) $out[] = ["label" => $s, "value" => $counts[$s]];
        return $out;
    }

    // ---- Enrolled/reserved seats by strand ----
    public function enrollmentsByStrand() {
        $sql = "
        SELECT st.strand_code AS label, COUNT(*) AS value
        FROM enrollments e
        JOIN class_sections cs ON cs.section_id = e.section_id
        JOIN strands st ON st.strand_id = cs.strand_id
        WHERE e.status IN ('Enrolled', 'Pending')
        GROUP BY st.strand_code
        ORDER BY value DESC, st.strand_code
        ";
        $rows = $this->conn->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        return array_map(function ($r) {
            return ["label" => $r["label"], "value" => (int) $r["value"]];
        }, $rows);
    }

    // ---- Active students by grade level ----
    public function studentsByGrade() {
        $counts = ["11" => 0, "12" => 0];
        $stmt = $this->conn->query("SELECT grade_level, COUNT(*) AS n FROM students WHERE status = 'Active' GROUP BY grade_level");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            if (isset($counts[$r["grade_level"]])) $counts[$r["grade_level"]] = (int) $r["n"];
        }
        return [
            ["label" => "Grade 11", "value" => $counts["11"]],
            ["label" => "Grade 12", "value" => $counts["12"]]
        ];
    }
}
?>
