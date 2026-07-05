<?php 

class StudentAccountModel{
    // Attributes
    private $student_id;
    private $email;
    private $contact_number;
    private $password;

    // Setters

    public function setStudentID($student_id){
        $this->student_id = $student_id;
    }

    public function setEmail($email){
        $this->email = $email;
    }

    public function setContactNumber($contact_number){
        $this->contact_number = $contact_number;
    }

    public function setPassword($password){
        $this->password = $password;
    }

    // Getters

    public function getStudentID(){
        return $this->student_id;
    }

    public function getEmail(){
        return $this->email;
    }

    public function getContactNumber(){
        return $this->contact_number;
    }

    public function getPassword(){
        return $this->password;
    }
}

?>