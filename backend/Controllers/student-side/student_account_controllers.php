<?php 
    include_once "../../Dao/student-side/StudentSideDAO.php";
    include_once "../../Models/student-side/student_account_model.php";



    if($_SERVER["REQUEST_METHOD"] == "POST"){
        if($_POST['form_type'] == 'creation'){
            $account = new StudentAccountModel();

            // Get form details
            $account->setEmail($_POST['email_address']);
            $account->setContactNumber($_POST['contact_number']);

            // Hash password
            $passwordhash = password_hash($_POST['password'], PASSWORD_DEFAULT);

            $account->setPassword($passwordhash);

            // Create DAO
            $dao = new StudentSideDAO();

            $result = $dao->VerifyUser($account);

            // If email is found. 
            if($result){
                echo json_encode([
                    "success" => false,
                    "message" => "Email already exists"
                ]);
            }

            // If email is not found
            else{
                $result = $dao->CreateUser($account);

                if($result){
                    echo json_encode([
                    "success" => true,
                    "message" => "Account Created Successfully"
                ]);
                }

                else{
                    echo json_encode([
                    "success" => false,
                    "message" => "Failed to create account."
                ]);
                }
            }

        }

        // Login Form
        if($_POST['form_type'] == 'login'){
            // Instance of users class
            $user = new StudentAccountModel();

            // Pass POST data to the instance
            $user->setEmail($_POST['email_login']);
            $user->setPassword($_POST['password_login']);

            // Create DAO instance
            $dao = new StudentSideDAO();

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
    }
?>
