// API Configuration
const API_BASE = '/EnrollmentMS/app/SchoolYears/Controller/school_year_controllers.php';

const searchInput = document.getElementById('searchInput');
const addSyBtn = document.getElementById('addSyBtn');
const syRows = document.getElementById('syRows');
const emptyState = document.getElementById('emptyState');

const activeSy = document.getElementById('activeSy');
const activeSyLabel = document.getElementById('activeSyLabel');
const activeSyHint = document.getElementById('activeSyHint');

const syModal = document.getElementById('syModal');
const syForm = document.getElementById('syForm');
const syMsg = document.getElementById('syMsg');
const closeSyModal = document.getElementById('closeSyModal');
const cancelSyBtn = document.getElementById('cancelSyBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmName = document.getElementById('confirmName');
const confirmNote = document.getElementById('confirmNote');
const closeConfirmModal = document.getElementById('closeConfirmModal');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');

let schoolYears = [];
let activeYearData = null;
let pendingAction = null;
let editingId = null;
let searchTimeout = null;

// ============ API Helpers ============
function apiRequest(method, data = null, action = null) {
    return new Promise((resolve, reject) => {
        let url = API_BASE;
        let body = null;

        if (method === 'GET') {
            if (action) {
                url += `?action=${action}`;
                if (data) {
                    const params = new URLSearchParams(data);
                    url += `&${params.toString()}`;
                }
            }
        } else {
            body = new FormData();
            if (action) {
                body.append('action', action);
            }
            if (data) {
                for (const [key, value] of Object.entries(data)) {
                    body.append(key, value);
                }
            }
        }

        fetch(url, {
            method: method,
            body: method === 'GET' ? undefined : body
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data);
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

function loadSchoolYears(keyword = '') {
    return apiRequest('GET', { keyword: keyword || '' }, 'list');
}

function getActiveSchoolYear() {
    return apiRequest('GET', null, 'active');
}

function suggestYear() {
    return apiRequest('GET', null, 'suggest');
}

function createSchoolYear(data) {
    return apiRequest('POST', data, 'create');
}

function updateSchoolYear(id, data) {
    return apiRequest('POST', { ...data, school_year_id: id }, 'update');
}

function openSchoolYear(id) {
    return apiRequest('POST', { school_year_id: id }, 'open');
}

function closeSchoolYear(id) {
    return apiRequest('POST', { school_year_id: id }, 'close');
}

function deleteSchoolYear(id) {
    return apiRequest('POST', { school_year_id: id }, 'delete');
}

// ============ UI Helpers ============
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function setMsg(text, type) {
    syMsg.textContent = text;
    syMsg.classList.remove('is-error', 'is-success');
    if (type) syMsg.classList.add(type);
    if (!text) syMsg.classList.remove('is-error', 'is-success');
}

function showLoading(show) {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        loadingModal.hidden = !show;
    }
}

// ============ Render ============
function render() {
    const q = searchInput.value.trim().toLowerCase();
    const list = schoolYears
        .filter((y) => !q || y.year.toLowerCase().includes(q))
        .sort((a, b) => b.year.localeCompare(a.year));

    if (list.length === 0) {
        syRows.innerHTML = '';
        emptyState.hidden = false;
        emptyState.textContent = q
            ? 'No school years match your search.'
            : 'No school years yet. Click "Add School Year" to get started.';
        return;
    }

    syRows.innerHTML = list.map((y) => {
        const isActive = y.status === 'active';
        const count = y.enrollment_count || 0;
        const actions = isActive
            ? `<button class="btn btn--ghost btn--sm" data-action="close" data-id="${y.school_year_id}">Close</button>`
            : `<button class="btn btn--primary btn--sm" data-action="open" data-id="${y.school_year_id}">Open</button>
               <button class="btn btn--danger btn--sm" data-action="delete" data-id="${y.school_year_id}">Delete</button>`;
        return `<tr class="${isActive ? 'sy-row--active' : ''}">
            <td><span class="cell-name">${esc(y.year)}</span></td>
            <td><span class="badge ${isActive ? 'badge--active' : 'badge--closed'}">${isActive ? 'Active' : 'Closed'}</span></td>
            <td><span class="chip">${count}</span></td>
            <td><div class="row-actions">${actions}</div></td>
        </tr>`;
    }).join('');

    emptyState.hidden = true;

    // Update active indicator
    const active = schoolYears.find(y => y.status === 'active');
    activeSy.classList.toggle('active-sy--none', !active);
    if (active) {
        activeSyLabel.textContent = `Active School Year: ${active.year}`;
        activeSyHint.textContent = 'New enrollments fall under this academic year.';
    } else {
        activeSyLabel.textContent = 'No active school year';
        activeSyHint.textContent = 'Open a school year to activate it for enrollment.';
    }
}

// ============ Load Data ============
async function refreshData() {
    showLoading(true);
    try {
        const data = await loadSchoolYears();
        schoolYears = data || [];
        render();
    } catch (error) {
        console.error('Error loading school years:', error);
        schoolYears = [];
        render();
    } finally {
        showLoading(false);
    }
}

// ============ Modal Functions ============
async function openSyModal(s) {
    editingId = s ? s.school_year_id : null;
    syForm.reset();
    setMsg('');

    if (s) {
        // Edit mode
        document.getElementById('modalTitle').textContent = 'Edit School Year';
        syForm.elements.year.value = s.year;
        syForm.elements.makeActive.checked = s.status === 'active';
        // Disable year field for editing
        syForm.elements.year.disabled = true;
    } else {
        // Add mode
        document.getElementById('modalTitle').textContent = 'Add School Year';
        syForm.elements.year.disabled = false;
        try {
            const suggestion = await suggestYear();
            syForm.elements.year.value = suggestion.suggested || '';
            syForm.elements.year.focus();
            syForm.elements.year.select();
        } catch (error) {
            console.error('Error getting suggestion:', error);
        }
        // Check if there's an active year
        const hasActive = schoolYears.some(y => y.status === 'active');
        syForm.elements.makeActive.checked = !hasActive;
    }

    syModal.hidden = false;
}

function openConfirm(title, name, note, actionLabel, isDanger, onConfirm) {
    confirmTitle.textContent = title;
    confirmName.textContent = name;
    confirmNote.textContent = note;
    confirmActionBtn.textContent = actionLabel;
    confirmActionBtn.className = 'btn ' + (isDanger ? 'btn--danger' : 'btn--primary');
    pendingAction = onConfirm;
    confirmModal.hidden = false;
}

function hideModals() {
    syModal.hidden = true;
    confirmModal.hidden = true;
    pendingAction = null;
    syForm.elements.year.disabled = false;
    setMsg('');
}

// ============ Event Listeners ============
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(refreshData, 300);
});

addSyBtn.addEventListener('click', () => openSyModal());
closeSyModal.addEventListener('click', hideModals);
cancelSyBtn.addEventListener('click', hideModals);
closeConfirmModal.addEventListener('click', hideModals);
cancelConfirmBtn.addEventListener('click', hideModals);

[syModal, confirmModal].forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModals();
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModals();
});

confirmActionBtn.addEventListener('click', () => {
    const action = pendingAction;
    hideModals();
    if (action) action();
});

// ============ Form Submit ============
syForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(syForm));
    const year = (data.year || '').trim();
    const makeActive = Boolean(data.makeActive);

    // Validate format
    const match = year.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (!match) {
        return setMsg('Use the format YYYY-YYYY, e.g. 2026-2027.', 'is-error');
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (end !== start + 1) {
        return setMsg('A school year must span two consecutive years.', 'is-error');
    }

    const submitData = {
        year: year,
        makeActive: makeActive ? 'true' : 'false',
        status: makeActive ? 'active' : 'closed'
    };

    const submitBtn = syForm.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        let result;
        if (editingId) {
            result = await updateSchoolYear(editingId, submitData);
        } else {
            result = await createSchoolYear(submitData);
        }

        if (result.success) {
            setMsg(result.message, 'is-success');
            hideModals();
            refreshData();
        } else {
            setMsg(result.message || 'Failed to save school year', 'is-error');
        }
    } catch (error) {
        console.error('Error saving school year:', error);
        setMsg(error.message || 'An error occurred while saving.', 'is-error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingId ? 'Update School Year' : 'Save School Year';
    }
});

// ============ Row Actions ============
syRows.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const y = schoolYears.find((x) => x.school_year_id === id);
    if (!y) return;

    if (btn.dataset.action === 'open') {
        const active = schoolYears.find(x => x.status === 'active');
        openConfirm(
            'Open School Year',
            `A.Y ${y.year}`,
            active
                ? `This will close A.Y ${active.year} — only one school year can be active at a time.`
                : 'This school year will become active, and new enrollments will fall under it.',
            'Open School Year',
            false,
            async () => {
                try {
                    const result = await openSchoolYear(id);
                    if (result.success) {
                        refreshData();
                    } else {
                        alert(result.message || 'Failed to open school year.');
                    }
                } catch (error) {
                    console.error('Error opening school year:', error);
                    alert('An error occurred while opening the school year.');
                }
            }
        );
    } else if (btn.dataset.action === 'close') {
        openConfirm(
            'Close School Year',
            `A.Y ${y.year}`,
            'No school year will be active until you open another one.',
            'Close School Year',
            true,
            async () => {
                try {
                    const result = await closeSchoolYear(id);
                    if (result.success) {
                        refreshData();
                    } else {
                        alert(result.message || 'Failed to close school year.');
                    }
                } catch (error) {
                    console.error('Error closing school year:', error);
                    alert('An error occurred while closing the school year.');
                }
            }
        );
    } else if (btn.dataset.action === 'delete') {
        const count = y.enrollment_count || 0;
        openConfirm(
            'Delete School Year',
            `A.Y ${y.year}`,
            count > 0
                ? `This school year has ${count} enrollment record${count === 1 ? '' : 's'}. Deleting it will not remove those records, and this cannot be undone.`
                : 'This permanently removes the school year. This cannot be undone.',
            'Delete',
            true,
            async () => {
                try {
                    const result = await deleteSchoolYear(id);
                    if (result.success) {
                        refreshData();
                    } else {
                        alert(result.message || 'Failed to delete school year.');
                    }
                } catch (error) {
                    console.error('Error deleting school year:', error);
                    alert('An error occurred while deleting the school year.');
                }
            }
        );
    }
});

// ============ Init ============
console.log('✅ Using API version of school-year.js');
refreshData();