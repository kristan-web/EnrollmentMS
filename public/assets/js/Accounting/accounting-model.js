/* Shared model for the accounting pages: endpoints, money formatting, and the
   calls to the PHP backend. Amounts here are pesos; PHP converts to centavos. */

(function () {
  "use strict";

  /* Every View/ page loads this from the same absolute path, so the endpoint is
     absolute too and does not care which page opened it. */
  var API_BASE = "/EnrollmentMS/app/Accounting/Controller/payments_controllers.php";

  var ENDPOINTS = {
    fees:     API_BASE + "?action=fees",
    checkout: API_BASE,
    status:   API_BASE + "?action=status"
  };

  var pesoFmt = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  });

  function formatPeso(amount) {
    var n = Number(amount);
    if (isNaN(n)) n = 0;
    return pesoFmt.format(n);
  }

  /* Display-only backup used when the server is unreachable.
     Keep in sync with FeeSchedule::items() in Accounting/Model/payment_model.php,
     which is the source of truth. */
  var FALLBACK_FEES = [
    { code: "TUITION",  name: "Tuition Fee",              note: "Per semester",                 amount: 12000, required: true },
    { code: "MISC",     name: "Miscellaneous Fee",        note: "Guidance, athletics, etc.",    amount: 3500,  required: true },
    { code: "LAB",      name: "Laboratory Fee",           note: "Computer & science labs",      amount: 1800,  required: true },
    { code: "REG",      name: "Registration Fee",         note: "One-time this semester",       amount: 500,   required: true },
    { code: "LIB",      name: "Library Fee",              note: "Books & online resources",     amount: 400,   required: true },
    { code: "MEDDENT",  name: "Medical & Dental Fee",     note: "Clinic services",              amount: 350,   required: true },
    { code: "IDMAT",    name: "ID & School Materials",    note: "School ID, modules, handbook", amount: 750,   required: true }
  ];

  var DOWNPAYMENT_RATE = 0.40;
  var MIN_CUSTOM_PAYMENT = 500;

  var SCHOOL_YEAR = "2026-2027";
  var SEMESTER = "1st Semester";

  /* Methods offered on step 3. "code" is sent to PHP, which maps it to the
     name PayMongo expects. */
  var METHODS = [
    { code: "gcash",   name: "GCash",          note: "e-wallet",             logo: "gcash.svg" },
    { code: "maya",    name: "Maya",           note: "e-wallet",             logo: "maya.svg" },
    { code: "grabpay", name: "GrabPay",        note: "e-wallet",             logo: "grab.svg" },
    { code: "card",    name: "Debit / Credit", note: "Visa or Mastercard",   logo: "visa.svg" }
  ];

  /* The pay flow spans three pages, so the answers are held in sessionStorage
     until checkout. Only the student's own inputs live here; the fee amounts
     and the final charge are decided by PHP, which re-checks them. */
  var DRAFT_KEY = "acct_pay_draft";

  function saveDraft(patch) {
    var draft = getDraft();
    Object.keys(patch).forEach(function (k) { draft[k] = patch[k]; });
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      /* Storage blocked: the page guards will send the student back to step 1. */
    }
    return draft;
  }

  function getDraft() {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      /* Nothing to clear. */
    }
  }

  /* Send the student back if they skipped a step. Returns the draft when ok. */
  function requireDraft(fields, backTo) {
    var draft = getDraft();
    var missing = fields.some(function (f) {
      return draft[f] === undefined || draft[f] === "";
    });
    if (missing) {
      location.replace(backTo);
      return null;
    }
    return draft;
  }

  /* Fetch the fee list. Falls back to FALLBACK_FEES and flags offline if the
     server can't be reached. */
  function fetchFees() {
    return fetch(ENDPOINTS.fees, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (res) {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then(function (data) {
        // PHP sends { fees: [...] }; guard in case it's just the array.
        var fees = Array.isArray(data) ? data : (data.fees || []);
        if (!fees.length) throw new Error("empty");
        return { fees: fees, offline: false };
      })
      .catch(function () {
        return { fees: FALLBACK_FEES, offline: true };
      });
  }

  /* Add up the fee items -> total assessment in pesos. */
  function totalOf(fees) {
    return fees.reduce(function (sum, f) {
      return sum + Number(f.amount || 0);
    }, 0);
  }

  /* Round to 2 decimals to avoid float noise like 7719.9999999. */
  function money(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  /* How much the student pays now, in pesos. Custom amounts are clamped
     between the minimum and the total. */
  function amountForPlan(plan, total, customValue) {
    if (plan === "full") {
      return money(total);
    }
    if (plan === "down") {
      return money(total * DOWNPAYMENT_RATE);
    }
    var val = Number(customValue) || 0;
    if (val < MIN_CUSTOM_PAYMENT) val = MIN_CUSTOM_PAYMENT;
    if (val > total) val = total;
    return money(val);
  }

  /* Ask PHP to create the PayMongo checkout link and return a checkout_url.
     PHP does the PayMongo call because the secret key must not reach the browser. */
  function createCheckout(payload) {
    var body = new URLSearchParams();
    body.set("action", "checkout");
    body.set("student_number", payload.studentNumber || "");
    body.set("student_name", payload.studentName || "");
    body.set("email", payload.email || "");
    body.set("plan", payload.plan || "full");
    body.set("amount", payload.amount || 0);
    body.set("method", payload.method || "");
    body.set("school_year", payload.schoolYear || SCHOOL_YEAR);
    body.set("semester", payload.semester || SEMESTER);

    return fetch(ENDPOINTS.checkout, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: body
    }).then(function (res) {
      return res.json();
    });
  }

  /* Ask PHP whether a checkout session was paid. */
  function fetchStatus(sessionId) {
    var url = ENDPOINTS.status + "&session=" + encodeURIComponent(sessionId);
    return fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (res) { return res.json(); });
  }

  /* Exposed for the controllers, same style as window.ApplicantModel. */
  window.AccountingModel = {
    ENDPOINTS: ENDPOINTS,
    DOWNPAYMENT_RATE: DOWNPAYMENT_RATE,
    MIN_CUSTOM_PAYMENT: MIN_CUSTOM_PAYMENT,
    SCHOOL_YEAR: SCHOOL_YEAR,
    SEMESTER: SEMESTER,
    METHODS: METHODS,
    formatPeso: formatPeso,
    fetchFees: fetchFees,
    totalOf: totalOf,
    money: money,
    amountForPlan: amountForPlan,
    createCheckout: createCheckout,
    fetchStatus: fetchStatus,
    saveDraft: saveDraft,
    getDraft: getDraft,
    clearDraft: clearDraft,
    requireDraft: requireDraft
  };
})();
