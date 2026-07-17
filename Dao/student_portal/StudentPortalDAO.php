<?php

require_once __DIR__ . '/../../config/db.php';

// Read/aggregation queries for the logged-in student's dashboard.
// Everything is scoped by the account's email (which the apply form locks to
// the account) or account id, so a student only ever sees their own records.
class StudentPortalDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Applications the student has submitted, newest first.
    public function getApplicationsByEmail($email) {
        $query = "
            SELECT a.*, s.strand_code, s.strand_name
            FROM applicants a
            LEFT JOIN strands s ON s.strand_id = a.desired_strand_id
            WHERE a.email = :email
            ORDER BY a.submitted_at DESC
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDocumentsByApplicant($applicantId) {
        $query = "
            SELECT d.document_id, d.document_type_id, d.original_filename,
                   d.status, d.remarks, d.uploaded_at, t.name AS document_type_name
            FROM applicant_documents d
            LEFT JOIN document_types t ON t.document_type_id = d.document_type_id
            WHERE d.applicant_id = :id
            ORDER BY t.sort_order ASC
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $applicantId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentById($studentId) {
        $query = "SELECT * FROM students WHERE student_id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $studentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // The student's enrollment plus the section they were assigned to.
    public function getEnrollmentByStudent($studentId) {
        $query = "
            SELECT e.*, cs.section_name, cs.grade_level AS section_grade,
                   cs.status AS section_status, st.strand_code, st.strand_name,
                   CONCAT(t.first_name, ' ', t.last_name) AS adviser_name
            FROM enrollments e
            JOIN class_sections cs ON cs.section_id = e.section_id
            LEFT JOIN strands st ON st.strand_id = cs.strand_id
            LEFT JOIN teachers t ON t.teacher_id = cs.adviser_id
            WHERE e.student_id = :id
            ORDER BY (e.status = 'Enrolled') DESC, e.date_enrolled DESC
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $studentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Official payments recorded by the registrar/accounting for an enrollment.
    public function getPaymentsByEnrollment($enrollmentId) {
        $query = "SELECT * FROM payments WHERE enrollment_id = :id ORDER BY payment_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Proof-of-payment files the student uploaded from the dashboard.
    public function getProofsByAccount($accountId) {
        $query = "SELECT proof_id, reference_number, amount, method, payment_reference,
                         original_filename, status, remarks, uploaded_at
                  FROM payment_proofs WHERE account_id = :id ORDER BY uploaded_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $accountId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function insertProof($accountId, $data) {
        $query = "
            INSERT INTO payment_proofs
                (account_id, reference_number, amount, method, payment_reference,
                 file_path, original_filename, file_size, mime_type)
            VALUES
                (:account_id, :reference_number, :amount, :method, :payment_reference,
                 :file_path, :original_filename, :file_size, :mime_type)
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":account_id", $accountId);
        $stmt->bindValue(":reference_number", $data['reference_number']);
        $stmt->bindValue(":amount", $data['amount']);
        $stmt->bindValue(":method", $data['method']);
        $stmt->bindValue(":payment_reference", $data['payment_reference']);
        $stmt->bindValue(":file_path", $data['file_path']);
        $stmt->bindValue(":original_filename", $data['original_filename']);
        $stmt->bindValue(":file_size", $data['file_size']);
        $stmt->bindValue(":mime_type", $data['mime_type']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
}
?>
