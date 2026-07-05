const SECTIONS_KEY = "ems_sections";
const STRANDS_KEY = "ems_strands";
const TEACHERS_KEY = "ems_teachers";
const ENROLL_KEY = "ems_enrollments";
const PURGE_FLAG = "ems_sections_purged_v1";
const PAGE_SIZE = 10;

const searchInput = document.getElementById("searchInput");
const gradeFilter = document.getElementById("gradeFilter");
const addSectionBtn = document.getElementById("addSectionBtn");
const sectionRows = document.getElementById("sectionRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const sectionModal = document.getElementById("sectionModal");
const sectionForm = document.getElementById("sectionForm");
const sectionMsg = document.getElementById("sectionMsg");
const modalTitle = document.getElementById("modalTitle");
const closeSectionModal = document.getElementById("closeSectionModal");
const cancelSectionBtn = document.getElementById("cancelSectionBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const deleteNote = document.getElementById("deleteNote");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let sections = loadSections();
let editingId = null;
let deletingId = null;
let currentPage = 1;
let lastSuggestedName = "";

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function loadSections() {
  const stored = loadJson(SECTIONS_KEY);
  if (localStorage.getItem(PURGE_FLAG)) return stored;
  const seedLike = (s) =>
    /^sec-\d+$/.test(s.id) &&
    /^(STEM|ABM|HUMSS|GAS|TVL) (11|12)-[AB]$/.test(s.name) &&
    !s.adviserId;
  const cleaned = stored.filter((s) => !seedLike(s));
  if (cleaned.length !== stored.length) {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(cleaned));
  }
  localStorage.setItem(PURGE_FLAG, "1");
  return cleaned;
}

function persist() {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
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

function strandCodes() {
  return loadJson(STRANDS_KEY).map((s) => s.code);
}

function teacherName(t) {
  return `${t.lastName}, ${t.firstName}`;
}

function enrolledCount(sectionId) {
  return loadJson(ENROLL_KEY).filter((e) => e.sectionId === sectionId && e.status === "Enrolled").length;
}

function enrollmentRecords(sectionId) {
  return loadJson(ENROLL_KEY).filter((e) => e.sectionId === sectionId).length;
}

function setMsg(text, type) {
  sectionMsg.textContent = text;
  sectionMsg.classList.remove("is-error", "is-success");
  if (type) sectionMsg.classList.add(type);
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
  const grade = gradeFilter.value;
  const teachers = loadJson(TEACHERS_KEY);

  const list = sections
    .filter((sec) => {
      if (grade && sec.grade !== grade) return false;
      if (!q) return true;
      const adviser = sec.adviserId ? teachers.find((t) => t.id === sec.adviserId) : null;
      return (
        sec.name.toLowerCase().includes(q) ||
        (sec.strand || "").toLowerCase().includes(q) ||
        (adviser ? teacherName(adviser).toLowerCase().includes(q) : false)
      );
    })
    .sort((a, b) => a.grade.localeCompare(b.grade) || a.name.localeCompare(b.name));

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  sectionRows.innerHTML = pageItems.map((sec) => {
    const adviser = sec.adviserId ? teachers.find((t) => t.id === sec.adviserId) : null;
    const enrolled = enrolledCount(sec.id);
    const adviserCell = adviser
      ? `<div class="avatar-cell">
           <span class="avatar">${esc(`${(adviser.firstName || "?")[0]}${(adviser.lastName || "?")[0]}`.toUpperCase())}</span>
           <span class="cell-name">${esc(teacherName(adviser))}</span>
         </div>`
      : "—";
    return `<tr>
      <td><span class="chip">Grade ${esc(sec.grade)}</span></td>
      <td>
        <span class="cell-name">${esc(sec.name)}</span>
        <span class="cell-sub">${esc(sec.strand || "—")} · ${enrolled}/${esc(sec.capacity)} enrolled</span>
      </td>
      <td>${adviserCell}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${sec.id}">Edit</button>
          <button class="btn btn--danger btn--sm" data-action="delete" data-id="${sec.id}">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  emptyState.hidden = total > 0;
  emptyState.textContent = q || grade
    ? "No sections match your filters."
    : 'No sections yet. Click "Add Section" to get started.';

  renderPagination(total, pages, start, pageItems.length);
}

function fillStrandOptions(selected) {
  const select = sectionForm.elements.strand;
  const codes = strandCodes();
  if (!codes.length) {
    select.innerHTML = '<option value="" disabled selected>No strands yet — add strands first</option>';
    return;
  }
  select.innerHTML = '<option value="" disabled>Select strand</option>' +
    codes.map((code) => `<option value="${esc(code)}">${esc(code)}</option>`).join("");
  select.value = selected || "";
}

function fillAdviserOptions(selected) {
  const select = sectionForm.elements.adviserId;
  const teachers = loadJson(TEACHERS_KEY)
    .slice()
    .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
  select.innerHTML = '<option value="">— No adviser —</option>' +
    teachers.map((t) => `<option value="${esc(t.id)}">${esc(teacherName(t))}</option>`).join("");
  select.value = selected || "";
  if (select.value !== (selected || "")) select.value = "";
}

function suggestName() {
  const strand = sectionForm.elements.strand.value;
  const grade = sectionForm.elements.grade.value;
  if (!strand || !grade) return "";
  const prefix = `${strand} ${grade}-`;
  const used = sections
    .filter((s) => s.id !== editingId && s.name.startsWith(prefix))
    .map((s) => s.name.slice(prefix.length))
    .filter((suffix) => /^[A-Z]$/.test(suffix));
  let letter = "A";
  while (used.includes(letter) && letter !== "Z") {
    letter = String.fromCharCode(letter.charCodeAt(0) + 1);
  }
  return prefix + letter;
}

function maybeSuggestName() {
  const nameField = sectionForm.elements.name;
  if (nameField.value && nameField.value !== lastSuggestedName) return;
  lastSuggestedName = suggestName();
  nameField.value = lastSuggestedName;
}

function openSectionModal(sec) {
  editingId = sec ? sec.id : null;
  lastSuggestedName = "";
  modalTitle.textContent = sec ? "Edit Section" : "Add Section";
  sectionForm.reset();
  setMsg("");
  fillStrandOptions(sec ? sec.strand : "");
  fillAdviserOptions(sec ? sec.adviserId : "");
  if (sec) {
    sectionForm.elements.grade.value = sec.grade;
    sectionForm.elements.name.value = sec.name;
    sectionForm.elements.capacity.value = sec.capacity;
  } else {
    sectionForm.elements.grade.selectedIndex = 0;
    sectionForm.elements.capacity.value = 40;
  }
  sectionModal.hidden = false;
  sectionForm.elements.grade.focus();
}

function hideModals() {
  sectionModal.hidden = true;
  deleteModal.hidden = true;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});
gradeFilter.addEventListener("change", () => {
  currentPage = 1;
  render();
});
addSectionBtn.addEventListener("click", () => openSectionModal());
closeSectionModal.addEventListener("click", hideModals);
cancelSectionBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);

pageControls.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  currentPage = Number(btn.dataset.page);
  render();
});

sectionForm.elements.strand.addEventListener("change", maybeSuggestName);
sectionForm.elements.grade.addEventListener("change", maybeSuggestName);

[sectionModal, deleteModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

sectionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(sectionForm));
  const grade = data.grade || "";
  const strand = data.strand || "";
  const name = data.name.trim();
  const capacity = parseInt(data.capacity, 10);

  if (!grade || !strand || !name) {
    return setMsg("Year level, strand, and section name are required.", "is-error");
  }
  if (Number.isNaN(capacity) || capacity < 1 || capacity > 100) {
    return setMsg("Capacity must be a number between 1 and 100.", "is-error");
  }
  const nameTaken = sections.some((s) =>
    s.id !== editingId && s.name.toLowerCase() === name.toLowerCase()
  );
  if (nameTaken) {
    return setMsg("A section with that name already exists.", "is-error");
  }
  if (editingId) {
    const enrolled = enrolledCount(editingId);
    if (capacity < enrolled) {
      return setMsg(`${enrolled} student${enrolled === 1 ? " is" : "s are"} currently enrolled — capacity cannot be lower than that.`, "is-error");
    }
  }

  if (editingId) {
    const sec = sections.find((x) => x.id === editingId);
    sec.grade = grade;
    sec.strand = strand;
    sec.name = name;
    sec.capacity = capacity;
    sec.adviserId = data.adviserId || "";
  } else {
    sections.push({
      id: "sec-" + Date.now().toString(36),
      name,
      strand,
      grade,
      capacity,
      adviserId: data.adviserId || ""
    });
  }
  persist();
  hideModals();
  render();
});

sectionRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const sec = sections.find((x) => x.id === btn.dataset.id);
  if (!sec) return;

  if (btn.dataset.action === "edit") {
    openSectionModal(sec);
  } else {
    deletingId = sec.id;
    deleteName.textContent = `${sec.name} (Grade ${sec.grade})`;
    const records = enrollmentRecords(sec.id);
    deleteNote.textContent = records > 0
      ? `${records} enrollment record${records === 1 ? "" : "s"} reference${records === 1 ? "s" : ""} this section. Deleting it will not remove those records, and this cannot be undone.`
      : "This permanently removes the section. This cannot be undone.";
    deleteModal.hidden = false;
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  sections = sections.filter((x) => x.id !== deletingId);
  persist();
  hideModals();
  render();
});

render();
