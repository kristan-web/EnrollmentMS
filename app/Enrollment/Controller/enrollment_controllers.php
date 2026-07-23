<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

// Increase memory limit and execution time for large datasets
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);

// Set JSON header for all responses
header('Content-Type: application/json');

require_once __DIR__."/../DAO/EnrollmentDAO.php";
require_once __DIR__."/../Model/enrollment_model.php";

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $dao    = new EnrollmentDAO();

    if ($method == "GET") {
        $action = isset($_GET["action"]) ? $_GET["action"] : "list";

        // Get enrollments list (original masterlist)
        if ($action == "list") {
            $filters = [
                "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
                "status" => isset($_GET["status"]) ? $_GET["status"] : null,
                "school_year_id" => isset($_GET["school_year_id"]) ? $_GET["school_year_id"] : null,
                "semester" => isset($_GET["semester"]) ? $_GET["semester"] : null
            ];
            echo json_encode($dao->getEnrollments($filters));
         
         // Get inactive students (for enrollment)
        } else if ($action == "inactive_students") {
            $filters = [
                "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null
            ];
            
            $result = $dao->getInactiveStudents($filters);
            echo json_encode($result);
         

            // Reactivate enrollment
        } else if ($action == "reactivate") {
            $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
            if (empty($id)) {
                echo "REACTIVATE FAILED: missing enrollment_id";
                exit;
            }
            
            if ($dao->reactivate($id)) {
                echo "REACTIVATE SUCCESS";
            } else {
                echo "REACTIVATE FAILED";
            }
        // Get section schedule
        } else if ($action == "section_schedule") {
            $sectionId = isset($_GET["section_id"]) ? $_GET["section_id"] : null;
            if (empty($sectionId)) {
                echo json_encode(["error" => "Missing section_id"]);
                exit;
            }
            
            $result = $dao->getSectionSchedule($sectionId);
            echo json_encode($result);

        // Get unenrolled students
        } else if ($action == "unenrolled") {
            $filters = [
                "keyword" => isset($_GET["keyword"]) ? $_GET["keyword"] : null,
                "school_year_id" => isset($_GET["school_year_id"]) ? $_GET["school_year_id"] : null,
                "semester" => isset($_GET["semester"]) ? $_GET["semester"] : null,
                "strand" => isset($_GET["strand"]) ? $_GET["strand"] : null,
                "show_enrolled" => isset($_GET["show_enrolled"]) ? $_GET["show_enrolled"] : 'false'
            ];
            
            $result = $dao->getUnenrolledStudents($filters);
            echo json_encode($result);

        // Get strands for dropdown
        } else if ($action == "strands") {
            echo json_encode($dao->getStrands());

        // Get school years for dropdown
        } else if ($action == "school_years") {
            echo json_encode($dao->getSchoolYears());

        // Get active school year
        } else if ($action == "active_school_year") {
            echo json_encode($dao->getActiveSchoolYear());

        // Search students
        } else if ($action == "search_students") {
            $keyword = isset($_GET["keyword"]) ? trim($_GET["keyword"]) : "";
            if ($keyword === "") {
                echo json_encode([]);
                exit;
            }
            echo json_encode($dao->searchStudents($keyword));

        // Get student by ID
        } else if ($action == "student") {
            $id = isset($_GET["id"]) ? $_GET["id"] : null;
            if (empty($id)) {
                echo json_encode(["error" => "Missing student id"]);
                exit;
            }
            echo json_encode($dao->getStudentById($id));

        // Get student enrollments history
        } else if ($action == "student_enrollments") {
            $id = isset($_GET["id"]) ? $_GET["id"] : null;
            if (empty($id)) {
                echo json_encode(["error" => "Missing student id"]);
                exit;
            }
            echo json_encode($dao->getEnrollmentsByStudent($id));

        // Get available sections for enrollment
        } else if ($action == "sections") {
            $strand     = isset($_GET["strand"]) ? $_GET["strand"] : null;
            $grade      = isset($_GET["grade"]) ? $_GET["grade"] : null;
            $schoolYearId = isset($_GET["school_year_id"]) ? $_GET["school_year_id"] : null;

            if (empty($strand) || empty($grade) || empty($schoolYearId)) {
                echo json_encode(["error" => "Missing strand, grade, or school year"]);
                exit;
            }

            echo json_encode($dao->getAvailableSections($strand, $grade, $schoolYearId));

        // Get enrollment details by ID
        } else if ($action == "get") {
            $id = isset($_GET["id"]) ? $_GET["id"] : null;
            if (empty($id)) {
                echo json_encode(["error" => "Missing enrollment id"]);
                exit;
            }
            $enrollment = $dao->getEnrollmentDetails($id);
            if ($enrollment) {
                echo json_encode($enrollment);
            } else {
                echo json_encode(["error" => "Enrollment not found"]);
            }

        // Get student's complete schedule with all enrollments
        } else if ($action == "student_schedule") {
            $studentId = isset($_GET["student_id"]) ? $_GET["student_id"] : null;
            if (empty($studentId)) {
                echo json_encode(["error" => "Missing student_id"]);
                exit;
            }
            echo json_encode($dao->getStudentSchedule($studentId));

        // Debug: Get all enrollments (for testing)
        } else if ($action == "debug_enrollments") {
            echo json_encode($dao->debugGetAllEnrollments());

        // Invalid action
        } else {
            echo json_encode(["error" => "Invalid action: " . $action]);
        }

    // Handle POST requests
    } else if ($method == "POST") {
        $action = isset($_POST["action"]) ? $_POST["action"] : "create";

        // Drop enrollment
        if ($action == "drop") {
            $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
            if (empty($id)) {
                echo "DROP FAILED: missing enrollment_id";
                exit;
            }
            if ($dao->drop($id)) {
                echo "DROP SUCCESS";
            } else {
                echo "DROP FAILED";
            }

        // Update enrollment status
        } else if ($action == "update_status") {
            $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
            $status = isset($_POST["status"]) ? $_POST["status"] : null;
            if (empty($id) || empty($status)) {
                echo "UPDATE FAILED: missing enrollment_id or status";
                exit;
            }
            if ($dao->updateStatus($id, $status)) {
                echo "UPDATE SUCCESS";
            } else {
                echo "UPDATE FAILED";
            }

        // Delete enrollment
        } else if ($action == "delete") {
            $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
            if (empty($id)) {
                echo "DELETE FAILED: missing enrollment_id";
                exit;
            }
            if ($dao->delete($id)) {
                echo "DELETE SUCCESS";
            } else {
                echo "DELETE FAILED";
            }

        // Create new enrollment
        } else if ($action == "create") {
            $errors = Enrollment::validate($_POST);
            if (!empty($errors)) {
                echo "INSERT FAILED: " . implode(" ", $errors);
                exit;
            }

            // Get the school year string from the ID
            $schoolYearId = $_POST["school_year_id"];
            $schoolYearData = $dao->getSchoolYearById($schoolYearId);
            if (!$schoolYearData) {
                echo "INSERT FAILED: Invalid school year selected.";
                exit;
            }

            // Re-check duplicate
            if ($dao->isDuplicate($_POST["student_id"], $schoolYearId, $_POST["semester"])) {
                echo "INSERT FAILED: This student is already enrolled for that semester and school year.";
                exit;
            }

            // Check capacity
            $capacity = $dao->getSectionCapacity($_POST["section_id"]);
            if (!$capacity) {
                echo "INSERT FAILED: Section not found.";
                exit;
            }
            if ($capacity["enrolled_count"] >= $capacity["max_slots"]) {
                echo "INSERT FAILED: That section is already full.";
                exit;
            }

            $enrollment = new Enrollment();
            $enrollment->setStudentId($_POST["student_id"]);
            $enrollment->setSectionId($_POST["section_id"]);
            $enrollment->setSchoolYearId($schoolYearId);
            $enrollment->setSchoolYear($schoolYearData['year']);
            $enrollment->setSemester($_POST["semester"]);
            $enrollment->setStatus("Enrolled");

            if ($dao->insert($enrollment)) {
                echo "INSERT SUCCESS";
            } else {
                echo "INSERT FAILED";
            }

        // Reactivate enrollment (change status back to Enrolled)
        } else if ($action == "reactivate") {
            $id = isset($_POST["enrollment_id"]) ? $_POST["enrollment_id"] : null;
            if (empty($id)) {
                echo "REACTIVATE FAILED: missing enrollment_id";
                exit;
            }
            
            // Check capacity before reactivating
            $enrollment = $dao->getById($id);
            if (!$enrollment) {
                echo "REACTIVATE FAILED: Enrollment not found";
                exit;
            }
            
            $capacity = $dao->getSectionCapacity($enrollment['section_id']);
            if (!$capacity) {
                echo "REACTIVATE FAILED: Section not found.";
                exit;
            }
            if ($capacity["enrolled_count"] >= $capacity["max_slots"]) {
                echo "REACTIVATE FAILED: Section is already full.";
                exit;
            }
            
            if ($dao->updateStatus($id, 'Enrolled')) {
                echo "REACTIVATE SUCCESS";
            } else {
                echo "REACTIVATE FAILED";
            }

        // Invalid action
        } else {
            echo "Invalid action: " . $action;
        }

    } else {
        echo "Method not allowed";
    }
    
} catch (Exception $e) {
    // Return error as JSON
    error_log('Exception: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Error $e) {
    error_log('Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>