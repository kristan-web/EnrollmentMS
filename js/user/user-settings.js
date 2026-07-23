const ACCOUNTS_KEY = "ems_accounts";

const createForm = document.getElementById("createForm");
const createMsg = document.getElementById("createMsg");
const changeForm = document.getElementById("changeForm");
const changeMsg = document.getElementById("changeMsg");

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';

function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function setMsg(el, text, type) {
  el.textContent = text;
  el.classList.remove("is-error", "is-success");
  if (type) el.classList.add(type);
}

const STRENGTH_LABELS = [" ", "Weak", "Fair", "Good", "Strong"];

function strengthScore(pw) {
  if (!pw) return 0;
  if (pw.length < 6) return 1;
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

function bindStrength(input, meter) {
  const label = meter.querySelector(".strength__label");
  const update = () => {
    const level = strengthScore(input.value);
    meter.dataset.level = level;
    label.textContent = STRENGTH_LABELS[level];
  };
  input.addEventListener("input", update);
  return update;
}

const updateCreateStrength = bindStrength(
  createForm.elements.passwordCreation,
  document.getElementById("createStrength")
);
const updateChangeStrength = bindStrength(
  changeForm.elements.newPassword,
  document.getElementById("changeStrength")
);

document.querySelectorAll(".pw-toggle").forEach((btn) => {
  btn.innerHTML = EYE;
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.innerHTML = show ? EYE_OFF : EYE;
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(createForm));
  const name = data.name.trim();
  const username = data.username.trim();

  if (!name || !username || !data.password || !data.confirmPassword) {
    return setMsg(createMsg, "Please fill in all fields.", "is-error");
  }
  if (data.password.length < 6) {
    return setMsg(createMsg, "Password must be at least 6 characters.", "is-error");
  }
  if (data.password !== data.confirmPassword) {
    return setMsg(createMsg, "Passwords do not match.", "is-error");
  }

  const accounts = loadAccounts();
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    return setMsg(createMsg, "That username is already taken.", "is-error");
  }

  accounts.push({ name, username, password: data.password });
  saveAccounts(accounts);
  createForm.reset();
  updateCreateStrength();
  setMsg(createMsg, `Account created for "${username}".`, "is-success");
});

changeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(changeForm));
  const username = data.username.trim();

  if (!username || !data.oldPassword || !data.newPassword || !data.confirmPassword) {
    return setMsg(changeMsg, "Please fill in all fields.", "is-error");
  }

  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());

  if (!account) {
    return setMsg(changeMsg, "No account found with that username.", "is-error");
  }
  if (account.password !== data.oldPassword) {
    return setMsg(changeMsg, "Old password is incorrect.", "is-error");
  }
  if (data.newPassword.length < 6) {
    return setMsg(changeMsg, "New password must be at least 6 characters.", "is-error");
  }
  if (data.newPassword === data.oldPassword) {
    return setMsg(changeMsg, "New password must be different from the old one.", "is-error");
  }
  if (data.newPassword !== data.confirmPassword) {
    return setMsg(changeMsg, "Passwords do not match.", "is-error");
  }

  account.password = data.newPassword;
  saveAccounts(accounts);
  changeForm.reset();
  updateChangeStrength();
  setMsg(changeMsg, "Password updated successfully.", "is-success");
});
