<?php

class Student {

    private $student_id;
    private $lrn;
    private $student_number;
    private $first_name;
    private $middle_name;
    private $last_name;
    private $gender;
    private $birthdate;
    private $address;
    private $contact_number;
    private $email;
    private $grade_level;
    private $status;

    // Parent Information
    private $father_name;
    private $father_contact_number;
    private $father_occupation;
    private $mother_name;
    private $mother_contact_number;
    private $mother_occupation;

    // Guardian Information
    private $guardian_name;
    private $guardian_relationship;
    private $guardian_contact_number;
    private $guardian_address;

    // Emergency Contact
    private $emergency_contact_name;
    private $emergency_contact_relationship;
    private $emergency_contact_number;

    private $created_at;


    // Constructor

    public function __construct(
        $lrn = null,
        $student_number = null,
        $first_name = null,
        $middle_name = null,
        $last_name = null,
        $gender = null,
        $birthdate = null,
        $address = null,
        $contact_number = null,
        $email = null,
        $grade_level = null,
        $status = null,
        $father_name = null,
        $father_contact_number = null,
        $father_occupation = null,
        $mother_name = null,
        $mother_contact_number = null,
        $mother_occupation = null,
        $guardian_name = null,
        $guardian_relationship = null,
        $guardian_contact_number = null,
        $guardian_address = null,
        $emergency_contact_name = null,
        $emergency_contact_relationship = null,
        $emergency_contact_number = null
    ){

        $this->lrn = $lrn;
        $this->student_number = $student_number;
        $this->first_name = $first_name;
        $this->middle_name = $middle_name;
        $this->last_name = $last_name;
        $this->gender = $gender;
        $this->birthdate = $birthdate;
        $this->address = $address;
        $this->contact_number = $contact_number;
        $this->email = $email;
        $this->grade_level = $grade_level;
        $this->status = $status;
        $this->father_name = $father_name;
        $this->father_contact_number = $father_contact_number;
        $this->father_occupation = $father_occupation;
        $this->mother_name = $mother_name;
        $this->mother_contact_number = $mother_contact_number;
        $this->mother_occupation = $mother_occupation;
        $this->guardian_name = $guardian_name;
        $this->guardian_relationship = $guardian_relationship;
        $this->guardian_contact_number = $guardian_contact_number;
        $this->guardian_address = $guardian_address;
        $this->emergency_contact_name = $emergency_contact_name;
        $this->emergency_contact_relationship = $emergency_contact_relationship;
        $this->emergency_contact_number = $emergency_contact_number;

    }



    // Getters

    public function getStudentId(){
        return $this->student_id;
    }

    public function getLrn(){
        return $this->lrn;
    }

    public function getStudentNumber(){
        return $this->student_number;
    }

    public function getFirstName(){
        return $this->first_name;
    }

    public function getMiddleName(){
        return $this->middle_name;
    }

    public function getLastName(){
        return $this->last_name;
    }

    public function getGender(){
        return $this->gender;
    }

    public function getBirthdate(){
        return $this->birthdate;
    }

    public function getAddress(){
        return $this->address;
    }

    public function getContactNumber(){
        return $this->contact_number;
    }

    public function getEmail(){
        return $this->email;
    }

    public function getGradeLevel(){
        return $this->grade_level;
    }

    public function getStatus(){
        return $this->status;
    }

    public function getFatherName(){
        return $this->father_name;
    }

    public function getFatherContactNumber(){
        return $this->father_contact_number;
    }

    public function getFatherOccupation(){
        return $this->father_occupation;
    }

    public function getMotherName(){
        return $this->mother_name;
    }

    public function getMotherContactNumber(){
        return $this->mother_contact_number;
    }

    public function getMotherOccupation(){
        return $this->mother_occupation;
    }

    public function getGuardianName(){
        return $this->guardian_name;
    }

    public function getGuardianRelationship(){
        return $this->guardian_relationship;
    }

    public function getGuardianContactNumber(){
        return $this->guardian_contact_number;
    }

    public function getGuardianAddress(){
        return $this->guardian_address;
    }

    public function getEmergencyContactName(){
        return $this->emergency_contact_name;
    }

    public function getEmergencyContactRelationship(){
        return $this->emergency_contact_relationship;
    }

    public function getEmergencyContactNumber(){
        return $this->emergency_contact_number;
    }


    // Setters

    public function setStudentId($student_id){
        $this->student_id = $student_id;
    }

    public function setLrn($lrn){
        $this->lrn = $lrn;
    }

    public function setStudentNumber($student_number){
        $this->student_number = $student_number;
    }

    public function setFirstName($first_name){
        $this->first_name = $first_name;
    }

    public function setMiddleName($middle_name){
        $this->middle_name = $middle_name;
    }

    public function setLastName($last_name){
        $this->last_name = $last_name;
    }

    public function setGender($gender){
        $this->gender = $gender;
    }

    public function setBirthdate($birthdate){
        $this->birthdate = $birthdate;
    }

    public function setAddress($address){
        $this->address = $address;
    }

    public function setContactNumber($contact_number){
        $this->contact_number = $contact_number;
    }

    public function setEmail($email){
        $this->email = $email;
    }

    public function setGradeLevel($grade_level){
        $this->grade_level = $grade_level;
    }

    public function setStatus($status){
        $this->status = $status;
    }

    public function setFatherName($father_name){
        $this->father_name = $father_name;
    }

    public function setFatherContactNumber($father_contact_number){
        $this->father_contact_number = $father_contact_number;
    }

    public function setFatherOccupation($father_occupation){
        $this->father_occupation = $father_occupation;
    }

    public function setMotherName($mother_name){
        $this->mother_name = $mother_name;
    }

    public function setMotherContactNumber($mother_contact_number){
        $this->mother_contact_number = $mother_contact_number;
    }

    public function setMotherOccupation($mother_occupation){
        $this->mother_occupation = $mother_occupation;
    }

    public function setGuardianName($guardian_name){
        $this->guardian_name = $guardian_name;
    }

    public function setGuardianRelationship($guardian_relationship){
        $this->guardian_relationship = $guardian_relationship;
    }

    public function setGuardianContactNumber($guardian_contact_number){
        $this->guardian_contact_number = $guardian_contact_number;
    }

    public function setGuardianAddress($guardian_address){
        $this->guardian_address = $guardian_address;
    }

    public function setEmergencyContactName($emergency_contact_name){
        $this->emergency_contact_name = $emergency_contact_name;
    }

    public function setEmergencyContactRelationship($emergency_contact_relationship){
        $this->emergency_contact_relationship = $emergency_contact_relationship;
    }

    public function setEmergencyContactNumber($emergency_contact_number){
        $this->emergency_contact_number = $emergency_contact_number;
    }

}

?>
