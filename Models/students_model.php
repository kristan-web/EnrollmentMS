<?php

class Student {

    private $student_id;
    private $student_number;
    private $first_name;
    private $last_name;
    private $gender;
    private $birthdate;
    private $address;
    private $contact_number;
    private $email;
    private $year_level;
    private $status;
    private $created_at;


    // Constructor

    public function __construct(
        $student_number = null,
        $first_name = null,
        $last_name = null,
        $gender = null,
        $birthdate = null,
        $address = null,
        $contact_number = null,
        $email = null,
        $year_level = null,
        $status = null
    ){

        $this->student_number = $student_number;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->gender = $gender;
        $this->birthdate = $birthdate;
        $this->address = $address;
        $this->contact_number = $contact_number;
        $this->email = $email;
        $this->year_level = $year_level;
        $this->status = $status;

    }



    // Getters

    public function getStudentId(){
        return $this->student_id;
    }

    public function getStudentNumber(){
        return $this->student_number;
    }

    public function getFirstName(){
        return $this->first_name;
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

    public function getYearLevel(){
        return $this->year_level;
    }

    public function getStatus(){
        return $this->status;
    }


    // Setters

    public function setStudentId($student_id){
        $this->student_id = $student_id;
    }


    public function setStudentNumber($student_number){
        $this->student_number = $student_number;
    }


    public function setFirstName($first_name){
        $this->first_name = $first_name;
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


    public function setYearLevel($year_level){
        $this->year_level = $year_level;
    }


    public function setStatus($status){
        $this->status = $status;
    }

}

?>