<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../Models/student_account/student_account_model.php';

// Data access for the public student-portal accounts. Same shape as UserDAO,
// pointed at the `student_accounts` table.
class StudentAccountDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Returns the account row for an email, or false if none exists.
    public function findByEmail($email) {
        $query = "SELECT * FROM student_accounts WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(StudentAccount $account) {
        $query = "INSERT INTO student_accounts (full_name, email, password_hash)
                  VALUES (:full_name, :email, :password_hash)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":full_name", $account->getFullname());
        $stmt->bindValue(":email", $account->getEmail());
        $stmt->bindValue(":password_hash", $account->getPassword());

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
}
?>
