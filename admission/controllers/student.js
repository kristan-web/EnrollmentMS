const STORAGE_KEY = "ems_students";

const tabs = document.querySelectorAll(".tab");
const activeCountEl = document.getElementById("activeCount");
const archivedCountEl = document.getElementById("archivedCount");
const searchInput = document.getElementById("searchInput");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentRows = document.getElementById("studentRows");
const emptyState = document.getElementById("emptyState");

const studentModal = document.getElementById("studentModal");
const studentForm = document.getElementById("studentForm");
const modalTitle = document.getElementById("modalTitle");
const closeStudentModal = document.getElementById("closeStudentModal");
const cancelStudentBtn = document.getElementById("cancelStudentBtn");

const archiveModal = document.getElementById("archiveModal");
const archiveName = document.getElementById("archiveName");
const archiveReason = document.getElementById("archiveReason");
const closeArchiveModal = document.getElementById("closeArchiveModal");
const cancelArchiveBtn = document.getElementById("cancelArchiveBtn");
const confirmArchiveBtn = document.getElementById("confirmArchiveBtn");

let students = load();
let currentTab = "active";
let editingId = null;
let archivingId = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
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

function fullName(s) {
  return `${s.lastName}, ${s.firstName}${s.middleName ? " " + s.middleName : ""}`;
}

function rowHtml(s) {
  const badge = s.status === "archived"
    ? `<span class="badge badge--archived">${esc(s.archiveReason)}</span>
       <span class="cell-sub">${esc(s.archivedAt || "")}</span>`
    : `<span class="badge badge--active">Active</span>`;

  const actions = s.status === "archived"
    ? `<button class="btn btn--ghost btn--sm" data-action="restore" data-id="${s.id}">Restore</button>`
    : `<button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.id}">Edit</button>
       <button class="btn btn--danger btn--sm" data-action="archive" data-id="${s.id}">Archive</button>`;

  return `<tr>
    <td><span class="cell-name">${esc(fullName(s))}</span><span class="cell-sub">${esc(s.address || "")}</span></td>
    <td>${esc(s.studentType)}</td>
    <td>${esc(s.gender)}</td>
    <td>${esc(s.age || "—")}</td>
    <td>${esc(s.contact || "—")}</td>
    <td>${badge}</td>
    <td><div class="row-actions">${actions}</div></td>
  </tr>`;
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const list = students
    .filter((s) => (currentTab === "archived" ? s.status === "archived" : s.status !== "archived"))
    .filter((s) => !q || fullName(s).toLowerCase().includes(q) || (s.contact || "").toLowerCase().includes(q));

  studentRows.innerHTML = list.map(rowHtml).join("");
  emptyState.hidden = list.length > 0;
  emptyState.textContent = q
    ? "No students match your search."
    : currentTab === "archived"
      ? "No archived students."
      : 'No students yet. Click "Add Student" to get started.';

  activeCountEl.textContent = students.filter((s) => s.status !== "archived").length;
  archivedCountEl.textContent = students.filter((s) => s.status === "archived").length;
}

function openStudentModal(s) {
  editingId = s ? s.id : null;
  modalTitle.textContent = s ? "Edit Student" : "Add Student";
  studentForm.reset();
  if (s) {
    for (const [key, value] of Object.entries(s)) {
      const field = studentForm.elements[key];
      if (field && typeof value === "string") field.value = value;
    }
  }
  studentModal.hidden = false;
  studentForm.elements.studentType.focus();
}

function hideModals() {
  studentModal.hidden = true;
  archiveModal.hidden = true;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    currentTab = tab.dataset.tab;
    render();
  });
});

searchInput.addEventListener("input", render);

addStudentBtn.addEventListener("click", () => openStudentModal());
closeStudentModal.addEventListener("click", hideModals);
cancelStudentBtn.addEventListener("click", hideModals);
closeArchiveModal.addEventListener("click", hideModals);
cancelArchiveBtn.addEventListener("click", hideModals);

[studentModal, archiveModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

studentForm.elements.birthDate.addEventListener("change", () => {
  const value = studentForm.elements.birthDate.value;
  if (!value) return;
  const dob = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  if (age >= 0) studentForm.elements.age.value = age;
});

studentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(studentForm));
  if (editingId) {
    const s = students.find((x) => x.id === editingId);
    Object.assign(s, data);
  } else {
    students.push({ id: Date.now().toString(36), status: "active", ...data });
  }
  persist();
  hideModals();
  render();
});

studentRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const s = students.find((x) => x.id === btn.dataset.id);
  if (!s) return;

  if (btn.dataset.action === "edit") {
    openStudentModal(s);
  } else if (btn.dataset.action === "archive") {
    archivingId = s.id;
    archiveName.textContent = fullName(s);
    archiveReason.value = "Transferred Out";
    archiveModal.hidden = false;
  } else if (btn.dataset.action === "restore") {
    s.status = "active";
    delete s.archiveReason;
    delete s.archivedAt;
    persist();
    render();
  }
});

confirmArchiveBtn.addEventListener("click", () => {
  const s = students.find((x) => x.id === archivingId);
  if (!s) return;
  s.status = "archived";
  s.archiveReason = archiveReason.value;
  s.archivedAt = new Date().toISOString().slice(0, 10);
  persist();
  hideModals();
  render();
});

render();
