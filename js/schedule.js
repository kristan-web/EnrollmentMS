const SCHEDULES_KEY = "ems_schedules";
const SECTIONS_KEY = "ems_sections";
const SUBJECTS_KEY = "ems_shs_subjects";
const TEACHERS_KEY = "ems_teachers";
const SY_KEY = "ems_school_years";
const PAGE_SIZE = 10;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTERS = { Mon: "M", Tue: "T", Wed: "W", Thu: "Th", Fri: "F", Sat: "S" };

const searchInput = document.getElementById("searchInput");
const termFilter = document.getElementById("termFilter");
const sectionFilter = document.getElementById("sectionFilter");
const addSchedBtn = document.getElementById("addSchedBtn");
const printPreviewBtn = document.getElementById("printPreviewBtn");
const schedRows = document.getElementById("schedRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const schedModal = document.getElementById("schedModal");
const schedForm = document.getElementById("schedForm");
const schedMsg = document.getElementById("schedMsg");
const modalTitle = document.getElementById("modalTitle");
const closeSchedModal = document.getElementById("closeSchedModal");
const cancelSchedBtn = document.getElementById("cancelSchedBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const printModal = document.getElementById("printModal");
const closePrintModal = document.getElementById("closePrintModal");
const printSection = document.getElementById("printSection");
const printTerm = document.getElementById("printTerm");
const printBtn = document.getElementById("printBtn");
const printSheet = document.getElementById("printSheet");

let schedules = load();
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
  return loadJson(SCHEDULES_KEY);
}

function persist() {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
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

function sections() {
  return loadJson(SECTIONS_KEY);
}

function subjects() {
  return loadJson(SUBJECTS_KEY);
}

function teacherName(t) {
  return `${t.lastName}, ${t.firstName}`;
}

function adviserName(sec) {
  if (!sec || !sec.adviserId) return "—";
  const t = loadJson(TEACHERS_KEY).find((x) => x.id === sec.adviserId);
  return t ? teacherName(t) : "—";
}

function activeSchoolYear() {
  const sy = loadJson(SY_KEY).find((y) => y.status === "active");
  return sy ? sy.year : "";
}

function fmtTime(t) {
  const [h, m] = (t || "0:0").split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function shortDays(days) {
  return DAYS.filter((d) => days.includes(d)).map((d) => DAY_LETTERS[d]).join("");
}

function fullDays(days) {
  return DAYS.filter((d) => days.includes(d)).join(", ");
}

function shortTerm(term) {
  return term === "1st Semester" ? "1st Sem" : "2nd Sem";
}

function overlaps(a, b) {
  return a.from < b.to && b.from < a.to;
}

function sharesDay(a, b) {
  return a.days.some((d) => b.days.includes(d));
}

function setMsg(text, type) {
  schedMsg.textContent = text;
  schedMsg.classList.remove("is-error", "is-success");
  if (type) schedMsg.classList.add(type);
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

function fillSectionFilter() {
  const opts = sections()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`)
    .join("");
  sectionFilter.innerHTML = '<option value="">All Sections</option>' + opts;
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const term = termFilter.value;
  const sectionId = sectionFilter.value;
  const secList = sections();
  const subList = subjects();
  const teachers = loadJson(TEACHERS_KEY);

  const enriched = schedules.map((entry) => {
    const sec = secList.find((s) => s.id === entry.sectionId);
    const sub = subList.find((s) => s.id === entry.subjectId);
    const adviser = sec && sec.adviserId ? teachers.find((t) => t.id === sec.adviserId) : null;
    return { entry, sec, sub, adviser };
  });

  const list = enriched
    .filter(({ entry, sec, sub, adviser }) => {
      if (term && entry.term !== term) return false;
      if (sectionId && entry.sectionId !== sectionId) return false;
      if (!q) return true;
      return (
        (sub && (sub.code.toLowerCase().includes(q) || sub.title.toLowerCase().includes(q))) ||
        (sec && (sec.name.toLowerCase().includes(q) || (sec.strand || "").toLowerCase().includes(q))) ||
        (adviser && teacherName(adviser).toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const nameA = a.sec ? a.sec.name : "";
      const nameB = b.sec ? b.sec.name : "";
      return nameA.localeCompare(nameB) ||
        a.entry.term.localeCompare(b.entry.term) ||
        DAYS.indexOf(a.entry.days[0]) - DAYS.indexOf(b.entry.days[0]) ||
        a.entry.from.localeCompare(b.entry.from);
    });

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  schedRows.innerHTML = pageItems.map(({ entry, sec, sub, adviser }) => `<tr>
    <td>${sub ? `<span class="badge ${sub.type === "Core" ? "badge--core" : "badge--specialized"}">${esc(sub.type)}</span>` : "—"}</td>
    <td>${sec ? esc(sec.strand || "—") : "—"}</td>
    <td>
      <span class="cell-name">${sec ? "Grade " + esc(sec.grade) : "—"}</span>
      <span class="cell-sub">${esc(shortTerm(entry.term))}</span>
    </td>
    <td>${sec ? esc(sec.name) : "—"}</td>
    <td>${adviser ? esc(teacherName(adviser)) : "—"}</td>
    <td>
      ${sub ? `<span class="chip">${esc(sub.code)}</span><span class="cell-sub">${esc(sub.title)}</span>` : "—"}
    </td>
    <td><span class="chip" title="${esc(fullDays(entry.days))}">${esc(shortDays(entry.days))}</span></td>
    <td>${esc(fmtTime(entry.from))} – ${esc(fmtTime(entry.to))}</td>
    <td>
      <div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${entry.id}">Edit</button>
        <button class="btn btn--danger btn--sm" data-action="delete" data-id="${entry.id}">Delete</button>
      </div>
    </td>
  </tr>`).join("");

  emptyState.hidden = total > 0;
  emptyState.textContent = q || term || sectionId
    ? "No schedules match your filters."
    : 'No schedules yet. Click "Add Schedule" to get started.';

  renderPagination(total, pages, start, pageItems.length);
}

function fillModalSections(selected) {
  const select = schedForm.elements.sectionId;
  const secList = sections().slice().sort((a, b) => a.name.localeCompare(b.name));
  if (!secList.length) {
    select.innerHTML = '<option value="" disabled selected>No sections yet — add sections first</option>';
    return;
  }
  select.innerHTML = '<option value="" disabled>Select section</option>' +
    secList.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} (Grade ${esc(s.grade)} · ${esc(s.strand)})</option>`).join("");
  select.value = selected || "";
}

function fillModalSubjects(selected) {
  const select = schedForm.elements.subjectId;
  const sec = sections().find((s) => s.id === schedForm.elements.sectionId.value);
  if (!sec) {
    select.innerHTML = '<option value="" disabled selected>Select a section first</option>';
    return;
  }
  const subList = subjects()
    .filter((s) => s.grade === sec.grade)
    .sort((a, b) => a.code.localeCompare(b.code));
  if (!subList.length) {
    select.innerHTML = `<option value="" disabled selected>No Grade ${esc(sec.grade)} subjects — add SHS subjects first</option>`;
    return;
  }
  select.innerHTML = '<option value="" disabled>Select subject</option>' +
    subList.map((s) => `<option value="${esc(s.id)}">${esc(s.code)} — ${esc(s.title)} (${esc(s.type)})</option>`).join("");
  select.value = selected || "";
  if (select.value !== (selected || "")) select.selectedIndex = 0;
}

function setDays(days) {
  schedForm.querySelectorAll('input[name="days"]').forEach((box) => {
    box.checked = days.includes(box.value);
  });
}

function openSchedModal(entry) {
  editingId = entry ? entry.id : null;
  modalTitle.textContent = entry ? "Edit Schedule" : "Add Schedule";
  schedForm.reset();
  setMsg("");
  fillModalSections(entry ? entry.sectionId : "");
  fillModalSubjects(entry ? entry.subjectId : "");
  if (entry) {
    schedForm.elements.term.value = entry.term;
    setDays(entry.days);
    schedForm.elements.from.value = entry.from;
    schedForm.elements.to.value = entry.to;
  } else {
    schedForm.elements.term.selectedIndex = 0;
    schedForm.elements.from.value = "07:30";
    schedForm.elements.to.value = "08:30";
  }
  schedModal.hidden = false;
  schedForm.elements.term.focus();
}

function findConflict(candidate) {
  return schedules.find((other) => {
    if (other.id === editingId) return false;
    if (other.sectionId !== candidate.sectionId) return false;
    if (other.term !== candidate.term) return false;
    if (!sharesDay(other, candidate)) return false;
    return overlaps(other, candidate);
  });
}

function buildSheet() {
  const sec = sections().find((s) => s.id === printSection.value);
  const term = printTerm.value;
  if (!sec) {
    return '<p class="empty">No section selected. Add sections and schedules first.</p>';
  }
  const subList = subjects();
  const entries = schedules
    .filter((e) => e.sectionId === sec.id && e.term === term)
    .sort((a, b) => a.from.localeCompare(b.from) || DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]));

  const sy = activeSchoolYear();
  const meta = `
    <div class="sheet-meta">
      <div><span class="sheet-meta__label">Section</span><strong>${esc(sec.name)}</strong></div>
      <div><span class="sheet-meta__label">Strand</span><strong>${esc(sec.strand || "—")}</strong></div>
      <div><span class="sheet-meta__label">Year Level</span><strong>Grade ${esc(sec.grade)}</strong></div>
      <div><span class="sheet-meta__label">Term</span><strong>${esc(term)}</strong></div>
      <div><span class="sheet-meta__label">Adviser</span><strong>${esc(adviserName(sec))}</strong></div>
      <div><span class="sheet-meta__label">School Year</span><strong>${sy ? "A.Y " + esc(sy) : "—"}</strong></div>
    </div>`;

  let body;
  if (!entries.length) {
    body = '<p class="empty">No schedule entries for this section and term yet.</p>';
  } else {
    const seen = new Set();
    let totalUnits = 0;
    const rows = entries.map((e) => {
      const sub = subList.find((s) => s.id === e.subjectId);
      if (sub && !seen.has(sub.id)) {
        seen.add(sub.id);
        totalUnits += Number(sub.units) || 0;
      }
      return `<tr>
        <td>${sub ? esc(sub.code) : "—"}</td>
        <td>${sub ? esc(sub.title) : "—"}</td>
        <td>${sub ? esc(sub.type) : "—"}</td>
        <td>${sub ? esc(sub.units) : "—"}</td>
        <td>${esc(fullDays(e.days))}</td>
        <td>${esc(fmtTime(e.from))} – ${esc(fmtTime(e.to))}</td>
      </tr>`;
    }).join("");
    body = `<table class="sheet-table">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Descriptive Title</th>
          <th>Type</th>
          <th>Unit(s)</th>
          <th>Day(s)</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3">Total Units</td>
          <td>${totalUnits}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>`;
  }

  return `
    <div class="sched-sheet__head">
      <h3>Enrollment Management System</h3>
      <p>Class Program${sy ? " · A.Y " + esc(sy) : ""}</p>
    </div>
    ${meta}
    ${body}`;
}

function refreshSheet() {
  printSheet.innerHTML = buildSheet();
}

function openPrintModal() {
  const secList = sections().slice().sort((a, b) => a.name.localeCompare(b.name));
  printSection.innerHTML = secList.length
    ? secList.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("")
    : '<option value="">No sections</option>';
  const filtered = sectionFilter.value;
  if (filtered) printSection.value = filtered;
  if (termFilter.value) printTerm.value = termFilter.value;
  refreshSheet();
  printModal.hidden = false;
}

function hideModals() {
  schedModal.hidden = true;
  deleteModal.hidden = true;
  printModal.hidden = true;
  document.body.classList.remove("print-sheet");
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});
[termFilter, sectionFilter].forEach((el) => {
  el.addEventListener("change", () => {
    currentPage = 1;
    render();
  });
});
addSchedBtn.addEventListener("click", () => openSchedModal());
printPreviewBtn.addEventListener("click", openPrintModal);
closeSchedModal.addEventListener("click", hideModals);
cancelSchedBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);
closePrintModal.addEventListener("click", hideModals);

schedForm.elements.sectionId.addEventListener("change", () => fillModalSubjects(""));

[printSection, printTerm].forEach((el) => el.addEventListener("change", refreshSheet));

printBtn.addEventListener("click", () => {
  document.body.classList.add("print-sheet");
  window.print();
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-sheet");
});

pageControls.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  currentPage = Number(btn.dataset.page);
  render();
});

[schedModal, deleteModal, printModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

schedForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(schedForm);
  const term = data.get("term") || "";
  const sectionId = data.get("sectionId") || "";
  const subjectId = data.get("subjectId") || "";
  const days = data.getAll("days");
  const from = data.get("from") || "";
  const to = data.get("to") || "";

  if (!term || !sectionId || !subjectId) {
    return setMsg("Term, section, and subject are required.", "is-error");
  }
  if (!days.length) {
    return setMsg("Pick at least one day.", "is-error");
  }
  if (!from || !to) {
    return setMsg("Both start and end times are required.", "is-error");
  }
  if (from >= to) {
    return setMsg("End time must be after start time.", "is-error");
  }

  const candidate = { sectionId, term, days, from, to };
  const conflict = findConflict(candidate);
  if (conflict) {
    const sub = subjects().find((s) => s.id === conflict.subjectId);
    return setMsg(
      `Conflict: ${sub ? sub.code : "another subject"} is already scheduled ${shortDays(conflict.days)} ${fmtTime(conflict.from)} – ${fmtTime(conflict.to)} for this section.`,
      "is-error"
    );
  }

  if (editingId) {
    const entry = schedules.find((x) => x.id === editingId);
    Object.assign(entry, { term, sectionId, subjectId, days, from, to });
  } else {
    schedules.push({
      id: Date.now().toString(36),
      term,
      sectionId,
      subjectId,
      days,
      from,
      to
    });
  }
  persist();
  hideModals();
  render();
});

schedRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const entry = schedules.find((x) => x.id === btn.dataset.id);
  if (!entry) return;

  if (btn.dataset.action === "edit") {
    openSchedModal(entry);
  } else {
    deletingId = entry.id;
    const sub = subjects().find((s) => s.id === entry.subjectId);
    const sec = sections().find((s) => s.id === entry.sectionId);
    deleteName.textContent = `${sub ? sub.code : "Subject"} — ${sec ? sec.name : "section"} (${shortTerm(entry.term)}, ${shortDays(entry.days)} ${fmtTime(entry.from)} – ${fmtTime(entry.to)})`;
    deleteModal.hidden = false;
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  schedules = schedules.filter((x) => x.id !== deletingId);
  persist();
  hideModals();
  render();
});

fillSectionFilter();
render();
