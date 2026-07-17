<?php

require_once __DIR__ . '/../../config/db.php';

// Data access for the accounting/cashier console. Reads enrolled students and
// their official `payments`, records new payments, and reviews the
// `payment_proofs` students upload from the portal. Same PDO style as
// StudentPortalDAO — the cashier only ever touches the real enrollment tables.
class CashierDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Look up a staff account by email (the cashier logs in with a `users` row).
    public function findUserByEmail($email) {
        $query = "SELECT user_id, full_name, email, password_hash, role
                  FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Enrolled students plus how much they have paid so far. The controller
    // subtracts this from the assessment to decide who is still "awaiting
    // payment". Optional free-text search over name / student number.
    //
    // 'Pending' rows are included: that's a seat the registrar reserved for an
    // approved applicant, and payment is exactly what the student has to settle
    // here before the registrar can finalize it.
    public function listAwaiting($q = '') {
        $query = "
            SELECT e.enrollment_id, e.school_year, e.semester,
                   s.student_id, s.student_number, s.first_name, s.last_name, s.email,
                   cs.section_name,
                   COALESCE(SUM(CASE WHEN p.payment_status = 'Paid' THEN p.amount ELSE 0 END), 0) AS paid
            FROM enrollments e
            JOIN students s ON s.student_id = e.student_id
            LEFT JOIN class_sections cs ON cs.section_id = e.section_id
            LEFT JOIN payments p ON p.enrollment_id = e.enrollment_id
            WHERE e.status IN ('Enrolled', 'Pending')
        ";
        if ($q !== '') {
            $query .= " AND CONCAT_WS(' ', s.first_name, s.last_name, s.student_number) LIKE :like ";
        }
        $query .= " GROUP BY e.enrollment_id ORDER BY s.last_name ASC, s.first_name ASC";

        $stmt = $this->conn->prepare($query);
        if ($q !== '') {
            $stmt->bindValue(":like", "%" . $q . "%");
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Full detail for one enrollment: student, section, adviser, strand.
    public function getEnrollmentDetail($enrollmentId) {
        $query = "
            SELECT e.enrollment_id, e.section_id, e.school_year, e.semester,
                   e.status AS enrollment_status, e.date_enrolled,
                   s.student_id, s.student_number, s.lrn,
                   s.first_name, s.last_name, s.middle_name, s.email,
                   s.grade_level, s.status AS student_status,
                   cs.section_name, cs.grade_level AS section_grade,
                   st.strand_code, st.strand_name,
                   CONCAT(t.first_name, ' ', t.last_name) AS adviser_name
            FROM enrollments e
            JOIN students s ON s.student_id = e.student_id
            LEFT JOIN class_sections cs ON cs.section_id = e.section_id
            LEFT JOIN strands st ON st.strand_id = cs.strand_id
            LEFT JOIN teachers t ON t.teacher_id = cs.adviser_id
            WHERE e.enrollment_id = :id
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Official payments recorded against an enrollment, newest first.
    public function getPaymentsByEnrollment($enrollmentId) {
        $query = "SELECT payment_id, amount, payment_method, paymongo_reference_id,
                         payment_status, payment_date
                  FROM payments
                  WHERE enrollment_id = :id
                  ORDER BY payment_date DESC, payment_id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // How much has cleared for an enrollment (sum of Paid rows), in pesos.
    public function sumPaid($enrollmentId) {
        $query = "SELECT COALESCE(SUM(amount), 0) AS paid
                  FROM payments
                  WHERE enrollment_id = :id AND payment_status = 'Paid'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (float) ($row['paid'] ?? 0);
    }

    // Record a payment taken at the cashier. Cash payments clear immediately, so
    // the row is stored as 'Paid'. Returns the new payment_id or false.
    public function insertPayment($enrollmentId, $amount, $method) {
        $query = "INSERT INTO payments
                    (enrollment_id, amount, payment_method, payment_status, payment_date)
                  VALUES
                    (:enrollment_id, :amount, :method, 'Paid', NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":enrollment_id", $enrollmentId);
        $stmt->bindValue(":amount", $amount);
        $stmt->bindValue(":method", $method);
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // A single payment joined to the student, used to draw the receipt.
    public function getPaymentById($paymentId) {
        $query = "
            SELECT p.payment_id, p.enrollment_id, p.amount, p.payment_method,
                   p.payment_status, p.payment_date,
                   s.first_name, s.last_name, s.student_number, s.email,
                   e.school_year, e.semester
            FROM payments p
            JOIN enrollments e ON e.enrollment_id = p.enrollment_id
            JOIN students s ON s.student_id = e.student_id
            WHERE p.payment_id = :id
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $paymentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Proof-of-payment files a student uploaded, matched to the student by the
    // email on their portal account. Lets the cashier verify manual uploads.
    public function getProofsForEmail($email) {
        $query = "
            SELECT pp.proof_id, pp.reference_number, pp.amount, pp.method,
                   pp.payment_reference, pp.original_filename, pp.status,
                   pp.remarks, pp.uploaded_at
            FROM payment_proofs pp
            JOIN student_accounts sa ON sa.account_id = pp.account_id
            WHERE sa.email = :email
            ORDER BY pp.uploaded_at DESC
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Cashier decision on an uploaded proof: Verified or Rejected (+ remarks).
    public function updateProofStatus($proofId, $status, $remarks) {
        $query = "UPDATE payment_proofs
                  SET status = :status, remarks = :remarks
                  WHERE proof_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":status", $status);
        $stmt->bindValue(":remarks", $remarks);
        $stmt->bindValue(":id", $proofId);
        return $stmt->execute();
    }
}
?>
