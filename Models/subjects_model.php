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
        $subject_type = null,
        $grade_level = null,
        $semester = null,
        $units = null,
        $description = null,
        $status = null
    ){

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

    public function getSubjectId(){
        return $this->subject_id;
    }

    public function getStrandId(){
        return $this->strand_id;
    }

    public function getSubjectCode(){
        return $this->subject_code;
    }

    public function getSubjectName(){
        return $this->subject_name;
    }

    public function getSubjectType(){
        return $this->subject_type;
    }

    public function getGradeLevel(){
        return $this->grade_level;
    }

    public function getSemester(){
        return $this->semester;
    }

    public function getUnits(){
        return $this->units;
    }

    public function getDescription(){
        return $this->description;
    }

    public function getStatus(){
        return $this->status;
    }

    public function getCreatedAt(){
        return $this->created_at;
    }


    // Setters

    public function setSubjectId($subject_id){
        $this->subject_id = $subject_id;
    }

    public function setStrandId($strand_id){
        $this->strand_id = $strand_id;
    }

    public function setSubjectCode($subject_code){
        $this->subject_code = $subject_code;
    }

    public function setSubjectName($subject_name){
        $this->subject_name = $subject_name;
    }

    public function setSubjectType($subject_type){
        $this->subject_type = $subject_type;
    }

    public function setGradeLevel($grade_level){
        $this->grade_level = $grade_level;
    }

    public function setSemester($semester){
        $this->semester = $semester;
    }

    public function setUnits($units){
        $this->units = $units;
    }

    public function setDescription($description){
        $this->description = $description;
    }

    public function setStatus($status){
        $this->status = $status;
    }

    public function setCreatedAt($created_at){
        $this->created_at = $created_at;
    }


    // Allowed enum values, shared between validation and dropdowns

    public static function allowedSubjectTypes(){
        return ["Core", "Applied", "Specialized"];
    }

    public static function allowedGradeLevels(){
        return ["11", "12"];
    }

    public static function allowedSemesters(){
        return ["1st Semester", "2nd Semester"];
    }

    public static function allowedStatuses(){
        return ["Active", "Inactive"];
    }


    // Shared validation used by both the create and update controllers.
    // $data is expected to be an array (e.g. $_POST).
    // Set $isUpdate to true to also require/validate the "status" field.
    // Returns an array of human-readable error messages (empty = valid).

    public static function validate($data, $isUpdate = false) {

        $errors = [];

        $subject_code = trim($data["subject_code"] ?? "");
        $subject_name = trim($data["subject_name"] ?? "");
        $subject_type = trim($data["subject_type"] ?? "");
        $grade_level  = trim($data["grade_level"] ?? "");
        $semester     = trim($data["semester"] ?? "");
        $units        = trim($data["units"] ?? "");
        $description  = trim($data["description"] ?? "");
        $strand_id    = trim($data["strand_id"] ?? "");

        // subject_code: required, letters/numbers/dashes/underscores, 2-20 chars
        if ($subject_code === "") {
            $errors[] = "Subject code is required.";
        } elseif (!preg_match("/^[A-Za-z0-9_-]{2,20}$/", $subject_code)) {
            $errors[] = "Subject code may only contain letters, numbers, hyphens, and underscores (2-20 characters).";
        }

        // subject_name: required, max 150 chars
        if ($subject_name === "") {
            $errors[] = "Subject name is required.";
        } elseif (strlen($subject_name) > 150) {
            $errors[] = "Subject name must be 150 characters or fewer.";
        }

        // subject_type: required, must be one of the allowed enum values
        if ($subject_type === "") {
            $errors[] = "Subject type is required.";
        } elseif (!in_array($subject_type, self::allowedSubjectTypes(), true)) {
            $errors[] = "Subject type must be one of: " . implode(", ", self::allowedSubjectTypes()) . ".";
        }

        // grade_level: required, must be 11 or 12
        if ($grade_level === "") {
            $errors[] = "Grade level is required.";
        } elseif (!in_array($grade_level, self::allowedGradeLevels(), true)) {
            $errors[] = "Grade level must be one of: " . implode(", ", self::allowedGradeLevels()) . ".";
        }

        // semester: required, must be a valid semester value
        if ($semester === "") {
            $errors[] = "Semester is required.";
        } elseif (!in_array($semester, self::allowedSemesters(), true)) {
            $errors[] = "Semester must be one of: " . implode(", ", self::allowedSemesters()) . ".";
        }

        // units: required, numeric, matches DECIMAL(3,1), reasonable range 0.5 - 20.0
        if ($units === "") {
            $errors[] = "Units is required.";
        } elseif (!preg_match("/^\d{1,2}(\.\d)?$/", $units)) {
            $errors[] = "Units must be a number with at most one decimal place (e.g. 1.0, 2.5).";
        } elseif ((float)$units < 0.5 || (float)$units > 20) {
            $errors[] = "Units must be between 0.5 and 20.";
        }

        // strand_id: Core subjects must NOT have a strand (shared by all strands).
        // Applied/Specialized subjects MUST have a strand.
        if ($subject_type === "Core") {

            if ($strand_id !== "") {
                $errors[] = "Core subjects are shared across all strands and must not have a strand assigned.";
            }

        } elseif (in_array($subject_type, ["Applied", "Specialized"], true)) {

            if ($strand_id === "") {
                $errors[] = "Applied and Specialized subjects require a strand.";
            } elseif (!ctype_digit((string)$strand_id)) {
                $errors[] = "Invalid strand selected.";
            }

        }

        // description: optional, max 1000 chars
        if (strlen($description) > 1000) {
            $errors[] = "Description must be 1000 characters or fewer.";
        }

        if ($isUpdate) {

            $status = $data["status"] ?? "";

            if (!in_array($status, self::allowedStatuses(), true)) {
                $errors[] = "Status must be one of: " . implode(", ", self::allowedStatuses()) . ".";
            }

        }

        return $errors;

    }

}

?>