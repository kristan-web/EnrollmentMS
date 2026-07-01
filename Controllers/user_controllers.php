<?PHP 
    include_once '../Models/users_model.php';
    include_once '../Dao/UserDAO.php';


    if($_SERVER["REQUEST_METHOD"] == "POST"){
        $user = new Users();
        $user->setEmail($_POST['email']);
        $user->setPassword($_POST['password']);

        $dao = new UserDAO();

        $account = $dao->VerifyUser($user);

        if($account){
            if($user->getPassword() == $account['password_hash']){
                echo json_encode([
                    "success" => true,
                    "message" => "Login Successful"
                ]);
            }
            else{
                echo json_encode([
                    "success" => false,
                    "message" => "Incorrect Password"
                ]);
            }
        }
        else{
            echo json_encode([
                "success" => false,
                "message" => "Email not found"
            ]);
        }
    }

?>