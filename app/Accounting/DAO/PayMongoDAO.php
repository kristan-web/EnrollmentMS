<?php
/* DAO for accounting. Reads and writes the PayMongo REST API over cURL
   instead of a database. */

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/config/paymongo.php";
require_once "$projectFilePath/app/Accounting/Model/payment_model.php";

class PayMongoDAO {

    private $baseUrl;
    private $authHeader;

    public function __construct() {
        $this->baseUrl = PAYMONGO_BASE_URL;
        // PayMongo uses Basic auth with the secret key as username and no password.
        $this->authHeader = "Authorization: Basic " . base64_encode(PAYMONGO_SECRET_KEY . ":");
    }

    /* One cURL call. Returns array("http" => code, "body" => decoded json). */
    private function request($method, $path, $body = null) {
        $ch = curl_init($this->baseUrl . $path);

        $headers = array(
            $this->authHeader,
            "Content-Type: application/json",
            "Accept: application/json"
        );

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if ($method === "POST" && $body !== null) {
            // PayMongo expects { "data": { "attributes": {...} } }.
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array("data" => array("attributes" => $body))));
        }

        $raw  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            return array("http" => 0, "body" => null, "curl_error" => $err);
        }

        return array("http" => $code, "body" => json_decode($raw, true));
    }

    /* Create a checkout session and return the link to send the student to. */
    public function createCheckoutSession(Payment $payment) {
        $attributes = array(
            "line_items"           => $payment->toLineItems(),
            "payment_method_types" => $payment->paymongoMethods(),
            "success_url"          => paymongo_success_url($payment->getReference()),
            "cancel_url"           => paymongo_cancel_url(),
            "description"          => "School Fees (" . $payment->getSchoolYear() . " " . $payment->getSemester() . ")",
            "reference_number"     => $payment->getReference(),
            "send_email_receipt"   => true,
            "show_line_items"      => true,
            "billing"              => array(
                "name"  => $payment->getStudentName(),
                "email" => $payment->getEmail()
            )
        );

        $res = $this->request("POST", "/checkout_sessions", $attributes);

        if ($res["http"] === 0) {
            return array("success" => false, "message" => "Couldn't reach PayMongo. Please check the server's internet connection.");
        }

        $data = isset($res["body"]["data"]) ? $res["body"]["data"] : null;

        if (($res["http"] === 200 || $res["http"] === 201) && $data && isset($data["attributes"]["checkout_url"])) {
            return array(
                "success"      => true,
                "checkout_url" => $data["attributes"]["checkout_url"],
                "session_id"   => $data["id"],
                "reference"    => $payment->getReference()
            );
        }

        return array("success" => false, "message" => $this->firstError($res["body"]));
    }

    /* Look up a checkout session (cs_...) and work out whether it was paid. */
    public function retrieveCheckoutSession($sessionId) {
        $res = $this->request("GET", "/checkout_sessions/" . urlencode($sessionId));

        if ($res["http"] === 0) {
            return array("success" => false, "message" => "Couldn't reach PayMongo right now. Please try again.");
        }

        $data = isset($res["body"]["data"]) ? $res["body"]["data"] : null;
        if ($res["http"] !== 200 || !$data) {
            return array("success" => false, "message" => $this->firstError($res["body"]));
        }

        $attr = $data["attributes"];

        // A session can hold several payments; any one "paid" counts. Otherwise
        // fall back to the payment_intent status, then the session status.
        $status = "unpaid";
        $paidAmount = null;

        if (!empty($attr["payments"])) {
            foreach ($attr["payments"] as $p) {
                if (isset($p["attributes"]["status"]) && $p["attributes"]["status"] === "paid") {
                    $status = "paid";
                    $paidAmount = Payment::toPesos($p["attributes"]["amount"]);
                    break;
                }
            }
        }

        if ($status !== "paid" && isset($attr["payment_intent"]["attributes"]["status"])) {
            $pi = $attr["payment_intent"]["attributes"]["status"];
            if ($pi === "succeeded") {
                $status = "paid";
                $paidAmount = Payment::toPesos($attr["payment_intent"]["attributes"]["amount"]);
            }
        }

        if ($status !== "paid" && isset($attr["status"]) && $attr["status"] === "expired") {
            $status = "expired";
        }

        // Fall back to the line-item total if the amount is still unknown.
        if ($paidAmount === null && !empty($attr["line_items"])) {
            $sum = 0;
            foreach ($attr["line_items"] as $li) {
                $qty = isset($li["quantity"]) ? $li["quantity"] : 1;
                $sum += $li["amount"] * $qty;
            }
            $paidAmount = Payment::toPesos($sum);
        }

        return array(
            "success"     => true,
            "session"     => $sessionId,
            "status"      => $status,
            "amount"      => $paidAmount,
            "reference"   => isset($attr["reference_number"]) ? $attr["reference_number"] : null,
            "payer_name"  => isset($attr["billing"]["name"]) ? $attr["billing"]["name"] : null,
            "description" => isset($attr["description"]) ? $attr["description"] : null
        );
    }

    /* PayMongo returns errors in body.errors[].detail; show the first one. */
    private function firstError($body) {
        if (isset($body["errors"][0]["detail"])) {
            return "PayMongo: " . $body["errors"][0]["detail"];
        }
        return "PayMongo request failed. Please double-check your API keys and try again.";
    }
}
?>
