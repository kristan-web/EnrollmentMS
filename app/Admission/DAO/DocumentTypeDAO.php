<?php

require_once __DIR__."/../../../config/db.php";

class DocumentTypeDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET ACTIVE CHECKLIST FOR AN APPLICANT TYPE (drives the upload form + backend validation)
    public function getActiveForApplicantType($applicantType) {
        $query = "
        SELECT * FROM document_types
        WHERE is_active = 1
          AND (applicant_type = :applicant_type OR applicant_type = 'All')
        ORDER BY sort_order
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":applicant_type", $applicantType);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ONE DOCUMENT TYPE BY ID (used to validate an upload request)
    public function getById($id) {
        $query = "SELECT * FROM document_types WHERE document_type_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
