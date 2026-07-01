<?php 

class Users{
    private $user_id;
    private $username;
    private $password_hash;
    private $full_name;
    private $email;
    private $role;
    private $created_at;

    //Getters

    public function getUserId(){
        return $this->user_id;
    }

    public function getUsername(){
        return $this->username;
    }

    public function getPassword(){
        return $this->password_hash;
    }

    public function getFullname(){
        return $this->full_name;
    }

    public function getEmail(){
        return $this->email;
    }

    public function getRole(){
        return $this->role;

    }

    //Setters

    public function setUsername($username){
        $this->username = $username;
    }

    public function setPassword($password_hash){
        $this->password_hash = $password_hash;
    }

    public function setFullname($full_name){
        $this->full_name = $full_name;
    }

    public function setEmail($email){
        $this->email = $email;
    }

    public function setRole($role){
        $this->role = $role;
    }
}

?>