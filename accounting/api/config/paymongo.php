<?php
/* PayMongo gateway settings. Edit this file to enable real payments.
   The secret key must stay server-side and never reach the JavaScript. */

/* Keys from dashboard.paymongo.com -> Developers -> API Keys. */
define("PAYMONGO_SECRET_KEY", "sk_test_REPLACE_WITH_YOUR_SECRET_KEY");
define("PAYMONGO_PUBLIC_KEY", "pk_test_REPLACE_WITH_YOUR_PUBLIC_KEY");

define("PAYMONGO_BASE_URL", "https://api.paymongo.com/v1");
define("PAYMONGO_CURRENCY", "PHP");

/* Methods shown on the checkout page. These are PayMongo's exact codes. */
$PAYMONGO_METHODS = array("gcash", "paymaya", "card", "grab_pay");

/* Leave empty to auto-detect from the request. */
define("APP_BASE_URL", "");

/* Base URL of the /accounting folder, used to build the return links. */
function paymongo_app_base_url() {
    if (APP_BASE_URL !== "") {
        return rtrim(APP_BASE_URL, "/");
    }

    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host   = isset($_SERVER["HTTP_HOST"]) ? $_SERVER["HTTP_HOST"] : "localhost";

    // Requests arrive at /accounting/api/Controllers, so trim that to reach /accounting.
    $scriptDir = str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"]));
    $accountingBase = preg_replace("#/api/Controllers$#", "", $scriptDir);

    return $scheme . "://" . $host . $accountingBase;
}

/* Where PayMongo sends the student after paying. */
function paymongo_success_url($reference) {
    return paymongo_app_base_url() . "/views/receipt.html?ref=" . urlencode($reference);
}
function paymongo_cancel_url() {
    return paymongo_app_base_url() . "/views/receipt.html?cancelled=1";
}

/* True once the placeholder keys have been replaced. */
function paymongo_is_configured() {
    $key = PAYMONGO_SECRET_KEY;
    return strpos($key, "REPLACE_WITH_YOUR") === false && strlen($key) > 10;
}
?>
