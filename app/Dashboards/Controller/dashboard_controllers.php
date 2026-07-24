<?php
// C:/xampp/htdocs/EnrollmentMS/app/Dashboard/Controller/dashboard_controllers.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

require_once __DIR__."/../DAO/DashboardDAO.php";

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $dao = new DashboardDAO();

    if ($method == "GET") {
        $action = isset($_GET["action"]) ? $_GET["action"] : "dashboard";

        if ($action == "dashboard") {
            echo json_encode($dao->getDashboardData());
        
        } else if ($action == "student_stats") {
            echo json_encode($dao->getStudentStats());
        
        } else if ($action == "enrollment_stats") {
            echo json_encode($dao->getEnrollmentStats());
        
        } else if ($action == "strand_distribution") {
            echo json_encode($dao->getStrandDistribution());
        
        } else if ($action == "grade_distribution") {
            echo json_encode($dao->getGradeDistribution());
        
        } else if ($action == "gender_distribution") {
            echo json_encode($dao->getGenderDistribution());
        
        } else if ($action == "section_capacity") {
            echo json_encode($dao->getSectionCapacity());
        
        } else if ($action == "recent_enrollments") {
            $limit = isset($_GET["limit"]) ? intval($_GET["limit"]) : 10;
            echo json_encode($dao->getRecentEnrollments($limit));
        
        } else if ($action == "enrollment_trend") {
            echo json_encode($dao->getEnrollmentTrend());
        
        } else if ($action == "school_year_comparison") {
            echo json_encode($dao->getSchoolYearComparison());
        
        } else {
            echo json_encode(["error" => "Invalid action: " . $action]);
        }
    } else {
        echo json_encode(["error" => "Method not allowed"]);
    }
    
} catch (Exception $e) {
    error_log('Dashboard API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Error $e) {
    error_log('Dashboard API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>