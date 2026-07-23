// cashier-login.js — Accounting-side (cashier) login; drives Accounting/View/index.php,
// the module's entry point.
// Talks to Accounting/Controller/cashier_controllers.php via CashierModel. The
// credentials are checked against the staff `users` table; on a valid account a
// PHP cashier session is started and the user is sent to View/cashier.php.
// Mirrors the student-portal login flow.
(function () {
  "use strict";

  var M = window.CashierModel;
  var loginForm = document.getElementById("loginForm");
  var loginMsg = document.getElementById("loginMsg");
  var submitBtn = document.getElementById("loginSubmit");
  var pwWrap = document.getElementById("pwWrap");
  var pwToggle = document.getElementById("pwToggle");

  // Already signed in? Go straight to the console.
  M.redirectIfAuthed("cashier.php");

  function setMsg(text, type) {
    loginMsg.textContent = text || "";
    loginMsg.classList.remove("is-error", "is-success");
    if (type) loginMsg.classList.add(type);
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Signing in…" : "Log In";
  }

  // Show / hide the password.
  pwToggle.addEventListener("click", function () {
    var input = pwWrap.querySelector("input");
    var reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    pwWrap.classList.toggle("is-shown", reveal);
    pwToggle.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
    pwToggle.setAttribute("aria-pressed", reveal ? "true" : "false");
    input.focus();
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var identifierEl = loginForm.elements.identifier;
    var passwordEl = loginForm.elements.password;
    var email = identifierEl.value.trim();
    var password = passwordEl.value;

    identifierEl.classList.remove("is-invalid");
    passwordEl.classList.remove("is-invalid");

    // "All filled out?" — client-side gate (the server re-checks).
    if (!email || !password) {
      if (!email) identifierEl.classList.add("is-invalid");
      if (!password) passwordEl.classList.add("is-invalid");
      return setMsg("Please enter your email and your password.", "is-error");
    }

    setMsg("");
    setLoading(true);

    M.login(email, password).then(function (data) {
      if (data && data.success) {
        setMsg(data.message || "Signed in. Redirecting…", "is-success");
        window.location.href = data.redirect || "cashier.php";
        return;
      }
      setMsg((data && data.message) || "We couldn't sign you in. Please check your details and try again.", "is-error");
      setLoading(false);
    }).catch(function () {
      setMsg("We couldn't reach the server. Please check your connection and try again.", "is-error");
      setLoading(false);
    });
  });
})();
