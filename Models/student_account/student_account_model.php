<?php

// Plain data holder for a student-portal login account.
// Mirrors the staff Users model, but these accounts live in the separate
// `student_accounts` table and are created by applicants themselves.
class StudentAccount {
    private $account_id;
    private $full_name;
    private $email;
    private $password_hash;
    private $created_at;

    // Getters
    public function getAccountId() {
        return $this->account_id;
    }

    public function getFullname() {
        return $this->full_name;
    }

    public function getEmail() {
        return $this->email;
    }

    public function getPassword() {
        return $this->password_hash;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    // Setters
    public function setAccountId($account_id) {
        $this->account_id = $account_id;
    }

    public function setFullname($full_name) {
        $this->full_name = $full_name;
    }

    public function setEmail($email) {
        $this->email = $email;
    }

    public function setPassword($password_hash) {
        $this->password_hash = $password_hash;
    }
}
?>
