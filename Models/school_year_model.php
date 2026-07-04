<?php

class SchoolYear {

    private $school_year_id;
    private $year;
    private $status;
    private $created_at;
    private $updated_at;

    // Constructor
    public function __construct(
        $year = null,
        $status = 'closed'
    ) {
        $this->year = $year;
        $this->status = $status;
    }

    // Getters
    public function getSchoolYearId() {
        return $this->school_year_id;
    }

    public function getYear() {
        return $this->year;
    }

    public function getStatus() {
        return $this->status;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function getUpdatedAt() {
        return $this->updated_at;
    }

    // Setters
    public function setSchoolYearId($school_year_id) {
        $this->school_year_id = $school_year_id;
    }

    public function setYear($year) {
        $this->year = $year;
    }

    public function setStatus($status) {
        $this->status = $status;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }

    public function setUpdatedAt($updated_at) {
        $this->updated_at = $updated_at;
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $year = trim($data['year'] ?? '');

        if (empty($year)) {
            $errors[] = "School year is required.";
        } else {
            // Validate format YYYY-YYYY
            if (!preg_match('/^\d{4}-\d{4}$/', $year)) {
                $errors[] = "School year must be in the format YYYY-YYYY.";
            } else {
                // Validate consecutive years
                $parts = explode('-', $year);
                $start = intval($parts[0]);
                $end = intval($parts[1]);
                if ($end !== $start + 1) {
                    $errors[] = "School year must span two consecutive years (e.g., 2026-2027).";
                }
            }
        }

        return $errors;
    }

    // Helper: Get active status options
    public static function allowedStatuses() {
        return ['active', 'closed'];
    }

    // Helper: Check if status is valid
    public static function isValidStatus($status) {
        return in_array($status, self::allowedStatuses(), true);
    }
}