const STUDENTS_KEY = "ems_students";
const SECTIONS_KEY = "ems_sections";
const ENROLL_KEY = "ems_enrollments";
const GRADES_KEY = "ems_grades";

const SUBJECTS = [
  { code: "ORAL-COM", title: "Oral Communication", units: 3, grade: "11", term: "1st Semester" },
  { code: "KOM-PAN", title: "Komunikasyon at Pananaliksik", units: 3, grade: "11", term: "1st Semester" },
  { code: "GEN-MATH", title: "General Mathematics", units: 3, grade: "11", term: "1st Semester" },
  { code: "ELS", title: "Earth and Life Science", units: 3, grade: "11", term: "1st Semester" },
  { code: "PE-1", title: "Physical Education and Health 1", units: 2, grade: "11", term: "1st Semester" },
  { code: "READ-WRITE", title: "Reading and Writing", units: 3, grade: "11", term: "2nd Semester" },
  { code: "PAGBASA", title: "Pagbasa at Pagsusuri", units: 3, grade: "11", term: "2nd Semester" },
  { code: "STAT-PROB", title: "Statistics and Probability", units: 3, grade: "11", term: "2nd Semester" },
  { code: "PHYS-SCI", title: "Physical Science", units: 3, grade: "11", term: "2nd Semester" },
  { code: "PE-2", title: "Physical Education and Health 2", units: 2, grade: "11", term: "2nd Semester" },
  { code: "21ST-LIT", title: "21st Century Literature", units: 3, grade: "12", term: "1st Semester" },
  { code: "UCSP", title: "Understanding Culture, Society and Politics", units: 3, grade: "12", term: "1st Semester" },
  { code: "PR-2", title: "Practical Research 2", units: 3, grade: "12", term: "1st Semester" },
  { code: "CPAR", title: "Contemporary Philippine Arts from the Regions", units: 3, grade: "12", term: "1st Semester" },
  { code: "PE-3", title: "Physical Education and Health 3", units: 2, grade: "12", term: "1st Semester" },
  { code: "MIL", title: "Media and Information Literacy", units: 3, grade: "12", term: "2nd Semester" },
  { code: "PER-DEV", title: "Personal Development", units: 3, grade: "12", term: "2nd Semester" },
  { code: "EAPP", title: "English for Academic and Professional Purposes", units: 3, grade: "12", term: "2nd Semester" },
  { code: "ENTREP", title: "Entrepreneurship", units: 3, grade: "12", term: "2nd Semester" },
  { code: "PE-4", title: "Physical Education and Health 4", units: 2, grade: "12", term: "2nd Semester" }
];

const filterGrade = document.getElementById("filterGrade");
const filterSection = document.getElementById("filterSection");
const filterSubject = document.getElementById("filterSubject");
const filterTerm = document.getElementById("filterTerm");
const searchInput = document.getElementById("searchInput");
const gradeRows = document.getElementById("gradeRows");
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
const enrollments = loadJson(ENROLL_KEY).filter((e) => e.status === "Enrolled");
let grades = loadJson(GRADES_KEY);

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

function hashSeed(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function ensureGrades() {
  let changed = false;
  for (const en of enrollments) {
    const sec = sections.find((s) => s.id === en.sectionId);
    if (!sec) continue;
    const subjects = SUBJECTS.filter((s) => s.grade === sec.grade && s.term === en.semester);
    for (const sub of subjects) {
      const exists = grades.some((g) => g.enrollmentId === en.id && g.subjectCode === sub.code);
      if (!exists) {
        const h1 = hashSeed(en.id + sub.code + "q1");
        const h2 = hashSeed(en.id + sub.code + "q2");
        grades.push({
          enrollmentId: en.id,
          subjectCode: sub.code,
          q1: 72 + (h1 % 27),
          q2: 72 + (h2 % 27)
        });
        changed = true;
      }
    }
  }
  if (changed) localStorage.setItem(GRADES_KEY, JSON.stringify(grades));
}

function populateFilters() {
  filterSection.innerHTML = '<option value="">All Sections</option>' +
    sections.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  filterSubject.innerHTML = '<option value="">All Subjects</option>' +
    SUBJECTS.map((s) => `<option value="${s.code}">${esc(s.code)} — ${esc(s.title)}</option>`).join("");
}

function render() {
  const gradeLevel = filterGrade.value;
  const sectionId = filterSection.value;
  const subjectCode = filterSubject.value;
  const term = filterTerm.value;
  const q = searchInput.value.trim().toLowerCase();

  const rows = [];
  for (const g of grades) {
    const en = enrollments.find((e) => e.id === g.enrollmentId);
    if (!en) continue;
    const st = students.find((s) => s.id === en.studentId);
    const sec = sections.find((s) => s.id === en.sectionId);
    const sub = SUBJECTS.find((s) => s.code === g.subjectCode);
    if (!st || !sec || !sub) continue;

    if (gradeLevel && sec.grade !== gradeLevel) continue;
    if (sectionId && sec.id !== sectionId) continue;
    if (subjectCode && sub.code !== subjectCode) continue;
    if (term && en.semester !== term) continue;
    if (q && !fullName(st).toLowerCase().includes(q) && !(st.studentNo || "").toLowerCase().includes(q)) continue;

    const average = Math.round((g.q1 + g.q2) / 2);
    const passed = average >= 75;
    rows.push(`<tr>
      <td>${esc(st.studentNo || "—")}</td>
      <td><span class="cell-name">${esc(fullName(st))}</span><span class="cell-sub">${esc(sec.name)}</span></td>
      <td>${esc(sub.code)}</td>
      <td>${esc(sub.title)}</td>
      <td>${sub.units}</td>
      <td>${g.q1}</td>
      <td>${g.q2}</td>
      <td><strong>${average}</strong></td>
      <td><span class="badge ${passed ? "badge--active" : "badge--archived"}">${passed ? "Passed" : "Failed"}</span></td>
      <td>${esc(en.semester)}</td>
    </tr>`);
  }

  gradeRows.innerHTML = rows.join("");
  emptyState.hidden = rows.length > 0;
  emptyState.textContent = enrollments.length
    ? "No records match your filters."
    : "No grades to display yet. Enroll students in Transaction › Enrollment first.";
}

ensureGrades();
populateFilters();
[filterGrade, filterSection, filterSubject, filterTerm].forEach((el) => el.addEventListener("change", render));
searchInput.addEventListener("input", render);
render();
