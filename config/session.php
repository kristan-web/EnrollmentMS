<?php 
    $loginPageFilePath = 'C:/xampp/htdocs/EnrollmentMS';

    function safeStartSession(){
        if(session_status() === PHP_SESSION_NONE){
            return session_start();
        }

        return null;
    }

    function setSessionValues($name, $email, $role){
        $_SESSION['name'] = $name;
        $_SESSION['email'] = $email;
        $_SESSION['role'] = $role;   
    }

    function redirectToLoginPage(){
        if(!isset($_SESSION['role'])){
            header("Location: $loginPageFilePath/public/index.php ");
        }
    }
    
?>