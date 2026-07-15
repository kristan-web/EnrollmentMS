const ENROLLMENT_URL = "/EnrollmentMS/app/Enrollment/Controller/enrollment_controllers.php";

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

let masterlist = [];
let selectedStudent = null;
let selectedSectionId = null;
let pendingAction = null;
let schoolYears = [];

// ============ API Helpers ============

async function apiGet(params) {
    const url = `${ENROLLMENT_URL}?${new URLSearchParams(params).toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
}

async function apiPost(params) {
    const res = await fetch(ENROLLMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString()
    });
    return res.text();
}

// ============ UI Helpers ============

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
    return `${s.last_name}, ${s.first_name}${s.middle_name ? " " + s.middle_name : ""}`;
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setMsg(text, type) {
    enrollMsg.textContent = text;
    enrollMsg.classList.remove("is-error", "is-success");
    if (type) enrollMsg.classList.add(type);
}

// ============ Masterlist ============

async function loadMasterlist() {
    const q = searchInput.value.trim();
    try {
        masterlist = await apiGet({ action: "list", keyword: q });
    } catch {
        masterlist = [];
    }
    renderMasterlist(q);
}

function renderMasterlist(q) {
    masterRows.innerHTML = masterlist.map((e) => {
        const dropped = e.status === "Dropped";
        const actions = `
            ${dropped ? "" : `<button class="btn btn--ghost btn--sm" data-action="drop" data-id="${e.enrollment_id}">Drop</button>`}
            <button class="btn btn--danger btn--sm" data-action="delete" data-id="${e.enrollment_id}">Delete</button>`;
        return `<tr>
            <td>${esc(e.student_number || "—")}</td>
            <td><span class="cell-name">${esc(fullName(e))}</span></td>
            <td>${esc(e.school_year)}</td>
            <td>${esc(e.semester)}</td>
            <td>${esc(e.strand_code || "—")}</td>
            <td>${e.grade_level ? "Grade " + esc(e.grade_level) : "—"}</td>
            <td>${esc(e.section_name || "—")}</td>
            <td>${esc(e.date_enrolled)}</td>
            <td><span class="badge badge--${dropped ? "archived" : "active"}">${esc(e.status)}</span></td>
            <td class="no-print"><div class="row-actions">${actions}</div></td>
        </tr>`;
    }).join("");

    emptyState.hidden = masterlist.length > 0;
    emptyState.textContent = q ? "No enrollments match your search." : 'No enrollments yet. Click "Enroll Student" to begin.';
}

// ============ Step 1: Find Student ============

let lastStudentMatches = [];

async function renderStudentResults() {
    const q = studentSearch.value.trim();
    if (!q) {
        studentResults.hidden = true;
        studentResults.innerHTML = "";
        return;
    }

    let matches = [];
    try {
        matches = await apiGet({ action: "search_students", keyword: q });
    } catch {
        matches = [];
    }
    lastStudentMatches = matches;

    studentResults.innerHTML = matches.length
        ? matches.map((s) => `
            <button type="button" class="result-item" data-id="${s.student_id}">
                <strong>${esc(fullName(s))}</strong>
                <em>${esc(s.gender || "—")}${s.student_number ? " &middot; " + esc(s.student_number) : ""}</em>
            </button>`).join("")
        : '<p class="result-empty">No matching student. Add them in Data Entry &rsaquo; Student first.</p>';
    studentResults.hidden = false;
}

const onStudentSearchInput = debounce(renderStudentResults, 250);

function selectStudent(s) {
    selectedStudent = s;
    studentSearch.value = "";
    studentResults.hidden = true;
    studentResults.innerHTML = "";
    chipInitials.textContent = `${(s.first_name || "?")[0]}${(s.last_name || "?")[0]}`.toUpperCase();
    chipName.textContent = fullName(s);
    chipMeta.textContent = `${s.gender || "—"}${s.student_number ? " · " + s.student_number : ""}`;
    selectedStudentChip.hidden = false;
    updateEnrollButton();
}

function clearStudent() {
    selectedStudent = null;
    selectedStudentChip.hidden = true;
    updateEnrollButton();
}

// ============ Step 2: Load School Years ============

async function loadSchoolYears() {
    try {
        schoolYears = await apiGet({ action: "school_years" });
    } catch {
        schoolYears = [];
    }
    
    schoolYearSel.innerHTML = '<option value="" disabled selected>Select school year</option>';
    schoolYears.forEach(sy => {
        const option = document.createElement('option');
        option.value = sy.school_year_id;
        option.textContent = sy.year;
        if (sy.status === 'active') {
            option.textContent += ' (Active)';
            option.selected = true;
        }
        schoolYearSel.appendChild(option);
    });
}

// ============ Step 3: Sections ============

async function renderSections() {
    const strand = strandSel.value;
    const grade = gradeSel.value;
    const schoolYearId = schoolYearSel.value;
    selectedSectionId = null;
    updateEnrollButton();

    if (!strand || !grade || !schoolYearId) {
        sectionsTable.hidden = true;
        sectionHint.hidden = false;
        sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
        return;
    }

    sectionHint.hidden = false;
    sectionHint.textContent = "Loading sections...";
    sectionsTable.hidden = true;

    let list = [];
    try {
        list = await apiGet({ action: "sections", strand, grade, school_year_id: schoolYearId });
        if (list && list.error) list = [];
    } catch {
        list = [];
    }

    if (!list.length) {
        sectionsTable.hidden = true;
        sectionHint.hidden = false;
        sectionHint.textContent = "No open sections for this school year, strand, and grade level yet.";
        return;
    }

    sectionRows.innerHTML = list.map((s) => {
        const count = Number(s.enrolled_count);
        const slots = s.max_slots - count;
        const full = slots <= 0;
        return `<tr class="sec-row${full ? " is-full" : ""}" data-id="${s.section_id}" title="${full ? "Section is full" : "Click to select this section"}">
            <td><span class="cell-name">${esc(s.section_name)}</span></td>
            <td>${count}</td>
            <td>${s.max_slots}</td>
            <td><span class="badge ${full ? "badge--archived" : "badge--active"}">${full ? "Full" : slots + " slots"}</span></td>
        </tr>`;
    }).join("");

    sectionsTable.hidden = false;
    sectionHint.hidden = true;
}

// ============ Load Strands ============

let strandsList = [];

async function loadStrands() {
    try {
        strandsList = await apiGet({ action: "strands" });
    } catch {
        strandsList = [];
    }
    strandSel.innerHTML =
        '<option value="" disabled selected>Select strand</option>' +
        strandsList.map((s) => `<option value="${esc(s.strand_code)}">${esc(s.strand_name)} (${esc(s.strand_code)})</option>`).join("");
}

// ============ Modal Functions ============

function updateEnrollButton() {
    confirmEnrollBtn.disabled = !(selectedStudent && selectedSectionId);
}

function resetEnrollModal() {
    clearStudent();
    studentSearch.value = "";
    studentResults.hidden = true;
    strandSel.selectedIndex = 0;
    gradeSel.selectedIndex = 0;
    termSel.selectedIndex = 0;
    schoolYearSel.selectedIndex = 0;
    setMsg("");
    sectionsTable.hidden = true;
    sectionHint.hidden = false;
    sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
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

// ============ Event Wiring ============

searchInput.addEventListener("input", debounce(loadMasterlist, 250));
printBtn.addEventListener("click", () => window.print());

enrollBtn.addEventListener("click", async () => {
    await Promise.all([loadSchoolYears(), loadStrands()]);
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

studentSearch.addEventListener("input", onStudentSearchInput);

studentResults.addEventListener("click", (e) => {
    const item = e.target.closest(".result-item");
    if (!item) return;
    const s = lastStudentMatches.find((x) => String(x.student_id) === item.dataset.id);
    if (s) selectStudent(s);
});

clearStudentBtn.addEventListener("click", clearStudent);

schoolYearSel.addEventListener("change", renderSections);
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

// ============ Confirm Enrollment ============

confirmEnrollBtn.addEventListener("click", async () => {
    if (!selectedStudent || !selectedSectionId) return;

    confirmEnrollBtn.disabled = true;

    const response = await apiPost({
        action: "create",
        student_id: selectedStudent.student_id,
        section_id: selectedSectionId,
        school_year_id: schoolYearSel.value,
        semester: termSel.value
    });

    if (response.indexOf("SUCCESS") !== -1) {
        hideModals();
        loadMasterlist();
    } else {
        confirmEnrollBtn.disabled = false;
        setMsg(response.replace(/^INSERT FAILED:\s*/, ""), "is-error");
    }
});

// ============ Row Actions ============

masterRows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const en = masterlist.find((x) => String(x.enrollment_id) === btn.dataset.id);
    if (!en) return;
    const name = fullName(en);

    if (btn.dataset.action === "drop") {
        openConfirm(
            "Drop Student",
            name,
            "The student will be marked as Dropped and their slot in the section will be freed. The record stays in the masterlist.",
            "Drop",
            async () => {
                await apiPost({ action: "drop", enrollment_id: en.enrollment_id });
                loadMasterlist();
            }
        );
    } else if (btn.dataset.action === "delete") {
        openConfirm(
            "Delete Enrollment",
            name,
            "This permanently removes the enrollment record from the masterlist. This cannot be undone.",
            "Delete",
            async () => {
                await apiPost({ action: "delete", enrollment_id: en.enrollment_id });
                loadMasterlist();
            }
        );
    }
});

confirmActionBtn.addEventListener("click", async () => {
    if (pendingAction) await pendingAction();
    hideModals();
});

// ============ Init ============
loadMasterlist();