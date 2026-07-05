<?php

class Subject {

    private $subject_id;
    private $strand_id;
    private $subject_code;
    private $subject_name;
    private $subject_type;
    private $grade_level;
    private $semester;
    private $units;
    private $description;
    private $status;
    private $created_at;

    // Constructor
    public function __construct(
        $strand_id = null,
        $subject_code = null,
        $subject_name = null,
        $subject_type = 'Core',
        $grade_level = null,
        $semester = '1st Semester',
        $units = null,
        $description = null,
        $status = 'Active'
    ) {
        $this->strand_id = $strand_id;
        $this->subject_code = $subject_code;
        $this->subject_name = $subject_name;
        $this->subject_type = $subject_type;
        $this->grade_level = $grade_level;
        $this->semester = $semester;
        $this->units = $units;
        $this->description = $description;
        $this->status = $status;
    }

    // Getters
    public function getSubjectId() {
        return $this->subject_id;
    }

    public function getStrandId() {
        return $this->strand_id;
    }

    public function getSubjectCode() {
        return $this->subject_code;
    }

    public function getSubjectName() {
        return $this->subject_name;
    }

    public function getSubjectType() {
        return $this->subject_type;
    }

    public function getGradeLevel() {
        return $this->grade_level;
    }

    public function getSemester() {
        return $this->semester;
    }

    public function getUnits() {
        return $this->units;
    }

    public function getDescription() {
        return $this->description;
    }

    public function getStatus() {
        return $this->status;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    // Setters
    public function setSubjectId($subject_id) {
        $this->subject_id = $subject_id;
    }

    public function setStrandId($strand_id) {
        $this->strand_id = $strand_id;
    }

    public function setSubjectCode($subject_code) {
        $this->subject_code = $subject_code;
    }

    public function setSubjectName($subject_name) {
        $this->subject_name = $subject_name;
    }

    public function setSubjectType($subject_type) {
        $this->subject_type = $subject_type;
    }

    public function setGradeLevel($grade_level) {
        $this->grade_level = $grade_level;
    }

    public function setSemester($semester) {
        $this->semester = $semester;
    }

    public function setUnits($units) {
        $this->units = $units;
    }

    public function setDescription($description) {
        $this->description = $description;
    }

    public function setStatus($status) {
        $this->status = $status;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }

    // Allowed values
    public static function allowedTypes() {
        return ['Core', 'Applied', 'Specialized'];
    }

    public static function allowedGradeLevels() {
        return ['11', '12'];
    }

    public static function allowedSemesters() {
        return ['1st Semester', '2nd Semester'];
    }

    public static function allowedStatuses() {
        return ['Active', 'Inactive'];
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $subject_code = trim($data['subject_code'] ?? '');
        $subject_name = trim($data['subject_name'] ?? '');
        $subject_type = $data['subject_type'] ?? '';
        $grade_level = $data['grade_level'] ?? '';
        $semester = $data['semester'] ?? '';
        $units = $data['units'] ?? '';
        $status = $data['status'] ?? 'Active';

        if (empty($subject_code)) {
            $errors[] = "Subject code is required.";
        } elseif (strlen($subject_code) < 2 || strlen($subject_code) > 20) {
            $errors[] = "Subject code must be 2-20 characters.";
        } elseif (!preg_match('/^[A-Za-z0-9\-_]+$/', $subject_code)) {
            $errors[] = "Subject code may only contain letters, numbers, hyphens, and underscores.";
        }

        if (empty($subject_name)) {
            $errors[] = "Subject name is required.";
        } elseif (strlen($subject_name) > 150) {
            $errors[] = "Subject name must be 150 characters or fewer.";
        }

        if (!in_array($subject_type, self::allowedTypes(), true)) {
            $errors[] = "Subject type must be one of: " . implode(", ", self::allowedTypes()) . ".";
        }

        if (!in_array($grade_level, self::allowedGradeLevels(), true)) {
            $errors[] = "Please select a valid grade level.";
        }

        if (!in_array($semester, self::allowedSemesters(), true)) {
            $errors[] = "Semester must be one of: " . implode(", ", self::allowedSemesters()) . ".";
        }

        if (empty($units) || !is_numeric($units) || $units < 1 || $units > 10) {
            $errors[] = "Units must be a number between 1 and 10.";
        }

        if (!in_array($status, self::allowedStatuses(), true)) {
            $errors[] = "Status must be one of: " . implode(", ", self::allowedStatuses()) . ".";
        }

        return $errors;
    }
}