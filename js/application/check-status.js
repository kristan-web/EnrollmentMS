const statusForm = document.getElementById("statusForm");
const lookupMsg = document.getElementById("lookupMsg");
const statusResult = document.getElementById("statusResult");

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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
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

statusForm.addEventListener("submit", (e) => {
  e.preventDefault();
  statusResult.hidden = true;
  statusResult.innerHTML = "";

  const ref = statusForm.elements.referenceNumber.value.trim();
  const email = statusForm.elements.email.value.trim();
  if (!ref || !email) {
    return setMsg("Both reference number and email address are required.", "is-error");
  }

  const app = ApplicantModel.findByReference(ref, email);
  if (!app) {
    return setMsg("No application found for that reference number and email combination. Please double-check both and try again.", "is-error");
  }

  setMsg("");
  const status = ApplicantModel.effectiveStatus(app);
  const docs = ApplicantModel.documentsFor(app.id);

  const timelineHtml = `<ol class="timeline">
    ${timelineFor(status).map((t) => `
      <li class="tl-item ${t.state}">
        <span class="tl-dot"></span>
        <span class="tl-label">${esc(t.label)}</span>
      </li>`).join("")}
  </ol>`;

  const docsHtml = docs.length
    ? `<p class="status-docs__title">Submitted Documents</p>
      <div class="status-docs">
        ${docs.map((d) => `
          <div class="status-doc">
            <span class="status-doc__name">${esc(d.documentTypeName)}</span>
            <span class="badge ${DOC_BADGE[d.status] || "badge--pending"}">${esc(d.status)}</span>
            ${d.status === "Rejected" && d.remarks ? `<span class="status-doc__remarks">Remarks: ${esc(d.remarks)}</span>` : ""}
          </div>`).join("")}
      </div>`
    : "";

  const rejectionHtml = status === "Rejected" && app.rejectionReason
    ? `<p class="status-note status-note--rejected"><strong>Reason:</strong> ${esc(app.rejectionReason)}</p>`
    : "";

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
    ${docsHtml}`;
  statusResult.hidden = false;
});
