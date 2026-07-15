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
const rejectionReasonField = document.getElementById("rejectionReasonField");
const rejectionReasonInput = document.getElementById("rejectionReasonInput");
const reviewError = document.getElementById("reviewError");
const saveReviewBtn = document.getElementById("saveReviewBtn");

const STATUS_BADGE = {
  "Pending": "badge--pending",
  "Under Review": "badge--review",
  "Approved": "badge--approved",
  "Rejected": "badge--rejected",
  "Enrolled": "badge--enrolled"
};

let allApplications = [];
let activeStatus = "";
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
  const counts = { "": allApplications.length, "Pending": 0, "Under Review": 0, "Approved": 0, "Rejected": 0, "Enrolled": 0 };
  allApplications.forEach((a) => {
    if (counts[a.status] !== undefined) counts[a.status]++;
  });
  document.getElementById("allCount").textContent = counts[""];
  document.getElementById("pendingCount").textContent = counts["Pending"];
  document.getElementById("reviewCount").textContent = counts["Under Review"];
  document.getElementById("approvedCount").textContent = counts["Approved"];
  document.getElementById("rejectedCount").textContent = counts["Rejected"];
  document.getElementById("enrolledCount").textContent = counts["Enrolled"];
}

function getFilteredApplications() {
  const keyword = searchInput.value.trim().toLowerCase();

  return allApplications.filter((a) => {
    if (activeStatus && a.status !== activeStatus) return false;

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
    return;
  }
  emptyState.hidden = true;

  tableBody.innerHTML = rows.map((a) => {
    const fullName = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ");
    const badgeClass = STATUS_BADGE[a.status] || "badge--pending";
    return `
      <tr>
        <td data-no-translate>${esc(a.reference_number)}</td>
        <td>
          <div>${esc(fullName)}</div>
          <div class="row-sub">${esc(a.email)}</div>
        </td>
        <td>${esc(a.applicant_type)}</td>
        <td>Grade ${esc(a.desired_grade_level)} &middot; ${esc(strandLabel(a))}</td>
        <td>${esc(a.school_year)}</td>
        <td>${formatDate(a.submitted_at)}</td>
        <td><span class="badge ${badgeClass}">${esc(a.status)}</span></td>
        <td>
          <button type="button" class="btn btn--ghost btn--sm review-btn" data-id="${esc(a.applicant_id)}">Review</button>
        </td>
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
    activeStatus = tab.dataset.status || "";
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
  const statusBadge = {
    "Pending": "badge--pending",
    "Verified": "badge--approved",
    "Rejected": "badge--rejected"
  };
  const badgeClass = statusBadge[doc.status] || "badge--pending";
  
  const fileSize = doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : '—';
  
  return `<div class="document-item">
    <div class="document-item__header">
      <span class="document-item__name">${esc(doc.document_type_name || 'Document')}</span>
      <span class="badge ${badgeClass}">${esc(doc.status)}</span>
    </div>
    <div class="document-item__details">
      <span class="document-item__filename">${esc(doc.original_filename)}</span>
      <span class="document-item__size">${esc(fileSize)}</span>
    </div>
    ${doc.remarks ? `<div class="document-item__remarks">${esc(doc.remarks)}</div>` : ''}
    <div class="document-item__actions">
      <button type="button" class="btn btn--ghost btn--sm view-doc-btn" data-path="${esc(doc.file_path)}">👁 View</button>
    </div>
  </div>`;
}

async function openReviewModal(applicantId) {
  reviewError.style.display = "none";
  reviewError.textContent = "";
  activeApplicantId = applicantId;

  try {
    const url = `${CONTROLLER_URL}?action=get&id=${encodeURIComponent(applicantId)}`;
    console.log("=== Fetching applicant details URL ===", url);
    
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });
    const data = await res.json();
    console.log("=== Applicant details response ===", data);

    if (!data || data.error || !data.applicant) {
      alert((data && data.error) || "Could not load that application.");
      return;
    }

    populateReviewModal(data.applicant);
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
    documentsContainer.style.display = "none";
    if (noDocuments) noDocuments.style.display = "block";
  }

  statusSelect.value = a.status;
  rejectionReasonInput.value = a.rejection_reason || "";
  toggleRejectionReason();
}

function toggleRejectionReason() {
  const isRejected = statusSelect.value === "Rejected";
  rejectionReasonField.hidden = !isRejected;
  rejectionReasonInput.required = isRejected;
}

statusSelect.addEventListener("change", toggleRejectionReason);

function closeModal() {
  reviewModal.hidden = true;
  activeApplicantId = null;
  decisionForm.reset();
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
  const rejectionReason = rejectionReasonInput.value.trim();

  if (status === "Rejected" && !rejectionReason) {
    reviewError.textContent = "Please provide a rejection reason.";
    reviewError.style.display = "block";
    return;
  }

  saveReviewBtn.disabled = true;
  saveReviewBtn.textContent = "Saving…";

  try {
    const body = new URLSearchParams({
      action: "update-status",
      applicant_id: activeApplicantId,
      status: status,
      rejection_reason: rejectionReason
    });

    const res = await fetch(CONTROLLER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await res.json();

    if (data && data.success) {
      closeModal();
      await loadApplications();
    } else {
      reviewError.textContent = (data && data.message) || "Failed to update status.";
      reviewError.style.display = "block";
    }
  } catch (err) {
    reviewError.textContent = "Could not reach the server. Please try again.";
    reviewError.style.display = "block";
  } finally {
    saveReviewBtn.disabled = false;
    saveReviewBtn.textContent = "Save Status";
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

let currentDocPath = null;
let currentDocName = null;

function openDocPreview(filePath, fileName) {
    currentDocPath = filePath;
    currentDocName = fileName || filePath.split('/').pop();
    
    docViewer.style.display = "none";
    docError.style.display = "none";
    docLoading.style.display = "block";
    docPreviewInfo.innerHTML = "";
    docPreviewFrame.innerHTML = "";
    
    docPreviewModal.hidden = false;
    document.getElementById("docPreviewTitle").textContent = "Document Preview";
    
    loadDocument(filePath, fileName);
}

async function loadDocument(filePath, fileName) {
    try {
        const ext = fileName.split('.').pop().toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const pdfTypes = ['pdf'];
        
        docPreviewInfo.innerHTML = `
            <span class="doc-preview-info__name">${esc(fileName)}</span>
            <span class="doc-preview-info__meta">
                <span class="file-type-badge file-type-badge--${getFileTypeClass(ext)}">${ext.toUpperCase()}</span>
            </span>
        `;
        
        if (imageTypes.includes(ext)) {
            const img = document.createElement('img');
            img.src = `${CONTROLLER_URL}?action=serve-document&path=${encodeURIComponent(filePath)}`;
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
            iframe.src = `${CONTROLLER_URL}?action=serve-document&path=${encodeURIComponent(filePath)}`;
            iframe.title = fileName;
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:#c00;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>${esc(message)}</p>
        </div>
    `;
}

function downloadCurrentDoc() {
    if (currentDocPath) {
        const downloadUrl = `${CONTROLLER_URL}?action=serve-document&path=${encodeURIComponent(currentDocPath)}&download=1`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = currentDocName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function closeDocPreviewModal() {
    docPreviewModal.hidden = true;
    const iframe = docPreviewFrame.querySelector('iframe');
    if (iframe) {
        iframe.src = 'about:blank';
    }
    docPreviewFrame.innerHTML = '';
    currentDocPath = null;
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
  if (e.target.classList.contains('view-doc-btn')) {
    const filePath = e.target.dataset.path;
    const fileName = e.target.closest('.document-item') 
      ? e.target.closest('.document-item').querySelector('.document-item__filename')?.textContent 
      : filePath.split('/').pop();
    
    openDocPreview(filePath, fileName);
  }
});

// ---------- Init ----------
loadApplications();