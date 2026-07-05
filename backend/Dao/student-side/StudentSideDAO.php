<?php 
    include_once "../../config/db.php";
    include_once "../../Models/student-side/student_account_model.php";

    class StudentSideDAO{
        private $conn;

        public function __construct(){
            $database = new Database();
            $this->conn = $database->connect();
        }

        public function VerifyUser(StudentAccountModel $user){
            $query = "SELECT * FROM student_accounts WHERE email = :email";

            $stmt = $this->conn->prepare($query);

            $stmt->bindValue(":email", $user->getEmail());
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        public function CreateUser(StudentAccountModel $user){
            $query = "INSERT INTO student_accounts (email, contact_number, password_hash) values (:email, :contact, :password)";

            $stmt =  $this->conn->prepare($query);

            $stmt->bindValue(":email", $user->getEmail());
            $stmt->bindValue(":contact", $user->getContactNumber());
            $stmt->bindValue(":password", $user->getPassword());

            return $stmt->execute();
        }
    }
?>