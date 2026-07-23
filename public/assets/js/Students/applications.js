// ============================================
// CONTROLLER URL - Using absolute path
// ============================================
const CONTROLLER_URL = "/EnrollmentMS/app/Students/Controller/applicants_controllers.php";
console.log("=== CONTROLLER_URL ===", CONTROLLER_URL);
// ============================================

const tableBody = document.getElementById("applicationRows");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const searchClear = document.querySelector(".search-clear");
const tabs = document.querySelectorAll(".tab");

const reviewModal = document.getElementById("reviewModal");
const closeReviewModal = document.getElementById("closeReviewModal");
const cancelReviewBtn = document.getElementById("cancelReviewBtn");
const decisionForm = document.getElementById("decisionForm");
const statusSelect = document.getElementById("statusSelect");
const rejectionReasonField = document.getElementById("rejectionReasonField");  // Changed from refusalReasonField
const rejectionReasonInput = document.getElementById("rejectionReasonInput");  // Changed from refusalReasonInput
const reviewError = document.getElementById("reviewError");
const saveReviewBtn = document.getElementById("saveReviewBtn");

const STATUS_BADGE = {
  "Pending": "badge--pending",
  "Approved": "badge--approved",
  "Rejected": "badge--rejected"  // Changed from "Refused"
};

let allApplications = [];
let activeStatus = "Pending";
let activeApplicantId = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function strandLabel(app) {
  if (!app.strand_name) return "—";
  return app.strand_code ? `${app.strand_name} (${app.strand_code})` : app.strand_name;
}

// ---------- Toast notification ----------
function showToast(message, type = "info") {
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

// ---------- Load & render list ----------

async function loadApplications() {
  loadingState.style.display = "block";
  emptyState.hidden = true;
  tableBody.innerHTML = "";

  try {
    const url = `${CONTROLLER_URL}?action=list`;
    console.log("=== Fetching URL ===", url);
    
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    console.log("=== Response status ===", res.status);
    
    const raw = await res.text();
    console.log("=== Raw response (first 500 chars) ===", raw.substring(0, 500));

    let data;
    try {
      data = JSON.parse(raw);
      console.log("=== Parsed data successfully, count:", Array.isArray(data) ? data.length : 'not an array');
    } catch (parseErr) {
      console.error("Applications list: non-JSON response from server:", raw);
      allApplications = [];
      loadingState.style.display = "none";
      emptyState.hidden = false;
      emptyState.textContent = "Could not load applications — the server returned an unexpected response. Check the console/PHP error log for details.";
      return;
    }

    if (Array.isArray(data)) {
      allApplications = data;
      console.log("=== Loaded", allApplications.length, "applications");
    } else {
      allApplications = [];
      if (data && data.error) {
        console.error("Applications list error:", data.error);
        emptyState.textContent = "Error: " + data.error;
        emptyState.hidden = false;
      }
    }
  } catch (err) {
    allApplications = [];
    console.error("Failed to load applications", err);
    emptyState.textContent = "Network error: " + err.message;
    emptyState.hidden = false;
  }

  loadingState.style.display = "none";
  updateCounts();
  renderRows();
}

function updateCounts() {
  const counts = { "Pending": 0, "Approved": 0, "Rejected": 0 };  // Changed from "Refused"
  allApplications.forEach((a) => {
    if (counts[a.status] !== undefined) counts[a.status]++;
  });
  document.getElementById("pendingCount").textContent = counts["Pending"] || 0;
  document.getElementById("approvedCount").textContent = counts["Approved"] || 0;
  document.getElementById("rejectedCount").textContent = counts["Rejected"] || 0;  // Changed from refusedCount
}

function getFilteredApplications() {
  const keyword = searchInput.value.trim().toLowerCase();

  return allApplications.filter((a) => {
    // Filter by status (only show applications that match the selected tab)
    if (activeStatus && a.status !== activeStatus) return false;

    // Search filter
    if (keyword) {
      const haystack = [
        a.reference_number, a.first_name, a.last_name, a.middle_name, a.email, a.lrn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

function renderRows() {
  const rows = getFilteredApplications();

  if (!rows.length) {
    tableBody.innerHTML = "";
    emptyState.hidden = false;
    const statusText = activeStatus || "Pending";
    emptyState.textContent = `No ${statusText.toLowerCase()} applications found.`;
    return;
  }
  emptyState.hidden = true;

  tableBody.innerHTML = rows.map((a) => {
    const fullName = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ");
    const badgeClass = STATUS_BADGE[a.status] || "badge--pending";
    
    let actions = '';
    if (a.status === "Pending") {
      actions = `
        <button type="button" class="btn btn--primary btn--sm review-btn" data-id="${esc(a.applicant_id)}">Review</button>
      `;
    } else {
      actions = `
        <button type="button" class="btn btn--ghost btn--sm review-btn" data-id="${esc(a.applicant_id)}">View</button>
      `;
    }
    
    return `
      <tr>
        <td data-no-translate><strong>${esc(a.reference_number)}</strong></td>
        <td>
          <div>${esc(fullName)}</div>
          <div class="row-sub">${esc(a.email)}</div>
        </td>
        <td>${esc(a.applicant_type)}</td>
        <td>Grade ${esc(a.desired_grade_level)} &middot; ${esc(strandLabel(a))}</td>
        <td>${esc(a.school_year)}</td>
        <td>${formatDate(a.submitted_at)}</td>
        <td><span class="badge ${badgeClass}">${esc(a.status)}</span></td>
        <td><div class="row-actions">${actions}</div></td>
      </tr>`;
  }).join("");

  tableBody.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", () => openReviewModal(btn.dataset.id));
  });
}

// ---------- Tabs & search ----------

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    activeStatus = tab.dataset.status || "Pending";
    renderRows();
  });
});

searchInput.addEventListener("input", () => {
  if (searchClear) searchClear.hidden = !searchInput.value;
  renderRows();
});

if (searchClear) {
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.hidden = true;
    renderRows();
  });
}

// ---------- Review modal ----------

function detailItem(label, value) {
  return `<div class="detail-item">
    <span class="detail-item__label">${esc(label)}</span>
    <span class="detail-item__value">${esc(value ?? "—") || "—"}</span>
  </div>`;
}

function documentItem(doc) {
  const fileSize = doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : '—';
  
  return `<div class="document-item">
    <div class="document-item__header">
      <span class="document-item__name">${esc(doc.document_type_name || 'Document')}</span>
      <span class="file-type-badge file-type-badge--${getFileType(doc.original_filename)}">${getFileExtension(doc.original_filename)}</span>
    </div>
    <div class="document-item__details">
      <span class="document-item__filename">${esc(doc.original_filename || doc.file_name)}</span>
      <span class="document-item__size">${esc(fileSize)}</span>
    </div>
    <div class="document-item__actions">
      <button type="button" class="btn btn--ghost btn--sm view-doc-btn" data-id="${esc(doc.document_id)}" data-name="${esc(doc.original_filename || doc.file_name)}">👁 Preview</button>
    </div>
  </div>`;
}

function getFileType(filename) {
  if (!filename) return 'other';
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  return 'other';
}

function getFileExtension(filename) {
  if (!filename) return 'FILE';
  return filename.split('.').pop().toUpperCase() || 'FILE';
}

async function openReviewModal(applicantId) {
  reviewError.style.display = "none";
  reviewError.textContent = "";
  activeApplicantId = applicantId;

  // Show loading state
  document.getElementById("reviewName").textContent = "Loading...";
  document.getElementById("reviewRef").textContent = "";
  document.getElementById("reviewLearnerInfo").innerHTML = "";
  document.getElementById("reviewFamilyInfo").innerHTML = "";
  document.getElementById("reviewEmergencyInfo").innerHTML = "";
  document.getElementById("reviewDocuments").innerHTML = "";
  document.getElementById("noDocuments").style.display = "none";

  try {
    const url = `${CONTROLLER_URL}?action=get&id=${encodeURIComponent(applicantId)}`;
    console.log("=== Fetching applicant details URL ===", url);
    
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });
    const data = await res.json();
    console.log("=== Applicant details response ===", data);

    if (!data || data.error) {
      alert((data && data.error) || "Could not load that application.");
      return;
    }

    populateReviewModal(data);
    reviewModal.hidden = false;
  } catch (err) {
    console.error("Error loading applicant details:", err);
    alert("Could not reach the server. Please try again.");
  }
}

function populateReviewModal(a) {
  console.log("=== Populating review modal with applicant:", a);
  console.log("=== Documents:", a.documents);
  
  const fullName = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ");
  document.getElementById("reviewName").textContent = fullName;
  document.getElementById("reviewRef").textContent = a.reference_number;

  const badge = document.getElementById("reviewCurrentBadge");
  badge.className = "badge " + (STATUS_BADGE[a.status] || "badge--pending");
  badge.textContent = a.status;

  document.getElementById("reviewLearnerInfo").innerHTML = [
    detailItem("Applicant Type", a.applicant_type),
    detailItem("Gender", a.gender),
    detailItem("Birthdate", formatDate(a.birthdate)),
    detailItem("LRN", a.lrn || "—"),
    detailItem("Grade Level", "Grade " + a.desired_grade_level),
    detailItem("Strand", strandLabel(a)),
    detailItem("School Year", a.school_year),
    detailItem("Email", a.email),
    detailItem("Contact Number", a.contact_number || "—"),
    detailItem("Address", a.address)
  ].join("");

  document.getElementById("reviewFamilyInfo").innerHTML = [
    detailItem("Father's Name", a.father_name || "—"),
    detailItem("Father's Contact", a.father_contact_number || "—"),
    detailItem("Mother's Name", a.mother_name || "—"),
    detailItem("Mother's Contact", a.mother_contact_number || "—"),
    detailItem("Guardian's Name", a.guardian_name || "—"),
    detailItem("Guardian Relationship", a.guardian_relationship || "—"),
    detailItem("Guardian's Contact", a.guardian_contact_number || "—")
  ].join("");

  document.getElementById("reviewEmergencyInfo").innerHTML = [
    detailItem("Name", a.emergency_contact_name),
    detailItem("Relationship", a.emergency_contact_relationship),
    detailItem("Contact Number", a.emergency_contact_number),
    detailItem("Submitted", formatDateTime(a.submitted_at)),
    detailItem("Last Reviewed", a.reviewed_at ? formatDateTime(a.reviewed_at) : "—")
  ].join("");

  // Display documents
  const documentsContainer = document.getElementById("reviewDocuments");
  const noDocuments = document.getElementById("noDocuments");
  
  console.log("=== Documents container found:", !!documentsContainer);
  console.log("=== No documents element found:", !!noDocuments);
  
  if (a.documents && a.documents.length > 0) {
    console.log("=== Rendering", a.documents.length, "documents");
    documentsContainer.innerHTML = a.documents.map(doc => documentItem(doc)).join("");
    documentsContainer.style.display = "grid";
    if (noDocuments) noDocuments.style.display = "none";
  } else {
    console.log("=== No documents to display");
    documentsContainer.innerHTML = "";
    documentsContainer.style.display = "none";
    if (noDocuments) noDocuments.style.display = "block";
  }

  // Set status select - only Approved or Rejected
  statusSelect.value = a.status === "Approved" ? "Approved" : "Rejected";  // Changed from "Refused"
  rejectionReasonInput.value = a.status === "Rejected" ? (a.rejection_reason || "") : "";  // Changed from refusalReasonInput
  toggleRejectionReason();  // Changed from toggleRefusalReason
}

function toggleRejectionReason() {  // Changed from toggleRefusalReason
  const isRejected = statusSelect.value === "Rejected";  // Changed from "Refused"
  rejectionReasonField.hidden = !isRejected;  // Changed from refusalReasonField
  rejectionReasonInput.required = isRejected;  // Changed from refusalReasonInput
  if (isRejected) {
    rejectionReasonInput.focus();  // Changed from refusalReasonInput
  }
}

statusSelect.addEventListener("change", toggleRejectionReason);  // Changed from toggleRefusalReason

function closeModal() {
  reviewModal.hidden = true;
  activeApplicantId = null;
  decisionForm.reset();
  reviewError.style.display = "none";
}

closeReviewModal.addEventListener("click", closeModal);
cancelReviewBtn.addEventListener("click", closeModal);
reviewModal.addEventListener("click", (e) => {
  if (e.target === reviewModal) closeModal();
});

decisionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeApplicantId) return;

  reviewError.style.display = "none";
  reviewError.textContent = "";

  const status = statusSelect.value;
  const rejectionReason = rejectionReasonInput.value.trim();  // Changed from refusalReason

  if (status === "Rejected" && !rejectionReason) {  // Changed from "Refused"
    reviewError.textContent = "Please provide a reason for rejecting this application.";  // Changed from "refusing"
    reviewError.style.display = "block";
    return;
  }

  // Confirmation
  const actionText = status === "Approved" ? "approve" : "reject";  // Changed from "refuse"
  if (!confirm(`Are you sure you want to ${actionText} this application?`)) {
    return;
  }

  saveReviewBtn.disabled = true;
  saveReviewBtn.textContent = "Saving…";

  try {
    const body = new URLSearchParams({
      action: "update_status",
      applicant_id: activeApplicantId,
      status: status,
      rejection_reason: rejectionReason  // Changed from refusal_reason
    });

    const res = await fetch(CONTROLLER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await res.json();

    if (data && data.success) {
      closeModal();
      showToast(data.message || `Application ${status} successfully!`, "success");
      await loadApplications();
    } else {
      reviewError.textContent = (data && data.message) || "Failed to update status.";
      reviewError.style.display = "block";
    }
  } catch (err) {
    reviewError.textContent = "Could not reach the server. Please try again.";
    reviewError.style.display = "block";
    console.error("Error updating status:", err);
  } finally {
    saveReviewBtn.disabled = false;
    saveReviewBtn.textContent = "Submit Decision";
  }
});

// ---------- Document Preview Modal ----------
const docPreviewModal = document.getElementById("docPreviewModal");
const closeDocPreview = document.getElementById("closeDocPreview");
const closeDocPreviewBtn = document.getElementById("closeDocPreviewBtn");
const downloadDocBtn = document.getElementById("downloadDocBtn");
const docViewer = document.getElementById("docViewer");
const docLoading = document.getElementById("docLoading");
const docError = document.getElementById("docError");
const docPreviewInfo = document.getElementById("docPreviewInfo");
const docPreviewFrame = document.getElementById("docPreviewFrame");

let currentDocId = null;
let currentDocName = null;

function openDocPreview(docId, fileName) {
    currentDocId = docId;
    currentDocName = fileName;
    
    docViewer.style.display = "none";
    docError.style.display = "none";
    docLoading.style.display = "block";
    docPreviewInfo.innerHTML = "";
    docPreviewFrame.innerHTML = "";
    
    docPreviewModal.hidden = false;
    document.getElementById("docPreviewTitle").textContent = "Document Preview";
    
    loadDocument(docId, fileName);
}

async function loadDocument(docId, fileName) {
    try {
        const ext = fileName.split('.').pop().toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const pdfTypes = ['pdf'];
        
        // Get the document from the server
        const docUrl = `${CONTROLLER_URL}?action=serve-document&id=${encodeURIComponent(docId)}`;
        
        docPreviewInfo.innerHTML = `
            <span class="doc-preview-info__name">${esc(fileName)}</span>
            <span class="doc-preview-info__meta">
                <span class="file-type-badge file-type-badge--${getFileTypeClass(ext)}">${ext.toUpperCase()}</span>
            </span>
        `;
        
        if (imageTypes.includes(ext)) {
            const img = document.createElement('img');
            img.src = docUrl;
            img.alt = fileName;
            img.onload = function() {
                docLoading.style.display = "none";
                docViewer.style.display = "block";
                docPreviewFrame.innerHTML = '';
                docPreviewFrame.appendChild(img);
            };
            img.onerror = function() {
                showDocError("Failed to load image. The file may be corrupted.");
            };
            docPreviewFrame.innerHTML = '<div style="text-align:center;padding:2rem;color:#6c757d;">Loading image...</div>';
            
        } else if (pdfTypes.includes(ext)) {
            const iframe = document.createElement('iframe');
            iframe.src = docUrl;
            iframe.title = fileName;
            iframe.style.width = '100%';
            iframe.style.height = '70vh';
            iframe.style.border = 'none';
            iframe.onload = function() {
                docLoading.style.display = "none";
                docViewer.style.display = "block";
            };
            iframe.onerror = function() {
                showDocError("Failed to load PDF. The file may be corrupted.");
            };
            docPreviewFrame.appendChild(iframe);
            docLoading.style.display = "block";
            setTimeout(() => {
                if (docLoading.style.display !== "none") {
                    docLoading.style.display = "none";
                    docViewer.style.display = "block";
                }
            }, 5000);
            
        } else {
            docPreviewFrame.innerHTML = `
                <div class="doc-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:64px;height:64px;margin-bottom:1rem;opacity:0.5;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <p>Preview not available for this file type.</p>
                    <p style="font-size:0.85rem;margin-top:0.5rem;">Click "Download" to view the file.</p>
                    <button type="button" class="btn btn--primary" onclick="downloadCurrentDoc()" style="margin-top:1rem;">
                        Download ${esc(ext.toUpperCase())} File
                    </button>
                </div>
            `;
            docLoading.style.display = "none";
            docViewer.style.display = "block";
        }
        
    } catch (err) {
        showDocError("Could not load the document. Please try again.");
        console.error("Document load error:", err);
    }
}

function getFileTypeClass(ext) {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const pdfTypes = ['pdf'];
    
    if (imageTypes.includes(ext)) return 'image';
    if (pdfTypes.includes(ext)) return 'pdf';
    return 'other';
}

function showDocError(message) {
    docLoading.style.display = "none";
    docViewer.style.display = "block";
    docPreviewFrame.innerHTML = `
        <div class="doc-placeholder" style="color:#c00;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:64px;height:64px;margin-bottom:1rem;stroke:#c00;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>${esc(message)}</p>
        </div>
    `;
}

function downloadCurrentDoc() {
    if (currentDocId) {
        const downloadUrl = `${CONTROLLER_URL}?action=serve-document&id=${encodeURIComponent(currentDocId)}&download=1`;
        window.open(downloadUrl, '_blank');
    }
}

function closeDocPreviewModal() {
    docPreviewModal.hidden = true;
    const iframe = docPreviewFrame.querySelector('iframe');
    if (iframe) {
        iframe.src = 'about:blank';
    }
    docPreviewFrame.innerHTML = '';
    currentDocId = null;
    currentDocName = null;
}

closeDocPreview.addEventListener("click", closeDocPreviewModal);
closeDocPreviewBtn.addEventListener("click", closeDocPreviewModal);
docPreviewModal.addEventListener("click", (e) => {
    if (e.target === docPreviewModal) closeDocPreviewModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !docPreviewModal.hidden) {
        closeDocPreviewModal();
    }
});

downloadDocBtn.addEventListener("click", downloadCurrentDoc);

// ---------- Event listener for document view buttons ----------
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('view-doc-btn') || e.target.closest('.view-doc-btn')) {
    const btn = e.target.closest('.view-doc-btn');
    const docId = btn.dataset.id;
    const fileName = btn.dataset.name || 'document';

    openDocPreview(docId, fileName);
  }
});

// ---------- Init ----------
loadApplications();