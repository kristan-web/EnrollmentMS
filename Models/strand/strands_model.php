<?php

class Strand {

    private $strand_id;
    private $track_id;
    private $strand_code;
    private $strand_name;
    private $description;
    private $created_at;

    // Constructor
    public function __construct(
        $track_id = null,
        $strand_code = null,
        $strand_name = null,
        $description = null
    ) {
        $this->track_id = $track_id;
        $this->strand_code = $strand_code;
        $this->strand_name = $strand_name;
        $this->description = $description;
    }

    // Getters
    public function getStrandId() {
        return $this->strand_id;
    }

    public function getTrackId() {
        return $this->track_id;
    }

    public function getStrandCode() {
        return $this->strand_code;
    }

    public function getStrandName() {
        return $this->strand_name;
    }

    public function getDescription() {
        return $this->description;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    // Setters
    public function setStrandId($strand_id) {
        $this->strand_id = $strand_id;
    }

    public function setTrackId($track_id) {
        $this->track_id = $track_id;
    }

    public function setStrandCode($strand_code) {
        $this->strand_code = $strand_code;
    }

    public function setStrandName($strand_name) {
        $this->strand_name = $strand_name;
    }

    public function setDescription($description) {
        $this->description = $description;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        if (empty($data['track_id'])) {
            $errors[] = "Track is required.";
        }

        if (empty($data['strand_code']) || strlen(trim($data['strand_code'])) < 2) {
            $errors[] = "Strand code must be at least 2 characters.";
        } elseif (strlen(trim($data['strand_code'])) > 20) {
            $errors[] = "Strand code must be 20 characters or fewer.";
        } elseif (!preg_match('/^[A-Za-z0-9\-_]+$/', $data['strand_code'])) {
            $errors[] = "Strand code may only contain letters, numbers, hyphens, and underscores.";
        }

        if (empty($data['strand_name']) || strlen(trim($data['strand_name'])) < 2) {
            $errors[] = "Strand name must be at least 2 characters.";
        } elseif (strlen(trim($data['strand_name'])) > 150) {
            $errors[] = "Strand name must be 150 characters or fewer.";
        }

        if (!empty($data['description']) && strlen($data['description']) > 1000) {
            $errors[] = "Description must be 1000 characters or fewer.";
        }

        return $errors;
    }
}

?>