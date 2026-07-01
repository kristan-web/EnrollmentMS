<?php 

require_once '../config/db.php';
require_once '../Models/users_model.php';

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

}

?>