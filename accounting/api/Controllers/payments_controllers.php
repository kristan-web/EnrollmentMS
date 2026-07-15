<?php
/* Accounting API, routed by ?action=. Replies in JSON.
     GET  ?action=fees                 -> fee list + total assessment
     GET  ?action=status&session=cs_.. -> payment status from PayMongo
     POST  action=checkout             -> create a PayMongo checkout link */

require_once __DIR__ . "/../config/paymongo.php";
require_once __DIR__ . "/../Models/payment_model.php";
require_once __DIR__ . "/../Dao/PayMongoDAO.php";

header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];
$dao = new PayMongoDAO();

if ($method === "GET") {

    $action = isset($_GET["action"]) ? $_GET["action"] : "fees";

    if ($action === "fees") {
        echo json_encode(array(
            "fees"     => FeeSchedule::items(),
            "total"    => FeeSchedule::total(),
            "currency" => PAYMONGO_CURRENCY
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

        echo json_encode($dao->retrieveCheckoutSession($session));
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

        echo json_encode($result);
        exit;
    }

    echo json_encode(array("success" => false, "message" => "Invalid action."));
    exit;
}

http_response_code(405);
echo json_encode(array("success" => false, "message" => "Method not allowed."));
?>
