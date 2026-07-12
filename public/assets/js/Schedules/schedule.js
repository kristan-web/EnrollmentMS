const SCHEDULE_URL = "/EnrollmentMS/app/Schedules/Controller/schedule_controllers.php";
const PAGE_SIZE = 10;

const DAYS = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
};

// DOM Elements
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

// State
let schedules = [];
let subjects = [];
let sections = [];
let rooms = [];
let teachers = [];
let editingId = null;
let deletingId = null;
let currentPage = 1;

// Helper Functions
function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setMsg(text, type) {
    schedMsg.textContent = text;
    schedMsg.classList.remove("is-error", "is-success");
    if (type) schedMsg.classList.add(type);
}

function showLoading(show) {
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        loadingModal.hidden = !show;
    }
}

function getFullName(first, last) {
    if (!first && !last) return "—";
    return `${last || ''}${last && first ? ', ' : ''}${first || ''}`.trim() || "—";
}

function formatTime(time) {
    if (!time) return "—";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ---------- API Helpers ----------
async function apiGet(params) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '' && value !== 'null') {
            cleanParams[key] = value;
        }
    }
    
    const url = `${SCHEDULE_URL}?${new URLSearchParams(cleanParams).toString()}`;
    console.log("Fetching:", url);
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Response data:", data);
        return data;
    } catch (e) {
        console.error("API Error:", e);
        throw e;
    }
}

async function apiPost(params) {
    const res = await fetch(SCHEDULE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString()
    });
    const text = await res.text();
    console.log("Response:", text);
    try {
        return JSON.parse(text);
    } catch {
        if (text.includes("SUCCESS") || text.includes("success")) {
            return { success: true, message: text };
        }
        return { success: false, message: text || "Unknown error" };
    }
}

// ---------- Load Data ----------
async function loadLookupData() {
    showLoading(true);
    try {
        const data = await apiGet({ action: "lookup" });
        sections = data.sections || [];
        rooms = data.rooms || [];
        teachers = data.teachers || [];
        subjects = data.subjects || [];
        populateDropdowns();
        return data;
    } catch (e) {
        console.error("Failed to load lookup data:", e);
        throw e;
    } finally {
        showLoading(false);
    }
}

function populateDropdowns() {
    // Populate section filter
    if (sectionFilter) {
        let html = '<option value="">All Sections</option>';
        sections.forEach(s => {
            html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
        });
        sectionFilter.innerHTML = html;
    }

    // Populate section dropdown in modal
    const sectionSelect = document.getElementById("sectionSelect");
    if (sectionSelect) {
        let html = '<option value="" disabled selected>Select section</option>';
        sections.forEach(s => {
            html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
        });
        sectionSelect.innerHTML = html;
    }

    // Populate room dropdown in modal
    const roomSelect = document.getElementById("roomSelect");
    if (roomSelect) {
        let html = '<option value="" disabled selected>Select room</option>';
        rooms.forEach(r => {
            html += `<option value="${r.room_id}">${esc(r.room_name)} (${esc(r.building)}) - Capacity: ${r.capacity}</option>`;
        });
        roomSelect.innerHTML = html;
    }

    // Populate teacher dropdown in modal
    const teacherSelect = document.getElementById("teacherSelect");
    if (teacherSelect) {
        let html = '<option value="" disabled selected>Select teacher</option>';
        teachers.forEach(t => {
            html += `<option value="${t.teacher_id}">${esc(t.last_name)}, ${esc(t.first_name)}</option>`;
        });
        teacherSelect.innerHTML = html;
    }
}

// Fetches subjects that apply to the selected section (grade level + strand,
// or common subjects), optionally narrowed by term. Replaces the old
// client-side class_subjects filtering since subjects now come straight
// from the `subjects` table via the lookup endpoint.
async function populateSubjects(selected) {
    const sectionId = document.getElementById("sectionSelect")?.value;
    const term = document.getElementById("termSelect")?.value;
    const select = document.getElementById("subjectSelect");

    if (!sectionId) {
        select.innerHTML = '<option value="" disabled selected>Select section first</option>';
        return;
    }

    select.innerHTML = '<option value="" disabled selected>Loading subjects...</option>';

    try {
        const data = await apiGet({ action: "lookup", section_id: sectionId, term: term });
        subjects = data.subjects || [];
    } catch (e) {
        console.error("Failed to load subjects:", e);
        subjects = [];
    }

    if (!subjects.length) {
        select.innerHTML = '<option value="" disabled selected>No subjects found for this section</option>';
        return;
    }

    let html = '<option value="" disabled selected>Select subject</option>';
    subjects.forEach(sub => {
        html += `<option value="${sub.subject_id}">${esc(sub.subject_code)} - ${esc(sub.subject_name)} (${esc(sub.subject_type)})</option>`;
    });
    select.innerHTML = html;

    if (selected) {
        select.value = selected;
    }
}

// ---------- Load Schedules ----------
async function loadSchedules() {
    const filters = {};
    
    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }
    if (termFilter && termFilter.value) {
        filters.term = termFilter.value;
    }
    if (sectionFilter && sectionFilter.value) {
        filters.section_id = sectionFilter.value;
    }
    
    filters.action = "list";

    console.log("Loading schedules with filters:", filters);

    showLoading(true);
    try {
        const response = await apiGet(filters);
        schedules = Array.isArray(response) ? response : [];
        console.log("Schedules loaded:", schedules.length);
        render();
    } catch (e) {
        console.error("Failed to load schedules:", e);
        schedules = [];
        render();
    } finally {
        showLoading(false);
    }
}

// ---------- Render ----------
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
    const total = schedules.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = schedules.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
        schedRows.innerHTML = "";
        emptyState.hidden = false;
        const hasFilters = (searchInput && searchInput.value.trim()) || 
                          (termFilter && termFilter.value) || 
                          (sectionFilter && sectionFilter.value);
        emptyState.textContent = hasFilters
            ? "No schedules match your filters."
            : 'No schedules yet. Click "Add Schedule" to get started.';
        pagination.hidden = true;
        return;
    }

    emptyState.hidden = true;

    schedRows.innerHTML = pageItems.map((s) => {
        const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
        const dayShort = DAYS[s.day_of_week] || s.day_of_week;
        const startTime = formatTime(s.start_time);
        const endTime = formatTime(s.end_time);

        return `<tr>
            <td><span class="cell-name">${esc(s.section_name)}</span></td>
            <td>
                <span class="chip">${esc(s.subject_code)}</span>
                <span class="cell-sub">${esc(s.subject_name)}</span>
            </td>
            <td>${esc(teacherName)}</td>
            <td><span class="chip">${esc(dayShort)}</span></td>
            <td>${esc(startTime)} – ${esc(endTime)}</td>
            <td>${esc(s.room_name)}</td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.schedule_id}">Edit</button>
                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.schedule_id}">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
}

// ---------- Check Conflicts ----------
async function checkConflicts() {
    const sectionId = document.getElementById("sectionSelect")?.value;
    const teacherId = document.getElementById("teacherSelect")?.value;
    const dayOfWeek = document.getElementById("daySelect")?.value;
    const startTime = document.getElementById("startTime")?.value;
    const endTime = document.getElementById("endTime")?.value;
    const roomId = document.getElementById("roomSelect")?.value;

    const conflictWarning = document.getElementById("conflictWarning");
    const conflictMsg = document.getElementById("conflictMsg");

    if (!sectionId || !dayOfWeek || !startTime || !endTime || !roomId) {
        conflictWarning.hidden = true;
        return;
    }

    const params = {
        action: "check_conflicts",
        section_id: sectionId,
        teacher_id: teacherId || '',
        room_id: roomId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
    };

    if (editingId) {
        params.exclude_id = editingId;
    }

    try {
        const conflicts = await apiGet(params);
        let conflictMessages = [];

        if (conflicts.section) {
            conflictMessages.push("This section already has a class at this time.");
        }
        if (conflicts.teacher) {
            conflictMessages.push("This teacher is already assigned to another class at this time.");
        }
        if (conflicts.room) {
            conflictMessages.push("This room is already occupied at this time.");
        }

        if (conflictMessages.length > 0) {
            conflictWarning.hidden = false;
            conflictMsg.textContent = conflictMessages.join(" ");
            return false;
        } else {
            conflictWarning.hidden = true;
            return true;
        }
    } catch (e) {
        console.error("Error checking conflicts:", e);
        return true;
    }
}

// ---------- Modal Functions ----------
async function openSchedModal(s) {
    await loadLookupData();
    
    editingId = s ? s.schedule_id : null;
    modalTitle.textContent = s ? "Edit Schedule" : "Add Schedule";
    schedForm.reset();
    setMsg("");
    document.getElementById("conflictWarning").hidden = true;

    // Set term
    const termSelect = document.getElementById("termSelect");
    if (s) {
        termSelect.value = s.semester || "";
    } else {
        termSelect.selectedIndex = 0;
    }

    // Set section and populate the subjects that apply to it
    const sectionSelect = document.getElementById("sectionSelect");
    if (s) {
        sectionSelect.value = s.section_id;
    } else {
        sectionSelect.selectedIndex = 0;
    }
    await populateSubjects(s ? s.subject_id : null);

    // Set teacher
    const teacherSelect = document.getElementById("teacherSelect");
    if (teacherSelect) {
        if (s) {
            teacherSelect.value = s.teacher_id || "";
        } else {
            teacherSelect.selectedIndex = 0;
        }
    }

    // Set other fields
    if (s) {
        document.getElementById("daySelect").value = s.day_of_week || "";
        document.getElementById("roomSelect").value = s.room_id || "";
        document.getElementById("startTime").value = s.start_time || "";
        document.getElementById("endTime").value = s.end_time || "";
    } else {
        document.getElementById("startTime").value = "08:00";
        document.getElementById("endTime").value = "09:00";
    }

    schedModal.hidden = false;
}

function hideModals() {
    schedModal.hidden = true;
    deleteModal.hidden = true;
    printModal.hidden = true;
    document.body.classList.remove("print-sheet");
}

// ---------- Print Functions ----------
function buildSheet() {
    const sectionId = printSection.value;
    const term = printTerm.value;
    
    if (!sectionId) {
        return '<p class="empty">No section selected.</p>';
    }

    const section = sections.find(s => s.section_id == sectionId);
    const sectionSchedules = schedules.filter(s => s.section_id == sectionId && s.semester === term);

    if (!sectionSchedules.length) {
        return `<p class="empty">No schedules found for ${section ? esc(section.section_name) : 'this section'} - ${esc(term)}.</p>`;
    }

    // Group by day
    const grouped = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(d => { grouped[d] = []; });
    sectionSchedules.forEach(s => {
        if (grouped[s.day_of_week]) {
            grouped[s.day_of_week].push(s);
        }
    });

    let tableRows = '';
    days.forEach(day => {
        const items = grouped[day] || [];
        if (items.length) {
            items.sort((a, b) => a.start_time.localeCompare(b.start_time));
            items.forEach(s => {
                const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
                tableRows += `<tr>
                    <td>${esc(DAYS[day] || day)}</td>
                    <td>${esc(s.subject_code)}</td>
                    <td>${esc(s.subject_name)}</td>
                    <td>${esc(teacherName)}</td>
                    <td>${esc(formatTime(s.start_time))} – ${esc(formatTime(s.end_time))}</td>
                    <td>${esc(s.room_name)}</td>
                </tr>`;
            });
        }
    });

    if (!tableRows) {
        return `<p class="empty">No schedules found for ${section ? esc(section.section_name) : 'this section'} - ${esc(term)}.</p>`;
    }

    return `
        <div class="sheet-header">
            <h3>Class Program</h3>
            <p><strong>Section:</strong> ${esc(section?.section_name || '')} | <strong>Grade:</strong> ${esc(section?.grade_level || '')} | <strong>Term:</strong> ${esc(term)}</p>
        </div>
        <table class="sheet-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Subject Code</th>
                    <th>Subject Title</th>
                    <th>Teacher</th>
                    <th>Time</th>
                    <th>Room</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;
}

function refreshSheet() {
    printSheet.innerHTML = buildSheet();
}

function openPrintModal() {
    // Populate section dropdown
    let html = '<option value="">Select section</option>';
    sections.forEach(s => {
        html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
    });
    printSection.innerHTML = html;

    // Set default term
    if (termFilter && termFilter.value) {
        printTerm.value = termFilter.value;
    }

    // Set default section
    if (sectionFilter && sectionFilter.value) {
        printSection.value = sectionFilter.value;
    }

    refreshSheet();
    printModal.hidden = false;
}

// ---------- Event Listeners ----------
// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadSchedules();
    }, 300));
}

// Filters
[termFilter, sectionFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener("change", () => {
            currentPage = 1;
            loadSchedules();
        });
    }
});

// Add Schedule Button
if (addSchedBtn) {
    addSchedBtn.addEventListener("click", () => openSchedModal());
}

// Print Preview Button
if (printPreviewBtn) {
    printPreviewBtn.addEventListener("click", openPrintModal);
}

// Modal Close Buttons
if (closeSchedModal) closeSchedModal.addEventListener("click", hideModals);
if (cancelSchedBtn) cancelSchedBtn.addEventListener("click", hideModals);
if (closeDeleteModal) closeDeleteModal.addEventListener("click", hideModals);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideModals);
if (closePrintModal) closePrintModal.addEventListener("click", hideModals);

// Section/Subject selection in modal
const sectionSelect = document.getElementById("sectionSelect");
if (sectionSelect) {
    sectionSelect.addEventListener("change", () => {
        populateSubjects(null);
        document.getElementById("conflictWarning").hidden = true;
    });
}

const termSelect = document.getElementById("termSelect");
if (termSelect) {
    termSelect.addEventListener("change", () => {
        populateSubjects(null);
        document.getElementById("conflictWarning").hidden = true;
    });
}

// Check conflicts on change
['daySelect', 'roomSelect', 'startTime', 'endTime', 'subjectSelect', 'teacherSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("change", () => {
            checkConflicts();
        });
        if (id === 'startTime' || id === 'endTime') {
            el.addEventListener("input", () => {
                checkConflicts();
            });
        }
    }
});

// Pagination
if (pageControls) {
    pageControls.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-page]");
        if (!btn || btn.disabled) return;
        currentPage = Number(btn.dataset.page);
        render();
    });
}

// Click outside modal to close
[schedModal, deleteModal, printModal].forEach((overlay) => {
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) hideModals();
        });
    }
});

// Escape key to close
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModals();
});

// Print functionality
if (printBtn) {
    printBtn.addEventListener("click", () => {
        document.body.classList.add("print-sheet");
        window.print();
    });
}

window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-sheet");
});

[printSection, printTerm].forEach(el => {
    if (el) {
        el.addEventListener("change", refreshSheet);
    }
});

// ---------- Form Submit ----------
if (schedForm) {
    schedForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(schedForm);
        const data = {
            section_id: formData.get("sectionId"),
            subject_id: formData.get("subjectId"),
            teacher_id: formData.get("teacherId"),
            room_id: formData.get("roomId"),
            day_of_week: formData.get("dayOfWeek"),
            start_time: formData.get("startTime"),
            end_time: formData.get("endTime"),
        };

        console.log("Submitting data:", data);

        // Validate
        if (!data.section_id) {
            return setMsg("Please select a section.", "is-error");
        }
        if (!data.subject_id) {
            return setMsg("Please select a subject.", "is-error");
        }
        if (!data.teacher_id) {
            return setMsg("Please select a teacher.", "is-error");
        }
        if (!data.room_id) {
            return setMsg("Please select a room.", "is-error");
        }
        if (!data.day_of_week) {
            return setMsg("Please select a day.", "is-error");
        }
        if (!data.start_time || !data.end_time) {
            return setMsg("Please set both start and end times.", "is-error");
        }
        if (data.start_time >= data.end_time) {
            return setMsg("End time must be after start time.", "is-error");
        }

        // Check conflicts first
        const conflictCheck = await checkConflicts();
        if (!conflictCheck) {
            return setMsg("Please resolve conflicts before saving.", "is-error");
        }

        const submitBtn = schedForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            action: editingId ? "update" : "create",
            ...data
        };
        if (editingId) {
            payload.schedule_id = editingId;
        }

        const response = await apiPost(payload);
        if (submitBtn) submitBtn.disabled = false;

        if (response.success) {
            hideModals();
            await loadSchedules();
        } else {
            setMsg(response.message || "Failed to save schedule.", "is-error");
        }
    });
}

// ---------- Row Actions ----------
if (schedRows) {
    schedRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = schedules.find((x) => String(x.schedule_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "edit") {
            openSchedModal(s);
        } else if (btn.dataset.action === "delete") {
            deletingId = s.schedule_id;
            const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
            deleteName.textContent = `${s.subject_code} - ${s.section_name} (${DAYS[s.day_of_week] || s.day_of_week}, ${formatTime(s.start_time)} - ${formatTime(s.end_time)})`;
            deleteModal.hidden = false;
        }
    });
}

// ---------- Confirm Delete ----------
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!deletingId) return;

        const response = await apiPost({
            action: "delete",
            schedule_id: deletingId
        });

        hideModals();

        if (response.success) {
            await loadSchedules();
        } else {
            alert(response.message || "Failed to delete schedule.");
        }
    });
}

// ---------- Clear Search ----------
const searchClear = document.querySelector('.search-clear');
if (searchClear && searchInput) {
    searchInput.addEventListener('input', () => {
        searchClear.hidden = !searchInput.value;
    });
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.hidden = true;
        currentPage = 1;
        loadSchedules();
    });
}

// ---------- Initialize ----------
console.log("Initializing Schedule module...");
loadLookupData().then(() => {
    loadSchedules();
});