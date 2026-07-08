/**
 * Student Management Module
 * Connects frontend UI to backend PHP API
 */

const STUDENTS_API_URL = "../Controllers/student/students_controllers.php";

// DOM Elements
const tabs = document.querySelectorAll(".tab");
const activeCountEl = document.getElementById("activeCount");
const archivedCountEl = document.getElementById("archivedCount");
const searchInput = document.getElementById("searchInput");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentRows = document.getElementById("studentRows");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");

// Modal Elements
const studentModal = document.getElementById("studentModal");
const studentForm = document.getElementById("studentForm");
const modalTitle = document.getElementById("modalTitle");
const closeStudentModal = document.getElementById("closeStudentModal");
const cancelStudentBtn = document.getElementById("cancelStudentBtn");
const saveStudentBtn = document.getElementById("saveStudentBtn");
const formError = document.getElementById("formError");

// Archive Modal Elements
const archiveModal = document.getElementById("archiveModal");
const archiveName = document.getElementById("archiveName");
const archiveReason = document.getElementById("archiveReason");
const closeArchiveModal = document.getElementById("closeArchiveModal");
const cancelArchiveBtn = document.getElementById("cancelArchiveBtn");
const confirmArchiveBtn = document.getElementById("confirmArchiveBtn");

// State
let currentTab = "active";
let editingId = null;
let archivingId = null;
let searchDebounce = null;

// ============ API Functions ============

/**
 * Fetch all students with optional search/filter
 */
function fetchStudents(searchTerm = "") {
    const params = new URLSearchParams();
    params.append("action", "list");
    if (searchTerm.trim()) {
        params.append("keyword", searchTerm.trim());
    }

    showLoading(true);

    fetch(`${STUDENTS_API_URL}?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Handle both array response and error response
            if (data.error) {
                throw new Error(data.error);
            }
            // If data is not an array, try to extract it
            const students = Array.isArray(data) ? data : [];
            renderStudents(students);
        })
        .catch(error => {
            console.error("Error fetching students:", error);
            studentRows.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#c00;">Failed to load students: ${error.message}</td></tr>`;
            emptyState.hidden = true;
        })
        .finally(() => {
            showLoading(false);
        });
}

/**
 * Fetch archived students
 */
function fetchArchivedStudents() {
    const params = new URLSearchParams();
    params.append("action", "archived");

    showLoading(true);

    fetch(`${STUDENTS_API_URL}?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            const students = Array.isArray(data) ? data : [];
            renderStudents(students);
        })
        .catch(error => {
            console.error("Error fetching archived students:", error);
            studentRows.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#c00;">Failed to load archived students.</td></tr>`;
            emptyState.hidden = true;
        })
        .finally(() => {
            showLoading(false);
        });
}

/**
 * Save student (create or update)
 */
function saveStudent(studentData, isEdit = false) {
    const formData = new FormData();
    
    // Add all student data
    Object.keys(studentData).forEach(key => {
        if (studentData[key] !== null && studentData[key] !== undefined) {
            formData.append(key, studentData[key]);
        }
    });

    if (isEdit && editingId) {
        formData.append("action", "update");
        formData.append("student_id", editingId);
        formData.append("status", studentData.status || "Active");
    } else {
        formData.append("action", "create");
    }

    saveStudentBtn.disabled = true;
    saveStudentBtn.textContent = "Saving...";

    fetch(STUDENTS_API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            hideModals();
            refreshList();
            showToast(result.message || "Student saved successfully!", "success");
        } else {
            showFormError(result.message || "Failed to save student.");
        }
    })
    .catch(error => {
        console.error("Error saving student:", error);
        showFormError("Network error: " + error.message);
    })
    .finally(() => {
        saveStudentBtn.disabled = false;
        saveStudentBtn.textContent = isEdit ? "Update Student" : "Save Student";
    });
}

/**
 * Archive student (soft delete)
 */
function archiveStudent(id, reason) {
    const formData = new FormData();
    formData.append("action", "archive");
    formData.append("student_id", id);
    formData.append("reason", reason);

    confirmArchiveBtn.disabled = true;
    confirmArchiveBtn.textContent = "Archiving...";

    fetch(STUDENTS_API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            hideModals();
            refreshList();
            showToast(result.message || "Student archived successfully!", "info");
        } else {
            alert(result.message || "Failed to archive student.");
        }
    })
    .catch(error => {
        console.error("Error archiving student:", error);
        alert("Network error: " + error.message);
    })
    .finally(() => {
        confirmArchiveBtn.disabled = false;
        confirmArchiveBtn.textContent = "Archive";
    });
}

/**
 * Restore archived student
 */
function restoreStudent(id) {
    const formData = new FormData();
    formData.append("action", "restore");
    formData.append("student_id", id);

    fetch(STUDENTS_API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            refreshList();
            showToast(result.message || "Student restored successfully!", "success");
        } else {
            alert(result.message || "Failed to restore student.");
        }
    })
    .catch(error => {
        console.error("Error restoring student:", error);
        alert("Network error: " + error.message);
    });
}

/**
 * Delete student (hard delete - use with caution)
 */
function deleteStudent(id) {
    if (!confirm("⚠️ This will permanently delete the student. Are you sure?")) return;

    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("student_id", id);

    fetch(STUDENTS_API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            refreshList();
            showToast(result.message || "Student deleted successfully!", "warning");
        } else {
            alert(result.message || "Failed to delete student.");
        }
    })
    .catch(error => {
        console.error("Error deleting student:", error);
        alert("Network error: " + error.message);
    });
}

// ============ UI Functions ============

function showLoading(show) {
    if (loadingState) {
        loadingState.style.display = show ? "block" : "none";
    }
}

function showFormError(message) {
    if (formError) {
        formError.textContent = message;
        formError.style.display = "block";
        setTimeout(() => {
            formError.style.display = "none";
        }, 5000);
    }
}

function showToast(message, type = "info") {
    // Simple toast implementation
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: "#28a745",
        error: "#dc3545",
        info: "#17a2b8",
        warning: "#ffc107"
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getFullName(student) {
    let name = student.last_name || "";
    if (student.first_name) name += `, ${student.first_name}`;
    if (student.middle_name) name += ` ${student.middle_name}`;
    return name;
}

function renderStudents(students) {
    if (!students || students.length === 0) {
        studentRows.innerHTML = "";
        emptyState.hidden = false;
        emptyState.textContent = currentTab === "archived" 
            ? "No archived students." 
            : 'No students yet. Click "Add Student" to get started.';
        updateCounts(students || []);
        return;
    }

    emptyState.hidden = true;
    updateCounts(students);

    let html = "";
    students.forEach(student => {
        const isArchived = student.status === "Inactive" || student.status === "Archived";
        const statusText = isArchived ? (student.archive_reason || "Archived") : "Active";
        const statusClass = isArchived ? "badge--archived" : "badge--active";

        let actions = "";
        if (isArchived) {
            actions = `
                <button class="btn btn--ghost btn--sm" data-action="restore" data-id="${student.student_id}">Restore</button>
                <button class="btn btn--danger btn--sm" data-action="delete" data-id="${student.student_id}">Delete</button>
            `;
        } else {
            actions = `
                <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${student.student_id}">Edit</button>
                <button class="btn btn--danger btn--sm" data-action="archive" data-id="${student.student_id}">Archive</button>
            `;
        }

        html += `
            <tr>
                <td><span class="cell-name">${escapeHtml(student.lrn || "—")}</span></td>
                <td><span class="cell-name">${escapeHtml(getFullName(student))}</span></td>
                <td>${escapeHtml(student.grade_level || "—")}</td>
                <td>${escapeHtml(student.gender || "—")}</td>
                <td>${escapeHtml(student.contact_number || "—")}</td>
                <td><span class="badge ${statusClass}">${escapeHtml(statusText)}</span></td>
                <td><div class="row-actions">${actions}</div></td>
            </tr>
        `;
    });

    studentRows.innerHTML = html;
}

function updateCounts(students) {
    if (currentTab === "archived") {
        archivedCountEl.textContent = students.filter(s => 
            s.status === "Inactive" || s.status === "Archived"
        ).length;
        activeCountEl.textContent = students.filter(s => 
            s.status === "Active"
        ).length;
    } else {
        const active = students.filter(s => s.status === "Active").length;
        const archived = students.filter(s => s.status === "Inactive" || s.status === "Archived").length;
        activeCountEl.textContent = active;
        archivedCountEl.textContent = archived;
    }
}

function refreshList() {
    if (currentTab === "archived") {
        fetchArchivedStudents();
    } else {
        fetchStudents(searchInput.value);
    }
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ============ Modal Functions ============

function openStudentModal(student = null) {
    editingId = student ? student.student_id : null;
    modalTitle.textContent = student ? "Edit Student" : "Add Student";
    saveStudentBtn.textContent = student ? "Update Student" : "Save Student";
    
    studentForm.reset();
    formError.style.display = "none";

    if (student) {
        // Populate form fields
        const fields = [
            "lrn", "student_number", "first_name", "middle_name", "last_name",
            "gender", "birthdate", "address", "contact_number", "email",
            "grade_level", "father_name", "father_occupation", "father_contact_number",
            "mother_name", "mother_occupation", "mother_contact_number",
            "guardian_name", "guardian_relationship", "guardian_contact_number",
            "guardian_address",
            "emergency_contact_name", "emergency_contact_relationship",
            "emergency_contact_number"
        ];
        
        fields.forEach(field => {
            const el = studentForm.elements[field];
            if (el && student[field] !== undefined && student[field] !== null) {
                el.value = student[field];
            }
        });
    }

    studentModal.hidden = false;
    studentForm.elements.first_name?.focus();
}

function hideModals() {
    studentModal.hidden = true;
    archiveModal.hidden = true;
    editingId = null;
    archivingId = null;
    formError.style.display = "none";
}

function openArchiveModal(student) {
    archivingId = student.student_id;
    archiveName.textContent = getFullName(student);
    archiveReason.value = "Transferred Out";
    archiveModal.hidden = false;
}

// ============ Event Listeners ============

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.toggle("is-active", t === tab));
        currentTab = tab.dataset.tab;
        if (currentTab === "archived") {
            fetchArchivedStudents();
        } else {
            fetchStudents(searchInput.value);
        }
    });
});

// Search with debounce
searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        if (currentTab === "archived") {
            // Archived tab doesn't support search in this implementation
            fetchArchivedStudents();
        } else {
            fetchStudents(searchInput.value);
        }
    }, 350);
});

// Add student button
addStudentBtn.addEventListener("click", () => openStudentModal());

// Close modal buttons
closeStudentModal.addEventListener("click", hideModals);
cancelStudentBtn.addEventListener("click", hideModals);
closeArchiveModal.addEventListener("click", hideModals);
cancelArchiveBtn.addEventListener("click", hideModals);

// Close on overlay click
[studentModal, archiveModal].forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) hideModals();
    });
});

// Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModals();
});

// Form submission
studentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = studentForm.querySelectorAll("[required]");
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = "#dc3545";
            isValid = false;
        } else {
            field.style.borderColor = "";
        }
    });
    
    if (!isValid) {
        showFormError("Please fill in all required fields.");
        return;
    }
    
    // Collect form data
    const formData = new FormData(studentForm);
    const studentData = {};
    formData.forEach((value, key) => {
        studentData[key] = value;
    });

    // Add status for edit
    if (editingId) {
        // For edit, we need to get the current status from the form or keep existing
        // The status field might not be visible, so we add it
        studentData.status = "Active";
    }

    saveStudent(studentData, !!editingId);
});

// Row action buttons (event delegation)
studentRows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "edit") {
        // Fetch student data for editing
        const params = new URLSearchParams({ action: "get", id: id });
        fetch(`${STUDENTS_API_URL}?${params.toString()}`)
            .then(response => response.json())
            .then(student => {
                if (student.error) {
                    alert(student.error);
                    return;
                }
                openStudentModal(student);
            })
            .catch(error => {
                console.error("Error fetching student for edit:", error);
                alert("Failed to load student data.");
            });
    } else if (action === "archive") {
        // Fetch student name for archive modal
        const params = new URLSearchParams({ action: "get", id: id });
        fetch(`${STUDENTS_API_URL}?${params.toString()}`)
            .then(response => response.json())
            .then(student => {
                if (student.error) {
                    alert(student.error);
                    return;
                }
                openArchiveModal(student);
            })
            .catch(error => {
                console.error("Error fetching student for archive:", error);
                alert("Failed to load student data.");
            });
    } else if (action === "restore") {
        restoreStudent(id);
    } else if (action === "delete") {
        deleteStudent(id);
    }
});

// Confirm archive
confirmArchiveBtn.addEventListener("click", () => {
    if (archivingId) {
        archiveStudent(archivingId, archiveReason.value);
    }
});

// ============ Initial Load ============
document.addEventListener("DOMContentLoaded", () => {
    fetchStudents();
});

// Add CSS animation for toast
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);