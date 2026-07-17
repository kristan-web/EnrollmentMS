const statusForm = document.getElementById("statusForm");
const lookupMsg = document.getElementById("lookupMsg");
const statusResult = document.getElementById("statusResult");
const submitBtn = statusForm.querySelector("button[type=submit]");

// Adjust if your controller lives somewhere else relative to this view.
const CONTROLLER_URL = "../Controller/applicants_controllers.php";

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
  // MySQL datetimes ("2026-07-16 10:23:00") need a "T" for reliable Date parsing.
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
    // Not returned by findByReferenceAndEmail() yet — stays empty until a
    // documents endpoint/DAO method is added. Rendering below skips the
    // documents block gracefully if this is empty.
    documents: Array.isArray(raw.documents) ? raw.documents : []
  };
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