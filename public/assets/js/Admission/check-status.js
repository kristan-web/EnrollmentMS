const statusForm = document.getElementById("statusForm");
const lookupMsg = document.getElementById("lookupMsg");
const statusResult = document.getElementById("statusResult");
const submitBtn = statusForm.querySelector("button[type=submit]");

// Adjust if your controller lives somewhere else relative to this view.
const CONTROLLER_URL = "../Controller/status_controller.php";

const STATUS_CLASS = {
  "Pending": "pending",
  "Under Review": "review",
  "Approved": "approved",
  "Rejected": "rejected",
  "Enrolled": "enrolled"
};

const STATUS_NOTE = {
  "Pending": "Your application has been received and is waiting for review by the registrar.",
  "Under Review": "The registrar is currently reviewing your application and documents.",
  "Approved": "Congratulations! Your application has been approved. Please wait for the school's instructions on sectioning and payment, or visit the registrar's office.",
  "Rejected": "Unfortunately, your application was not approved. See the reason below. You may submit a new application once the issue is resolved.",
  "Enrolled": "You are officially enrolled. Welcome! Coordinate with the registrar's office for your class schedule."
};

const STATUS_ICON = {
  "Pending": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  "Under Review": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  "Approved": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  "Rejected": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  "Enrolled": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
};

const DOC_BADGE = {
  "Pending": "badge--pending",
  "Verified": "badge--verified",
  "Rejected": "badge--rejected"
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function setMsg(text, type) {
  lookupMsg.textContent = text;
  lookupMsg.classList.remove("is-error", "is-success");
  if (type) lookupMsg.classList.add(type);
}

function setLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Searching…" : "View Status";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function timelineFor(status) {
  if (status === "Rejected") {
    return [
      { label: "Submitted", state: "is-done" },
      { label: "Under Review", state: "is-done" },
      { label: "Rejected", state: "is-stop" }
    ];
  }
  const stages = ["Submitted", "Under Review", "Approved", "Enrolled"];
  const idx = { "Pending": 0, "Under Review": 1, "Approved": 2, "Enrolled": 3 }[status] || 0;
  return stages.map((label, i) => ({
    label,
    state: i < idx ? "is-done" : i === idx ? "is-current" : ""
  }));
}

// Maps the DAO's raw row (snake_case, joined with strands) into the shape
// the rendering code below expects.
function normalizeApplicant(raw) {
  const strandLabel = raw.strand_name
    ? raw.strand_code
      ? `${raw.strand_name} (${raw.strand_code})`
      : raw.strand_name
    : "—";

  return {
    id: raw.applicant_id,
    referenceNumber: raw.reference_number,
    firstName: raw.first_name,
    lastName: raw.last_name,
    desiredGradeLevel: raw.desired_grade_level,
    desiredStrand: strandLabel,
    schoolYear: raw.school_year,
    submittedAt: raw.submitted_at,
    status: raw.status,
    rejectionReason: raw.rejection_reason,
    documents: Array.isArray(raw.documents) ? raw.documents : []
  };
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

statusForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusResult.hidden = true;
  statusResult.innerHTML = "";

  const ref = statusForm.elements.referenceNumber.value.trim();
  const email = statusForm.elements.email.value.trim();
  if (!ref || !email) {
    return setMsg("Both reference number and email address are required.", "is-error");
  }

  setMsg("Looking up your application…");
  setLoading(true);

  let data;
  try {
    const url = `${CONTROLLER_URL}?action=status&reference_number=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    data = await res.json();
  } catch (err) {
    setLoading(false);
    return setMsg("Could not reach the server. Please check your connection and try again.", "is-error");
  }
  setLoading(false);

  if (!data || data.error || !data.applicant) {
    return setMsg(
      (data && data.error) || "No application found for that reference number and email combination. Please double-check both and try again.",
      "is-error"
    );
  }

  setMsg("");

  const app = normalizeApplicant(data.applicant);
  const status = app.status;
  const docs = app.documents;

  const timelineHtml = `<ol class="timeline">
    ${timelineFor(status).map((t) => `
      <li class="tl-item ${t.state}">
        <span class="tl-dot"></span>
        <span class="tl-label">${esc(t.label)}</span>
      </li>`).join("")}
  </ol>`;

  // Add click handler for image previews
document.addEventListener('click', function(e) {
    const img = e.target.closest('.doc-preview-img');
    if (img) {
        // Create modal for full-size view
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            cursor: pointer;
            padding: 20px;
        `;
        
        const fullImg = document.createElement('img');
        fullImg.src = img.src;
        fullImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        modal.appendChild(fullImg);
        modal.addEventListener('click', function() {
            modal.remove();
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.contains(modal)) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
});

  const docsHtml = docs.length
    ? `<p class="status-docs__title">Submitted Documents</p>
      <div class="status-docs">
        ${docs.map((d) => {
          // Determine file icon
          let fileIcon = '📄';
          let previewHtml = '';
          
          if (d.is_image) {
            fileIcon = '🖼️';
            previewHtml = `
              <div class="status-doc__preview">
                <img src="${d.preview_url}" alt="${esc(d.original_filename)}" 
                     class="doc-preview-img" 
                     loading="lazy"
                     onerror="this.style.display='none'" />
              </div>
            `;
          } else if (d.is_pdf) {
            fileIcon = '📕';
            previewHtml = `
              <div class="status-doc__preview pdf-preview">
                <a href="${d.preview_url}" target="_blank" class="doc-preview-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span>View PDF</span>
                </a>
              </div>
            `;
          } else {
            fileIcon = '📄';
            previewHtml = `
              <div class="status-doc__preview">
                <a href="${d.preview_url}" target="_blank" class="doc-preview-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span>View Document</span>
                </a>
              </div>
            `;
          }
          
          return `
            <div class="status-doc">
              <div class="status-doc__header">
                <span class="status-doc__name">${esc(d.document_type_name || d.documentTypeName || 'Untitled')}</span>
                <span class="badge ${DOC_BADGE[d.status] || "badge--pending"}">${esc(d.status)}</span>
              </div>
              ${d.original_filename ? `
                <div class="status-doc__file">
                  <span class="status-doc__filename">${fileIcon} ${esc(d.original_filename)}</span>
                  ${d.file_size ? `<span class="status-doc__filesize">(${formatFileSize(d.file_size)})</span>` : ''}
                </div>
              ` : ''}
              ${previewHtml}
              ${d.uploaded_at ? `
                <div class="status-doc__meta">
                  Uploaded: ${formatDate(d.uploaded_at)}
                </div>
              ` : ''}
              ${d.status === "Rejected" && d.remarks ? `
                <div class="status-doc__remarks">Remarks: ${esc(d.remarks)}</div>
              ` : ''}
            </div>
          `;
        }).join("")}
      </div>`
    : "<p class=\"status-docs__empty\">No documents have been uploaded yet.</p>";

  const rejectionHtml = status === "Rejected" && app.rejectionReason
    ? `<p class="status-note status-note--rejected"><strong>Reason:</strong> ${esc(app.rejectionReason)}</p>`
    : "";

  // ============ ACTION BUTTONS BASED ON STATUS ============
  let actionButtonsHtml = '';
  
  if (status === "Rejected") {
    actionButtonsHtml = `
      <div class="status-actions">
        <a href="/EnrollmentMS/app/Admission/View/apply.php" class="btn btn--primary btn--large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" style="margin-right:8px;">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Submit New Application
        </a>
        <p class="status-actions__note">Start a fresh application. Your previous information will not be carried over.</p>
      </div>
    `;
  } else if (status === "Approved") {
    actionButtonsHtml = `
      <div class="status-actions">
        <a href="/EnrollmentMS/app/Admission/View/enroll.php" class="btn btn--primary btn--large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" style="margin-right:8px;">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          Proceed to Enrollment
        </a>
      </div>
    `;
  } else if (status === "Enrolled") {
    actionButtonsHtml = `
      <div class="status-actions">
        <a href="/EnrollmentMS/app/Dashboard/View/index.php" class="btn btn--primary btn--large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" style="margin-right:8px;">
            <path d="M3 12h18"/>
            <path d="M12 3v18"/>
          </svg>
          Go to Dashboard
        </a>
      </div>
    `;
  }

  statusResult.innerHTML = `
    <div class="status-hero status-hero--${STATUS_CLASS[status] || "pending"}">
      <span class="status-hero__icon" aria-hidden="true">${STATUS_ICON[status] || ""}</span>
      <div class="status-hero__text">
        <h2 data-no-translate>${esc(app.firstName)} ${esc(app.lastName)}</h2>
        <span class="status-hero__meta" data-no-translate>${esc(app.referenceNumber)} &middot; Grade ${esc(app.desiredGradeLevel)} ${esc(app.desiredStrand)} &middot; S.Y. ${esc(app.schoolYear)} &middot; Submitted ${formatDate(app.submittedAt)}</span>
      </div>
      <span class="badge badge--${STATUS_CLASS[status] || "pending"}">${esc(status)}</span>
    </div>
    ${timelineHtml}
    <p class="status-note">${STATUS_NOTE[status] || ""}</p>
    ${rejectionHtml}
    ${docsHtml}
    ${actionButtonsHtml}`;
  statusResult.hidden = false;
});