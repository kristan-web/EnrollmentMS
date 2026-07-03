const SCHEDULES_KEY = "ems_schedules";
const SECTIONS_KEY = "ems_sections";
const SUBJECTS_KEY = "ems_shs_subjects";
const TEACHERS_KEY = "ems_teachers";
const SY_KEY = "ems_school_years";
const PAGE_SIZE = 10;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTERS = { Mon: "M", Tue: "T", Wed: "W", Thu: "Th", Fri: "F", Sat: "S" };
const HOUR_PX = 56;
const PALETTE_SIZE = 8;

const searchInput = document.getElementById("searchInput");
const termFilter = document.getElementById("termFilter");
const sectionFilter = document.getElementById("sectionFilter");
const viewTabs = document.getElementById("viewTabs");
const addSchedBtn = document.getElementById("addSchedBtn");
const printPreviewBtn = document.getElementById("printPreviewBtn");
const listPanel = document.getElementById("listPanel");
const schedRows = document.getElementById("schedRows");
const emptyState = document.getElementById("emptyState");

const timetablePanel = document.getElementById("timetablePanel");
const timetableMeta = document.getElementById("timetableMeta");
const timetableEmpty = document.getElementById("timetableEmpty");
const timetableWrap = document.getElementById("timetableWrap");

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
let viewMode = "list";

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function load() {
  return loadJson(SCHEDULES_KEY).map((e) => ({ teacherId: "", room: "", ...e }));
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

function teachers() {
  return loadJson(TEACHERS_KEY);
}

function teacherName(t) {
  return `${t.lastName}, ${t.firstName}`;
}

function adviserName(sec) {
  if (!sec || !sec.adviserId) return "—";
  const t = teachers().find((x) => x.id === sec.adviserId);
  return t ? teacherName(t) : "—";
}

function activeSchoolYear() {
  const sy = loadJson(SY_KEY).find((y) => y.status === "active");
  return sy ? sy.year : "";
}

function toMin(t) {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return h * 60 + m;
}

function fmtTime(t) {
  const [h, m] = (t || "0:0").split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function fmtHour(min) {
  const h = Math.floor(min / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12} ${suffix}`;
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

function normRoom(room) {
  return (room || "").trim().toLowerCase();
}

function setMsg(text, type) {
  schedMsg.textContent = text;
  schedMsg.classList.remove("is-error", "is-success");
  if (type) schedMsg.classList.add(type);
}

function subjectColor(subjectId) {
  const idx = subjects().findIndex((s) => s.id === subjectId);
  return "c" + (idx >= 0 ? idx % PALETTE_SIZE : PALETTE_SIZE - 1);
}

function findConflicts(candidate) {
  const secList = sections();
  const subList = subjects();
  const out = [];
  for (const other of schedules) {
    if (other.id === editingId) continue;
    if (other.term !== candidate.term) continue;
    if (!sharesDay(other, candidate)) continue;
    if (!overlaps(other, candidate)) continue;

    let kind = "";
    if (other.sectionId === candidate.sectionId) kind = "Section";
    else if (candidate.teacherId && other.teacherId === candidate.teacherId) kind = "Teacher";
    else if (normRoom(candidate.room) && normRoom(other.room) === normRoom(candidate.room)) kind = "Room";
    if (!kind) continue;

    const sub = subList.find((s) => s.id === other.subjectId);
    const sec = secList.find((s) => s.id === other.sectionId);
    out.push(
      `${kind} conflict: ${sub ? sub.code : "a subject"} in ${sec ? sec.name : "another section"} (${shortDays(other.days)} ${fmtTime(other.from)} – ${fmtTime(other.to)})`
    );
  }
  return out;
}

function gatherCandidate() {
  const data = new FormData(schedForm);
  return {
    term: data.get("term") || "",
    sectionId: data.get("sectionId") || "",
    subjectId: data.get("subjectId") || "",
    teacherId: data.get("teacherId") || "",
    room: (data.get("room") || "").trim(),
    days: data.getAll("days"),
    from: data.get("from") || "",
    to: data.get("to") || ""
  };
}

function liveCheck() {
  if (schedModal.hidden) return;
  const c = gatherCandidate();
  if (!c.term || !c.sectionId || !c.days.length || !c.from || !c.to || c.from >= c.to) {
    setMsg("");
    return;
  }
  const conflicts = findConflicts(c);
  if (conflicts.length) {
    setMsg("Heads up — " + conflicts.join(" • "), "is-error");
  } else {
    setMsg("No conflicts for this slot.", "is-success");
  }
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

function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const term = termFilter.value;
  const sectionId = sectionFilter.value;
  const secList = sections();
  const subList = subjects();
  const teacherList = teachers();

  const enriched = schedules.map((entry) => {
    const sec = secList.find((s) => s.id === entry.sectionId);
    const sub = subList.find((s) => s.id === entry.subjectId);
    const teacher = entry.teacherId ? teacherList.find((t) => t.id === entry.teacherId) : null;
    return { entry, sec, sub, teacher };
  });

  const list = enriched
    .filter(({ entry, sec, sub, teacher }) => {
      if (term && entry.term !== term) return false;
      if (sectionId && entry.sectionId !== sectionId) return false;
      if (!q) return true;
      return (
        (sub && (sub.code.toLowerCase().includes(q) || sub.title.toLowerCase().includes(q))) ||
        (sec && (sec.name.toLowerCase().includes(q) || (sec.strand || "").toLowerCase().includes(q))) ||
        (teacher && teacherName(teacher).toLowerCase().includes(q)) ||
        (entry.room || "").toLowerCase().includes(q)
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

  schedRows.innerHTML = pageItems.map(({ entry, sec, sub, teacher }) => `<tr>
    <td>${sub ? `<span class="badge ${sub.type === "Core" ? "badge--core" : "badge--specialized"}">${esc(sub.type)}</span>` : "—"}</td>
    <td>${sec ? esc(sec.strand || "—") : "—"}</td>
    <td>
      <span class="cell-name">${sec ? "Grade " + esc(sec.grade) : "—"}</span>
      <span class="cell-sub">${esc(shortTerm(entry.term))}</span>
    </td>
    <td>${sec ? esc(sec.name) : "—"}</td>
    <td>
      ${sub ? `<span class="chip">${esc(sub.code)}</span><span class="cell-sub">${esc(sub.title)}</span>` : "—"}
    </td>
    <td>
      <span class="cell-name">${teacher ? esc(teacherName(teacher)) : "—"}</span>
      <span class="cell-sub">${entry.room ? esc(entry.room) : "No room"}</span>
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

function layoutDay(entries, day) {
  const items = entries
    .filter((e) => e.days.includes(day))
    .sort((a, b) => toMin(a.from) - toMin(b.from) || toMin(a.to) - toMin(b.to))
    .map((e) => ({ e, lane: 0, lanes: 1 }));

  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const laneEnds = [];
    for (const it of cluster) {
      let lane = laneEnds.findIndex((end) => end <= toMin(it.e.from));
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = toMin(it.e.to);
      it.lane = lane;
    }
    for (const it of cluster) {
      it.lanes = laneEnds.length;
      placed.push(it);
    }
    cluster = [];
  };

  for (const it of items) {
    if (cluster.length && toMin(it.e.from) >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, toMin(it.e.to));
  }
  if (cluster.length) flush();
  return placed;
}

function renderTimetable() {
  const secList = sections().slice().sort((a, b) => a.name.localeCompare(b.name));
  if (!secList.length) {
    timetableMeta.innerHTML = "";
    timetableWrap.innerHTML = "";
    timetableEmpty.hidden = false;
    timetableEmpty.textContent = "No sections yet. Add sections in Maintenance first.";
    return;
  }
  if (!sectionFilter.value) sectionFilter.value = secList[0].id;
  if (!termFilter.value) termFilter.value = "1st Semester";

  const sec = secList.find((s) => s.id === sectionFilter.value) || secList[0];
  const term = termFilter.value;
  const subList = subjects();
  const teacherList = teachers();
  const entries = schedules.filter((e) => e.sectionId === sec.id && e.term === term);

  const usedSubjects = [...new Set(entries.map((e) => e.subjectId))]
    .map((id) => subList.find((s) => s.id === id))
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));

  timetableMeta.innerHTML = `
    <div class="timetable-meta__info">
      <strong>${esc(sec.name)} · ${esc(term)}</strong>
      <span>Grade ${esc(sec.grade)}${sec.strand ? " · " + esc(sec.strand) : ""} · Adviser: ${esc(adviserName(sec))}</span>
    </div>
    <div class="legend">
      ${usedSubjects.map((s) => `<span class="legend-chip"><i class="${subjectColor(s.id)}"></i>${esc(s.code)}</span>`).join("")}
    </div>`;

  timetableEmpty.hidden = entries.length > 0;
  if (!entries.length) {
    timetableEmpty.textContent = `No schedule entries for ${sec.name} in the ${term} yet.`;
  }

  let startMin = 7 * 60;
  let endMin = 17 * 60;
  if (entries.length) {
    startMin = Math.floor(Math.min(...entries.map((e) => toMin(e.from))) / 60) * 60;
    endMin = Math.ceil(Math.max(...entries.map((e) => toMin(e.to))) / 60) * 60;
    if (endMin - startMin < 120) endMin = startMin + 120;
  }
  const totalMin = endMin - startMin;
  const colHeight = (totalMin / 60) * HOUR_PX;

  const axisMarks = [];
  for (let m = startMin; m <= endMin; m += 60) {
    axisMarks.push(`<span style="top:${((m - startMin) / 60) * HOUR_PX}px">${fmtHour(m)}</span>`);
  }

  const cols = DAYS.map((day) => {
    const blocks = layoutDay(entries, day).map(({ e, lane, lanes }) => {
      const sub = subList.find((s) => s.id === e.subjectId);
      const teacher = e.teacherId ? teacherList.find((t) => t.id === e.teacherId) : null;
      const top = ((toMin(e.from) - startMin) / 60) * HOUR_PX;
      const height = ((toMin(e.to) - toMin(e.from)) / 60) * HOUR_PX;
      const left = (lane / lanes) * 100;
      const width = 100 / lanes;
      const detail = [teacher ? teacherName(teacher) : "", e.room || ""].filter(Boolean).join(" · ");
      const title = `${sub ? sub.code + " — " + sub.title : "Subject"}\n${fmtTime(e.from)} – ${fmtTime(e.to)}${detail ? "\n" + detail : ""}`;
      return `<div class="sched-block ${subjectColor(e.subjectId)}" data-id="${esc(e.id)}" title="${esc(title)}"
        style="top:${top}px;height:${Math.max(height - 3, 20)}px;left:calc(${left}% + 3px);width:calc(${width}% - 6px)">
        <strong>${sub ? esc(sub.code) : "—"}</strong>
        <em>${esc(fmtTime(e.from))} – ${esc(fmtTime(e.to))}</em>
        ${detail ? `<em>${esc(detail)}</em>` : ""}
      </div>`;
    }).join("");
    return `<div class="tt-col" style="height:${colHeight}px">${blocks}</div>`;
  }).join("");

  timetableWrap.innerHTML = `
    <div class="timetable">
      <div class="tt-head"></div>
      ${DAYS.map((d) => `<div class="tt-head">${d}</div>`).join("")}
      <div class="tt-axis" style="height:${colHeight}px">${axisMarks.join("")}</div>
      ${cols}
    </div>`;
}

function render() {
  if (viewMode === "list") {
    renderList();
  } else {
    renderTimetable();
  }
}

function setView(mode) {
  viewMode = mode;
  viewTabs.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === mode);
  });
  listPanel.hidden = mode !== "list";
  timetablePanel.hidden = mode !== "grid";
  searchInput.closest(".search-box").style.visibility = mode === "list" ? "visible" : "hidden";
  render();
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

function fillModalTeachers(selected) {
  const select = schedForm.elements.teacherId;
  const list = teachers().slice().sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
  select.innerHTML = '<option value="">Unassigned</option>' +
    list.map((t) => `<option value="${esc(t.id)}">${esc(teacherName(t))}${t.specialization ? " · " + esc(t.specialization) : ""}</option>`).join("");
  select.value = selected || "";
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
  fillModalTeachers(entry ? entry.teacherId : "");
  if (entry) {
    schedForm.elements.term.value = entry.term;
    schedForm.elements.room.value = entry.room || "";
    setDays(entry.days);
    schedForm.elements.from.value = entry.from;
    schedForm.elements.to.value = entry.to;
  } else {
    schedForm.elements.term.selectedIndex = 0;
    schedForm.elements.from.value = "07:30";
    schedForm.elements.to.value = "08:30";
    if (viewMode === "grid" && sectionFilter.value) {
      fillModalSections(sectionFilter.value);
      fillModalSubjects("");
      if (termFilter.value) schedForm.elements.term.value = termFilter.value;
    }
  }
  schedModal.hidden = false;
  schedForm.elements.term.focus();
}

function buildSheet() {
  const sec = sections().find((s) => s.id === printSection.value);
  const term = printTerm.value;
  if (!sec) {
    return '<p class="empty">No section selected. Add sections and schedules first.</p>';
  }
  const subList = subjects();
  const teacherList = teachers();
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
      const teacher = e.teacherId ? teacherList.find((t) => t.id === e.teacherId) : null;
      if (sub && !seen.has(sub.id)) {
        seen.add(sub.id);
        totalUnits += Number(sub.units) || 0;
      }
      return `<tr>
        <td>${sub ? esc(sub.code) : "—"}</td>
        <td>${sub ? esc(sub.title) : "—"}</td>
        <td>${sub ? esc(sub.units) : "—"}</td>
        <td>${esc(fullDays(e.days))}</td>
        <td>${esc(fmtTime(e.from))} – ${esc(fmtTime(e.to))}${e.room ? " · " + esc(e.room) : ""}</td>
        <td>${teacher ? esc(teacherName(teacher)) : "—"}</td>
      </tr>`;
    }).join("");
    body = `<table class="sheet-table">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Descriptive Title</th>
          <th>Unit(s)</th>
          <th>Day(s)</th>
          <th>Time / Room</th>
          <th>Teacher</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2">Total Units</td>
          <td>${totalUnits}</td>
          <td colspan="3"></td>
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

viewTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab[data-view]");
  if (tab) setView(tab.dataset.view);
});

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
schedForm.addEventListener("change", liveCheck);
schedForm.elements.room.addEventListener("input", liveCheck);

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

timetableWrap.addEventListener("click", (e) => {
  const block = e.target.closest(".sched-block[data-id]");
  if (!block) return;
  const entry = schedules.find((x) => x.id === block.dataset.id);
  if (entry) openSchedModal(entry);
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
  const c = gatherCandidate();

  if (!c.term || !c.sectionId || !c.subjectId) {
    return setMsg("Term, section, and subject are required.", "is-error");
  }
  if (!c.days.length) {
    return setMsg("Pick at least one day.", "is-error");
  }
  if (!c.from || !c.to) {
    return setMsg("Both start and end times are required.", "is-error");
  }
  if (c.from >= c.to) {
    return setMsg("End time must be after start time.", "is-error");
  }

  const conflicts = findConflicts(c);
  if (conflicts.length) {
    return setMsg(conflicts.join(" • "), "is-error");
  }

  if (editingId) {
    const entry = schedules.find((x) => x.id === editingId);
    Object.assign(entry, c);
  } else {
    schedules.push({ id: Date.now().toString(36), ...c });
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
if (window.location.hash === "#timetable") {
  setView("grid");
} else {
  render();
}
