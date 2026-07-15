// login.js — Student portal login (UI only)
// ---------------------------------------------------------------------------
// This screen keeps NOTHING in the browser — no localStorage, no fake auth.
// It only handles the interface (validation, password toggle, messages) and
// then hands the credentials to your PHP backend.
//
// To connect it, point LOGIN_ENDPOINT at a PHP script. The form is sent as a
// normal POST so PHP can read it straight from $_POST:
//
//   POST  <LOGIN_ENDPOINT>            (application/x-www-form-urlencoded)
//     identifier = Student ID or email     -> $_POST['identifier']
//     password   = the password            -> $_POST['password']
//     remember   = "1" when ticked         -> $_POST['remember'] (optional)
//
//   Your PHP should reply with JSON, e.g.:
//     echo json_encode(["success" => true,  "redirect" => "dashboard.php"]);
//     echo json_encode(["success" => false, "message" => "Invalid ID or password."]);
//
// Until that file exists, submitting just shows a friendly notice.
const LOGIN_ENDPOINT = "student-login.php";

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const submitBtn = document.getElementById("loginSubmit");
const pwWrap = document.getElementById("pwWrap");
const pwToggle = document.getElementById("pwToggle");

function setMsg(text, type) {
  loginMsg.textContent = text;
  loginMsg.classList.remove("is-error", "is-success");
  if (type) loginMsg.classList.add(type);
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "Signing in…" : "Log In";
}

// Show / hide the password.
pwToggle.addEventListener("click", () => {
  const input = pwWrap.querySelector("input");
  const reveal = input.type === "password";
  input.type = reveal ? "text" : "password";
  pwWrap.classList.toggle("is-shown", reveal);
  pwToggle.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
  pwToggle.setAttribute("aria-pressed", reveal ? "true" : "false");
  input.focus();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifierEl = loginForm.elements.identifier;
  const passwordEl = loginForm.elements.password;
  const identifier = identifierEl.value.trim();
  const password = passwordEl.value;

  identifierEl.classList.remove("is-invalid");
  passwordEl.classList.remove("is-invalid");

  if (!identifier || !password) {
    if (!identifier) identifierEl.classList.add("is-invalid");
    if (!password) passwordEl.classList.add("is-invalid");
    return setMsg("Please enter your Student ID or email and your password.", "is-error");
  }

  setMsg("");
  setLoading(true);

  try {
    const body = new URLSearchParams();
    body.set("identifier", identifier);
    body.set("password", password);
    if (loginForm.elements.remember.checked) body.set("remember", "1");

    const res = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body
    });

    let data = null;
    try { data = await res.json(); } catch { /* non-JSON reply */ }

    if (res.ok && data && data.success) {
      setMsg("Signed in successfully. Redirecting…", "is-success");
      if (data.redirect) window.location.href = data.redirect;
      return;
    }

    setMsg(
      (data && data.message) || "We couldn't sign you in. Please check your details and try again.",
      "is-error"
    );
  } catch {
    setMsg("We couldn't reach the server. Please check your connection and try again.", "is-error");
  } finally {
    setLoading(false);
  }
});
