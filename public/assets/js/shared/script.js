const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailField = document.getElementById("emailField");
const passwordField = document.getElementById("passwordField");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const toggleBtn = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const alertBox = document.getElementById("alert");
const alertTitle = document.getElementById("alertTitle");
const alertText = document.getElementById("alertText");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

toggleBtn.addEventListener("click", () => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  toggleBtn.classList.toggle("is-visible", show);
  toggleBtn.setAttribute("aria-pressed", String(show));
  toggleBtn.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

function setFieldError(field, errorEl, message) {
  field.classList.add("is-invalid");
  errorEl.textContent = message;
}

function clearFieldError(field, errorEl) {
  field.classList.remove("is-invalid");
  errorEl.textContent = "";
}

emailInput.addEventListener("input", () => clearFieldError(emailField, emailError));
passwordInput.addEventListener("input", () => clearFieldError(passwordField, passwordError));

function showAlert(title, text) {
  alertTitle.textContent = title;
  alertText.textContent = text;
  alertBox.hidden = false;
}

function hideAlert() {
  alertBox.hidden = true;
}

function validate() {
  let valid = true;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    setFieldError(emailField, emailError, "Email is required.");
    valid = false;
  } else if (!emailPattern.test(email)) {
    setFieldError(emailField, emailError, "Enter a valid email address.");
    valid = false;
  } else {
    clearFieldError(emailField, emailError);
  }

  if (!password) {
    setFieldError(passwordField, passwordError, "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    setFieldError(passwordField, passwordError, "Password must be at least 6 characters.");
    valid = false;
  } else {
    clearFieldError(passwordField, passwordError);
  }

  return valid;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = "/app/Dashboards/dashboard.php";
});
