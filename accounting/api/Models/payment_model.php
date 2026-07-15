<?php
/* Models for accounting: the fee schedule and a single payment.
   Amounts are in pesos; toCentavos() converts for PayMongo. */

class FeeSchedule {

    /* The assessment for the semester, and the source of truth for the amounts.
       The copy in accounting/models/accounting-model.js must match. */
    public static function items() {
        return array(
            array("code" => "TUITION", "name" => "Tuition Fee",           "note" => "Per semester",                 "amount" => 12000, "required" => true),
            array("code" => "MISC",    "name" => "Miscellaneous Fee",     "note" => "Guidance, athletics, etc.",    "amount" => 3500,  "required" => true),
            array("code" => "LAB",     "name" => "Laboratory Fee",        "note" => "Computer & science labs",      "amount" => 1800,  "required" => true),
            array("code" => "REG",     "name" => "Registration Fee",      "note" => "One-time this semester",        "amount" => 500,   "required" => true),
            array("code" => "LIB",     "name" => "Library Fee",           "note" => "Books & online resources",     "amount" => 400,   "required" => true),
            array("code" => "MEDDENT", "name" => "Medical & Dental Fee",  "note" => "Clinic services",              "amount" => 350,   "required" => true),
            array("code" => "IDMAT",   "name" => "ID & School Materials", "note" => "School ID, modules, handbook", "amount" => 750,   "required" => true),
        );
    }

    /* Total assessment in pesos. */
    public static function total() {
        $sum = 0;
        foreach (self::items() as $fee) {
            $sum += $fee["amount"];
        }
        return $sum;
    }
}

class Payment {

    private $student_number;
    private $student_name;
    private $email;
    private $plan;          // "full" | "down" | "custom"
    private $amount;        // pesos paid now
    private $method;        // key of methodMap(), chosen on step 3
    private $school_year;
    private $semester;
    private $reference;     // e.g. SOA-2026-4821-7Q3K

    const DOWNPAYMENT_RATE = 0.40;
    const MIN_PAYMENT = 500;

    public function __construct($data = array()) {
        $this->student_number = isset($data["student_number"]) ? trim($data["student_number"]) : "";
        $this->student_name   = isset($data["student_name"]) ? trim($data["student_name"]) : "";
        $this->email          = isset($data["email"]) ? trim($data["email"]) : "";
        $this->plan           = isset($data["plan"]) ? trim($data["plan"]) : "full";
        $this->amount         = isset($data["amount"]) ? (float)$data["amount"] : 0;
        $this->method         = isset($data["method"]) ? trim($data["method"]) : "";
        $this->school_year    = isset($data["school_year"]) ? trim($data["school_year"]) : "";
        $this->semester       = isset($data["semester"]) ? trim($data["semester"]) : "";
    }

    /* Getters */
    public function getStudentNumber() { return $this->student_number; }
    public function getStudentName()   { return $this->student_name; }
    public function getEmail()         { return $this->email; }
    public function getPlan()          { return $this->plan; }
    public function getAmount()        { return $this->amount; }
    public function getMethod()        { return $this->method; }
    public function getSchoolYear()    { return $this->school_year; }
    public function getSemester()      { return $this->semester; }
    public function getReference()     { return $this->reference; }

    /* Setters */
    public function setAmount($amount)       { $this->amount = (float)$amount; }
    public function setReference($reference) { $this->reference = $reference; }

    public static function allowedPlans() {
        return array("full", "down", "custom");
    }

    /* Our method codes -> the names PayMongo expects. */
    public static function methodMap() {
        return array(
            "gcash"   => "gcash",
            "maya"    => "paymaya",
            "grabpay" => "grab_pay",
            "card"    => "card"
        );
    }

    /* The method to open on the checkout page. Falls back to every configured
       method so an empty choice still works. */
    public function paymongoMethods() {
        global $PAYMONGO_METHODS;
        $map = self::methodMap();
        if (isset($map[$this->method])) {
            return array($map[$this->method]);
        }
        return $PAYMONGO_METHODS;
    }

    /* Check the form data. Returns error messages; empty means valid. */
    public static function validate($data) {
        $errors = array();

        $studentNumber = isset($data["student_number"]) ? trim($data["student_number"]) : "";
        $studentName   = isset($data["student_name"]) ? trim($data["student_name"]) : "";
        $email         = isset($data["email"]) ? trim($data["email"]) : "";
        $plan          = isset($data["plan"]) ? trim($data["plan"]) : "";
        $amount        = isset($data["amount"]) ? (float)$data["amount"] : 0;
        $method        = isset($data["method"]) ? trim($data["method"]) : "";

        if ($studentNumber === "") {
            $errors[] = "Student number is required.";
        }
        if ($studentName === "") {
            $errors[] = "Student name is required.";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "A valid email is required.";
        }
        if (!in_array($plan, self::allowedPlans(), true)) {
            $errors[] = "Please choose a valid payment option.";
        }
        if ($method !== "" && !array_key_exists($method, self::methodMap())) {
            $errors[] = "Please choose a valid payment method.";
        }
        if ($amount < self::MIN_PAYMENT) {
            $errors[] = "Minimum online payment is PHP " . number_format(self::MIN_PAYMENT, 2) . ".";
        }
        if ($amount > FeeSchedule::total()) {
            $errors[] = "Amount is more than your total assessment.";
        }

        return $errors;
    }

    /* Line items for the checkout page, in centavos. Full payment lists every
       fee; down/custom is a single line. */
    public function toLineItems() {
        $items = array();

        if ($this->plan === "full") {
            foreach (FeeSchedule::items() as $fee) {
                $items[] = array(
                    "currency" => PAYMONGO_CURRENCY,
                    "amount"   => self::toCentavos($fee["amount"]),
                    "name"     => $fee["name"],
                    "quantity" => 1
                );
            }
        } else {
            $label = ($this->plan === "down") ? "Down Payment - School Fees" : "Partial Payment - School Fees";
            $items[] = array(
                "currency" => PAYMONGO_CURRENCY,
                "amount"   => self::toCentavos($this->amount),
                "name"     => $label . " (" . $this->school_year . " " . $this->semester . ")",
                "quantity" => 1
            );
        }

        return $items;
    }

    /* Rounded so fractional centavos are never sent. */
    public static function toCentavos($peso) {
        return (int) round(((float)$peso) * 100);
    }

    public static function toPesos($centavos) {
        return round(((int)$centavos) / 100, 2);
    }

    /* Reference number, e.g. SOA-2026-4821-7Q3K. Mixes the timestamp with a
       random part to avoid clashes, since there's no DB sequence. */
    public static function makeReference() {
        $year = date("Y");
        $seq  = substr((string) time(), -4);
        $rand = strtoupper(substr(md5(uniqid("", true)), 0, 4));
        return "SOA-" . $year . "-" . $seq . "-" . $rand;
    }
}
?>
