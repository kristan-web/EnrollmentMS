const SECTIONS_URL = "../Controllers/sections_controllers.php";
const PAGE_SIZE = 10;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const gradeFilter = document.getElementById("gradeFilter");
const yearFilter = document.getElementById("yearFilter");
const statusFilter = document.getElementById("statusFilter");
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

// State
let sections = [];
let strands = [];
let teachers = [];
let schoolYears = [];
let editingSection = null;
let deletingSection = null;
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
    if (sectionMsg) {
        sectionMsg.textContent = text;
        sectionMsg.classList.remove("is-error", "is-success");
        if (type) sectionMsg.classList.add(type);
    }
}

function getFullName(first, last) {
    if (!first && !last) return "—";
    return `${last || ''}${last && first ? ', ' : ''}${first || ''}`.trim() || "—";
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
    
    const url = `${SECTIONS_URL}?${new URLSearchParams(cleanParams).toString()}`;
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
    const res = await fetch(SECTIONS_URL, {
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
        teachers = data.teachers || [];
        schoolYears = data.school_years || [];
        lookupLoaded = true;
        console.log("Strands loaded:", strands.length);
        console.log("Teachers loaded:", teachers.length);
        console.log("School Years loaded:", schoolYears.length);
        populateFormDropdowns();
        populateFilterDropdowns();
    } catch (e) {
        console.error("Failed to load lookup data:", e);
    } finally {
        showLoading(false);
    }
}

function populateFilterDropdowns() {
    // Populate school year filter
    if (yearFilter) {
        let html = '<option value="">All School Years</option>';
        schoolYears.forEach(sy => {
            const isActive = sy.status === 'active';
            html += `<option value="${esc(sy.year)}">${esc(sy.year)}${isActive ? ' (Active)' : ''}</option>`;
        });
        yearFilter.innerHTML = html;
    }
}

function populateFormDropdowns() {
    // Populate strand dropdown in form
    const strandSelect = document.querySelector('select[name="strand"]');
    if (strandSelect) {
        const grouped = {};
        strands.forEach(s => {
            if (!grouped[s.track_name]) grouped[s.track_name] = [];
            grouped[s.track_name].push(s);
        });

        let html = '<option value="" disabled selected>Select strand</option>';
        for (const [trackName, items] of Object.entries(grouped)) {
            html += `<optgroup label="${esc(trackName)}">`;
            items.forEach(s => {
                html += `<option value="${s.strand_id}">${esc(s.strand_code)} - ${esc(s.strand_name)}</option>`;
            });
            html += `</optgroup>`;
        }
        strandSelect.innerHTML = html;
    }

    // Populate teacher dropdown in form
    const adviserSelect = document.querySelector('select[name="adviserId"]');
    if (adviserSelect) {
        let html = '<option value="" disabled selected>Select adviser</option>';
        teachers.forEach(t => {
            html += `<option value="${t.teacher_id}">${esc(t.last_name)}, ${esc(t.first_name)}</option>`;
        });
        adviserSelect.innerHTML = html;
        console.log("Teachers populated in dropdown:", teachers.length);
    }

    // Populate school year dropdown in form
    const schoolYearSelect = document.querySelector('select[name="schoolYear"]');
    if (schoolYearSelect) {
        let html = '<option value="" disabled selected>Select school year</option>';
        schoolYears.forEach(sy => {
            const isActive = sy.status === 'active';
            html += `<option value="${esc(sy.year)}"${isActive ? ' selected' : ''}>${esc(sy.year)}${isActive ? ' (Active)' : ''}</option>`;
        });
        schoolYearSelect.innerHTML = html;
    }
}

// ---------- Pagination ----------
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

// ---------- Load + Render ----------
async function loadSections() {
    const filters = {};
    
    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }
    if (gradeFilter && gradeFilter.value) {
        filters.grade_level = gradeFilter.value;
    }
    if (yearFilter && yearFilter.value) {
        filters.school_year = yearFilter.value;
    }
    if (statusFilter && statusFilter.value) {
        filters.status = statusFilter.value;
    }
    
    filters.action = "list";

    console.log("Loading sections with filters:", filters);

    showLoading(true);
    try {
        const response = await apiGet(filters);
        sections = Array.isArray(response) ? response : [];
        console.log("Sections loaded:", sections.length);
        render();
    } catch (e) {
        console.error("Failed to load sections:", e);
        sections = [];
        render();
    } finally {
        showLoading(false);
    }
}

function render() {
    const total = sections.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = sections.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
        sectionRows.innerHTML = "";
        emptyState.hidden = false;
        const hasFilters = (searchInput && searchInput.value.trim()) || 
                          (gradeFilter && gradeFilter.value) || 
                          (yearFilter && yearFilter.value) || 
                          (statusFilter && statusFilter.value);
        emptyState.textContent = hasFilters
            ? "No sections match your filters."
            : 'No sections yet. Click "Add Section" to get started.';
        pagination.hidden = true;
        return;
    }

    emptyState.hidden = true;

    sectionRows.innerHTML = pageItems.map((s) => {
        const adviserName = getFullName(s.adviser_first_name, s.adviser_last_name);
        const enrolledText = s.enrolled_count !== undefined
            ? `${s.enrolled_count}/${s.max_slots}`
            : `0/${s.max_slots}`;

        const statusClass = s.status === 'Open' ? 'status-open' :
                           s.status === 'Closed' ? 'status-closed' :
                           'status-cancelled';

        const hasStudents = (s.enrolled_count || 0) > 0;

        return `<tr>
            <td><span class="chip grade-chip">Grade ${esc(s.grade_level)}</span></td>
            <td>
                <span class="cell-name">${esc(s.section_name)}</span>
                <span class="cell-sub">${esc(s.strand_code || '')} · ${esc(s.track_name || '')}</span>
            </td>
            <td>${esc(adviserName)}</td>
            <td>
                <span class="status-badge ${statusClass}">${esc(s.status)}</span>
                <span class="enrolled-count">${enrolledText} enrolled</span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.section_id}">Edit</button>
                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.section_id}" ${hasStudents ? 'disabled title="Cannot cancel: has enrolled students"' : ''}>
                        ${hasStudents ? 'Has Students' : 'Cancel'}
                    </button>
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
}

// ---------- Modal Open/Close ----------
async function openSectionModal(s) {
    await loadLookupData();

    editingSection = s || null;
    modalTitle.textContent = s ? "Edit Section" : "Add Section";
    sectionForm.reset();
    setMsg("");

    // Populate dropdowns
    populateFormDropdowns();

    if (s) {
        // Set form values for edit
        const strandSelect = document.querySelector('select[name="strand"]');
        if (strandSelect) strandSelect.value = s.strand_id;

        const adviserSelect = document.querySelector('select[name="adviserId"]');
        if (adviserSelect) adviserSelect.value = s.adviser_id || "";

        const gradeSelect = document.querySelector('select[name="grade"]');
        if (gradeSelect) gradeSelect.value = s.grade_level;

        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) nameInput.value = s.section_name;

        const capacityInput = document.querySelector('input[name="capacity"]');
        if (capacityInput) capacityInput.value = s.max_slots;

        const yearSelect = document.querySelector('select[name="schoolYear"]');
        if (yearSelect) yearSelect.value = s.school_year;

        const statusSelect = document.querySelector('select[name="status"]');
        if (statusSelect) statusSelect.value = s.status;
    } else {
        // Default values for new section
        const capacityInput = document.querySelector('input[name="capacity"]');
        if (capacityInput) capacityInput.value = 40;

        const statusSelect = document.querySelector('select[name="status"]');
        if (statusSelect) statusSelect.value = "Open";
    }

    sectionModal.hidden = false;
    const nameInput = document.querySelector('input[name="name"]');
    if (nameInput) nameInput.focus();
}

function hideModals() {
    sectionModal.hidden = true;
    deleteModal.hidden = true;
}

// ---------- Event Wiring ----------
// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadSections();
    }, 300));
}

// Filters
[gradeFilter, yearFilter, statusFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener("change", () => {
            currentPage = 1;
            loadSections();
        });
    }
});

// Add Section Button
if (addSectionBtn) {
    addSectionBtn.addEventListener("click", () => openSectionModal());
}

// Modal Close Buttons
if (closeSectionModal) closeSectionModal.addEventListener("click", hideModals);
if (cancelSectionBtn) cancelSectionBtn.addEventListener("click", hideModals);
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
[sectionModal, deleteModal].forEach((overlay) => {
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
if (sectionForm) {
    sectionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(sectionForm);
        const data = {
            strand_id: formData.get("strand"),
            adviser_id: formData.get("adviserId") || "",
            grade_level: formData.get("grade"),
            section_name: formData.get("name").trim(),
            school_year: formData.get("schoolYear"),
            max_slots: formData.get("capacity"),
            status: formData.get("status"),
        };

        console.log("Submitting data:", data);

        // Validate
        if (!data.strand_id) {
            return setMsg("Please select a strand.", "is-error");
        }
        if (!data.grade_level) {
            return setMsg("Please select a grade level.", "is-error");
        }
        if (!data.section_name || data.section_name.length < 2) {
            return setMsg("Section name must be at least 2 characters.", "is-error");
        }
        if (data.section_name.length > 50) {
            return setMsg("Section name must be 50 characters or fewer.", "is-error");
        }
        if (!data.school_year) {
            return setMsg("Please select a school year.", "is-error");
        }
        if (!/^\d{4}-\d{4}$/.test(data.school_year)) {
            return setMsg("School year must be in YYYY-YYYY format.", "is-error");
        }
        if (!data.max_slots || parseInt(data.max_slots) < 1 || parseInt(data.max_slots) > 100) {
            return setMsg("Capacity must be between 1 and 100.", "is-error");
        }
        if (!data.adviser_id) {
            return setMsg("Please select an adviser for this section.", "is-error");
        }

        const submitBtn = sectionForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            action: editingSection ? "update" : "create",
            ...data
        };
        if (editingSection) {
            payload.section_id = editingSection.section_id;
        }

        const response = await apiPost(payload);
        if (submitBtn) submitBtn.disabled = false;

        if (response.success) {
            hideModals();
            await loadSections();
        } else {
            setMsg(response.message || "Failed to save section.", "is-error");
        }
    });
}

// ---------- Row Actions (Edit / Delete) ----------
if (sectionRows) {
    sectionRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = sections.find((x) => String(x.section_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "edit") {
            openSectionModal(s);
        } else if (btn.dataset.action === "delete") {
            deletingSection = s;
            deleteName.textContent = `${s.section_name} (Grade ${s.grade_level} · ${s.strand_code || ''})`;

            if ((s.enrolled_count || 0) > 0) {
                deleteNote.textContent =
                    `${s.enrolled_count} student${s.enrolled_count === 1 ? "" : "s"} currently enrolled in this section. ` +
                    `You must drop all students before cancelling this section.`;
                confirmDeleteBtn.disabled = true;
            } else {
                deleteNote.textContent =
                    "This will cancel the section. It will be hidden from the active list " +
                    "but can be restored later from the Status filter.";
                confirmDeleteBtn.disabled = false;
            }

            deleteModal.hidden = false;
        }
    });
}

// ---------- Confirm Delete ----------
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!deletingSection) return;

        const response = await apiPost({
            action: "delete",
            section_id: deletingSection.section_id
        });

        hideModals();

        if (response.success) {
            await loadSections();
        } else {
            alert(response.message || "Failed to cancel section.");
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
        loadSections();
    });
}

// ---------- Initialize ----------
console.log("Initializing Section module...");
loadLookupData().then(() => {
    loadSections();
});