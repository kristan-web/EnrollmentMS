const SUBJECTS_KEY = "ems_shs_subjects";
const PAGE_SIZE = 10;

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const gradeFilter = document.getElementById("gradeFilter");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectRows = document.getElementById("subjectRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectMsg = document.getElementById("subjectMsg");
const modalTitle = document.getElementById("modalTitle");
const closeSubjectModal = document.getElementById("closeSubjectModal");
const cancelSubjectBtn = document.getElementById("cancelSubjectBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let subjects = load();
let editingId = null;
let deletingId = null;
let currentPage = 1;

function load() {
  try {
    return JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
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

function setMsg(text, type) {
  subjectMsg.textContent = text;
  subjectMsg.classList.remove("is-error", "is-success");
  if (type) subjectMsg.classList.add(type);
}

function pageList(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const wanted = [...new Set([1, 2, current - 1, current, current + 1, pages - 1, pages])]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of wanted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function renderPagination(total, pages, start, shown) {
  if (total <= PAGE_SIZE) {
    pagination.hidden = true;
    return;
  }
  pagination.hidden = false;
  pageInfo.textContent = `Showing ${start + 1}–${start + shown} of ${total}`;
  const parts = [
    `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page">&lsaquo;</button>`
  ];
  for (const p of pageList(currentPage, pages)) {
    parts.push(p === "…"
      ? '<span class="page-ellipsis">…</span>'
      : `<button class="page-btn${p === currentPage ? " is-current" : ""}" data-page="${p}">${p}</button>`);
  }
  parts.push(
    `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""} aria-label="Next page">&rsaquo;</button>`
  );
  pageControls.innerHTML = parts.join("");
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const type = typeFilter.value;
  const grade = gradeFilter.value;

  const list = subjects
    .filter((s) => {
      if (type && s.type !== type) return false;
      if (grade && s.grade !== grade) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        (s.title || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.grade.localeCompare(b.grade) || a.code.localeCompare(b.code));

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  subjectRows.innerHTML = pageItems.map((s) => `<tr>
    <td><span class="chip">${esc(s.code)}</span></td>
    <td><span class="cell-name">${esc(s.title)}</span></td>
    <td>${esc(s.units)}</td>
    <td><span class="badge ${s.type === "Core" ? "badge--core" : "badge--specialized"}">${esc(s.type)}</span></td>
    <td><span class="chip">Grade ${esc(s.grade)}</span></td>
    <td>
      <div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.id}">Delete</button>
      </div>
    </td>
  </tr>`).join("");

  emptyState.hidden = total > 0;
  emptyState.textContent = q || type || grade
    ? "No subjects match your filters."
    : 'No subjects yet. Click "Add Subject" to get started.';

  renderPagination(total, pages, start, pageItems.length);
}

function openSubjectModal(s) {
  editingId = s ? s.id : null;
  modalTitle.textContent = s ? "Edit Subject" : "Add Subject";
  subjectForm.reset();
  setMsg("");
  if (s) {
    subjectForm.elements.code.value = s.code;
    subjectForm.elements.title.value = s.title;
    subjectForm.elements.units.value = s.units;
    subjectForm.elements.type.value = s.type;
    subjectForm.elements.grade.value = s.grade;
  } else {
    subjectForm.elements.type.selectedIndex = 0;
    subjectForm.elements.grade.selectedIndex = 0;
  }
  subjectModal.hidden = false;
  subjectForm.elements.code.focus();
}

function hideModals() {
  subjectModal.hidden = true;
  deleteModal.hidden = true;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});
[typeFilter, gradeFilter].forEach((el) => {
  el.addEventListener("change", () => {
    currentPage = 1;
    render();
  });
});
addSubjectBtn.addEventListener("click", () => openSubjectModal());
closeSubjectModal.addEventListener("click", hideModals);
cancelSubjectBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);

pageControls.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  currentPage = Number(btn.dataset.page);
  render();
});

[subjectModal, deleteModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

subjectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(subjectForm));
  const code = data.code.trim().toUpperCase().replace(/\s+/g, "");
  const title = data.title.trim();
  const units = parseInt(data.units, 10);
  const type = data.type || "";
  const grade = data.grade || "";

  if (!code || !title || !type || !grade) {
    return setMsg("All fields are required.", "is-error");
  }
  if (!/^[A-Z0-9-]{2,15}$/.test(code)) {
    return setMsg("Subject code must be 2-15 letters, numbers, or dashes.", "is-error");
  }
  if (Number.isNaN(units) || units < 1 || units > 10) {
    return setMsg("Units must be a number between 1 and 10.", "is-error");
  }
  const codeTaken = subjects.some((s) =>
    s.id !== editingId && s.code.toUpperCase() === code
  );
  if (codeTaken) {
    return setMsg("That subject code already exists.", "is-error");
  }

  if (editingId) {
    const s = subjects.find((x) => x.id === editingId);
    s.code = code;
    s.title = title;
    s.units = units;
    s.type = type;
    s.grade = grade;
  } else {
    subjects.push({
      id: Date.now().toString(36),
      code,
      title,
      units,
      type,
      grade
    });
  }
  persist();
  hideModals();
  render();
});

subjectRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const s = subjects.find((x) => x.id === btn.dataset.id);
  if (!s) return;

  if (btn.dataset.action === "edit") {
    openSubjectModal(s);
  } else {
    deletingId = s.id;
    deleteName.textContent = `${s.code} — ${s.title}`;
    deleteModal.hidden = false;
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  subjects = subjects.filter((x) => x.id !== deletingId);
  persist();
  hideModals();
  render();
});

render();
