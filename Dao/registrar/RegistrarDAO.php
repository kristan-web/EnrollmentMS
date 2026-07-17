<?php

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../Models/registrar/admission_model.php";

// Data access for the registrar's admission review console.
//
// Reads the online submissions in `applicants`, records the registrar's
// decision, and (on approval) converts an applicant into a real `students` +
// `enrollments` pair. Same PDO style as the other DAOs.
//
// Slot accounting note: a section's occupancy counts enrollments that are
// 'Enrolled' OR 'Pending'. The registrar creates the enrollment as 'Pending'
// to reserve the seat while the student settles payment with the cashier, so
// a Pending row must hold a slot or two students could be given the last seat.
class RegistrarDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Look up a staff account by email (the registrar logs in with a `users`
    // row, same as the cashier console).
    //
    // Note on the applicant -> student conversion: it isn't wrapped in a
    // transaction because StudentDAO and EnrollmentDAO each open their own PDO
    // connection, so a transaction here wouldn't cover their writes. Instead
    // the controller links converted_student_id as soon as the student exists,
    // so a failure between the two inserts is self-healing: re-running the
    // assignment reuses that student and retries only the enrollment.
    public function findUserByEmail($email) {
        $query = "SELECT user_id, full_name, email, password_hash, role
                  FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ---- Review queue -------------------------------------------------

    // The queue. $filters: status, keyword, school_year.
    // doc_total / doc_verified / doc_rejected drive the "documents" column so
    // the registrar can see completeness without opening each row.
    public function listApplicants($filters = []) {
        $query = "
        SELECT
            a.applicant_id,
            a.reference_number,
            a.applicant_type,
            a.first_name,
            a.last_name,
            a.middle_name,
            a.email,
            a.contact_number,
            a.lrn,
            a.desired_grade_level,
            a.desired_strand_id,
            a.school_year,
            a.status,
            a.rejection_reason,
            a.submitted_at,
            a.reviewed_at,
            a.converted_student_id,
            st.strand_code,
            st.strand_name,
            u.full_name AS reviewer_name,
            (SELECT COUNT(*) FROM applicant_documents d
              WHERE d.applicant_id = a.applicant_id) AS doc_total,
            (SELECT COUNT(*) FROM applicant_documents d
              WHERE d.applicant_id = a.applicant_id AND d.status = 'Verified') AS doc_verified,
            (SELECT COUNT(*) FROM applicant_documents d
              WHERE d.applicant_id = a.applicant_id AND d.status = 'Rejected') AS doc_rejected,
            (SELECT COUNT(*) FROM document_types dt
              WHERE dt.is_active = 1 AND dt.is_required = 1
              AND dt.applicant_type IN (a.applicant_type, 'All')) AS doc_required
        FROM applicants a
        LEFT JOIN strands st ON st.strand_id = a.desired_strand_id
        LEFT JOIN users u ON u.user_id = a.reviewed_by
        WHERE 1 = 1
        ";

        $params = [];

        if (!empty($filters["status"])) {
            $query .= " AND a.status = :status ";
            $params[":status"] = $filters["status"];
        }
        if (!empty($filters["school_year"])) {
            $query .= " AND a.school_year = :school_year ";
            $params[":school_year"] = $filters["school_year"];
        }
        if (!empty($filters["keyword"])) {
            $query .= " AND (
                a.reference_number LIKE :keyword
                OR a.first_name LIKE :keyword
                OR a.last_name LIKE :keyword
                OR CONCAT(a.first_name, ' ', a.last_name) LIKE :keyword
                OR a.email LIKE :keyword
                OR a.lrn LIKE :keyword
            ) ";
            $params[":keyword"] = "%" . $filters["keyword"] . "%";
        }

        // Oldest submission first: the queue is worked front to back.
        $query .= " ORDER BY a.submitted_at ASC ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Tab counts across every status (so a filtered queue still shows totals).
    public function countsByStatus() {
        $query = "SELECT status, COUNT(*) AS total FROM applicants GROUP BY status";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $counts = [];
        foreach (AdmissionReview::allStatuses() as $status) {
            $counts[$status] = 0;
        }
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $counts[$row["status"]] = (int) $row["total"];
        }
        $counts["All"] = array_sum($counts);
        return $counts;
    }

    // Everything the detail panel shows for one applicant.
    public function getApplicantDetail($applicantId) {
        $query = "
        SELECT
            a.*,
            st.strand_code,
            st.strand_name,
            u.full_name AS reviewer_name,
            s.student_number,
            s.student_id
        FROM applicants a
        LEFT JOIN strands st ON st.strand_id = a.desired_strand_id
        LEFT JOIN users u ON u.user_id = a.reviewed_by
        LEFT JOIN students s ON s.student_id = a.converted_student_id
        WHERE a.applicant_id = :id
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $applicantId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Uploaded documents for one applicant, plus the checklist metadata.
    public function getDocuments($applicantId) {
        $query = "
        SELECT
            ad.document_id,
            ad.applicant_id,
            ad.document_type_id,
            ad.original_filename,
            ad.file_size,
            ad.mime_type,
            ad.status,
            ad.remarks,
            ad.uploaded_at,
            dt.name AS document_type_name,
            dt.is_required
        FROM applicant_documents ad
        JOIN document_types dt ON dt.document_type_id = ad.document_type_id
        WHERE ad.applicant_id = :applicant_id
        ORDER BY dt.sort_order
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_id", $applicantId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Required document types this applicant has not uploaded at all. Drives
    // the "missing requirements" list in the detail panel.
    public function getMissingRequiredDocuments($applicantId, $applicantType) {
        $query = "
        SELECT dt.document_type_id, dt.name
        FROM document_types dt
        WHERE dt.is_active = 1
          AND dt.is_required = 1
          AND dt.applicant_type IN (:applicant_type, 'All')
          AND dt.document_type_id NOT IN (
              SELECT ad.document_type_id FROM applicant_documents ad
              WHERE ad.applicant_id = :applicant_id
          )
        ORDER BY dt.sort_order
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_type", $applicantType);
        $stmt->bindValue(":applicant_id", $applicantId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // One document row, including file_path — used to stream the file back.
    // Uploads live outside the web root, so they can only be served by PHP.
    public function getDocumentById($documentId) {
        $query = "
        SELECT ad.*, dt.name AS document_type_name
        FROM applicant_documents ad
        JOIN document_types dt ON dt.document_type_id = ad.document_type_id
        WHERE ad.document_id = :id
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $documentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateDocumentStatus($documentId, $status, $remarks = null) {
        $query = "
        UPDATE applicant_documents
        SET status = :status, remarks = :remarks
        WHERE document_id = :id
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":status", $status);
        $stmt->bindValue(":remarks", $remarks);
        $stmt->bindValue(":id", $documentId);
        return $stmt->execute();
    }

    // ---- Decisions ----------------------------------------------------

    // Records approve / reject / request-corrections and stamps who decided it.
    public function updateStatus(AdmissionReview $review) {
        $query = "
        UPDATE applicants
        SET status = :status,
            rejection_reason = :rejection_reason,
            reviewed_by = :reviewed_by,
            reviewed_at = NOW()
        WHERE applicant_id = :id
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":status", $review->getStatus());
        $stmt->bindValue(":rejection_reason", $review->getRejectionReason());
        $stmt->bindValue(":reviewed_by", $review->getReviewerId());
        $stmt->bindValue(":id", $review->getApplicantId());
        return $stmt->execute();
    }

    // Assign / change the strand on the applicant row.
    public function updateDesiredStrand($applicantId, $strandId) {
        $query = "UPDATE applicants SET desired_strand_id = :strand_id WHERE applicant_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":strand_id", $strandId);
        $stmt->bindValue(":id", $applicantId);
        return $stmt->execute();
    }

    public function linkConvertedStudent($applicantId, $studentId) {
        $query = "UPDATE applicants SET converted_student_id = :student_id WHERE applicant_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":student_id", $studentId);
        $stmt->bindValue(":id", $applicantId);
        return $stmt->execute();
    }

    // ---- Lookups ------------------------------------------------------

    public function getStrands() {
        $query = "
        SELECT s.strand_id, s.strand_code, s.strand_name, t.track_name
        FROM strands s
        JOIN tracks t ON t.track_id = s.track_id
        ORDER BY t.track_name, s.strand_name
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSchoolYearByYear($year) {
        $query = "SELECT school_year_id, year, status FROM school_years WHERE year = :year LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":year", $year);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getActiveSchoolYear() {
        $query = "SELECT school_year_id, year FROM school_years WHERE status = 'active' LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Open sections for a strand + grade + school year, with live occupancy.
    public function getOpenSections($strandId, $gradeLevel, $schoolYear) {
        $query = "
        SELECT
            cs.section_id,
            cs.section_name,
            cs.max_slots,
            cs.school_year,
            CONCAT(t.first_name, ' ', t.last_name) AS adviser_name,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.section_id = cs.section_id
                AND e.status IN ('Enrolled', 'Pending')
            ) AS occupied_count
        FROM class_sections cs
        LEFT JOIN teachers t ON t.teacher_id = cs.adviser_id
        WHERE cs.strand_id = :strand_id
          AND cs.grade_level = :grade_level
          AND cs.school_year = :school_year
          AND cs.status = 'Open'
        ORDER BY cs.section_name
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":strand_id", $strandId);
        $stmt->bindValue(":grade_level", $gradeLevel);
        $stmt->bindValue(":school_year", $schoolYear);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Capacity for one section. Pending rows count — see the note at the top.
    public function getSectionCapacity($sectionId) {
        $query = "
        SELECT
            cs.section_id,
            cs.section_name,
            cs.max_slots,
            cs.status,
            cs.school_year,
            cs.grade_level,
            cs.strand_id,
            (
                SELECT COUNT(*) FROM enrollments e
                WHERE e.section_id = cs.section_id
                AND e.status IN ('Enrolled', 'Pending')
            ) AS occupied_count
        FROM class_sections cs
        WHERE cs.section_id = :id
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $sectionId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ---- Applicant -> student conversion -------------------------------

    // Student numbers look like "2026-0001": the school year's opening year
    // plus a zero-padded sequence. Derived from the highest existing number
    // with the same prefix so it survives gaps and manual inserts.
    public function generateStudentNumber($schoolYear) {
        $prefix = substr((string) $schoolYear, 0, 4);
        if (!preg_match("/^[0-9]{4}$/", $prefix)) {
            $prefix = date("Y");
        }

        $query = "
        SELECT student_number FROM students
        WHERE student_number LIKE :prefix
        ORDER BY student_number DESC
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":prefix", $prefix . "-%");
        $stmt->execute();
        $last = $stmt->fetchColumn();

        $next = 1;
        if ($last && preg_match("/-(\d+)$/", $last, $m)) {
            $next = (int) $m[1] + 1;
        }
        return $prefix . "-" . str_pad((string) $next, 4, "0", STR_PAD_LEFT);
    }

    // students.lrn and students.email are both UNIQUE — check before inserting
    // so the registrar gets a readable message instead of a PDO exception.
    public function findStudentByLrn($lrn) {
        $query = "SELECT student_id, student_number, first_name, last_name FROM students WHERE lrn = :lrn LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":lrn", $lrn);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findStudentByEmail($email) {
        $query = "SELECT student_id, student_number, first_name, last_name FROM students WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ---- Enrollment ----------------------------------------------------

    public function findEnrollment($studentId, $schoolYearId, $semester) {
        $query = "
        SELECT * FROM enrollments
        WHERE student_id = :student_id
          AND school_year_id = :school_year_id
          AND semester = :semester
          AND status IN ('Enrolled', 'Pending')
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":student_id", $studentId);
        $stmt->bindValue(":school_year_id", $schoolYearId);
        $stmt->bindValue(":semester", $semester);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // The applicant's enrollment (via converted_student_id) plus what has been
    // paid on it. `paid` gates the Finalize step.
    public function getEnrollmentForApplicant($applicantId) {
        $query = "
        SELECT
            e.enrollment_id,
            e.student_id,
            e.section_id,
            e.school_year,
            e.school_year_id,
            e.semester,
            e.status,
            e.date_enrolled,
            cs.section_name,
            cs.grade_level,
            st.strand_code,
            st.strand_name,
            s.student_number,
            COALESCE((
                SELECT SUM(p.amount) FROM payments p
                WHERE p.enrollment_id = e.enrollment_id
                AND p.payment_status = 'Paid'
            ), 0) AS paid
        FROM applicants a
        JOIN enrollments e ON e.student_id = a.converted_student_id
        JOIN students s ON s.student_id = e.student_id
        LEFT JOIN class_sections cs ON cs.section_id = e.section_id
        LEFT JOIN strands st ON st.strand_id = cs.strand_id
        WHERE a.applicant_id = :applicant_id
          AND e.school_year = a.school_year
          AND e.status IN ('Enrolled', 'Pending')
        ORDER BY e.enrollment_id DESC
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_id", $applicantId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Full detail for one enrollment, used to print the temporary report card
    // for a walk-in the registrar just enrolled.
    public function getEnrollmentDetail($enrollmentId) {
        $query = "
        SELECT
            e.enrollment_id, e.school_year, e.semester, e.status, e.date_enrolled,
            s.student_id, s.student_number, s.lrn,
            s.first_name, s.middle_name, s.last_name, s.gender, s.birthdate,
            s.address, s.contact_number, s.email, s.grade_level,
            cs.section_name, cs.grade_level AS section_grade,
            st.strand_code, st.strand_name,
            t.track_name,
            CONCAT(te.first_name, ' ', te.last_name) AS adviser_name
        FROM enrollments e
        JOIN students s ON s.student_id = e.student_id
        LEFT JOIN class_sections cs ON cs.section_id = e.section_id
        LEFT JOIN strands st ON st.strand_id = cs.strand_id
        LEFT JOIN tracks t ON t.track_id = st.track_id
        LEFT JOIN teachers te ON te.teacher_id = cs.adviser_id
        WHERE e.enrollment_id = :id
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function finalizeEnrollment($enrollmentId) {
        $query = "
        UPDATE enrollments
        SET status = 'Enrolled', date_enrolled = NOW()
        WHERE enrollment_id = :id
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $enrollmentId);
        return $stmt->execute();
    }

    // ---- Reports -------------------------------------------------------

    // Admission funnel for one school year: how many applications sit at each
    // status, split by strand.
    public function getAdmissionReport($schoolYear) {
        $query = "
        SELECT
            COALESCE(st.strand_code, 'Unassigned') AS strand_code,
            a.desired_grade_level AS grade_level,
            SUM(a.status = 'Pending')      AS pending,
            SUM(a.status = 'Under Review') AS under_review,
            SUM(a.status = 'Approved')     AS approved,
            SUM(a.status = 'Rejected')     AS rejected,
            SUM(a.status = 'Enrolled')     AS enrolled,
            COUNT(*) AS total
        FROM applicants a
        LEFT JOIN strands st ON st.strand_id = a.desired_strand_id
        WHERE a.school_year = :school_year
        GROUP BY strand_code, a.desired_grade_level
        ORDER BY strand_code, a.desired_grade_level
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":school_year", $schoolYear);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Section fill report for one school year: seats taken vs capacity,
    // and how many of those seats are still awaiting payment.
    public function getSectionFillReport($schoolYear) {
        $query = "
        SELECT
            cs.section_id,
            cs.section_name,
            cs.grade_level,
            cs.max_slots,
            cs.status,
            st.strand_code,
            CONCAT(t.first_name, ' ', t.last_name) AS adviser_name,
            (SELECT COUNT(*) FROM enrollments e
              WHERE e.section_id = cs.section_id AND e.status = 'Enrolled') AS enrolled_count,
            (SELECT COUNT(*) FROM enrollments e
              WHERE e.section_id = cs.section_id AND e.status = 'Pending') AS pending_count
        FROM class_sections cs
        JOIN strands st ON st.strand_id = cs.strand_id
        LEFT JOIN teachers t ON t.teacher_id = cs.adviser_id
        WHERE cs.school_year = :school_year
          AND cs.status <> 'Cancelled'
        ORDER BY st.strand_code, cs.grade_level, cs.section_name
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":school_year", $schoolYear);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSchoolYears() {
        $query = "SELECT school_year_id, year, status FROM school_years ORDER BY year DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
