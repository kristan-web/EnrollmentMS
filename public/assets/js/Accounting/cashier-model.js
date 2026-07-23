// cashier-model.js — the accounting/cashier console's single connection to the
// PHP/MySQL backend. Same style as accounting-model.js: every page talks to the
// module's Controller/, and the PHP session cookie rides along on same-origin
// requests.
//
// Every page loads this from the same absolute path, so the endpoints below are
// absolute too and do not care which View/ page is open.
(function () {
  "use strict";

  var BASE = "/EnrollmentMS/app/Accounting";
  var VIEWS = BASE + "/View";
  var API = BASE + "/Controller/cashier_controllers.php";

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

  // POST a plain object as a urlencoded form; parse the JSON reply.
  function postForm(data) {
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { body.set(k, data[k]); });
    return fetch(API, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: body
    }).then(function (res) { return res.json(); })
      .catch(function () {
        return { success: false, message: "We couldn't reach the server. Please check your connection and try again." };
      });
  }

  function getJson(query) {
    return fetch(API + query, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (res) {
        if (res.status === 401) return { authenticated: false };
        return res.json();
      })
      .catch(function () { return null; });
  }

  // ---- Session ----
  function login(email, password) {
    return postForm({ form_type: "login", email: email, password: password });
  }

  // Sends the browser back to the cashier login.
  function logout() {
    return postForm({ form_type: "logout" }).then(function (data) {
      window.location.href = (data && data.redirect) || (VIEWS + "/index.php");
    });
  }

  function me() {
    return getJson("?action=me");
  }

  // Guard the console: bounce to the login (View/index.php) if there is
  // no cashier session.
  function requireAuth(loginPage) {
    return me().then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = loginPage || (VIEWS + "/index.php");
        return null;
      }
      return data.cashier;
    });
  }

  // For the login page: skip straight to the console if already signed in.
  function redirectIfAuthed(dest) {
    return me().then(function (data) {
      if (data && data.authenticated) window.location.href = dest || (VIEWS + "/cashier.php");
    });
  }

  // ---- Console data ----
  function listAwaiting(q) {
    return getJson("?action=awaiting&q=" + encodeURIComponent(q || ""));
  }

  function getStudent(enrollmentId) {
    return getJson("?action=student&enrollment_id=" + encodeURIComponent(enrollmentId));
  }

  function recordPayment(enrollmentId, amount, method) {
    return postForm({
      action: "record_payment",
      enrollment_id: enrollmentId,
      amount: amount,
      method: method
    });
  }

  function verifyProof(proofId, decision, remarks) {
    return postForm({
      action: "verify_proof",
      proof_id: proofId,
      decision: decision,
      remarks: remarks || ""
    });
  }

  window.CashierModel = {
    formatPeso: formatPeso,
    login: login,
    logout: logout,
    me: me,
    requireAuth: requireAuth,
    redirectIfAuthed: redirectIfAuthed,
    listAwaiting: listAwaiting,
    getStudent: getStudent,
    recordPayment: recordPayment,
    verifyProof: verifyProof
  };
})();
