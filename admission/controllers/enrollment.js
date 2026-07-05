const STUDENTS_KEY = "ems_students";
const SECTIONS_KEY = "ems_sections";
const ENROLL_KEY = "ems_enrollments";

const searchInput = document.getElementById("searchInput");
const printBtn = document.getElementById("printBtn");
const enrollBtn = document.getElementById("enrollBtn");
const masterRows = document.getElementById("masterRows");
const emptyState = document.getElementById("emptyState");

const enrollModal = document.getElementById("enrollModal");
const closeEnrollModal = document.getElementById("closeEnrollModal");
const cancelEnrollBtn = document.getElementById("cancelEnrollBtn");
const confirmEnrollBtn = document.getElementById("confirmEnrollBtn");
const studentSearch = document.getElementById("studentSearch");
const studentResults = document.getElementById("studentResults");
const selectedStudentChip = document.getElementById("selectedStudentChip");
const chipInitials = document.getElementById("chipInitials");
const chipName = document.getElementById("chipName");
const chipMeta = document.getElementById("chipMeta");
const clearStudentBtn = document.getElementById("clearStudentBtn");
const schoolYearSel = document.getElementById("schoolYear");
const termSel = document.getElementById("term");
const strandSel = document.getElementById("strand");
const gradeSel = document.getElementById("gradeLevel");
const sectionsTable = document.getElementById("sectionsTable");
const sectionRows = document.getElementById("sectionRows");
const sectionHint = document.getElementById("sectionHint");
const enrollMsg = document.getElementById("enrollMsg");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmName = document.getElementById("confirmName");
const confirmNote = document.getElementById("confirmNote");
const confirmActionBtn = document.getElementById("confirmActionBtn");
const closeConfirmModal = document.getElementById("closeConfirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let students = loadJson(STUDENTS_KEY);
let sections = loadJson(SECTIONS_KEY);
let enrollments = loadJson(ENROLL_KEY);

let selectedStudent = null;
let selectedSectionId = null;
let pendingAction = null;

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

function enrolledCount(sectionId) {
  return enrollments.filter((e) => e.sectionId === sectionId && e.status === "Enrolled").length;
}

function ensureStudentNo(student, schoolYear) {
  if (student.studentNo) return;
  const used = students.filter((s) => s.studentNo).length;
  student.studentNo = `${schoolYear.slice(0, 4)}-${String(used + 1).padStart(4, "0")}`;
  persist(STUDENTS_KEY, students);
}

function setMsg(text, type) {
  enrollMsg.textContent = text;
  enrollMsg.classList.remove("is-error", "is-success");
  if (type) enrollMsg.classList.add(type);
}

function renderMasterlist() {
  const q = searchInput.value.trim().toLowerCase();
  const list = enrollments.filter((e) => {
    if (!q) return true;
    const st = students.find((s) => s.id === e.studentId);
    if (!st) return false;
    return fullName(st).toLowerCase().includes(q) || (st.studentNo || "").toLowerCase().includes(q);
  });

  masterRows.innerHTML = list.map((e) => {
    const st = students.find((s) => s.id === e.studentId) || {};
    const sec = sections.find((s) => s.id === e.sectionId) || {};
    const dropped = e.status === "Dropped";
    const actions = `
      ${dropped ? "" : `<button class="btn btn--ghost btn--sm" data-action="drop" data-id="${e.id}">Drop</button>`}
      <button class="btn btn--danger btn--sm" data-action="delete" data-id="${e.id}">Delete</button>`;
    return `<tr>
      <td>${esc(st.studentNo || "—")}</td>
      <td><span class="cell-name">${st.lastName ? esc(fullName(st)) : "—"}</span></td>
      <td>${esc(e.schoolYear)}</td>
      <td>${esc(e.semester)}</td>
      <td>${esc(st.studentType || "—")}</td>
      <td>${esc(sec.strand || "—")}</td>
      <td>${sec.grade ? "Grade " + esc(sec.grade) : "—"}</td>
      <td>${esc(sec.name || "—")}</td>
      <td>${esc(e.dateEnrolled)}</td>
      <td><span class="badge badge--${dropped ? "archived" : "active"}">${esc(e.status)}</span></td>
      <td class="no-print"><div class="row-actions">${actions}</div></td>
    </tr>`;
  }).join("");

  emptyState.hidden = list.length > 0;
  emptyState.textContent = q ? "No enrollments match your search." : 'No enrollments yet. Click "Enroll Student" to begin.';
}

function renderStudentResults() {
  const q = studentSearch.value.trim().toLowerCase();
  if (!q) {
    studentResults.hidden = true;
    studentResults.innerHTML = "";
    return;
  }
  const matches = students
    .filter((s) => s.status !== "archived" && fullName(s).toLowerCase().includes(q))
    .slice(0, 6);

  studentResults.innerHTML = matches.length
    ? matches.map((s) => `
      <button type="button" class="result-item" data-id="${s.id}">
        <strong>${esc(fullName(s))}</strong>
        <em>${esc(s.studentType || "No type")} &middot; ${esc(s.gender || "—")}${s.studentNo ? " &middot; " + esc(s.studentNo) : ""}</em>
      </button>`).join("")
    : '<p class="result-empty">No matching student. Add them in Data Entry &rsaquo; Student first.</p>';
  studentResults.hidden = false;
}

function selectStudent(s) {
  selectedStudent = s;
  studentSearch.value = "";
  studentResults.hidden = true;
  studentResults.innerHTML = "";
  chipInitials.textContent = `${(s.firstName || "?")[0]}${(s.lastName || "?")[0]}`.toUpperCase();
  chipName.textContent = fullName(s);
  chipMeta.textContent = `${s.studentType || "No type"} · ${s.gender || "—"}`;
  selectedStudentChip.hidden = false;
  updateEnrollButton();
}

function clearStudent() {
  selectedStudent = null;
  selectedStudentChip.hidden = true;
  updateEnrollButton();
}

function renderSections() {
  const strand = strandSel.value;
  const grade = gradeSel.value;
  selectedSectionId = null;
  updateEnrollButton();

  if (!strand || !grade) {
    sectionsTable.hidden = true;
    sectionHint.hidden = false;
    sectionHint.textContent = "Select a strand and grade level to view available sections.";
    return;
  }

  const list = sections.filter((s) => s.strand === strand && s.grade === grade);
  sectionRows.innerHTML = list.map((s) => {
    const count = enrolledCount(s.id);
    const slots = s.capacity - count;
    const full = slots <= 0;
    return `<tr class="sec-row${full ? " is-full" : ""}" data-id="${s.id}" title="${full ? "Section is full" : "Click to select this section"}">
      <td><span class="cell-name">${esc(s.name)}</span></td>
      <td>${count}</td>
      <td>${s.capacity}</td>
      <td><span class="badge ${full ? "badge--archived" : "badge--active"}">${full ? "Full" : slots + " slots"}</span></td>
    </tr>`;
  }).join("");

  sectionsTable.hidden = false;
  sectionHint.hidden = true;
}

function updateEnrollButton() {
  confirmEnrollBtn.disabled = !(selectedStudent && selectedSectionId);
}

function resetEnrollModal() {
  clearStudent();
  studentSearch.value = "";
  studentResults.hidden = true;
  strandSel.selectedIndex = 0;
  gradeSel.selectedIndex = 0;
  schoolYearSel.value = "2026-2027";
  termSel.selectedIndex = 0;
  setMsg("");
  renderSections();
}

function openConfirm(title, name, note, actionLabel, onConfirm) {
  confirmTitle.textContent = title;
  confirmName.textContent = name;
  confirmNote.textContent = note;
  confirmActionBtn.textContent = actionLabel;
  pendingAction = onConfirm;
  confirmModal.hidden = false;
}

function hideModals() {
  enrollModal.hidden = true;
  confirmModal.hidden = true;
  pendingAction = null;
}

searchInput.addEventListener("input", renderMasterlist);
printBtn.addEventListener("click", () => window.print());

enrollBtn.addEventListener("click", () => {
  students = loadJson(STUDENTS_KEY);
  resetEnrollModal();
  enrollModal.hidden = false;
  studentSearch.focus();
});

closeEnrollModal.addEventListener("click", hideModals);
cancelEnrollBtn.addEventListener("click", hideModals);
closeConfirmModal.addEventListener("click", hideModals);
cancelConfirmBtn.addEventListener("click", hideModals);

[enrollModal, confirmModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

studentSearch.addEventListener("input", renderStudentResults);

studentResults.addEventListener("click", (e) => {
  const item = e.target.closest(".result-item");
  if (!item) return;
  const s = students.find((x) => x.id === item.dataset.id);
  if (s) selectStudent(s);
});

clearStudentBtn.addEventListener("click", clearStudent);

strandSel.addEventListener("change", renderSections);
gradeSel.addEventListener("change", renderSections);

sectionRows.addEventListener("click", (e) => {
  const row = e.target.closest(".sec-row");
  if (!row || row.classList.contains("is-full")) return;
  selectedSectionId = row.dataset.id;
  sectionRows.querySelectorAll(".sec-row").forEach((r) => r.classList.toggle("is-selected", r === row));
  setMsg("");
  updateEnrollButton();
});

confirmEnrollBtn.addEventListener("click", () => {
  if (!selectedStudent || !selectedSectionId) return;
  const schoolYear = schoolYearSel.value;
  const semester = termSel.value;

  const duplicate = enrollments.some((e) =>
    e.studentId === selectedStudent.id &&
    e.schoolYear === schoolYear &&
    e.semester === semester &&
    e.status === "Enrolled"
  );
  if (duplicate) {
    return setMsg(`${fullName(selectedStudent)} is already enrolled for ${semester}, A.Y ${schoolYear}.`, "is-error");
  }

  const section = sections.find((s) => s.id === selectedSectionId);
  if (enrolledCount(section.id) >= section.capacity) {
    renderSections();
    return setMsg(`${section.name} is already full.`, "is-error");
  }

  ensureStudentNo(selectedStudent, schoolYear);
  enrollments.push({
    id: Date.now().toString(36),
    studentId: selectedStudent.id,
    sectionId: section.id,
    schoolYear,
    semester,
    dateEnrolled: new Date().toISOString().slice(0, 10),
    status: "Enrolled"
  });
  persist(ENROLL_KEY, enrollments);
  hideModals();
  renderMasterlist();
});

masterRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const en = enrollments.find((x) => x.id === btn.dataset.id);
  if (!en) return;
  const st = students.find((s) => s.id === en.studentId);
  const name = st ? fullName(st) : "this enrollment";

  if (btn.dataset.action === "drop") {
    openConfirm(
      "Drop Student",
      name,
      "The student will be marked as Dropped and their slot in the section will be freed. The record stays in the masterlist.",
      "Drop",
      () => {
        en.status = "Dropped";
        persist(ENROLL_KEY, enrollments);
        renderMasterlist();
      }
    );
  } else if (btn.dataset.action === "delete") {
    openConfirm(
      "Delete Enrollment",
      name,
      "This permanently removes the enrollment record from the masterlist. This cannot be undone.",
      "Delete",
      () => {
        enrollments = enrollments.filter((x) => x.id !== en.id);
        persist(ENROLL_KEY, enrollments);
        renderMasterlist();
      }
    );
  }
});

confirmActionBtn.addEventListener("click", () => {
  if (pendingAction) pendingAction();
  hideModals();
});

renderMasterlist();
