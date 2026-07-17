<?php
// Check if class already exists
if (!class_exists('Applicant')) {

    class Applicant {

        private $applicant_id;
        private $reference_number;
        private $applicant_type;
        private $first_name;
        private $last_name;
        private $middle_name;
        private $gender;
        private $birthdate;
        private $address;
        private $contact_number;
        private $email;
        private $lrn;
        private $desired_grade_level;
        private $desired_strand_id;
        private $school_year;
        private $status;
        private $submitted_at;
        private $reviewed_at;
        private $rejection_reason;
        private $reviewed_by;
        private $converted_student_id;

        // Parent info
        private $father_name;
        private $father_contact_number;
        private $mother_name;
        private $mother_contact_number;

        // Guardian info
        private $guardian_name;
        private $guardian_relationship;
        private $guardian_contact_number;

        // Emergency contact
        private $emergency_contact_name;
        private $emergency_contact_relationship;
        private $emergency_contact_number;

        // Constructor
        public function __construct(
            $applicant_type = null,
            $first_name = null,
            $last_name = null,
            $middle_name = null,
            $gender = null,
            $birthdate = null,
            $address = null,
            $contact_number = null,
            $email = null,
            $lrn = null,
            $desired_grade_level = null,
            $desired_strand_id = null,
            $school_year = null,
            $status = "Pending"
        ) {
            $this->applicant_type = $applicant_type;
            $this->first_name = $first_name;
            $this->last_name = $last_name;
            $this->middle_name = $middle_name;
            $this->gender = $gender;
            $this->birthdate = $birthdate;
            $this->address = $address;
            $this->contact_number = $contact_number;
            $this->email = $email;
            $this->lrn = $lrn;
            $this->desired_grade_level = $desired_grade_level;
            $this->desired_strand_id = $desired_strand_id;
            $this->school_year = $school_year;
            $this->status = $status;
        }

        // ===== Getters =====
        public function getApplicantId() { return $this->applicant_id; }
        public function getReferenceNumber() { return $this->reference_number; }
        public function getApplicantType() { return $this->applicant_type; }
        public function getFirstName() { return $this->first_name; }
        public function getLastName() { return $this->last_name; }
        public function getMiddleName() { return $this->middle_name; }
        public function getGender() { return $this->gender; }
        public function getBirthdate() { return $this->birthdate; }
        public function getAddress() { return $this->address; }
        public function getContactNumber() { return $this->contact_number; }
        public function getEmail() { return $this->email; }
        public function getLrn() { return $this->lrn; }
        public function getDesiredGradeLevel() { return $this->desired_grade_level; }
        public function getDesiredStrandId() { return $this->desired_strand_id; }
        public function getSchoolYear() { return $this->school_year; }
        public function getStatus() { return $this->status; }
        public function getSubmittedAt() { return $this->submitted_at; }
        public function getReviewedAt() { return $this->reviewed_at; }
        public function getRejectionReason() { return $this->rejection_reason; }
        public function getReviewedBy() { return $this->reviewed_by; }
        public function getConvertedStudentId() { return $this->converted_student_id; }
        public function getFatherName() { return $this->father_name; }
        public function getFatherContactNumber() { return $this->father_contact_number; }
        public function getMotherName() { return $this->mother_name; }
        public function getMotherContactNumber() { return $this->mother_contact_number; }
        public function getGuardianName() { return $this->guardian_name; }
        public function getGuardianRelationship() { return $this->guardian_relationship; }
        public function getGuardianContactNumber() { return $this->guardian_contact_number; }
        public function getEmergencyContactName() { return $this->emergency_contact_name; }
        public function getEmergencyContactRelationship() { return $this->emergency_contact_relationship; }
        public function getEmergencyContactNumber() { return $this->emergency_contact_number; }

        // ===== Setters =====
        public function setApplicantId($applicant_id) { $this->applicant_id = $applicant_id; }
        public function setReferenceNumber($reference_number) { $this->reference_number = $reference_number; }
        public function setApplicantType($applicant_type) { $this->applicant_type = $applicant_type; }
        public function setFirstName($first_name) { $this->first_name = $first_name; }
        public function setLastName($last_name) { $this->last_name = $last_name; }
        public function setMiddleName($middle_name) { $this->middle_name = $middle_name; }
        public function setGender($gender) { $this->gender = $gender; }
        public function setBirthdate($birthdate) { $this->birthdate = $birthdate; }
        public function setAddress($address) { $this->address = $address; }
        public function setContactNumber($contact_number) { $this->contact_number = $contact_number; }
        public function setEmail($email) { $this->email = $email; }
        public function setLrn($lrn) { $this->lrn = $lrn; }
        public function setDesiredGradeLevel($desired_grade_level) { $this->desired_grade_level = $desired_grade_level; }
        public function setDesiredStrandId($desired_strand_id) { $this->desired_strand_id = $desired_strand_id; }
        public function setSchoolYear($school_year) { $this->school_year = $school_year; }
        public function setStatus($status) { $this->status = $status; }
        public function setSubmittedAt($submitted_at) { $this->submitted_at = $submitted_at; }
        public function setReviewedAt($reviewed_at) { $this->reviewed_at = $reviewed_at; }
        public function setRejectionReason($rejection_reason) { $this->rejection_reason = $rejection_reason; }
        public function setReviewedBy($reviewed_by) { $this->reviewed_by = $reviewed_by; }
        public function setConvertedStudentId($converted_student_id) { $this->converted_student_id = $converted_student_id; }
        public function setFatherName($father_name) { $this->father_name = $father_name; }
        public function setFatherContactNumber($father_contact_number) { $this->father_contact_number = $father_contact_number; }
        public function setMotherName($mother_name) { $this->mother_name = $mother_name; }
        public function setMotherContactNumber($mother_contact_number) { $this->mother_contact_number = $mother_contact_number; }
        public function setGuardianName($guardian_name) { $this->guardian_name = $guardian_name; }
        public function setGuardianRelationship($guardian_relationship) { $this->guardian_relationship = $guardian_relationship; }
        public function setGuardianContactNumber($guardian_contact_number) { $this->guardian_contact_number = $guardian_contact_number; }
        public function setEmergencyContactName($emergency_contact_name) { $this->emergency_contact_name = $emergency_contact_name; }
        public function setEmergencyContactRelationship($emergency_contact_relationship) { $this->emergency_contact_relationship = $emergency_contact_relationship; }
        public function setEmergencyContactNumber($emergency_contact_number) { $this->emergency_contact_number = $emergency_contact_number; }

        // ===== Allowed values =====
        public static function allowedApplicantTypes() {
            return ["New Student", "Transferee", "Returning"];
        }

        public static function allowedGenders() {
            return ["Male", "Female", "Other"];
        }

        public static function allowedGradeLevels() {
            return ["11", "12"];
        }

        public static function allowedStatuses() {
            return ["Pending", "Approved", "Refused"];
        }

        // ===== Validation =====
        public static function validate($data) {
            $errors = [];

            $applicant_type = $data["applicant_type"] ?? "";
            $first_name = trim($data["first_name"] ?? "");
            $last_name = trim($data["last_name"] ?? "");
            $gender = $data["gender"] ?? "";
            $birthdate = trim($data["birthdate"] ?? "");
            $email = trim($data["email"] ?? "");
            $desired_grade_level = $data["desired_grade_level"] ?? "";
            $desired_strand_id = $data["desired_strand_id"] ?? "";
            $school_year = trim($data["school_year"] ?? "");
            $address = trim($data["address"] ?? "");
            $emergency_contact_name = trim($data["emergency_contact_name"] ?? "");
            $emergency_contact_relationship = trim($data["emergency_contact_relationship"] ?? "");
            $emergency_contact_number = trim($data["emergency_contact_number"] ?? "");

            if (!in_array($applicant_type, self::allowedApplicantTypes(), true)) {
                $errors[] = "Please select a valid applicant type.";
            }

            if ($first_name === "") {
                $errors[] = "First name is required.";
            }

            if ($last_name === "") {
                $errors[] = "Last name is required.";
            }

            if (!in_array($gender, self::allowedGenders(), true)) {
                $errors[] = "Please select a valid gender.";
            }

            if ($birthdate === "") {
                $errors[] = "Birthdate is required.";
            } elseif (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $birthdate)) {
                $errors[] = "Birthdate must be in the format YYYY-MM-DD.";
            }

            if ($email === "") {
                $errors[] = "Email is required.";
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Please provide a valid email address.";
            }

            if (!in_array($desired_grade_level, self::allowedGradeLevels(), true)) {
                $errors[] = "Please select a valid grade level.";
            }

            if (empty($desired_strand_id)) {
                $errors[] = "Please select a strand.";
            }

            if ($school_year === "") {
                $errors[] = "School year is required.";
            }

            if ($address === "") {
                $errors[] = "Address is required.";
            }

            if ($emergency_contact_name === "") {
                $errors[] = "Emergency contact name is required.";
            }

            if ($emergency_contact_relationship === "") {
                $errors[] = "Emergency contact relationship is required.";
            }

            if ($emergency_contact_number === "") {
                $errors[] = "Emergency contact number is required.";
            }

            return $errors;
        }
    }
}