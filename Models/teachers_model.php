<?php

class Teacher {

    private $teacher_id;
    private $first_name;
    private $last_name;
    private $email;
    private $contact_number;
    private $specialization;
    private $status;
    private $created_at;


    // Constructor

    public function __construct(
        $first_name = null,
        $last_name = null,
        $email = null,
        $contact_number = null,
        $specialization = null,
        $status = null
    ){

        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->email = $email;
        $this->contact_number = $contact_number;
        $this->specialization = $specialization;
        $this->status = $status;

    }


    // Getters

    public function getTeacherId(){
        return $this->teacher_id;
    }

    public function getFirstName(){
        return $this->first_name;
    }

    public function getLastName(){
        return $this->last_name;
    }

    public function getEmail(){
        return $this->email;
    }

    public function getContactNumber(){
        return $this->contact_number;
    }

    public function getSpecialization(){
        return $this->specialization;
    }

    public function getStatus(){
        return $this->status;
    }

    public function getCreatedAt(){
        return $this->created_at;
    }


    // Setters

    public function setTeacherId($teacher_id){
        $this->teacher_id = $teacher_id;
    }

    public function setFirstName($first_name){
        $this->first_name = $first_name;
    }

    public function setLastName($last_name){
        $this->last_name = $last_name;
    }

    public function setEmail($email){
        $this->email = $email;
    }

    public function setContactNumber($contact_number){
        $this->contact_number = $contact_number;
    }

    public function setSpecialization($specialization){
        $this->specialization = $specialization;
    }

    public function setStatus($status){
        $this->status = $status;
    }

    public function setCreatedAt($created_at){
        $this->created_at = $created_at;
    }


    // List of allowed status values, used for both validation and dropdowns

    public static function allowedStatuses(){

        return ["Active", "Inactive"];

    }


    // Shared validation used by both the create and update controllers.
    // $data is expected to be an array (e.g. $_POST).
    // Set $isUpdate to true to also require/validate the "status" field.
    // Returns an array of human-readable error messages (empty = valid).

    public static function validate($data, $isUpdate = false) {

        $errors = [];

        $first_name = trim($data["first_name"] ?? "");
        $last_name  = trim($data["last_name"] ?? "");
        $email      = trim($data["email"] ?? "");
        $contact    = trim($data["contact_number"] ?? "");
        $specialization = trim($data["specialization"] ?? "");

        if ($first_name === "") {
            $errors[] = "First name is required.";
        } elseif (!preg_match("/^[a-zA-Z .'-]{2,50}$/", $first_name)) {
            $errors[] = "First name may only contain letters, spaces, apostrophes, and hyphens.";
        }

        if ($last_name === "") {
            $errors[] = "Last name is required.";
        } elseif (!preg_match("/^[a-zA-Z .'-]{2,50}$/", $last_name)) {
            $errors[] = "Last name may only contain letters, spaces, apostrophes, and hyphens.";
        }

        if ($email === "") {
            $errors[] = "Email is required.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Email format is invalid.";
        }

        if ($contact === "") {
            $errors[] = "Contact number is required.";
        } elseif (!preg_match("/^[0-9]{7,15}$/", $contact)) {
            $errors[] = "Contact number must be 7 to 15 digits, numbers only.";
        }

        if ($specialization === "") {
            $errors[] = "Specialization is required.";
        } elseif (strlen($specialization) > 100) {
            $errors[] = "Specialization must be 100 characters or fewer.";
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
