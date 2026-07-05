const tabs = document.querySelectorAll(".tab");
const searchInput = document.getElementById("searchInput");
const appRows = document.getElementById("appRows");
const emptyState = document.getElementById("emptyState");

const reviewModal = document.getElementById("reviewModal");
const reviewContent = document.getElementById("reviewContent");
const reviewMsg = document.getElementById("reviewMsg");
const closeReviewModal = document.getElementById("closeReviewModal");
const closeReviewBtn = document.getElementById("closeReviewBtn");
const rejectAppBtn = document.getElementById("rejectAppBtn");
const approveAppBtn = document.getElementById("approveAppBtn");

const docRejectModal = document.getElementById("docRejectModal");
const docRejectName = document.getElementById("docRejectName");
const docRemarks = document.getElementById("docRemarks");
const closeDocRejectModal = document.getElementById("closeDocRejectModal");
const cancelDocRejectBtn = document.getElementById("cancelDocRejectBtn");
const confirmDocRejectBtn = document.getElementById("confirmDocRejectBtn");

const rejectAppModal = document.getElementById("rejectAppModal");
const rejectAppName = document.getElementById("rejectAppName");
const rejectReason = document.getElementById("rejectReason");
const closeRejectAppModal = document.getElementById("closeRejectAppModal");
const cancelRejectAppBtn = document.getElementById("cancelRejectAppBtn");
const confirmRejectAppBtn = document.getElementById("confirmRejectAppBtn");

const approveModal = document.getElementById("approveModal");
const approveName = document.getElementById("approveName");
const closeApproveModal = document.getElementById("closeApproveModal");
const cancelApproveBtn = document.getElementById("cancelApproveBtn");
const confirmApproveBtn = document.getElementById("confirmApproveBtn");

const previewModal = document.getElementById("previewModal");
const previewTitle = document.getElementById("previewTitle");
const previewImg = document.getElementById("previewImg");
const closePreviewModal = document.getElementById("closePreviewModal");

let currentTab = "Pending";
let reviewingId = null;
let rejectingDocId = null;

const APP_BADGE = {
  "Pending": "badge--pending",
  "Under Review": "badge--review",
  "Approved": "badge--active",
  "Rejected": "badge--archived",
  "Enrolled": "badge--enrolled"
};

const DOC_BADGE = {
  "Pending": "badge--pending",
  "Verified": "badge--active",
  "Rejected": "badge--archived"
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

function fullName(a) {
  return `${a.lastName}, ${a.firstName}${a.middleName ? " " + a.middleName : ""}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function formatSize(bytes) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function setReviewMsg(text, type) {
  reviewMsg.textContent = text;
  reviewMsg.classList.remove("is-error", "is-success");
  if (type) reviewMsg.classList.add(type);
}

function decidable(app) {
  return app.status === "Pending" || app.status === "Under Review";
}

function docStats(app) {
  const docs = ApplicantModel.documentsFor(app.id);
  return `${docs.filter((d) => d.status === "Verified").length}/${docs.length}`;
}

function render() {
  const apps = ApplicantModel.applicants();
  const q = searchInput.value.trim().toLowerCase();

  document.getElementById("countPending").textContent = apps.filter((a) => a.status === "Pending").length;
  document.getElementById("countUnderReview").textContent = apps.filter((a) => a.status === "Under Review").length;
  document.getElementById("countApproved").textContent = apps.filter((a) => a.status === "Approved").length;
  document.getElementById("countRejected").textContent = apps.filter((a) => a.status === "Rejected").length;

  const list = apps
    .filter((a) => a.status === currentTab)
    .filter((a) =>
      !q ||
      fullName(a).toLowerCase().includes(q) ||
      a.referenceNumber.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
    .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));

  appRows.innerHTML = list.map((a) => {
    const status = ApplicantModel.effectiveStatus(a);
    return `<tr>
      <td><span class="ref-mono">${esc(a.referenceNumber)}</span></td>
      <td><span class="cell-name">${esc(fullName(a))}</span><span class="cell-sub">${esc(a.email)}</span></td>
      <td>${esc(a.applicantType)}</td>
      <td>Grade ${esc(a.desiredGradeLevel)} &middot; ${esc(a.desiredStrand)}</td>
      <td>${esc(a.schoolYear)}</td>
      <td>${formatDate(a.submittedAt)}</td>
      <td><span class="chip">${docStats(a)} verified</span></td>
      <td><span class="badge ${APP_BADGE[status] || "badge--pending"}">${esc(status)}</span></td>
      <td><div class="row-actions">
        <button class="btn btn--primary btn--sm" data-action="review" data-id="${a.id}">${decidable(a) ? "Review" : "View"}</button>
      </div></td>
    </tr>`;
  }).join("");

  emptyState.hidden = list.length > 0;
  emptyState.textContent = q
    ? "No applications match your search."
    : `No ${currentTab.toLowerCase()} applications.`;
}

function reviewRow(label, value) {
  return `<div><dt>${esc(label)}</dt><dd>${esc(value || "—")}</dd></div>`;
}

function docRowHtml(d, canDecide) {
  const actions = canDecide
    ? `<div class="row-actions">
        ${d.status !== "Verified" ? `<button class="btn btn--primary btn--sm" data-action="verify-doc" data-doc-id="${d.id}">Verify</button>` : ""}
        ${d.status !== "Rejected" ? `<button class="btn btn--danger btn--sm" data-action="reject-doc" data-doc-id="${d.id}">Reject</button>` : ""}
      </div>`
    : "";
  return `<div class="doc-row">
    <img class="doc-row__thumb" src="${d.dataUrl}" alt="" data-action="preview" data-doc-id="${d.id}" title="Click to view full size" />
    <div class="doc-row__info">
      <span class="cell-name">${esc(d.documentTypeName)}</span>
      <span class="cell-sub">${esc(d.fileName)} &middot; ${formatSize(d.fileSize)}</span>
      ${d.remarks ? `<span class="doc-row__remarks">Remarks: ${esc(d.remarks)}</span>` : ""}
    </div>
    <span class="badge ${DOC_BADGE[d.status] || "badge--pending"}">${esc(d.status)}</span>
    ${actions}
  </div>`;
}

function renderReview() {
  const app = ApplicantModel.getApplicant(reviewingId);
  if (!app) return;
  const status = ApplicantModel.effectiveStatus(app);
  const docs = ApplicantModel.documentsFor(app.id);
  const missing = ApplicantModel.missingRequirements(app);
  const canDecide = decidable(app);

  reviewContent.innerHTML = `
    <div class="review-status">
      <span class="ref-mono">${esc(app.referenceNumber)}</span>
      <span class="badge ${APP_BADGE[status] || "badge--pending"}">${esc(status)}</span>
      <span class="cell-sub">Submitted ${formatDate(app.submittedAt)}</span>
    </div>
    ${app.status === "Rejected" && app.rejectionReason ? `<p class="form-msg is-error">Rejected: ${esc(app.rejectionReason)}</p>` : ""}
    <h3 class="form-section">Applicant</h3>
    <dl class="review-grid">
      ${reviewRow("Name", fullName(app))}
      ${reviewRow("Type", app.applicantType)}
      ${reviewRow("Gender", app.gender)}
      ${reviewRow("Birth Date", app.birthDate)}
      ${reviewRow("LRN", app.lrn)}
      ${reviewRow("Email", app.email)}
      ${reviewRow("Contact", app.contact)}
      ${reviewRow("Address", app.address)}
    </dl>
    <h3 class="form-section">Family &amp; Emergency</h3>
    <dl class="review-grid">
      ${reviewRow("Father", app.fatherName)}
      ${reviewRow("Father's Contact", app.fatherContact)}
      ${reviewRow("Mother", app.motherName)}
      ${reviewRow("Mother's Contact", app.motherContact)}
      ${reviewRow("Guardian", app.guardianName)}
      ${reviewRow("Guardian Relationship", app.guardianRelationship)}
      ${reviewRow("Guardian Contact", app.guardianContact)}
      ${reviewRow("Emergency Contact", app.emergencyName ? `${app.emergencyName} (${app.emergencyRelationship})` : "")}
      ${reviewRow("Emergency Number", app.emergencyContact)}
    </dl>
    <h3 class="form-section">Enrollment Preference</h3>
    <dl class="review-grid">
      ${reviewRow("Grade Level", "Grade " + app.desiredGradeLevel)}
      ${reviewRow("Strand", `${app.desiredStrand}${app.desiredStrandName ? " — " + app.desiredStrandName : ""}`)}
      ${reviewRow("School Year", app.schoolYear)}
    </dl>
    <h3 class="form-section">Documents</h3>
    <div class="doc-rows">
      ${docs.length ? docs.map((d) => docRowHtml(d, canDecide)).join("") : '<p class="empty">No documents were uploaded.</p>'}
    </div>`;

  rejectAppBtn.hidden = !canDecide;
  approveAppBtn.hidden = !canDecide;
  approveAppBtn.disabled = missing.length > 0;
  approveAppBtn.title = missing.length
    ? `Verify all required documents first (${missing.map((t) => t.name).join(", ")})`
    : "";
}

function openReview(id) {
  reviewingId = id;
  const app = ApplicantModel.getApplicant(id);
  if (!app) return;
  ApplicantModel.markUnderReview(id);
  setReviewMsg("");
  renderReview();
  render();
  reviewModal.hidden = false;
}

function hideModals() {
  reviewModal.hidden = true;
  docRejectModal.hidden = true;
  rejectAppModal.hidden = true;
  approveModal.hidden = true;
  previewModal.hidden = true;
}

function hideSubModals() {
  docRejectModal.hidden = true;
  rejectAppModal.hidden = true;
  approveModal.hidden = true;
  previewModal.hidden = true;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    currentTab = tab.dataset.tab;
    render();
  });
});

searchInput.addEventListener("input", render);

appRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='review']");
  if (btn) openReview(btn.dataset.id);
});

reviewContent.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const docId = el.dataset.docId;
  const docs = ApplicantModel.documentsFor(reviewingId);
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return;

  if (el.dataset.action === "preview") {
    previewTitle.textContent = doc.documentTypeName;
    previewImg.src = doc.dataUrl;
    previewModal.hidden = false;
  } else if (el.dataset.action === "verify-doc") {
    ApplicantModel.setDocumentStatus(docId, "Verified", "");
    renderReview();
    render();
  } else if (el.dataset.action === "reject-doc") {
    rejectingDocId = docId;
    docRejectName.textContent = doc.documentTypeName;
    docRemarks.value = "";
    docRejectModal.hidden = false;
    docRemarks.focus();
  }
});

confirmDocRejectBtn.addEventListener("click", () => {
  ApplicantModel.setDocumentStatus(rejectingDocId, "Rejected", docRemarks.value.trim());
  docRejectModal.hidden = true;
  renderReview();
  render();
});

rejectAppBtn.addEventListener("click", () => {
  const app = ApplicantModel.getApplicant(reviewingId);
  if (!app) return;
  rejectAppName.textContent = fullName(app);
  rejectReason.value = "";
  rejectAppModal.hidden = false;
  rejectReason.focus();
});

confirmRejectAppBtn.addEventListener("click", () => {
  const reason = rejectReason.value.trim();
  if (!reason) {
    rejectReason.classList.add("is-invalid");
    rejectReason.focus();
    return;
  }
  rejectReason.classList.remove("is-invalid");
  ApplicantModel.reject(reviewingId, reason);
  rejectAppModal.hidden = true;
  setReviewMsg("Application rejected. The applicant will see the reason on the status page.", "is-success");
  renderReview();
  render();
});

rejectReason.addEventListener("input", () => rejectReason.classList.remove("is-invalid"));

approveAppBtn.addEventListener("click", () => {
  const app = ApplicantModel.getApplicant(reviewingId);
  if (!app) return;
  approveName.textContent = fullName(app);
  approveModal.hidden = false;
});

confirmApproveBtn.addEventListener("click", () => {
  approveModal.hidden = true;
  try {
    ApplicantModel.approve(reviewingId);
    setReviewMsg("Application approved and student record created. Enroll them into a section from Transaction › Enrollment.", "is-success");
  } catch (err) {
    setReviewMsg(err.message, "is-error");
  }
  renderReview();
  render();
});

closeReviewModal.addEventListener("click", hideModals);
closeReviewBtn.addEventListener("click", hideModals);
closeDocRejectModal.addEventListener("click", hideSubModals);
cancelDocRejectBtn.addEventListener("click", hideSubModals);
closeRejectAppModal.addEventListener("click", hideSubModals);
cancelRejectAppBtn.addEventListener("click", hideSubModals);
closeApproveModal.addEventListener("click", hideSubModals);
cancelApproveBtn.addEventListener("click", hideSubModals);
closePreviewModal.addEventListener("click", hideSubModals);

[docRejectModal, rejectAppModal, approveModal, previewModal].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideSubModals();
  });
});

reviewModal.addEventListener("click", (e) => {
  if (e.target === reviewModal) hideModals();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (![docRejectModal, rejectAppModal, approveModal, previewModal].every((m) => m.hidden)) {
    hideSubModals();
  } else {
    hideModals();
  }
});

render();
