// login.js — Student portal login.
// Talks to Controllers/student_account/student_account_controllers.php (via
// PortalAPI). The credentials are checked against the database; on a valid
// account a PHP session is started and the student is sent to their dashboard.
const LOGIN_FIELD_NOTE = "Please enter your email and your password.";

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const submitBtn = document.getElementById("loginSubmit");
const pwWrap = document.getElementById("pwWrap");
const pwToggle = document.getElementById("pwToggle");

// Already signed in? Go straight to the dashboard.
PortalAPI.redirectIfAuthed("dashboard.html");

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
  const email = identifierEl.value.trim();
  const password = passwordEl.value;

  identifierEl.classList.remove("is-invalid");
  passwordEl.classList.remove("is-invalid");

  if (!email || !password) {
    if (!email) identifierEl.classList.add("is-invalid");
    if (!password) passwordEl.classList.add("is-invalid");
    return setMsg(LOGIN_FIELD_NOTE, "is-error");
  }

  setMsg("");
  setLoading(true);

  try {
    const data = await PortalAPI.login(email, password);

    if (data && data.success) {
      setMsg(data.message || "Signed in successfully. Redirecting…", "is-success");
      window.location.href = data.redirect || "dashboard.html";
      return;
    }

    setMsg((data && data.message) || "We couldn't sign you in. Please check your details and try again.", "is-error");
  } catch {
    setMsg("We couldn't reach the server. Please check your connection and try again.", "is-error");
  } finally {
    setLoading(false);
  }
});
