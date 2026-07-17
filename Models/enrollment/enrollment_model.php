<?php

class Enrollment {

    private $enrollment_id;
    private $student_id;
    private $section_id;
    private $school_year_id;  // Changed from school_year to school_year_id
    private $school_year;     // Keep this for display (denormalized)
    private $semester;
    private $date_enrolled;
    private $status;

    // Constructor
    public function __construct(
        $student_id = null,
        $section_id = null,
        $school_year_id = null,
        $school_year = null,
        $semester = null,
        $status = "Enrolled"
    ){
        $this->student_id = $student_id;
        $this->section_id = $section_id;
        $this->school_year_id = $school_year_id;
        $this->school_year = $school_year;
        $this->semester = $semester;
        $this->status = $status;
    }

    // Getters
    public function getEnrollmentId(){
        return $this->enrollment_id;
    }

    public function getStudentId(){
        return $this->student_id;
    }

    public function getSectionId(){
        return $this->section_id;
    }

    public function getSchoolYearId(){
        return $this->school_year_id;
    }

    public function getSchoolYear(){
        return $this->school_year;
    }

    public function getSemester(){
        return $this->semester;
    }

    public function getDateEnrolled(){
        return $this->date_enrolled;
    }

    public function getStatus(){
        return $this->status;
    }

    // Setters
    public function setEnrollmentId($enrollment_id){
        $this->enrollment_id = $enrollment_id;
    }

    public function setStudentId($student_id){
        $this->student_id = $student_id;
    }

    public function setSectionId($section_id){
        $this->section_id = $section_id;
    }

    public function setSchoolYearId($school_year_id){
        $this->school_year_id = $school_year_id;
    }

    public function setSchoolYear($school_year){
        $this->school_year = $school_year;
    }

    public function setSemester($semester){
        $this->semester = $semester;
    }

    public function setDateEnrolled($date_enrolled){
        $this->date_enrolled = $date_enrolled;
    }

    public function setStatus($status){
        $this->status = $status;
    }

    // List of allowed values
    public static function allowedSemesters(){
        return ["1st Semester", "2nd Semester"];
    }

    public static function allowedStatuses(){
        return ["Enrolled", "Dropped", "Pending"];
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $student_id = $data["student_id"] ?? "";
        $section_id = $data["section_id"] ?? "";
        $school_year_id = $data["school_year_id"] ?? "";
        $semester = $data["semester"] ?? "";

        if ($student_id === "" || $student_id === null) {
            $errors[] = "Please select a student.";
        }

        if ($section_id === "" || $section_id === null) {
            $errors[] = "Please select a section.";
        }

        if ($school_year_id === "" || $school_year_id === null) {
            $errors[] = "Please select a school year.";
        }

        if (!in_array($semester, self::allowedSemesters(), true)) {
            $errors[] = "Semester must be one of: " . implode(", ", self::allowedSemesters()) . ".";
        }

        return $errors;
    }
}