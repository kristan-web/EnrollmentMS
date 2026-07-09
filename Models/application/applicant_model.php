<?php

class Applicant {

    private $applicantId;
    private $referenceNumber;
    private $applicantType;      // 'New Student' | 'Transferee'
    private $firstName;
    private $lastName;
    private $middleName;
    private $gender;             // 'Male' | 'Female' | 'Other'
    private $birthdate;
    private $address;
    private $contactNumber;
    private $email;
    private $lrn;
    private $desiredGradeLevel;  // '11' | '12'
    private $desiredStrandId;
    private $schoolYear;
    private $fatherName;
    private $fatherContactNumber;
    private $motherName;
    private $motherContactNumber;
    private $guardianName;
    private $guardianRelationship;
    private $guardianContactNumber;
    private $emergencyContactName;
    private $emergencyContactRelationship;
    private $emergencyContactNumber;
    private $status; // Pending | Under Review | Approved | Rejected | Enrolled

    // ---- Getters ----
    public function getApplicantId() { return $this->applicantId; }
    public function getReferenceNumber() { return $this->referenceNumber; }
    public function getApplicantType() { return $this->applicantType; }
    public function getFirstName() { return $this->firstName; }
    public function getLastName() { return $this->lastName; }
    public function getMiddleName() { return $this->middleName; }
    public function getGender() { return $this->gender; }
    public function getBirthdate() { return $this->birthdate; }
    public function getAddress() { return $this->address; }
    public function getContactNumber() { return $this->contactNumber; }
    public function getEmail() { return $this->email; }
    public function getLrn() { return $this->lrn; }
    public function getDesiredGradeLevel() { return $this->desiredGradeLevel; }
    public function getDesiredStrandId() { return $this->desiredStrandId; }
    public function getSchoolYear() { return $this->schoolYear; }
    public function getFatherName() { return $this->fatherName; }
    public function getFatherContactNumber() { return $this->fatherContactNumber; }
    public function getMotherName() { return $this->motherName; }
    public function getMotherContactNumber() { return $this->motherContactNumber; }
    public function getGuardianName() { return $this->guardianName; }
    public function getGuardianRelationship() { return $this->guardianRelationship; }
    public function getGuardianContactNumber() { return $this->guardianContactNumber; }
    public function getEmergencyContactName() { return $this->emergencyContactName; }
    public function getEmergencyContactRelationship() { return $this->emergencyContactRelationship; }
    public function getEmergencyContactNumber() { return $this->emergencyContactNumber; }
    public function getStatus() { return $this->status; }

    // ---- Setters ----
    public function setApplicantId($v) { $this->applicantId = $v; }
    public function setReferenceNumber($v) { $this->referenceNumber = $v; }
    public function setApplicantType($v) { $this->applicantType = $v; }
    public function setFirstName($v) { $this->firstName = $v; }
    public function setLastName($v) { $this->lastName = $v; }
    public function setMiddleName($v) { $this->middleName = $v; }
    public function setGender($v) { $this->gender = $v; }
    public function setBirthdate($v) { $this->birthdate = $v; }
    public function setAddress($v) { $this->address = $v; }
    public function setContactNumber($v) { $this->contactNumber = $v; }
    public function setEmail($v) { $this->email = $v; }
    public function setLrn($v) { $this->lrn = $v; }
    public function setDesiredGradeLevel($v) { $this->desiredGradeLevel = $v; }
    public function setDesiredStrandId($v) { $this->desiredStrandId = $v; }
    public function setSchoolYear($v) { $this->schoolYear = $v; }
    public function setFatherName($v) { $this->fatherName = $v; }
    public function setFatherContactNumber($v) { $this->fatherContactNumber = $v; }
    public function setMotherName($v) { $this->motherName = $v; }
    public function setMotherContactNumber($v) { $this->motherContactNumber = $v; }
    public function setGuardianName($v) { $this->guardianName = $v; }
    public function setGuardianRelationship($v) { $this->guardianRelationship = $v; }
    public function setGuardianContactNumber($v) { $this->guardianContactNumber = $v; }
    public function setEmergencyContactName($v) { $this->emergencyContactName = $v; }
    public function setEmergencyContactRelationship($v) { $this->emergencyContactRelationship = $v; }
    public function setEmergencyContactNumber($v) { $this->emergencyContactNumber = $v; }
    public function setStatus($v) { $this->status = $v; }
}
?>
