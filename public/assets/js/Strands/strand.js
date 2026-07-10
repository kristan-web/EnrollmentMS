const STRANDS_URL = "/EnrollmentMS/app/Strands/Controller/strands_controllers.php";
const PAGE_SIZE = 10;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const addStrandBtn = document.getElementById("addStrandBtn");
const strandRows = document.getElementById("strandRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const strandModal = document.getElementById("strandModal");
const strandForm = document.getElementById("strandForm");
const strandMsg = document.getElementById("strandMsg");
const modalTitle = document.getElementById("modalTitle");
const closeStrandModal = document.getElementById("closeStrandModal");
const cancelStrandBtn = document.getElementById("cancelStrandBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const deleteNote = document.getElementById("deleteNote");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// State
let strands = [];
let tracks = [];
let editingStrand = null;
let deletingStrand = null;
let currentPage = 1;
let tracksLoaded = false;

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
    if (strandMsg) {
        strandMsg.textContent = text;
        strandMsg.classList.remove("is-error", "is-success");
        if (type) strandMsg.classList.add(type);
    }
}

// ---------- API Helpers ----------
async function apiGet(params) {
    // Clean up params - remove null, undefined, and empty values
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '' && value !== 'null') {
            cleanParams[key] = value;
        }
    }
    
    const url = `${STRANDS_URL}?${new URLSearchParams(cleanParams).toString()}`;
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
    const res = await fetch(STRANDS_URL, {
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

// ---------- Load Tracks ----------
async function loadTracks() {
    if (tracksLoaded) return;
    try {
        console.log("Loading tracks...");
        const data = await apiGet({ action: "lookup" });
        
        if (data.error) {
            console.error("Lookup error:", data.error);
            return;
        }
        
        tracks = data.tracks || [];
        tracksLoaded = true;
        console.log("Tracks loaded:", tracks.length);
        populateTrackDropdown();
    } catch (e) {
        console.error("Failed to load tracks:", e);
    }
}

function populateTrackDropdown() {
    // Populate track dropdown in form
    const trackSelect = document.querySelector('select[name="track"]');
    if (trackSelect) {
        let html = '<option value="" disabled selected>Select track</option>';
        tracks.forEach(t => {
            html += `<option value="${t.track_id}">${esc(t.track_name)} (${esc(t.track_code)})</option>`;
        });
        trackSelect.innerHTML = html;
        console.log("Tracks populated in dropdown:", tracks.length);
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
async function loadStrands() {
    const filters = { action: "list" };
    
    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }

    console.log("Loading strands with filters:", filters);

    try {
        const response = await apiGet(filters);
        strands = Array.isArray(response) ? response : [];
        console.log("Strands loaded:", strands.length);
        if (strands.length > 0) {
            console.log("First strand:", strands[0]);
        }
        render();
    } catch (e) {
        console.error("Failed to load strands:", e);
        strands = [];
        render();
    }
}

function render() {
    const total = strands.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = strands.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
        strandRows.innerHTML = "";
        emptyState.hidden = false;
        const hasFilters = searchInput && searchInput.value.trim();
        emptyState.textContent = hasFilters
            ? "No strands match your search."
            : 'No strands yet. Click "Add Strand" to get started.';
        pagination.hidden = true;
        return;
    }

    emptyState.hidden = true;

    strandRows.innerHTML = pageItems.map((s) => {
        const hasSections = (s.section_count || 0) > 0;
        const hasSubjects = (s.subject_count || 0) > 0;
        const canDelete = !hasSections && !hasSubjects;

        return `<tr>
            <td><span class="chip">${esc(s.strand_code)}</span></td>
            <td>
                <span class="cell-name">${esc(s.strand_name)}</span>
                <span class="cell-sub">${esc(s.track_name || '')}</span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.strand_id}">Edit</button>
                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.strand_id}" ${!canDelete ? 'disabled title="Cannot delete: has sections or subjects"' : ''}>
                        ${canDelete ? 'Delete' : 'In Use'}
                    </button>
                    ${hasSections ? `<span class="badge badge--warning" title="${s.section_count} section(s)">📚 ${s.section_count}</span>` : ''}
                    ${hasSubjects ? `<span class="badge badge--info" title="${s.subject_count} subject(s)">📝 ${s.subject_count}</span>` : ''}
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
}

// ---------- Modal Open/Close ----------
async function openStrandModal(s) {
    await loadTracks();

    editingStrand = s || null;
    modalTitle.textContent = s ? "Edit Strand" : "Add Strand";
    strandForm.reset();
    setMsg("");

    // Populate dropdowns
    populateTrackDropdown();

    if (s) {
        // Set form values for edit
        const trackSelect = document.querySelector('select[name="track"]');
        if (trackSelect) trackSelect.value = s.track_id;

        const codeInput = document.querySelector('input[name="code"]');
        if (codeInput) codeInput.value = s.strand_code;

        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) nameInput.value = s.strand_name;

        const descInput = document.querySelector('textarea[name="description"]');
        if (descInput) descInput.value = s.description || "";
    }

    strandModal.hidden = false;
    const codeInput = document.querySelector('input[name="code"]');
    if (codeInput) codeInput.focus();
}

function hideModals() {
    strandModal.hidden = true;
    deleteModal.hidden = true;
}

// ---------- Event Wiring ----------
// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadStrands();
    }, 300));
}

// Add Strand Button
if (addStrandBtn) {
    addStrandBtn.addEventListener("click", () => openStrandModal());
}

// Modal Close Buttons
if (closeStrandModal) closeStrandModal.addEventListener("click", hideModals);
if (cancelStrandBtn) cancelStrandBtn.addEventListener("click", hideModals);
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
[strandModal, deleteModal].forEach((overlay) => {
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
if (strandForm) {
    strandForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(strandForm);
        const data = {
            track_id: formData.get("track"),
            strand_code: formData.get("code").trim().toUpperCase(),
            strand_name: formData.get("name").trim(),
            description: formData.get("description") ? formData.get("description").trim() : "",
        };

        console.log("Submitting data:", data);

        // Validate
        if (!data.track_id) {
            return setMsg("Please select a track.", "is-error");
        }
        if (!data.strand_code || data.strand_code.length < 2) {
            return setMsg("Strand code must be at least 2 characters.", "is-error");
        }
        if (data.strand_code.length > 20) {
            return setMsg("Strand code must be 20 characters or fewer.", "is-error");
        }
        if (!/^[A-Za-z0-9\-_]+$/.test(data.strand_code)) {
            return setMsg("Strand code may only contain letters, numbers, hyphens, and underscores.", "is-error");
        }
        if (!data.strand_name || data.strand_name.length < 2) {
            return setMsg("Strand name must be at least 2 characters.", "is-error");
        }
        if (data.strand_name.length > 150) {
            return setMsg("Strand name must be 150 characters or fewer.", "is-error");
        }

        const submitBtn = strandForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            action: editingStrand ? "update" : "create",
            ...data
        };
        if (editingStrand) {
            payload.strand_id = editingStrand.strand_id;
        }

        const response = await apiPost(payload);
        if (submitBtn) submitBtn.disabled = false;

        if (response.success) {
            hideModals();
            await loadStrands();
        } else {
            setMsg(response.message || "Failed to save strand.", "is-error");
        }
    });
}

// ---------- Row Actions (Edit / Delete) ----------
if (strandRows) {
    strandRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = strands.find((x) => String(x.strand_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "edit") {
            openStrandModal(s);
        } else if (btn.dataset.action === "delete") {
            deletingStrand = s;
            deleteName.textContent = `${s.strand_code} — ${s.strand_name}`;

            const hasSections = (s.section_count || 0) > 0;
            const hasSubjects = (s.subject_count || 0) > 0;

            if (hasSections) {
                deleteNote.textContent =
                    `${s.section_count} class section${s.section_count === 1 ? "" : "s"} currently use${s.section_count === 1 ? "s" : ""} this strand. ` +
                    `You must reassign or remove those sections before deleting this strand.`;
                confirmDeleteBtn.disabled = true;
            } else if (hasSubjects) {
                deleteNote.textContent =
                    `${s.subject_count} subject${s.subject_count === 1 ? "" : "s"} ${s.subject_count === 1 ? "is" : "are"} linked to this strand. ` +
                    `Deleting this strand will also delete those subjects. This cannot be undone.`;
                confirmDeleteBtn.disabled = false;
            } else {
                deleteNote.textContent = "This permanently removes the strand. This cannot be undone.";
                confirmDeleteBtn.disabled = false;
            }

            deleteModal.hidden = false;
        }
    });
}

// ---------- Confirm Delete ----------
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!deletingStrand) return;

        const response = await apiPost({
            action: "delete",
            strand_id: deletingStrand.strand_id
        });

        hideModals();

        if (response.success) {
            await loadStrands();
        } else {
            alert(response.message || "Failed to delete strand.");
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
        loadStrands();
    });
}

// ---------- Initialize ----------
console.log("Initializing Strand module...");
loadTracks().then(() => {
    loadStrands();
});