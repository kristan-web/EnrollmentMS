<?php
/* Accounting API, routed by ?action=. Replies in JSON.
     GET  ?action=fees                 -> fee list + total assessment
     GET  ?action=status&session=cs_.. -> payment status from PayMongo
     POST  action=checkout             -> create a PayMongo checkout link */

require_once __DIR__ . "/../config/paymongo.php";
require_once __DIR__ . "/../Models/payment_model.php";
require_once __DIR__ . "/../Dao/PayMongoDAO.php";
require_once __DIR__ . "/../Dao/AcctPaymentDAO.php";

header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new PayMongoDAO();
$paymentDao = new AcctPaymentDAO();

if ($method === "GET") {

    $action = isset($_GET["action"]) ? $_GET["action"] : "fees";

    if ($action === "fees") {
        // The amounts come from `acct_fees`. A term can be named; otherwise the
        // active school year is priced.
        $schoolYear = isset($_GET["school_year"]) ? trim($_GET["school_year"]) : null;
        $semester   = isset($_GET["semester"]) ? trim($_GET["semester"]) : null;
        $term = FeeSchedule::defaultTerm();

        echo json_encode(array(
            "fees"        => FeeSchedule::items($schoolYear, $semester),
            "total"       => FeeSchedule::total($schoolYear, $semester),
            "school_year" => $schoolYear ? $schoolYear : $term["school_year"],
            "semester"    => $semester ? $semester : $term["semester"],
            "currency"    => PAYMONGO_CURRENCY
        ));
        exit;
    }

    if ($action === "status") {
        if (!paymongo_is_configured()) {
            echo json_encode(array("success" => false, "message" => "PayMongo keys aren't set up yet on the server."));
            exit;
        }

        $session = isset($_GET["session"]) ? trim($_GET["session"]) : "";
        if ($session === "") {
            echo json_encode(array("success" => false, "message" => "Missing payment reference."));
            exit;
        }

        $result = $dao->retrieveCheckoutSession($session);

        // PayMongo is the authority on whether the money arrived; mirror its
        // answer onto our own record. This is what settles the 'pending' row
        // written at checkout. markStatus() ignores rows already marked paid.
        if (!empty($result["success"]) && isset($result["status"])) {
            $mirrored = array("paid" => "paid", "failed" => "failed", "expired" => "expired", "cancelled" => "cancelled");
            if (isset($mirrored[$result["status"]])) {
                $paymentDao->markStatus($session, $mirrored[$result["status"]]);
            }
        }

        echo json_encode($result);
        exit;
    }

    echo json_encode(array("success" => false, "message" => "Invalid action."));
    exit;
}

if ($method === "POST") {

    $action = isset($_POST["action"]) ? $_POST["action"] : "checkout";

    if ($action === "checkout") {

        if (!paymongo_is_configured()) {
            echo json_encode(array(
                "success" => false,
                "message" => "Online payment isn't set up yet — the PayMongo keys are still blank in api/config/paymongo.php."
            ));
            exit;
        }

        $errors = Payment::validate($_POST);
        if (!empty($errors)) {
            echo json_encode(array("success" => false, "message" => implode(" ", $errors)));
            exit;
        }

        $payment = new Payment($_POST);
        $payment->setReference(Payment::makeReference());

        $result = $dao->createCheckoutSession($payment);

        // Log the attempt once PayMongo hands back a session, so an unfinished
        // payment is still visible as 'pending' rather than vanishing. Only the
        // ?action=status check can settle it afterwards.
        if (!empty($result["success"]) && !empty($result["session_id"])) {
            $paymentDao->insertPending($payment, $result["session_id"]);
        }

        echo json_encode($result);
        exit;
    }

    echo json_encode(array("success" => false, "message" => "Invalid action."));
    exit;
}

http_response_code(405);
echo json_encode(array("success" => false, "message" => "Method not allowed."));
?>
