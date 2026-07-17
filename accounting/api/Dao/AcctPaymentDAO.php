<?php
/* Data access for the online payment attempts in `acct_payments`.
   Created by accounting/sql/schema/01_accounting_tables.sql.

   This is the accounting module's own record of what students tried to pay
   through PayMongo. It is deliberately separate from the `payments` table the
   cashier writes: that one requires an enrollment_id, and the online flow only
   collects a typed student number, so it can't fill that column in.

   The row is written when the checkout link is created ('pending') and settled
   when PayMongo confirms ('paid') or the student walks away. Like AcctFeeDAO,
   nothing here throws: a student must still be able to reach the payment page
   if the accounting SQL was never imported. */

require_once __DIR__ . "/../../../config/db.php";

class AcctPaymentDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /* Record a checkout attempt. Returns the new id, or false if it couldn't
       be written — the caller carries on either way, because failing to log an
       attempt must not stop the student from paying. */
    public function insertPending(Payment $payment, $sessionId) {
        if (!$this->conn) {
            return false;
        }

        $query = "
            INSERT INTO acct_payments
                (reference, student_number, student_name, email, school_year, semester,
                 plan, method, amount, status, checkout_session_id)
            VALUES
                (:reference, :student_number, :student_name, :email, :school_year, :semester,
                 :plan, :method, :amount, 'pending', :session)
        ";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":reference", $payment->getReference());
            $stmt->bindValue(":student_number", $payment->getStudentNumber());
            $stmt->bindValue(":student_name", $payment->getStudentName());
            $stmt->bindValue(":email", $payment->getEmail());
            $stmt->bindValue(":school_year", $payment->getSchoolYear());
            $stmt->bindValue(":semester", $payment->getSemester());
            $stmt->bindValue(":plan", $payment->getPlan());
            // method is nullable: the student may not have picked one yet.
            $method = $payment->getMethod();
            $stmt->bindValue(":method", $method !== "" ? $method : null);
            $stmt->bindValue(":amount", $payment->getAmount());
            $stmt->bindValue(":session", $sessionId);
            $stmt->execute();
            return $this->conn->lastInsertId();
        } catch (PDOException $e) {
            return false;
        }
    }

    /* Settle an attempt by its PayMongo session id. $status must be one of the
       acct_payments.status enum values. paid_at is stamped only for 'paid'.
       Already-paid rows are left alone so a re-check can't rewrite history. */
    public function markStatus($sessionId, $status) {
        if (!$this->conn || $sessionId === "") {
            return false;
        }

        $query = "
            UPDATE acct_payments
            SET status = :status,
                paid_at = CASE WHEN :status2 = 'paid' THEN NOW() ELSE paid_at END
            WHERE checkout_session_id = :session
              AND status <> 'paid'
        ";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":status", $status);
            $stmt->bindValue(":status2", $status);
            $stmt->bindValue(":session", $sessionId);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    public function findBySession($sessionId) {
        if (!$this->conn) {
            return false;
        }

        try {
            $stmt = $this->conn->prepare("SELECT * FROM acct_payments WHERE checkout_session_id = :session LIMIT 1");
            $stmt->bindValue(":session", $sessionId);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }
}
?>
