// teacher.js - Complete CRUD with backend API integration
const API_BASE = "../../Controllers/teacher/teachers_controllers.php";

const searchInput = document.getElementById("searchInput");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const teacherRows = document.getElementById("teacherRows");
const emptyState = document.getElementById("emptyState");

const teacherModal = document.getElementById("teacherModal");
const teacherForm = document.getElementById("teacherForm");
const teacherMsg = document.getElementById("teacherMsg");
const modalTitle = document.getElementById("modalTitle");
const closeTeacherModal = document.getElementById("closeTeacherModal");
const cancelTeacherBtn = document.getElementById("cancelTeacherBtn");
const saveTeacherBtn = document.getElementById("saveTeacherBtn");
const editId = document.getElementById("editId");

// Form field references for validation
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const contact = document.getElementById("contact");
const specialization = document.getElementById("specialization");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let editingId = null;
let deletingId = null;

// ============ LOAD TEACHERS FROM API ============
async function loadTeachers() {
  const q = searchInput.value.trim().toLowerCase();

  try {
    const params = new URLSearchParams();
    if (q) params.append("keyword", q);

    const response = await fetch(`${API_BASE}?action=list&${params.toString()}`);
    const teachers = await response.json();

    if (!Array.isArray(teachers)) {
      console.error("Unexpected response:", teachers);
      renderTeachers([]);
      return;
    }

    renderTeachers(teachers);
  } catch (error) {
    console.error("Failed to load teachers:", error);
    renderTeachers([]);
    showToast("Failed to load teachers. Please refresh the page.", "error");
  }
}

function renderTeachers(teachers) {
  if (!teachers || teachers.length === 0) {
    teacherRows.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = searchInput.value.trim()
      ? "No teachers match your search."
      : 'No teachers yet. Click "Add Teacher" to get started.';
    return;
  }

  emptyState.hidden = true;
  teacherRows.innerHTML = teachers.map((t) => `
    <tr>
      <td>${esc(t.teacher_id || "—")}</td>
      <td>
        <div class="avatar-cell">
          <span class="avatar">${esc((t.first_name || "?")[0] + (t.last_name || "?")[0]).toUpperCase()}</span>
          <span class="cell-name">${esc(`${t.last_name}, ${t.first_name}`)}</span>
        </div>
      </td>
      <td>${esc(t.email || "—")}</td>
      <td>${esc(t.contact_number || "—")}</td>
      <td>${t.specialization ? `<span class="chip">${esc(t.specialization)}</span>` : "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${t.teacher_id}">Edit</button>
          <button class="btn btn--danger btn--sm" data-action="delete" data-id="${t.teacher_id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ============ HELPER FUNCTIONS ============
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function showToast(message, type = "info") {
  // Create a simple toast notification
  const existing = document.querySelector(".toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 9999;
    max-width: 400px;
    background: ${type === "error" ? "#dc2626" : type === "success" ? "#16a34a" : "#2563eb"};
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + "Error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = message ? "block" : "none";
  }
}

function clearErrors() {
  ["firstName", "lastName", "email", "contact", "specialization"].forEach((id) => {
    setFieldError(id, "");
  });
  teacherMsg.textContent = "";
  teacherMsg.className = "form-msg";
}

function setFormMessage(text, type) {
  teacherMsg.textContent = text;
  teacherMsg.className = "form-msg" + (type ? ` is-${type}` : "");
}

// ============ OPEN / CLOSE MODALS ============
function openTeacherModal(teacher = null) {
  clearErrors();
  editingId = teacher ? teacher.teacher_id : null;
  editId.value = editingId || "";
  modalTitle.textContent = teacher ? "Edit Teacher" : "Add Teacher";
  saveTeacherBtn.textContent = teacher ? "Update Teacher" : "Save Teacher";

  if (teacher) {
    firstName.value = teacher.first_name || "";
    lastName.value = teacher.last_name || "";
    email.value = teacher.email || "";
    contact.value = teacher.contact_number || "";
    specialization.value = teacher.specialization || "";
  } else {
    teacherForm.reset();
    editId.value = "";
  }

  teacherModal.hidden = false;
  firstName.focus();
}

function hideModals() {
  teacherModal.hidden = true;
  deleteModal.hidden = true;
}

// ============ FORM VALIDATION ============
function validateForm() {
  let isValid = true;
  clearErrors();

  const fname = firstName.value.trim();
  const lname = lastName.value.trim();
  const emailVal = email.value.trim();
  const contactVal = contact.value.trim();
  const specVal = specialization.value.trim();

  // First Name validation
  if (!fname) {
    setFieldError("firstName", "First name is required.");
    isValid = false;
  } else if (!/^[a-zA-Z .'-]{2,50}$/.test(fname)) {
    setFieldError("firstName", "First name: 2-50 letters, spaces, apostrophes, or hyphens.");
    isValid = false;
  }

  // Last Name validation
  if (!lname) {
    setFieldError("lastName", "Last name is required.");
    isValid = false;
  } else if (!/^[a-zA-Z .'-]{2,50}$/.test(lname)) {
    setFieldError("lastName", "Last name: 2-50 letters, spaces, apostrophes, or hyphens.");
    isValid = false;
  }

  // Email validation
  if (!emailVal) {
    setFieldError("email", "Email is required.");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    setFieldError("email", "Please enter a valid email address.");
    isValid = false;
  }

  // Contact validation
  if (!contactVal) {
    setFieldError("contact", "Contact number is required.");
    isValid = false;
  } else if (!/^[0-9]{7,15}$/.test(contactVal.replace(/[\s\-()]/g, ""))) {
    setFieldError("contact", "Contact number must be 7-15 digits, numbers only.");
    isValid = false;
  }

  // Specialization validation
  if (!specVal) {
    setFieldError("specialization", "Specialization is required.");
    isValid = false;
  } else if (specVal.length > 100) {
    setFieldError("specialization", "Specialization must be 100 characters or fewer.");
    isValid = false;
  }

  return isValid;
}

// ============ SAVE TEACHER (CREATE / UPDATE) ============
async function saveTeacher(e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const data = {
    first_name: firstName.value.trim(),
    last_name: lastName.value.trim(),
    email: email.value.trim(),
    contact_number: contact.value.trim(),
    specialization: specialization.value.trim()
  };

  const isEdit = !!editId.value;

  if (isEdit) {
    data.action = "update";
    data.teacher_id = editId.value;
    data.status = "Active";
  } else {
    data.action = "create";
  }

  // Disable submit button
  saveTeacherBtn.disabled = true;
  saveTeacherBtn.textContent = "Saving...";

  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(API_BASE, {
      method: "POST",
      body: formData
    });

    const result = await response.text();

    if (result.includes("SUCCESS")) {
      hideModals();
      showToast(isEdit ? "Teacher updated successfully!" : "Teacher added successfully!", "success");
      loadTeachers();
    } else {
      const errorMsg = result.replace(/^(INSERT|UPDATE)\s+FAILED:\s*/i, "");
      setFormMessage(errorMsg || "Failed to save teacher. Please try again.", "error");
    }
  } catch (error) {
    console.error("Save error:", error);
    setFormMessage("Network error. Please check your connection.", "error");
  } finally {
    saveTeacherBtn.disabled = false;
    saveTeacherBtn.textContent = isEdit ? "Update Teacher" : "Save Teacher";
  }
}

// ============ DELETE TEACHER ============
async function confirmDelete() {
  if (!deletingId) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "Deleting...";

  try {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("id", deletingId);

    const response = await fetch(API_BASE, {
      method: "POST",
      body: formData
    });

    const result = await response.text();

    if (result.includes("SUCCESS")) {
      hideModals();
      showToast("Teacher deleted successfully!", "success");
      deletingId = null;
      loadTeachers();
    } else {
      showToast(result || "Failed to delete teacher.", "error");
    }
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Network error. Please try again.", "error");
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete";
  }
}

// ============ EVENT LISTENERS ============
// Search
searchInput.addEventListener("input", loadTeachers);

// Add button
addTeacherBtn.addEventListener("click", () => openTeacherModal());

// Modal close buttons
closeTeacherModal.addEventListener("click", hideModals);
cancelTeacherBtn.addEventListener("click", hideModals);
closeDeleteModal.addEventListener("click", hideModals);
cancelDeleteBtn.addEventListener("click", hideModals);

// Click outside modal to close
[teacherModal, deleteModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModals();
  });
});

// Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModals();
});

// Form submission
teacherForm.addEventListener("submit", saveTeacher);

// Action buttons (Edit / Delete) - event delegation
teacherRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const teacherId = btn.dataset.id;

  if (btn.dataset.action === "edit") {
    // Fetch teacher data and open edit modal
    fetch(`${API_BASE}?action=get&id=${teacherId}`)
      .then((res) => res.json())
      .then((teacher) => {
        if (teacher.error) {
          showToast(teacher.error, "error");
          return;
        }
        openTeacherModal(teacher);
      })
      .catch((err) => {
        console.error("Failed to fetch teacher:", err);
        showToast("Failed to load teacher data.", "error");
      });
  } else if (btn.dataset.action === "delete") {
    // Find teacher name for confirmation
    const row = btn.closest("tr");
    const nameCell = row?.querySelector(".cell-name");
    const name = nameCell ? nameCell.textContent : "this teacher";

    deletingId = teacherId;
    deleteName.textContent = `${name} (ID: ${teacherId})`;
    deleteModal.hidden = false;
  }
});

// Confirm delete
confirmDeleteBtn.addEventListener("click", confirmDelete);

// ============ INITIAL LOAD ============
document.addEventListener("DOMContentLoaded", loadTeachers);