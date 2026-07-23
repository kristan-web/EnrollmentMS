<?php 

require_once __DIR__.'/../../../config/db.php';
require_once __DIR__.'/../Model/users_model.php';

class UserDAO{

    private $conn;

    public function __construct(){
        $database = new Database();

        $this->conn = $database->connect();
    }

    public function VerifyUser(Users $user){
        $query = "SELECT * FROM users WHERE email = :email";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":email", $user->getEmail());
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function CreateUser(Users $user){
        $query = "INSERT INTO users (email, password_hash, full_name, role) values (:email, :password_hash, :full_name, :role)";

        $stmt =  $this->conn->prepare($query);

        $stmt->bindValue(":email", $user->getEmail());
        $stmt->bindValue(":password_hash", $user->getPassword());
        $stmt->bindValue(":full_name", $user->getFullname());
        $stmt->bindValue(":role", $user->getRole());

        return $stmt->execute();
    }

    public function ChangePassword(Users $user){
        // FIXED: Added WHERE clause to update the correct user
        $query = "UPDATE users SET password_hash = :newpassword WHERE email = :email";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":newpassword", $user->getPassword());
        $stmt->bindValue(":email", $user->getEmail());

        return $stmt->execute();
    }
}
?>