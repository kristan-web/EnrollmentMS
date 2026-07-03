const TEACHERS_KEY = "ems_teachers";

const searchInput = document.getElementById("searchInput");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const teacherRows = document.getElementById("teacherRows");
const emptyState = document.getElementById("emptyState");

const teacherModal = document.getElementById("teacherModal");
const teacherForm = document.getElementById("teacherForm");
const teacherMsg = document.getElementById("teacherMsg");
const modalTitle = document.getElementById("modalTitle");
const closeTeacherModal = document.getElementById("closeTeacherModal");
const cancelTeacherBtn = document.getElementById("cancelTeacherBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let teachers = load();
let editingId = null;
let deletingId = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(TEACHERS_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
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

function fullName(t) {
  return `${t.lastName}, ${t.firstName}`;
}

function nextTeacherId() {
  const max = teachers.reduce((m, t) => {
    const n = parseInt((t.teacherId || "").split("-")[1], 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "TCH-" + String(max + 1).padStart(4, "0");
}

function setMsg(text, type) {
  teacherMsg.textContent = text;
  teacherMsg.classList.remove("is-error", "is-success");
  if (type) teacherMsg.classList.add(type);
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const list = teachers.filter((t) =>
    !q ||
    fullName(t).toLowerCase().includes(q) ||
    (t.email || "").toLowerCase().includes(q) ||
    (t.specialization || "").toLowerCase().includes(q) ||
    (t.teacherId || "").toLowerCase().includes(q)
  );

  teacherRows.innerHTML = list.map((t) => `<tr>
    <td>${esc(t.teacherId)}</td>
    <td>
      <div class="avatar-cell">
        <span class="avatar">${esc(`${(t.firstName || "?")[0]}${(t.lastName || "?")[0]}`.toUpperCase())}</span>
        <span class="cell-name">${esc(fullName(t))}</span>
      </div>
    </td>
    <td>${esc(t.email || "—")}</td>
    <td>${esc(t.contact || "—")}</td>
    <td>${t.specialization ? `<span class="chip">${esc(t.specialization)}</span>` : "—"}</td>
    <td>
      <div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${t.id}">Edit</button>
        <button class="btn btn--danger btn--sm" data-action="delete" data-id="${t.id}">Delete</button>
      </div>
    </td>
  </tr>`).join("");

  emptyState.hidden = list.length > 0;
  emptyState.textContent = q
    ? "No teachers match your search."
    : 'No teachers yet. Click "Add Teacher" to get started.';
}

function openTeacherModal(t) {
  editingId = t ? t.id : null;
  modalTitle.textContent = t ? "Edit Teacher" : "Add Teacher";
  teacherForm.reset();
  setMsg("");
  if (t) {
    for (const [key, value] of Object.entries(t)) {
      const field = teacherForm.elements[key];
      if (field && typeof value === "string") field.value = value;
    }
  }
  teacherModal.hidden = false;
  teacherForm.elements.firstName.focus();
}

function hideModals() {
  teacherModal.hidden = true;
  deleteModal.hidden = true;
}

searchInput.addEventListener("input", render);
addTeacherBtn.addEventListener("click", () => openTeacherModal());
closeTeacherModal.addEventListener("click", hideModals);
cancelTeacherBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);

[teacherModal, deleteModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

teacherForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(teacherForm));
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const email = data.email.trim();

  if (!firstName || !lastName) {
    return setMsg("First name and last name are required.", "is-error");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return setMsg("Please enter a valid email address.", "is-error");
  }
  const emailTaken = teachers.some((t) =>
    t.id !== editingId && email && (t.email || "").toLowerCase() === email.toLowerCase()
  );
  if (emailTaken) {
    return setMsg("Another teacher already uses that email.", "is-error");
  }

  if (editingId) {
    const t = teachers.find((x) => x.id === editingId);
    Object.assign(t, data, { firstName, lastName, email });
  } else {
    teachers.push({
      id: Date.now().toString(36),
      teacherId: nextTeacherId(),
      ...data,
      firstName,
      lastName,
      email
    });
  }
  persist();
  hideModals();
  render();
});

teacherRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const t = teachers.find((x) => x.id === btn.dataset.id);
  if (!t) return;

  if (btn.dataset.action === "edit") {
    openTeacherModal(t);
  } else {
    deletingId = t.id;
    deleteName.textContent = `${fullName(t)} (${t.teacherId})`;
    deleteModal.hidden = false;
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  teachers = teachers.filter((x) => x.id !== deletingId);
  persist();
  hideModals();
  render();
});

render();
