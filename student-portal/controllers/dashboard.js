// dashboard.js — The logged-in student's hub. Reads one snapshot from the PHP
// backend and renders the student-side responsibilities: admission status,
// uploaded requirements, proceeding to enrollment, the assigned section,
// enrollment status, payment status, and paying tuition / uploading proof.
const accountName = document.getElementById("accountName");
const accountInitials = document.getElementById("accountInitials");
const dashGreetName = document.getElementById("dashGreetName");
const dashTracker = document.getElementById("dashTracker");
const dashGrid = document.getElementById("dashGrid");
const dashMsg = document.getElementById("dashMsg");
const admissionBody = document.getElementById("admissionBody");
const enrollmentBody = document.getElementById("enrollmentBody");
const paymentBody = document.getElementById("paymentBody");
const logoutBtn = document.getElementById("logoutBtn");

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

const STATUS_CLASS = {
  "Pending": "pending",
  "Under Review": "review",
  "Approved": "approved",
  "Rejected": "rejected",
  "Enrolled": "enrolled",
  "Dropped": "rejected"
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

function money(n) {
  const v = Number(n);
  return isNaN(v) ? "—" : peso.format(v);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(String(iso).replace(" ", "T"));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function badge(status) {
  return `<span class="badge badge--${STATUS_CLASS[status] || "pending"}">${esc(status)}</span>`;
}

function infoRow(label, valueHtml) {
  return `<div class="info-row"><dt>${esc(label)}</dt><dd data-no-translate>${valueHtml}</dd></div>`;
}

function setMsg(text, type) {
  dashMsg.textContent = text;
  dashMsg.classList.remove("is-error", "is-success");
  if (type) dashMsg.classList.add(type);
}

// ---- Progress tracker --------------------------------------------------

function renderTracker(status) {
  if (!status) { dashTracker.hidden = true; return; }
  let stages;
  if (status === "Rejected") {
    stages = [
      { label: "Submitted", state: "is-done" },
      { label: "Under Review", state: "is-done" },
      { label: "Rejected", state: "is-stop" }
    ];
  } else {
    const order = ["Submitted", "Under Review", "Approved", "Enrolled"];
    const idx = { "Pending": 0, "Under Review": 1, "Approved": 2, "Enrolled": 3 }[status] || 0;
    stages = order.map((label, i) => ({
      label,
      state: i < idx ? "is-done" : i === idx ? "is-current" : ""
    }));
  }
  dashTracker.innerHTML = stages.map((t) => `
    <li class="tl-item ${t.state}">
      <span class="tl-dot"></span>
      <span class="tl-label">${esc(t.label)}</span>
    </li>`).join("");
  dashTracker.hidden = false;
}

// ---- Admission card ----------------------------------------------------

function renderAdmission(snap) {
  const app = snap.application;
  if (!app) {
    admissionBody.innerHTML = `
      <div class="dash-empty">
        <p>You haven't submitted an admission application yet. Fill out the form and upload your requirements to get started.</p>
        <a class="btn btn--submit" href="apply.html">Submit admission application</a>
      </div>`;
    return;
  }

  const status = snap.admission_status || app.status;
  const strandLabel = app.strand_code || app.strand_name || "—";

  const docs = snap.documents || [];
  const docsHtml = docs.length
    ? `<p class="dash-subhead">Uploaded Requirements</p>
       <div class="status-docs">
         ${docs.map((d) => `
           <div class="status-doc">
             <span class="status-doc__name">${esc(d.document_type_name)}</span>
             <span class="badge badge--${STATUS_CLASS[d.status] || "pending"}">${esc(d.status)}</span>
             ${d.status === "Rejected" && d.remarks ? `<span class="status-doc__remarks">Remarks: ${esc(d.remarks)}</span>` : ""}
           </div>`).join("")}
       </div>`
    : `<p class="dash-note">No documents on file for this application.</p>`;

  const rejectionHtml = status === "Rejected" && app.rejection_reason
    ? `<p class="status-note status-note--rejected"><strong>Reason:</strong> ${esc(app.rejection_reason)}</p>
       <a class="btn btn--ghost btn--sm" href="apply.html">Submit a new application</a>`
    : "";

  admissionBody.innerHTML = `
    <div class="dash-status-row">
      <span class="dash-status-row__label">Admission status</span>
      ${badge(status)}
    </div>
    <dl class="info-grid">
      ${infoRow("Reference No.", `<span class="mono">${esc(app.reference_number)}</span>`)}
      ${infoRow("Applicant Type", esc(app.applicant_type))}
      ${infoRow("Applying for", `Grade ${esc(app.desired_grade_level)} · ${esc(strandLabel)}`)}
      ${infoRow("School Year", esc(app.school_year))}
      ${infoRow("Submitted", esc(formatDate(app.submitted_at)))}
    </dl>
    ${docsHtml}
    ${rejectionHtml}`;
}

// ---- Enrollment & section card -----------------------------------------

function renderEnrollment(snap) {
  const status = snap.admission_status;
  const enrollment = snap.enrollment;

  // Not yet approved -> the card is locked with a hint about what unlocks it.
  if (!snap.application) {
    enrollmentBody.innerHTML = `<div class="dash-lock"><p>Submit and get approved on your admission application to unlock enrollment.</p></div>`;
    return;
  }
  if (status === "Rejected") {
    enrollmentBody.innerHTML = `<div class="dash-lock"><p>Enrollment is unavailable because your application was not approved.</p></div>`;
    return;
  }
  if (status !== "Approved" && status !== "Enrolled") {
    enrollmentBody.innerHTML = `<div class="dash-lock">
      <p>Your enrollment options unlock once the registrar <strong>approves</strong> your admission. Current status: ${badge(status)}</p>
    </div>`;
    return;
  }

  const student = snap.student;
  const studentNo = student && student.student_number ? student.student_number : "To be assigned";

  // Approved but the registrar hasn't created the enrollment / assigned a section yet.
  if (!enrollment) {
    enrollmentBody.innerHTML = `
      <div class="dash-status-row">
        <span class="dash-status-row__label">Enrollment status</span>
        <span class="badge badge--review">Not yet enrolled</span>
      </div>
      <dl class="info-grid">
        ${infoRow("Student No.", esc(studentNo))}
        ${infoRow("Assigned Section", "Awaiting assignment")}
      </dl>
      <p class="dash-note">You're approved! Proceed to enrollment by settling your tuition below. The registrar will assign your section once your slot is confirmed.</p>
      <button type="button" class="btn btn--submit" id="proceedEnrollBtn">Proceed to Enrollment</button>`;
    const btn = document.getElementById("proceedEnrollBtn");
    if (btn) btn.addEventListener("click", () => {
      document.getElementById("paymentsCard").scrollIntoView({ behavior: "smooth", block: "start" });
      setMsg("Settle your tuition or upload your proof of payment below to complete enrollment.", "is-success");
    });
    return;
  }

  // Enrolled (or a pending enrollment row exists) -> show the assigned section.
  const secName = enrollment.section_name || "—";
  const secStrand = enrollment.strand_code || enrollment.strand_name || "—";
  enrollmentBody.innerHTML = `
    <div class="dash-status-row">
      <span class="dash-status-row__label">Enrollment status</span>
      ${badge(enrollment.status)}
    </div>
    <dl class="info-grid">
      ${infoRow("Student No.", esc(studentNo))}
      ${infoRow("Assigned Section", `<strong>${esc(secName)}</strong>`)}
      ${infoRow("Grade &amp; Strand", `Grade ${esc(enrollment.section_grade || "—")} · ${esc(secStrand)}`)}
      ${infoRow("Adviser", esc(enrollment.adviser_name || "To be announced"))}
      ${infoRow("School Year", `${esc(enrollment.school_year)} · ${esc(enrollment.semester)}`)}
      ${infoRow("Date Enrolled", esc(formatDate(enrollment.date_enrolled)))}
    </dl>`;
}

// ---- Payments card -----------------------------------------------------

function renderPayments(snap) {
  const payments = snap.payments || [];
  const proofs = snap.proofs || [];

  const paymentsHtml = payments.map((p) => `
    <div class="pay-item">
      <div class="pay-item__main">
        <span class="pay-item__amount" data-no-translate>${money(p.amount)}</span>
        <span class="pay-item__meta" data-no-translate>${esc(p.payment_method)} · ${esc(formatDate(p.payment_date))}</span>
      </div>
      ${badge(p.payment_status)}
    </div>`).join("");

  const proofsHtml = proofs.map((p) => `
    <div class="pay-item">
      <div class="pay-item__main">
        <span class="pay-item__amount" data-no-translate>${p.amount ? money(p.amount) : "Proof of payment"}</span>
        <span class="pay-item__meta" data-no-translate>${esc(p.method || "Uploaded")}${p.payment_reference ? " · Ref " + esc(p.payment_reference) : ""} · ${esc(formatDate(p.uploaded_at))}</span>
        <span class="pay-item__file" data-no-translate>${esc(p.original_filename)}</span>
      </div>
      ${badge(p.status)}
    </div>`).join("");

  const historyHtml = (payments.length || proofs.length)
    ? `<div class="pay-list">${paymentsHtml}${proofsHtml}</div>`
    : `<p class="dash-note">No payments recorded yet. Pay your tuition online or upload a proof of payment below.</p>`;

  paymentBody.innerHTML = `
    <p class="dash-subhead">Payment status</p>
    ${historyHtml}

    <div class="pay-actions">
      <a class="btn btn--submit" href="${esc(PortalAPI.PAY_ONLINE_URL)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        Pay Tuition Online
      </a>
    </div>

    <details class="proof-wrap" id="proofWrap">
      <summary class="proof-summary">Upload proof of payment</summary>
      <form class="proof-form" id="proofForm" novalidate>
        <div class="form-grid">
          <label class="field">
            <span>Amount Paid</span>
            <input type="number" name="amount" min="0" step="0.01" placeholder="0.00" />
          </label>
          <label class="field">
            <span>Payment Method</span>
            <select name="method">
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Over the Counter">Over the Counter</option>
              <option value="Cash">Cash</option>
            </select>
          </label>
          <label class="field">
            <span>Reference No. (optional)</span>
            <input type="text" name="payment_reference" placeholder="e.g. 0001234567" />
          </label>
          <label class="field field--wide">
            <span>Receipt / Screenshot <b class="req">*</b></span>
            <input type="file" name="proof" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required />
            <small class="field__hint">JPG, PNG, or PDF, up to 5 MB.</small>
          </label>
        </div>
        <button type="submit" class="btn btn--primary" id="proofSubmit">Upload Proof</button>
        <p class="form-msg" id="proofMsg"></p>
      </form>
    </details>`;

  wireProofForm();
}

function wireProofForm() {
  const proofForm = document.getElementById("proofForm");
  if (!proofForm) return;
  const proofMsg = document.getElementById("proofMsg");
  const proofSubmit = document.getElementById("proofSubmit");

  const setProofMsg = (text, type) => {
    proofMsg.textContent = text;
    proofMsg.classList.remove("is-error", "is-success");
    if (type) proofMsg.classList.add(type);
  };

  proofForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileEl = proofForm.elements.proof;
    if (!fileEl.files.length) return setProofMsg("Please choose a receipt or screenshot to upload.", "is-error");
    if (fileEl.files[0].size > 5 * 1024 * 1024) return setProofMsg("File exceeds the 5MB limit.", "is-error");

    const fd = new FormData();
    fd.append("action", "upload_proof");
    fd.append("amount", proofForm.elements.amount.value || "");
    fd.append("method", proofForm.elements.method.value || "");
    fd.append("payment_reference", proofForm.elements.payment_reference.value || "");
    fd.append("proof", fileEl.files[0]);

    proofSubmit.disabled = true;
    setProofMsg("Uploading…");
    try {
      const res = await fetch(PortalAPI.ENDPOINTS.dashboard, { method: "POST", body: fd });
      const data = await res.json();
      if (data && data.success) {
        setProofMsg(data.message || "Proof uploaded.", "is-success");
        proofForm.reset();
        setTimeout(load, 900); // refresh the payment list
      } else {
        setProofMsg((data && data.message) || "Upload failed. Please try again.", "is-error");
      }
    } catch {
      setProofMsg("We couldn't reach the server. Please try again.", "is-error");
    } finally {
      proofSubmit.disabled = false;
    }
  });
}

// ---- Boot --------------------------------------------------------------

function paintAccount(account) {
  const name = account.full_name || "Student";
  accountName.textContent = name;
  dashGreetName.textContent = name.split(" ")[0] || name;
  accountInitials.textContent = (name.trim()[0] || "S").toUpperCase();
}

async function load() {
  const snap = await PortalAPI.dashboardSnapshot();
  if (!snap || !snap.authenticated) {
    window.location.href = "login.html";
    return;
  }
  paintAccount(snap.account);
  renderTracker(snap.admission_status);
  renderAdmission(snap);
  renderEnrollment(snap);
  renderPayments(snap);
  dashGrid.hidden = false;
}

logoutBtn.addEventListener("click", () => PortalAPI.logout());

(async function init() {
  const account = await PortalAPI.requireAuth("login.html");
  if (!account) return;
  paintAccount(account);
  try {
    await load();
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    setMsg("We couldn't load your dashboard. Please refresh the page.", "is-error");
  }
})();
