// register.js — Student portal registration (UI only)
// ---------------------------------------------------------------------------
// Just like login.js, this keeps NOTHING in the browser — no localStorage, no
// fake accounts. It only handles the interface (validation, password toggles,
// messages) and then hands the details to your PHP backend.
//
// To connect it, point REGISTER_ENDPOINT at a PHP script. The form is sent as
// a normal POST so PHP can read it straight from $_POST:
//
//   POST  <REGISTER_ENDPOINT>          (application/x-www-form-urlencoded)
//     fullname = full name             -> $_POST['fullname']
//     email    = email address         -> $_POST['email']
//     password = chosen password       -> $_POST['password']
//     confirm  = repeated password     -> $_POST['confirm']
//
//   Your PHP should reply with JSON, e.g.:
//     echo json_encode(["success" => true,  "redirect" => "login.html"]);
//     echo json_encode(["success" => false, "message" => "Email already used."]);
//
// Until that file exists, submitting just shows a friendly notice.
const REGISTER_ENDPOINT = "student-register.php";

const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");
const submitBtn = document.getElementById("registerSubmit");

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

  // Quick checks in the browser (your PHP should validate again — never trust the client).
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
    const body = new URLSearchParams();
    body.set("fullname", fullname);
    body.set("email", email);
    body.set("password", password);
    body.set("confirm", confirm);

    const res = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body
    });

    let data = null;
    try { data = await res.json(); } catch { /* non-JSON reply */ }

    if (res.ok && data && data.success) {
      setMsg(data.message || "Account created! You can now log in.", "is-success");
      registerForm.reset();
      if (data.redirect) setTimeout(() => (window.location.href = data.redirect), 1200);
      return;
    }

    setMsg(
      (data && data.message) || "We couldn't create your account. Please try again.",
      "is-error"
    );
  } catch {
    setMsg("We couldn't reach the server. Please check your connection and try again.", "is-error");
  } finally {
    setLoading(false);
  }
});
