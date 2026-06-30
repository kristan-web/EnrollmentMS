<?php

class Department {

    private $department_id;
    private $department_code;
    private $department_name;
    private $created_at;


    public function __construct(
        $department_code = null,
        $department_name = null
    ){

        $this->department_code = $department_code;
        $this->department_name = $department_name;

    }


    // Getters

    public function getDepartmentId(){
        return $this->department_id;
    }

    public function getDepartmentCode(){
        return $this->department_code;
    }

    public function getDepartmentName(){
        return $this->department_name;
    }


    // Setters

    public function setDepartmentId($department_id){
        $this->department_id = $department_id;
    }

    public function setDepartmentCode($department_code){
        $this->department_code = $department_code;
    }

    public function setDepartmentName($department_name){
        $this->department_name = $department_name;
    }

}

?>
