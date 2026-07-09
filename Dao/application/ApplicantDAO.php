<?php

require_once "../../config/db.php";
require_once "../../Models/application/applicant_model.php";

class ApplicantDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Generates a reference number like "EMS-2026-483920" and guarantees it
    // doesn't collide with an existing row before handing it back.
    public function generateUniqueReferenceNumber() {
        do {
            $candidate = "EMS-" . date("Y") . "-" . str_pad((string) random_int(0, 999999), 6, "0", STR_PAD_LEFT);
            $exists = $this->referenceNumberExists($candidate);
        } while ($exists);

        return $candidate;
    }

    private function referenceNumberExists($referenceNumber) {
        $query = "SELECT 1 FROM applicants WHERE reference_number = :ref LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":ref", $referenceNumber);
        $stmt->execute();
        return (bool) $stmt->fetchColumn();
    }

    // INSERT APPLICANT
    public function insert(Applicant $a) {
        $query = "
        INSERT INTO applicants
        (
            reference_number, applicant_type, first_name, last_name, middle_name,
            gender, birthdate, address, contact_number, email, lrn,
            desired_grade_level, desired_strand_id, school_year,
            father_name, father_contact_number, mother_name, mother_contact_number,
            guardian_name, guardian_relationship, guardian_contact_number,
            emergency_contact_name, emergency_contact_relationship, emergency_contact_number,
            status
        )
        VALUES
        (
            :reference_number, :applicant_type, :first_name, :last_name, :middle_name,
            :gender, :birthdate, :address, :contact_number, :email, :lrn,
            :desired_grade_level, :desired_strand_id, :school_year,
            :father_name, :father_contact_number, :mother_name, :mother_contact_number,
            :guardian_name, :guardian_relationship, :guardian_contact_number,
            :emergency_contact_name, :emergency_contact_relationship, :emergency_contact_number,
            'Pending'
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":reference_number", $a->getReferenceNumber());
        $stmt->bindValue(":applicant_type", $a->getApplicantType());
        $stmt->bindValue(":first_name", $a->getFirstName());
        $stmt->bindValue(":last_name", $a->getLastName());
        $stmt->bindValue(":middle_name", $a->getMiddleName());
        $stmt->bindValue(":gender", $a->getGender());
        $stmt->bindValue(":birthdate", $a->getBirthdate());
        $stmt->bindValue(":address", $a->getAddress());
        $stmt->bindValue(":contact_number", $a->getContactNumber());
        $stmt->bindValue(":email", $a->getEmail());
        $stmt->bindValue(":lrn", $a->getLrn());
        $stmt->bindValue(":desired_grade_level", $a->getDesiredGradeLevel());
        $stmt->bindValue(":desired_strand_id", $a->getDesiredStrandId());
        $stmt->bindValue(":school_year", $a->getSchoolYear());
        $stmt->bindValue(":father_name", $a->getFatherName());
        $stmt->bindValue(":father_contact_number", $a->getFatherContactNumber());
        $stmt->bindValue(":mother_name", $a->getMotherName());
        $stmt->bindValue(":mother_contact_number", $a->getMotherContactNumber());
        $stmt->bindValue(":guardian_name", $a->getGuardianName());
        $stmt->bindValue(":guardian_relationship", $a->getGuardianRelationship());
        $stmt->bindValue(":guardian_contact_number", $a->getGuardianContactNumber());
        $stmt->bindValue(":emergency_contact_name", $a->getEmergencyContactName());
        $stmt->bindValue(":emergency_contact_relationship", $a->getEmergencyContactRelationship());
        $stmt->bindValue(":emergency_contact_number", $a->getEmergencyContactNumber());

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Used by the "Check Status" page: one applicant, matched on reference number + email
    // (both are required so a reference number alone can't be used to fish for someone else's data).
    public function findByReferenceAndEmail($referenceNumber, $email) {
        $query = "
        SELECT a.*, s.strand_code, s.strand_name
        FROM applicants a
        LEFT JOIN strands s ON s.strand_id = a.desired_strand_id
        WHERE a.reference_number = :ref AND a.email = :email
        LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":ref", $referenceNumber);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Deletes the applicant row. Used to roll back a submission if the
    // required document uploads that follow it fail.
    public function deleteById($applicantId) {
        $query = "DELETE FROM applicants WHERE applicant_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $applicantId);
        return $stmt->execute();
    }
}
?>
