<?php

require_once __DIR__."/../../../config/db.php";
require_once __DIR__."/../Model/applicant_documents_model.php";

class ApplicantDocumentDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // INSERT DOCUMENT
    public function insert(ApplicantDocument $doc) {
        $query = "
        INSERT INTO applicant_documents
        (
            applicant_id, document_type_id, file_path, original_filename,
            file_size, mime_type, status
        )
        VALUES
        (
            :applicant_id, :document_type_id, :file_path, :original_filename,
            :file_size, :mime_type, 'Pending'
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_id", $doc->getApplicantId());
        $stmt->bindValue(":document_type_id", $doc->getDocumentTypeId());
        $stmt->bindValue(":file_path", $doc->getFilePath());
        $stmt->bindValue(":original_filename", $doc->getOriginalFilename());
        $stmt->bindValue(":file_size", $doc->getFileSize());
        $stmt->bindValue(":mime_type", $doc->getMimeType());

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // FIND EXISTING UPLOAD FOR ONE APPLICANT + ONE DOCUMENT TYPE
    // (used to replace a re-upload instead of creating duplicate rows)
    public function findByApplicantAndType($applicantId, $documentTypeId) {
        $query = "
        SELECT * FROM applicant_documents
        WHERE applicant_id = :applicant_id AND document_type_id = :document_type_id
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_id", $applicantId);
        $stmt->bindValue(":document_type_id", $documentTypeId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // DELETE ONE DOCUMENT ROW (used right before a re-upload replaces it)
    public function deleteById($documentId) {
        $query = "DELETE FROM applicant_documents WHERE document_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $documentId);
        return $stmt->execute();
    }

    // GET ALL DOCUMENTS FOR ONE APPLICANT (joined with type name, for status page + admin review)
    public function getAllByApplicant($applicantId) {
        $query = "
        SELECT
            ad.*,
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

    // UPDATE STATUS (admin verify / reject a single document)
    public function updateStatus($documentId, $status, $remarks = null) {
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
}
?>
