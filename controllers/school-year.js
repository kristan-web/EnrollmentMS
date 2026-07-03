const SY_KEY = "ems_school_years";
const ENROLL_KEY = "ems_enrollments";

const searchInput = document.getElementById("searchInput");
const addSyBtn = document.getElementById("addSyBtn");
const syRows = document.getElementById("syRows");
const emptyState = document.getElementById("emptyState");

const activeSy = document.getElementById("activeSy");
const activeSyLabel = document.getElementById("activeSyLabel");
const activeSyHint = document.getElementById("activeSyHint");

const syModal = document.getElementById("syModal");
const syForm = document.getElementById("syForm");
const syMsg = document.getElementById("syMsg");
const closeSyModal = document.getElementById("closeSyModal");
const cancelSyBtn = document.getElementById("cancelSyBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmName = document.getElementById("confirmName");
const confirmNote = document.getElementById("confirmNote");
const closeConfirmModal = document.getElementById("closeConfirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmActionBtn = document.getElementById("confirmActionBtn");

let years = load();
let pendingAction = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(SY_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(SY_KEY, JSON.stringify(years));
}

function loadEnrollments() {
  try {
    return JSON.parse(localStorage.getItem(ENROLL_KEY)) || [];
  } catch {
    return [];
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function enrollCount(year) {
  return loadEnrollments().filter((e) => e.schoolYear === year).length;
}

function activeYear() {
  return years.find((y) => y.status === "active");
}

function suggestYear() {
  const starts = years
    .map((y) => parseInt(y.year.split("-")[0], 10))
    .filter((n) => !Number.isNaN(n));
  const start = starts.length ? Math.max(...starts) + 1 : new Date().getFullYear();
  return `${start}-${start + 1}`;
}

function setMsg(text, type) {
  syMsg.textContent = text;
  syMsg.classList.remove("is-error", "is-success");
  if (type) syMsg.classList.add(type);
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const list = years
    .filter((y) => !q || y.year.toLowerCase().includes(q) || y.status.includes(q))
    .sort((a, b) => b.year.localeCompare(a.year));

  syRows.innerHTML = list.map((y) => {
    const isActive = y.status === "active";
    const count = enrollCount(y.year);
    const actions = isActive
      ? `<button class="btn btn--ghost btn--sm" data-action="close" data-id="${y.id}">Close</button>`
      : `<button class="btn btn--primary btn--sm" data-action="open" data-id="${y.id}">Open</button>
         <button class="btn btn--danger btn--sm" data-action="delete" data-id="${y.id}">Delete</button>`;
    return `<tr class="${isActive ? "sy-row--active" : ""}">
      <td><span class="cell-name">${esc(y.year)}</span></td>
      <td><span class="badge ${isActive ? "badge--active" : "badge--closed"}">${isActive ? "Active" : "Closed"}</span></td>
      <td><span class="chip">${count}</span></td>
      <td><div class="row-actions">${actions}</div></td>
    </tr>`;
  }).join("");

  emptyState.hidden = list.length > 0;
  emptyState.textContent = q
    ? "No school years match your search."
    : 'No school years yet. Click "Add School Year" to get started.';

  const active = activeYear();
  activeSy.classList.toggle("active-sy--none", !active);
  if (active) {
    activeSyLabel.textContent = `Active School Year: ${active.year}`;
    activeSyHint.textContent = "New enrollments fall under this academic year.";
  } else {
    activeSyLabel.textContent = "No active school year";
    activeSyHint.textContent = "Open a school year to activate it for enrollment.";
  }
}

function openSyModal() {
  syForm.reset();
  setMsg("");
  syForm.elements.year.value = suggestYear();
  syForm.elements.makeActive.checked = !activeYear();
  syModal.hidden = false;
  syForm.elements.year.focus();
  syForm.elements.year.select();
}

function openConfirm(title, name, note, actionLabel, danger, onConfirm) {
  confirmTitle.textContent = title;
  confirmName.textContent = name;
  confirmNote.textContent = note;
  confirmActionBtn.textContent = actionLabel;
  confirmActionBtn.className = "btn " + (danger ? "btn--danger" : "btn--primary");
  pendingAction = onConfirm;
  confirmModal.hidden = false;
}

function hideModals() {
  syModal.hidden = true;
  confirmModal.hidden = true;
  pendingAction = null;
}

searchInput.addEventListener("input", render);
addSyBtn.addEventListener("click", openSyModal);
closeSyModal.addEventListener("click", hideModals);
cancelSyBtn.addEventListener("click", hideModals);
closeConfirmModal.addEventListener("click", hideModals);
cancelConfirmBtn.addEventListener("click", hideModals);

[syModal, confirmModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

confirmActionBtn.addEventListener("click", () => {
  const action = pendingAction;
  hideModals();
  if (action) action();
});

syForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(syForm));
  const match = (data.year || "").trim().match(/^(\d{4})\s*-\s*(\d{4})$/);

  if (!match) {
    return setMsg("Use the format YYYY-YYYY, e.g. 2026-2027.", "is-error");
  }
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (end !== start + 1) {
    return setMsg("A school year must span two consecutive years.", "is-error");
  }
  const year = `${start}-${end}`;
  if (years.some((y) => y.year === year)) {
    return setMsg("That school year already exists.", "is-error");
  }

  const makeActive = Boolean(data.makeActive);
  if (makeActive) {
    years.forEach((y) => { y.status = "closed"; });
  }
  years.push({
    id: Date.now().toString(36),
    year,
    status: makeActive ? "active" : "closed"
  });
  persist();
  hideModals();
  render();
});

syRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const y = years.find((x) => x.id === btn.dataset.id);
  if (!y) return;

  if (btn.dataset.action === "open") {
    const current = activeYear();
    openConfirm(
      "Open School Year",
      `A.Y ${y.year}`,
      current
        ? `This will close A.Y ${current.year} — only one school year can be active at a time.`
        : "This school year will become active, and new enrollments will fall under it.",
      "Open School Year",
      false,
      () => {
        years.forEach((x) => { x.status = x.id === y.id ? "active" : "closed"; });
        persist();
        render();
      }
    );
  } else if (btn.dataset.action === "close") {
    openConfirm(
      "Close School Year",
      `A.Y ${y.year}`,
      "No school year will be active until you open another one.",
      "Close School Year",
      true,
      () => {
        y.status = "closed";
        persist();
        render();
      }
    );
  } else {
    const count = enrollCount(y.year);
    openConfirm(
      "Delete School Year",
      `A.Y ${y.year}`,
      count > 0
        ? `This school year has ${count} enrollment record${count === 1 ? "" : "s"}. Deleting it will not remove those records, and this cannot be undone.`
        : "This permanently removes the school year. This cannot be undone.",
      "Delete",
      true,
      () => {
        years = years.filter((x) => x.id !== y.id);
        persist();
        render();
      }
    );
  }
});

render();
