// register.js — Create a student portal account.
// Talks to Controllers/student_account/student_account_controllers.php (via
// PortalAPI). Following the flowchart: the form is validated, the account is
// written to the database, then the student is redirected to the login page.
const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");
const submitBtn = document.getElementById("registerSubmit");

// If they are already signed in, there's no reason to register again.
PortalAPI.redirectIfAuthed("dashboard.html");

function setMsg(text, type) {
  registerMsg.textContent = text;
  registerMsg.classList.remove("is-error", "is-success");
  if (type) registerMsg.classList.add(type);
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "Creating account…" : "Create Account";
}

// Show / hide the password (works for both the Password and Confirm fields).
document.querySelectorAll(".field__toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const wrap = document.getElementById(toggle.dataset.target);
    if (!wrap) return;
    const input = wrap.querySelector("input");
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    wrap.classList.toggle("is-shown", reveal);
    toggle.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
    toggle.setAttribute("aria-pressed", reveal ? "true" : "false");
  });
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = registerForm.elements.fullname.value.trim();
  const email = registerForm.elements.email.value.trim();
  const password = registerForm.elements.password.value;
  const confirm = registerForm.elements.confirm.value;

  // Quick checks in the browser — the PHP validates again, never trusting the client.
  if (!fullname || !email || !password || !confirm)
    return setMsg("Please fill in all fields.", "is-error");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return setMsg("Please enter a valid email address.", "is-error");
  if (password.length < 6)
    return setMsg("Password must be at least 6 characters.", "is-error");
  if (password !== confirm)
    return setMsg("Passwords do not match.", "is-error");

  setMsg("");
  setLoading(true);

  try {
    const data = await PortalAPI.register({ fullname, email, password, confirm });

    if (data && data.success) {
      setMsg(data.message || "Account created! You can now log in.", "is-success");
      registerForm.reset();
      setTimeout(() => (window.location.href = data.redirect || "login.html"), 1200);
      return;
    }

    setMsg((data && data.message) || "We couldn't create your account. Please try again.", "is-error");
  } catch {
    setMsg("We couldn't reach the server. Please check your connection and try again.", "is-error");
  } finally {
    setLoading(false);
  }
});
