<?PHP 
    $projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

    include_once __DIR__.'/../Model/users_model.php';
    include_once __DIR__.'/../DAO/UserDAO.php';
    include_once "$projectFilePath/config/session.php";

    safeStartSession();


    // Set JSON response header
    header('Content-Type: application/json');

    function hashPassword($passwordData){
        return password_hash($passwordData, PASSWORD_DEFAULT);
    }

    function insertRegistrationDataToUserClass(Users $user, $fullname, $email, $password, $role){
        $user->setFullname($fullname);
        $user->setEmail($email);
        $user->setPassword($password);
        $user->setRole($role);

        return $user;
    }

    function insertLoginDataToUserClass(Users $user, $email, $password){
        $user->setEmail($email);
        $user->setPassword($password);

        return $user;
    }

    function verifyPassword($inputPassword, $databasePassword){
        return password_verify($inputPassword, $databasePassword);
    }

    function setNewHashedPassword(Users $user, $password){
        $hashedpassword = password_hash($password, PASSWORD_DEFAULT);
        $user->setPassword($hashedpassword);

        return $user;
    }



    if($_SERVER['REQUEST_METHOD'] == "POST"){
        if($_POST['form_type'] == 'creation'){
            $user = new Users();

            $hashedpassword = hashPassword($_POST['passwordCreation']);

            $account = insertRegistrationDataToUserClass($user, $_POST['fullnameCreation'], $_POST['emailCreation'], $hashedpassword, $_POST['accountRole']);

            $dao = new UserDAO();

            $result = $dao->VerifyUser($account);

            if($result){
                echo json_encode([
                    "success" => false,
                    "message" => "Email already exists"
                ]);
            }
            else{
                $result = $dao->CreateUser($user);

                if($result){
                    echo json_encode([
                        "success" => true,
                        "message" => "Account created successfully"
                    ]);
                } else {
                    echo json_encode([
                        "success" => false,
                        "message" => "Failed to create account. Please try again."
                    ]);
                }
            }
        }

        // Login Form
        if($_POST['form_type'] == 'login'){
            $user = new Users();

            $account = insertLoginDataToUserClass($user, $_POST['emailLogin'], $_POST['passwordLogin']);

            // Create DAO instance
            $dao = new UserDAO();

            $result = $dao->VerifyUser($account);

            if($result){
                if(verifyPassword($account->getPassword(), $result['password_hash'])){
                    setSessionValues($result['full_name'], $result['email'], $result['role']);
                    echo json_encode([
                        "success" => true,
                        "message" => 'Account Verified'
                    ]);
                }
                else{
                    echo json_encode([
                        "success" => false,
                        "message" => 'Incorrect Password'
                    ]);
                }
            }
            else{
                echo json_encode([
                    "success" => false,
                    "message" => 'Email does not exist'
                ]);
            }
        }

        // Account Change Password Form
        if($_POST['form_type'] == 'reset'){
            // Create user instance
            $user = new Users();

            $account = insertLoginDataToUserClass($user, $_POST['emailReset'], $_POST['passwordReset']);

            $dao = new UserDAO();

            $result = $dao->VerifyUser($account);

            // If account is found in the database
            if($result){
                // Check if password from database matches the user input.
                if(verifyPassword($account->getPassword(), $result['password_hash'])){
                    $account = setNewHashedPassword($user, $_POST['newPassReset']);
                    $result = $dao->ChangePassword($account);
                    
                    if($result){
                        echo json_encode([
                            "success" => true,
                            "message" => "Password changed successfully"
                        ]);
                    }
                    else{
                        echo json_encode([
                            "success" => false,
                            "message" => "Password change failed. Please try again."
                        ]);
                    }
                }
                else{
                    echo json_encode([
                        "success" => false,
                        "message" => "Incorrect email or password"
                    ]);
                }
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Account not found with this email"
                ]);
            }
        }
    }
?>