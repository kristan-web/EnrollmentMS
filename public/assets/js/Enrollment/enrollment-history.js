const STUDENTS_KEY = "ems_students";
const SECTIONS_KEY = "ems_sections";
const ENROLL_KEY = "ems_enrollments";

const filterYear = document.getElementById("filterYear");
const filterGrade = document.getElementById("filterGrade");
const filterTerm = document.getElementById("filterTerm");
const filterStrand = document.getElementById("filterStrand");
const searchInput = document.getElementById("searchInput");
const historyRows = document.getElementById("historyRows");
const emptyState = document.getElementById("emptyState");

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

const students = loadJson(STUDENTS_KEY);
const sections = loadJson(SECTIONS_KEY);
const enrollments = loadJson(ENROLL_KEY);

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

function populateYears() {
  const years = [...new Set(enrollments.map((e) => e.schoolYear))].sort();
  filterYear.innerHTML = '<option value="">All School Years</option>' +
    years.map((y) => `<option>${esc(y)}</option>`).join("");
}

function render() {
  const year = filterYear.value;
  const grade = filterGrade.value;
  const term = filterTerm.value;
  const strand = filterStrand.value;
  const q = searchInput.value.trim().toLowerCase();

  const rows = [];
  for (const e of enrollments) {
    const st = students.find((s) => s.id === e.studentId);
    const sec = sections.find((s) => s.id === e.sectionId);
    if (!st || !sec) continue;

    if (year && e.schoolYear !== year) continue;
    if (grade && sec.grade !== grade) continue;
    if (term && e.semester !== term) continue;
    if (strand && sec.strand !== strand) continue;
    if (q && !fullName(st).toLowerCase().includes(q) && !(st.studentNo || "").toLowerCase().includes(q)) continue;

    const dropped = e.status === "Dropped";
    rows.push(`<tr>
      <td>${esc(st.studentNo || "—")}</td>
      <td><span class="cell-name">${esc(fullName(st))}</span><span class="cell-sub">A.Y ${esc(e.schoolYear)}</span></td>
      <td>${esc(e.semester)}</td>
      <td>${esc(sec.strand)}</td>
      <td>Grade ${esc(sec.grade)}</td>
      <td>${esc(sec.name)}</td>
      <td>${esc(e.dateEnrolled)}</td>
      <td><span class="badge badge--${dropped ? "archived" : "active"}">${esc(e.status)}</span></td>
    </tr>`);
  }

  historyRows.innerHTML = rows.join("");
  emptyState.hidden = rows.length > 0;
  emptyState.textContent = enrollments.length
    ? "No records match your filters."
    : "No enrollment history yet. Records appear here once students are enrolled.";
}

populateYears();
[filterYear, filterGrade, filterTerm, filterStrand].forEach((el) => el.addEventListener("change", render));
searchInput.addEventListener("input", render);
render();
