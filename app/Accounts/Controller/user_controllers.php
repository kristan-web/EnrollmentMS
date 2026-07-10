<?PHP 
    include_once __DIR__.'/../Model/users_model.php';
    include_once __DIR__.'/../DAO/UserDAO.php';

    // Set JSON response header
    header('Content-Type: application/json');

    if($_SERVER['REQUEST_METHOD'] == "POST"){
        // Account Creation Form
        if($_POST['form_type'] == 'creation'){
            // Instance of Users class
            $user = new Users();

            // Hash the password;
            $password = $_POST['passwordCreation'];
            $hashedpassword = password_hash($password, PASSWORD_DEFAULT);

            // Store POST data to Users instance
            $user->setFullname($_POST['fullnameCreation']);
            $user->setEmail($_POST['emailCreation']);
            $user->setPassword($hashedpassword);
            $user->setRole("Staff");

            // Instance of User DAO
            $dao = new UserDAO();

            // Check if email exists
            $result = $dao->VerifyUser($user);

            // If result returns true, email exists.
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
            // Instance of users class
            $user = new Users();

            // Pass POST data to the instance
            $user->setEmail($_POST['emailLogin']);
            $user->setPassword($_POST['passwordLogin']);

            // Create DAO instance
            $dao = new UserDAO();

            $result = $dao->VerifyUser($user);

            if($result){
                // If user input password matches the one stored in database
                if(password_verify($user->getPassword(), $result['password_hash'])){
                    echo json_encode([
                        "success" => true,
                        "message" => 'Account Verified'
                    ]);
                }
                // If password is incorrect
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

            // Pass POST data to the instance
            $user->setEmail($_POST['emailReset']);
            $user->setPassword($_POST['passwordReset']);

            // Create DAO instance
            $dao = new UserDAO();

            // Check the database if account exists
            $result = $dao->VerifyUser($user);

            // If account is found in the database
            if($result){
                // Check if password from database matches the user input.
                if(password_verify($user->getPassword(), $result['password_hash'])){
                    $newpassword = $_POST['newpassReset'];
                    $hashedpassword = password_hash($newpassword, PASSWORD_DEFAULT);

                    $user->setPassword($hashedpassword);
                    
                    $result = $dao->ChangePassword($user);
                    
                    // If password change succeeds
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
                // If user input password does not match database password
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