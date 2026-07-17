const SECTIONS_URL = "/EnrollmentMS/app/Sections/Controller/sections_controllers.php";
const PAGE_SIZE = 10;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const gradeFilter = document.getElementById("gradeFilter");
const yearFilter = document.getElementById("yearFilter");
const sectionRows = document.getElementById("sectionRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const restoreModal = document.getElementById("restoreModal");
const restoreName = document.getElementById("restoreName");
const closeRestoreModal = document.getElementById("closeRestoreModal");
const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");

// State
let sections = [];
let schoolYears = [];
let restoringSection = null;
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

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function apiPost(params) {
    const res = await fetch(SECTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString()
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        if (text.includes("SUCCESS") || text.includes("success")) {
            return { success: true, message: text };
        }
        return { success: false, message: text || "Unknown error" };
    }
}

// ---------- Load Lookup Data (just needed for the school-year filter) ----------
async function loadLookupData() {
    try {
        const data = await apiGet({ action: "lookup" });
        schoolYears = data.school_years || [];
        populateFilterDropdowns();
    } catch (e) {
        console.error("Failed to load lookup data:", e);
    }
}

function populateFilterDropdowns() {
    if (yearFilter) {
        let html = '<option value="">All School Years</option>';
        schoolYears.forEach(sy => {
            const isActive = sy.status === 'active';
            html += `<option value="${esc(sy.year)}">${esc(sy.year)}${isActive ? ' (Active)' : ''}</option>`;
        });
        yearFilter.innerHTML = html;
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
    const filters = { action: "list", status: "Cancelled" };

    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }
    if (gradeFilter && gradeFilter.value) {
        filters.grade_level = gradeFilter.value;
    }
    if (yearFilter && yearFilter.value) {
        filters.school_year = yearFilter.value;
    }

    showLoading(true);
    try {
        const response = await apiGet(filters);
        sections = Array.isArray(response) ? response : [];
        render();
    } catch (e) {
        console.error("Failed to load cancelled sections:", e);
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
                          (yearFilter && yearFilter.value);
        emptyState.textContent = hasFilters
            ? "No cancelled sections match your filters."
            : "No cancelled sections found.";
        pagination.hidden = true;
        return;
    }

    emptyState.hidden = true;

    sectionRows.innerHTML = pageItems.map((s) => {
        const adviserName = getFullName(s.adviser_first_name, s.adviser_last_name);

        return `<tr>
            <td><span class="chip grade-chip">Grade ${esc(s.grade_level)}</span></td>
            <td>
                <span class="cell-name">${esc(s.section_name)}</span>
                <span class="cell-sub">${esc(s.strand_code || '')} · ${esc(s.track_name || '')} · ${esc(s.school_year || '')}</span>
            </td>
            <td>${esc(adviserName)}</td>
            <td>
                <span class="status-badge status-cancelled">Cancelled</span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--primary btn--sm" data-action="restore" data-id="${s.section_id}">Restore</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
}

// ---------- Event Wiring ----------
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadSections();
    }, 300));
}

[gradeFilter, yearFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener("change", () => {
            currentPage = 1;
            loadSections();
        });
    }
});

if (pageControls) {
    pageControls.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-page]");
        if (!btn || btn.disabled) return;
        currentPage = Number(btn.dataset.page);
        render();
    });
}

function hideModals() {
    restoreModal.hidden = true;
}

if (closeRestoreModal) closeRestoreModal.addEventListener("click", hideModals);
if (cancelRestoreBtn) cancelRestoreBtn.addEventListener("click", hideModals);

if (restoreModal) {
    restoreModal.addEventListener("click", (e) => {
        if (e.target === restoreModal) hideModals();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModals();
});

// ---------- Row Actions (Restore) ----------
if (sectionRows) {
    sectionRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = sections.find((x) => String(x.section_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "restore") {
            restoringSection = s;
            restoreName.textContent = `${s.section_name} (Grade ${s.grade_level} · ${s.strand_code || ''})`;
            restoreModal.hidden = false;
        }
    });
}

// ---------- Confirm Restore ----------
if (confirmRestoreBtn) {
    confirmRestoreBtn.addEventListener("click", async () => {
        if (!restoringSection) return;

        const response = await apiPost({
            action: "restore",
            section_id: restoringSection.section_id
        });

        hideModals();

        if (response.success) {
            await loadSections();
        } else {
            alert(response.message || "Failed to restore section.");
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
loadLookupData().then(() => {
    loadSections();
});
