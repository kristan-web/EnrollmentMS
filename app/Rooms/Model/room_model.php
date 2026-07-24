<?php

class Rooms {

    private $room_id;
    private $room_name;
    private $building;
    private $capacity;
    private $created_at;

    // Constructor
    public function __construct(
        $room_name = null,
        $building = null,
        $capacity = null
    ){
        $this->room_name = $room_name;
        $this->building  = $building;
        $this->capacity  = $capacity;
    }

    // Getters
    public function getRoomId(){
        return $this->room_id;
    }

    public function getRoomName(){
        return $this->room_name;
    }

    public function getBuilding(){
        return $this->building;
    }

    public function getCapacity(){
        return $this->capacity;
    }

    public function getCreatedAt(){
        return $this->created_at;
    }

    // Setters
    public function setRoomId($room_id){
        $this->room_id = $room_id;
    }

    public function setRoomName($room_name){
        $this->room_name = $room_name;
    }

    public function setBuilding($building){
        $this->building = $building;
    }

    public function setCapacity($capacity){
        $this->capacity = $capacity;
    }

    public function setCreatedAt($created_at){
        $this->created_at = $created_at;
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $room_name = isset($data["room_name"]) ? trim($data["room_name"]) : "";
        $building  = isset($data["building"]) ? trim($data["building"]) : "";
        $capacity  = $data["capacity"] ?? "";

        if ($room_name === "") {
            $errors[] = "Please enter a room name.";
        }

        if ($building === "") {
            $errors[] = "Please enter a building.";
        }

        if ($capacity === "" || $capacity === null) {
            $errors[] = "Please enter a capacity.";
        } else if (!is_numeric($capacity) || (int)$capacity <= 0) {
            $errors[] = "Capacity must be a positive number.";
        }

        return $errors;
    }
}

?>