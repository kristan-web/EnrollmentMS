<?php

class Section {

    private $section_id;
    private $strand_id;
    private $adviser_id;
    private $grade_level;
    private $section_name;
    private $school_year;
    private $max_slots;
    private $status;
    private $created_at;

    // Constructor
    public function __construct(
        $strand_id = null,
        $adviser_id = null,
        $grade_level = null,
        $section_name = null,
        $school_year = null,
        $max_slots = null,
        $status = "Open"
    ){
        $this->strand_id = $strand_id;
        $this->adviser_id = $adviser_id;
        $this->grade_level = $grade_level;
        $this->section_name = $section_name;
        $this->school_year = $school_year;
        $this->max_slots = $max_slots;
        $this->status = $status;
    }

    // Getters
    public function getSectionId(){
        return $this->section_id;
    }

    public function getStrandId(){
        return $this->strand_id;
    }

    public function getAdviserId(){
        return $this->adviser_id;
    }

    public function getGradeLevel(){
        return $this->grade_level;
    }

    public function getSectionName(){
        return $this->section_name;
    }

    public function getSchoolYear(){
        return $this->school_year;
    }

    public function getMaxSlots(){
        return $this->max_slots;
    }

    public function getStatus(){
        return $this->status;
    }

    public function getCreatedAt(){
        return $this->created_at;
    }

    // Setters
    public function setSectionId($section_id){
        $this->section_id = $section_id;
    }

    public function setStrandId($strand_id){
        $this->strand_id = $strand_id;
    }

    public function setAdviserId($adviser_id){
        $this->adviser_id = $adviser_id;
    }

    public function setGradeLevel($grade_level){
        $this->grade_level = $grade_level;
    }

    public function setSectionName($section_name){
        $this->section_name = $section_name;
    }

    public function setSchoolYear($school_year){
        $this->school_year = $school_year;
    }

    public function setMaxSlots($max_slots){
        $this->max_slots = $max_slots;
    }

    public function setStatus($status){
        $this->status = $status;
    }

    public function setCreatedAt($created_at){
        $this->created_at = $created_at;
    }

    // Allowed values
    public static function allowedGradeLevels(){
        return ["11", "12"];
    }

    public static function allowedFormStatuses(){
        return ["Open", "Closed"];
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $strand_id    = $data["strand_id"] ?? "";
        $adviser_id   = $data["adviser_id"] ?? "";
        $grade_level  = $data["grade_level"] ?? "";
        $section_name = trim($data["section_name"] ?? "");
        $school_year  = trim($data["school_year"] ?? "");
        $max_slots    = $data["max_slots"] ?? "";
        $status       = $data["status"] ?? "";

        if ($strand_id === "" || $strand_id === null) {
            $errors[] = "Please select a strand.";
        }

        if ($adviser_id === "" || $adviser_id === null) {
            $errors[] = "Please select an adviser.";
        }

        if (!in_array($grade_level, self::allowedGradeLevels(), true)) {
            $errors[] = "Please select a valid year level.";
        }

        if ($section_name === "") {
            $errors[] = "Section name is required.";
        } elseif (strlen($section_name) > 50) {
            $errors[] = "Section name must be 50 characters or fewer.";
        }

        if ($school_year === "") {
            $errors[] = "School year is required.";
        } elseif (!preg_match("/^\d{4}-\d{4}$/", $school_year)) {
            $errors[] = "School year must be in the format YYYY-YYYY.";
        }

        if ($max_slots === "" || !ctype_digit((string) $max_slots) || (int) $max_slots < 1 || (int) $max_slots > 100) {
            $errors[] = "Capacity must be a whole number between 1 and 100.";
        }

        if (!in_array($status, self::allowedFormStatuses(), true)) {
            $errors[] = "Status must be one of: " . implode(", ", self::allowedFormStatuses()) . ".";
        }

        return $errors;
    }
}

?>