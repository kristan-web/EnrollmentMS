<?php 
    $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';

    include_once "$projectFilePath/config/session.php";

    safeStartSession();

    session_destroy();

    header("Location: /EnrollmentMS/public/index.php");
?>