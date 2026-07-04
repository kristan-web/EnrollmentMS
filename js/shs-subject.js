const SUBJECT_URL = "../Controllers/subjects_controllers.php";
const PAGE_SIZE = 10;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const gradeFilter = document.getElementById("gradeFilter");
const semesterFilter = document.getElementById("semesterFilter");
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
const deleteNote = document.getElementById("deleteNote");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// State
let subjects = [];
let strands = [];
let editingId = null;
let deletingId = null;
let currentPage = 1;
let lookupLoaded = false;

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
    subjectMsg.textContent = text;
    subjectMsg.classList.remove("is-error", "is-success");
    if (type) subjectMsg.classList.add(type);
}

function showLoading(show) {
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        loadingModal.hidden = !show;
    }
}

// ---------- API Helpers ----------
async function apiGet(params) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '' && value !== 'null') {
            cleanParams[key] = value;
        }
    }
    
    const url = `${SUBJECT_URL}?${new URLSearchParams(cleanParams).toString()}`;
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
    const res = await fetch(SUBJECT_URL, {
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

// ---------- Load Lookup Data ----------
async function loadLookupData() {
    if (lookupLoaded) return;
    showLoading(true);
    try {
        console.log("Loading lookup data...");
        const data = await apiGet({ action: "lookup" });
        strands = data.strands || [];
        lookupLoaded = true;
        console.log("Strands loaded:", strands.length);
        populateFormDropdowns();
    } catch (e) {
        console.error("Failed to load lookup data:", e);
    } finally {
        showLoading(false);
    }
}

function populateFormDropdowns() {
    // Populate strand dropdown in form
    const strandSelect = document.querySelector('select[name="strand_id"]');
    if (strandSelect) {
        const grouped = {};
        strands.forEach(s => {
            if (!grouped[s.track_name]) grouped[s.track_name] = [];
            grouped[s.track_name].push(s);
        });

        let html = '<option value="">— All Strands (Core/Applied) —</option>';
        for (const [trackName, items] of Object.entries(grouped)) {
            html += `<optgroup label="${esc(trackName)}">`;
            html += `<option value="">— All ${esc(trackName)} —</option>`;
            items.forEach(s => {
                html += `<option value="${s.strand_id}">${esc(s.strand_code)} - ${esc(s.strand_name)}</option>`;
            });
            html += `</optgroup>`;
        }
        strandSelect.innerHTML = html;
    }
}

// ---------- Load Subjects ----------
async function loadSubjects() {
    const filters = {};
    
    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }
    if (typeFilter && typeFilter.value) {
        filters.subject_type = typeFilter.value;
    }
    if (gradeFilter && gradeFilter.value) {
        filters.grade_level = gradeFilter.value;
    }
    if (semesterFilter && semesterFilter.value) {
        filters.semester = semesterFilter.value;
    }
    
    filters.action = "list";

    console.log("Loading subjects with filters:", filters);

    showLoading(true);
    try {
        const response = await apiGet(filters);
        subjects = Array.isArray(response) ? response : [];
        console.log("Subjects loaded:", subjects.length);
        render();
    } catch (e) {
        console.error("Failed to load subjects:", e);
        subjects = [];
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
    const total = subjects.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = subjects.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
        subjectRows.innerHTML = "";
        emptyState.hidden = false;
        const hasFilters = (searchInput && searchInput.value.trim()) || 
                          (typeFilter && typeFilter.value) || 
                          (gradeFilter && gradeFilter.value) ||
                          (semesterFilter && semesterFilter.value);
        emptyState.textContent = hasFilters
            ? "No subjects match your filters."
            : 'No subjects yet. Click "Add Subject" to get started.';
        pagination.hidden = true;
        return;
    }

    emptyState.hidden = true;

    const typeBadges = {
        'Core': 'badge--core',
        'Applied': 'badge--applied',
        'Specialized': 'badge--specialized'
    };

    subjectRows.innerHTML = pageItems.map((s) => {
        const statusClass = s.status === 'Active' ? 'badge--active' : 'badge--inactive';
        return `<tr>
            <td><span class="chip">${esc(s.subject_code)}</span></td>
            <td><span class="cell-name">${esc(s.subject_name)}</span></td>
            <td>${esc(s.units)}</td>
            <td><span class="badge ${typeBadges[s.subject_type] || 'badge--core'}">${esc(s.subject_type)}</span></td>
            <td><span class="chip">Grade ${esc(s.grade_level)}</span></td>
            <td>${esc(s.semester || '—')}</td>
            <td><span class="badge ${statusClass}">${esc(s.status || 'Active')}</span></td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.subject_id}">Edit</button>
                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.subject_id}">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
}

// ---------- Modal Functions ----------
async function openSubjectModal(s) {
    await loadLookupData();
    
    editingId = s ? s.subject_id : null;
    modalTitle.textContent = s ? "Edit Subject" : "Add Subject";
    subjectForm.reset();
    setMsg("");

    // Set default values
    const statusSelect = document.querySelector('select[name="status"]');
    if (statusSelect && !s) {
        statusSelect.value = "Active";
    }

    if (s) {
        document.querySelector('input[name="subject_code"]').value = s.subject_code;
        document.querySelector('input[name="subject_name"]').value = s.subject_name;
        document.querySelector('input[name="units"]').value = s.units;
        document.querySelector('select[name="subject_type"]').value = s.subject_type;
        document.querySelector('select[name="grade_level"]').value = s.grade_level;
        document.querySelector('select[name="semester"]').value = s.semester || '1st Semester';
        document.querySelector('select[name="strand_id"]').value = s.strand_id || '';
        document.querySelector('textarea[name="description"]').value = s.description || '';
        document.querySelector('select[name="status"]').value = s.status || 'Active';
    } else {
        // Set default semester
        document.querySelector('select[name="semester"]').value = '1st Semester';
        document.querySelector('input[name="units"]').value = 2;
    }

    subjectModal.hidden = false;
    document.querySelector('input[name="subject_code"]').focus();
}

function hideModals() {
    subjectModal.hidden = true;
    deleteModal.hidden = true;
}

// ---------- Event Listeners ----------
// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadSubjects();
    }, 300));
}

// Filters
[typeFilter, gradeFilter, semesterFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener("change", () => {
            currentPage = 1;
            loadSubjects();
        });
    }
});

// Add Subject Button
if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", () => openSubjectModal());
}

// Modal Close Buttons
if (closeSubjectModal) closeSubjectModal.addEventListener("click", hideModals);
if (cancelSubjectBtn) cancelSubjectBtn.addEventListener("click", hideModals);
if (closeDeleteModal) closeDeleteModal.addEventListener("click", hideModals);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideModals);

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
[subjectModal, deleteModal].forEach((overlay) => {
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

// ---------- Form Submit ----------
if (subjectForm) {
    subjectForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(subjectForm);
        const data = {
            subject_code: formData.get("subject_code").trim(),
            subject_name: formData.get("subject_name").trim(),
            units: formData.get("units"),
            subject_type: formData.get("subject_type"),
            grade_level: formData.get("grade_level"),
            semester: formData.get("semester"),
            strand_id: formData.get("strand_id") || "",
            description: formData.get("description") || "",
            status: formData.get("status") || "Active"
        };

        console.log("Submitting data:", data);

        // Validate
        const code = data.subject_code.toUpperCase().replace(/\s+/g, "");
        if (!code || code.length < 2 || code.length > 20) {
            return setMsg("Subject code must be 2-20 characters.", "is-error");
        }
        if (!/^[A-Z0-9\-_]+$/.test(code)) {
            return setMsg("Subject code may only contain letters, numbers, hyphens, and underscores.", "is-error");
        }
        if (!data.subject_name || data.subject_name.length < 2) {
            return setMsg("Subject name must be at least 2 characters.", "is-error");
        }
        if (data.subject_name.length > 150) {
            return setMsg("Subject name must be 150 characters or fewer.", "is-error");
        }
        if (!data.subject_type) {
            return setMsg("Please select a subject type.", "is-error");
        }
        if (!data.grade_level) {
            return setMsg("Please select a grade level.", "is-error");
        }
        if (!data.semester) {
            return setMsg("Please select a semester.", "is-error");
        }
        const units = parseFloat(data.units);
        if (isNaN(units) || units < 1 || units > 10) {
            return setMsg("Units must be between 1 and 10.", "is-error");
        }

        data.subject_code = code;
        data.units = units;

        const submitBtn = subjectForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            action: editingId ? "update" : "create",
            ...data
        };
        if (editingId) {
            payload.subject_id = editingId;
        }

        const response = await apiPost(payload);
        if (submitBtn) submitBtn.disabled = false;

        if (response.success) {
            hideModals();
            await loadSubjects();
        } else {
            setMsg(response.message || "Failed to save subject.", "is-error");
        }
    });
}

// ---------- Row Actions ----------
if (subjectRows) {
    subjectRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = subjects.find((x) => String(x.subject_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "edit") {
            openSubjectModal(s);
        } else if (btn.dataset.action === "delete") {
            deletingId = s.subject_id;
            deleteName.textContent = `${s.subject_code} — ${s.subject_name}`;
            if (s.status === 'Inactive') {
                deleteNote.textContent = "This subject is already inactive. You can reactivate it by editing and changing the status to Active.";
                confirmDeleteBtn.textContent = "Deactivate";
            } else {
                deleteNote.textContent = "This will deactivate the subject. It can be restored by changing the status to Active.";
                confirmDeleteBtn.textContent = "Deactivate";
            }
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
            subject_id: deletingId
        });

        hideModals();

        if (response.success) {
            await loadSubjects();
        } else {
            alert(response.message || "Failed to delete subject.");
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
        loadSubjects();
    });
}

// ---------- Initialize ----------
console.log("Initializing Subject module...");
loadLookupData().then(() => {
    loadSubjects();
});