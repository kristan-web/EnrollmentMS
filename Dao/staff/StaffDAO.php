<?php
// Data access for staff accounts — the `users` table (Admin / Registrar /
// Accounting). Backs the admin console's "Staff Accounts" management page.
// The existing Controllers/user (User Settings create/reset) is left untouched;
// this is a separate, fuller manager (list, create with role, edit, reset,
// delete).

require_once __DIR__ . "/../../config/db.php";

class StaffDAO {

    // Roles the console can assign, matching the users.role enum.
    const ROLES = ["Admin", "Registrar", "Accounting"];

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Used by the console sign-in gate.
    public function findByEmail($email) {
        $query = "SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // All staff, newest first. $filters: role, keyword (name/email).
    public function getAll($filters = []) {
        $query = "SELECT user_id, full_name, email, role, created_at FROM users WHERE 1 = 1";
        $params = [];

        if (!empty($filters["role"])) {
            $query .= " AND role = :role ";
            $params[":role"] = $filters["role"];
        }
        if (!empty($filters["keyword"])) {
            $query .= " AND (full_name LIKE :kw OR email LIKE :kw) ";
            $params[":kw"] = "%" . $filters["keyword"] . "%";
        }

        $query .= " ORDER BY user_id DESC";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = :id");
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // $excludeId lets the edit form keep its own email.
    public function emailExists($email, $excludeId = null) {
        $query = "SELECT COUNT(*) FROM users WHERE email = :email";
        if ($excludeId) $query .= " AND user_id <> :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":email", $email);
        if ($excludeId) $stmt->bindValue(":id", $excludeId);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    public function create($fullName, $email, $passwordHash, $role) {
        $query = "INSERT INTO users (full_name, email, password_hash, role) VALUES (:name, :email, :hash, :role)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":name", $fullName);
        $stmt->bindValue(":email", $email);
        $stmt->bindValue(":hash", $passwordHash);
        $stmt->bindValue(":role", $role);
        if ($stmt->execute()) return $this->conn->lastInsertId();
        return false;
    }

    // Name / email / role. Password is handled separately by resetPassword().
    public function update($id, $fullName, $email, $role) {
        $query = "UPDATE users SET full_name = :name, email = :email, role = :role WHERE user_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":name", $fullName);
        $stmt->bindValue(":email", $email);
        $stmt->bindValue(":role", $role);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    public function resetPassword($id, $passwordHash) {
        $stmt = $this->conn->prepare("UPDATE users SET password_hash = :hash WHERE user_id = :id");
        $stmt->bindValue(":hash", $passwordHash);
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM users WHERE user_id = :id");
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // Guards deleting/demoting the last Admin so the console can't lock itself out.
    public function countByRole($role) {
        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM users WHERE role = :role");
        $stmt->bindValue(":role", $role);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }
}
?>
