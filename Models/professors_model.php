<?php

class Professor {

    private $professor_id;
    private $department_id;
    private $first_name;
    private $last_name;
    private $email;
    private $contact_number;
    private $status;
    private $created_at;


    // Constructor

    public function __construct(
        $department_id = null,
        $first_name = null,
        $last_name = null,
        $email = null,
        $contact_number = null,
        $status = null
    ){

        $this->department_id = $department_id;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->email = $email;
        $this->contact_number = $contact_number;
        $this->status = $status;

    }



    // Getters

    public function getProfessorId(){
        return $this->professor_id;
    }

    public function getDepartmentId(){
        return $this->department_id;
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

    public function getStatus(){
        return $this->status;
    }


    // Setters

    public function setProfessorId($professor_id){
        $this->professor_id = $professor_id;
    }


    public function setDepartmentId($department_id){
        $this->department_id = $department_id;
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


    public function setStatus($status){
        $this->status = $status;
    }

}

?>
