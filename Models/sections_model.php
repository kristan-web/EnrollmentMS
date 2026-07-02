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
        $status = null
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

}

?>
