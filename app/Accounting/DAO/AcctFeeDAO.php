<?php
/* Data access for the fee schedule.
   Reads `acct_fees` (created by database/01_accounting_tables.sql, filled by
   database/02_fee_schedule.sql) so the amounts can be edited in the database
   instead of in the code.

   FeeSchedule in ../Model/payment_model.php is the only caller. It falls back
   to its built-in list when this returns nothing, so an install that never
   imported the accounting SQL keeps working exactly as before. */

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/config/db.php";

class AcctFeeDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /* The active fees for one term, in display order.
       Returns [] when the table is missing, empty, or unreachable — never
       throws, because every screen that prices an enrollment calls this and a
       hard failure would take them all down. */
    public function getFees($schoolYear, $semester) {
        if (!$this->conn) {
            return array();
        }

        $query = "
            SELECT code, name, note, amount, is_required
            FROM acct_fees
            WHERE is_active = 1
              AND school_year = :school_year
              AND semester = :semester
            ORDER BY sort_order, fee_id
        ";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":school_year", $schoolYear);
            $stmt->bindValue(":semester", $semester);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Most likely the acct_ tables were never imported.
            return array();
        }

        // Shape the rows the way FeeSchedule::items() has always returned them,
        // so nothing downstream has to change.
        $fees = array();
        foreach ($rows as $row) {
            $fees[] = array(
                "code"     => $row["code"],
                "name"     => $row["name"],
                "note"     => $row["note"],
                "amount"   => (float) $row["amount"],
                "required" => (bool) $row["is_required"],
            );
        }
        return $fees;
    }

    /* The school year marked active, e.g. "2026-2027". Used when a caller
       prices something without naming a term. Null when unavailable. */
    public function getActiveSchoolYear() {
        if (!$this->conn) {
            return null;
        }

        try {
            $stmt = $this->conn->prepare("SELECT year FROM school_years WHERE status = 'active' LIMIT 1");
            $stmt->execute();
            $year = $stmt->fetchColumn();
        } catch (PDOException $e) {
            return null;
        }

        return $year ? $year : null;
    }
}
?>
