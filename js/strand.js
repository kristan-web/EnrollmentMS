const STRANDS_KEY = "ems_strands";
const SECTIONS_KEY = "ems_sections";
const PURGE_FLAG = "ems_strands_purged_v1";
const PAGE_SIZE = 10;

const SEEDED_STRANDS = new Map([
  ["STEM", "Science, Technology, Engineering, and Mathematics"],
  ["ABM", "Accountancy, Business, and Management"],
  ["HUMSS", "Humanities and Social Sciences"],
  ["GAS", "General Academic Strand"],
  ["TVL", "Technical-Vocational-Livelihood"]
]);

const searchInput = document.getElementById("searchInput");
const addStrandBtn = document.getElementById("addStrandBtn");
const strandRows = document.getElementById("strandRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const strandModal = document.getElementById("strandModal");
const strandForm = document.getElementById("strandForm");
const strandMsg = document.getElementById("strandMsg");
const modalTitle = document.getElementById("modalTitle");
const closeStrandModal = document.getElementById("closeStrandModal");
const cancelStrandBtn = document.getElementById("cancelStrandBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const deleteNote = document.getElementById("deleteNote");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let strands = load();
let editingId = null;
let deletingId = null;
let currentPage = 1;

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function load() {
  const stored = loadJson(STRANDS_KEY);
  if (localStorage.getItem(PURGE_FLAG)) return stored;
  const cleaned = stored.filter((s) => SEEDED_STRANDS.get(s.code) !== s.name);
  if (cleaned.length !== stored.length) {
    localStorage.setItem(STRANDS_KEY, JSON.stringify(cleaned));
  }
  localStorage.setItem(PURGE_FLAG, "1");
  return cleaned;
}

function persist() {
  localStorage.setItem(STRANDS_KEY, JSON.stringify(strands));
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

function sectionCount(code) {
  return loadJson(SECTIONS_KEY).filter((s) => s.strand === code).length;
}

function setMsg(text, type) {
  strandMsg.textContent = text;
  strandMsg.classList.remove("is-error", "is-success");
  if (type) strandMsg.classList.add(type);
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
  const list = strands
    .filter((s) =>
      !q ||
      s.code.toLowerCase().includes(q) ||
      (s.name || "").toLowerCase().includes(q)
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  strandRows.innerHTML = pageItems.map((s) => `<tr>
    <td><span class="chip">${esc(s.code)}</span></td>
    <td><span class="cell-name">${esc(s.name)}</span></td>
    <td>
      <div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.id}">Delete</button>
      </div>
    </td>
  </tr>`).join("");

  emptyState.hidden = total > 0;
  emptyState.textContent = q
    ? "No strands match your search."
    : 'No strands yet. Click "Add Strand" to get started.';

  renderPagination(total, pages, start, pageItems.length);
}

function openStrandModal(s) {
  editingId = s ? s.id : null;
  modalTitle.textContent = s ? "Edit Strand" : "Add Strand";
  strandForm.reset();
  setMsg("");
  if (s) {
    strandForm.elements.code.value = s.code;
    strandForm.elements.name.value = s.name;
  }
  strandModal.hidden = false;
  strandForm.elements.code.focus();
}

function hideModals() {
  strandModal.hidden = true;
  deleteModal.hidden = true;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});
addStrandBtn.addEventListener("click", () => openStrandModal());
closeStrandModal.addEventListener("click", hideModals);
cancelStrandBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);

pageControls.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  currentPage = Number(btn.dataset.page);
  render();
});

[strandModal, deleteModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

strandForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(strandForm));
  const code = data.code.trim().toUpperCase().replace(/\s+/g, "");
  const name = data.name.trim();

  if (!code || !name) {
    return setMsg("Strand code and strand name are required.", "is-error");
  }
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) {
    return setMsg("Strand code must be 2-12 letters, numbers, or dashes.", "is-error");
  }
  const codeTaken = strands.some((s) =>
    s.id !== editingId && s.code.toUpperCase() === code
  );
  if (codeTaken) {
    return setMsg("That strand code already exists.", "is-error");
  }

  if (editingId) {
    const s = strands.find((x) => x.id === editingId);
    s.code = code;
    s.name = name;
  } else {
    strands.push({ id: Date.now().toString(36), code, name });
  }
  persist();
  hideModals();
  render();
});

strandRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const s = strands.find((x) => x.id === btn.dataset.id);
  if (!s) return;

  if (btn.dataset.action === "edit") {
    openStrandModal(s);
  } else {
    deletingId = s.id;
    deleteName.textContent = `${s.code} — ${s.name}`;
    const count = sectionCount(s.code);
    deleteNote.textContent = count > 0
      ? `${count} section${count === 1 ? "" : "s"} currently use${count === 1 ? "s" : ""} this strand. Deleting it will not remove those sections, and this cannot be undone.`
      : "This permanently removes the strand. This cannot be undone.";
    deleteModal.hidden = false;
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  strands = strands.filter((x) => x.id !== deletingId);
  persist();
  hideModals();
  render();
});

render();
