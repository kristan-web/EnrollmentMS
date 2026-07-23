/**
 * Apply Wizard Controller
 * All data (strands, school year, document checklist, and the final
 * application + uploads) comes from the database via these endpoints —
 * nothing is read from or written to localStorage.
 *
 * NOTE: adjust these two paths if your folder layout differs. They assume
 * this file lives at .../public/controllers/apply.js and the PHP backend's
 * Controllers/ folder lives at the project root, i.e. two levels up.
 */
const APPLICANTS_API_URL = "../../Controllers/application/applicants_controllers.php";
const DOCUMENTS_API_URL = "../../Controllers/application/applicant_documents_controllers.php";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — must match the backend's limit

const form = document.getElementById("applyForm");
const steps = Array.from(document.querySelectorAll(".step"));
const stepperItems = Array.from(document.querySelectorAll(".stepper__item"));
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const stepMsg = document.getElementById("stepMsg");
const docList = document.getElementById("docList");
const reviewBody = document.getElementById("reviewBody");
const declaration = document.getElementById("declaration");
const strandSelect = document.getElementById("strandSelect");
const schoolYearInput = document.getElementById("schoolYearInput");
const lrnReq = document.getElementById("lrnReq");
const wizard = document.getElementById("wizard");
const successPanel = document.getElementById("successPanel");
const refNumber = document.getElementById("refNumber");
const stepChip = document.getElementById("stepChip");
const progressBar = document.getElementById("progressBar");
const copyRefBtn = document.getElementById("copyRefBtn");
const applyShell = document.getElementById("applyShell");

const TOTAL_STEPS = steps.length;
let current = 1;
const uploads = new Map(); // document_type_id -> { file, fileName, fileSize, mimeType, dataUrl }

// Document checklist is applicant-type dependent and comes from the server;
// cache it per type so switching back and forth doesn't re-fetch every time.
const checklistCache = new Map(); // applicant_type -> array of { id, name, description, isRequired }
let currentChecklist = [];

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
  stepMsg.textContent = text;
  stepMsg.classList.remove("is-error", "is-success");
  if (type) stepMsg.classList.add(type);
}

function applicantType() {
  return form.elements.applicantType.value;
}

function requirements() {
  return currentChecklist;
}

function validateFile(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or PDF files are accepted.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File exceeds the 5MB limit.";
  }
  return null;
}

// ---------- Initial lookups: strands + active school year ----------

async function loadStrandOptions() {
  try {
    const response = await fetch(`${APPLICANTS_API_URL}?action=strands`);
    const strands = await response.json();
    if (strands.error) throw new Error(strands.error);

    strands.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.strand_id;
      opt.textContent = `${s.strand_code} — ${s.strand_name}`;
      opt.dataset.name = s.strand_name;
      opt.dataset.code = s.strand_code;
      strandSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("Error loading strands:", error);
    setMsg("Could not load strand options. Please refresh the page.", "is-error");
  }
}

async function loadActiveSchoolYear() {
  try {
    const response = await fetch(`${APPLICANTS_API_URL}?action=school-year`);
    const data = await response.json();
    schoolYearInput.value = data && data.year ? data.year : "";
  } catch (error) {
    console.error("Error loading active school year:", error);
  }
}

// ---------- Document checklist (Step 4) ----------

async function fetchChecklist(type) {
  if (checklistCache.has(type)) return checklistCache.get(type);

  const params = new URLSearchParams({ action: "checklist", applicant_type: type });
  const response = await fetch(`${DOCUMENTS_API_URL}?${params.toString()}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  const normalized = data.map((docType) => ({
    id: String(docType.document_type_id),
    name: docType.name,
    description: docType.description,
    isRequired: docType.is_required == 1
  }));
  checklistCache.set(type, normalized);
  return normalized;
}

async function loadDocList() {
  docList.innerHTML = `<p class="doc-list__loading">Loading requirements…</p>`;
  nextBtn.disabled = true;
  try {
    currentChecklist = await fetchChecklist(applicantType() || "New Student");
    renderDocList();
  } catch (error) {
    console.error("Error loading document checklist:", error);
    docList.innerHTML = `<p style="color:#c00;">Failed to load requirements: ${esc(error.message)}</p>`;
  } finally {
    nextBtn.disabled = false;
  }
}

form.elements.applicantType.addEventListener("change", () => {
  const isTransferee = applicantType() === "Transferee";
  form.elements.lrn.required = isTransferee;
  lrnReq.hidden = !isTransferee;

  // Requirements can differ between New Student / Transferee — drop any
  // uploads that no longer belong to a required/optional slot for this type.
  uploads.clear();
});

function goTo(step) {
  current = step;
  steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
  stepperItems.forEach((item, i) => {
    item.classList.toggle("is-current", i + 1 === step);
    item.classList.toggle("is-done", i + 1 < step);
  });
  backBtn.hidden = false;
  backBtn.textContent = step === 1 ? "Back to Home" : "Back";
  nextBtn.hidden = step === TOTAL_STEPS;
  submitBtn.hidden = step !== TOTAL_STEPS;
  stepChip.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  progressBar.style.width = `${(step / TOTAL_STEPS) * 100}%`;
  setMsg("");
  if (step === 4) loadDocList();
  if (step === 5) renderReview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(step) {
  const section = steps[step - 1];
  let firstInvalid = null;
  section.querySelectorAll("input, select, textarea").forEach((el) => {
    if (el.type === "file" || el.type === "checkbox") return;
    const ok = el.checkValidity();
    el.classList.toggle("is-invalid", !ok);
    if (!ok && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) {
    setMsg("Please complete the highlighted fields correctly before continuing.", "is-error");
    firstInvalid.focus();
    return false;
  }
  if (step === 4) {
    const missing = requirements().filter((t) => t.isRequired && !uploads.has(t.id));
    if (missing.length) {
      setMsg(`Please upload: ${missing.map((t) => t.name).join(", ")}.`, "is-error");
      return false;
    }
  }
  return true;
}

function slotHtml(t) {
  const file = uploads.get(t.id);
  const isImage = file && file.mimeType && file.mimeType.startsWith("image/");
  return `<div class="doc-slot${file ? " has-file" : ""}" data-type-id="${t.id}">
    <img class="doc-slot__thumb" alt="" ${isImage ? `src="${file.dataUrl}"` : "hidden"} />
    <div class="doc-slot__info">
      <div class="doc-slot__name">${esc(t.name)}
        <span class="tag ${t.isRequired ? "tag--required" : "tag--optional"}">${t.isRequired ? "Required" : "Optional"}</span>
      </div>
      <div class="doc-slot__desc">${esc(t.description || "")}</div>
      <div class="doc-slot__error" hidden></div>
    </div>
    ${file ? `<span class="doc-slot__file" title="${esc(file.fileName)}" data-no-translate>${esc(file.fileName)}</span>` : ""}
    <label class="btn btn--ghost btn--sm">${file ? "Replace" : "Choose File"}
      <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" />
    </label>
    ${file ? `<button type="button" class="btn btn--ghost btn--sm" data-action="remove">Remove</button>` : ""}
  </div>`;
}

function renderDocList() {
  docList.innerHTML = requirements().map(slotHtml).join("");
}

function handleFile(slot, file) {
  const typeId = slot.dataset.typeId;
  const errorEl = slot.querySelector(".doc-slot__error");

  const error = validateFile(file);
  if (error) {
    errorEl.textContent = error;
    errorEl.hidden = false;
    return;
  }

  const finish = (dataUrl) => {
    const type = requirements().find((t) => t.id === typeId);
    uploads.set(typeId, {
      documentTypeId: typeId,
      documentTypeName: type ? type.name : "",
      file,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      dataUrl
    });
    renderDocList();
    setMsg("");
  };

  // Only images get an inline preview thumbnail; PDFs just show the filename.
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => finish(reader.result);
    reader.readAsDataURL(file);
  } else {
    finish(null);
  }
}

docList.addEventListener("change", (e) => {
  const input = e.target;
  if (input.type !== "file" || !input.files.length) return;
  handleFile(input.closest(".doc-slot"), input.files[0]);
});

["dragover", "dragenter"].forEach((type) => {
  docList.addEventListener(type, (e) => {
    const slot = e.target.closest(".doc-slot");
    if (!slot) return;
    e.preventDefault();
    slot.classList.add("is-drag");
  });
});

docList.addEventListener("dragleave", (e) => {
  const slot = e.target.closest(".doc-slot");
  if (slot && !slot.contains(e.relatedTarget)) slot.classList.remove("is-drag");
});

docList.addEventListener("drop", (e) => {
  const slot = e.target.closest(".doc-slot");
  if (!slot) return;
  e.preventDefault();
  slot.classList.remove("is-drag");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(slot, file);
});

docList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='remove']");
  if (!btn) return;
  uploads.delete(btn.closest(".doc-slot").dataset.typeId);
  renderDocList();
});

function reviewRow(label, value) {
  return `<div><dt>${esc(label)}</dt><dd data-no-translate>${esc(value || "—")}</dd></div>`;
}

function renderReview() {
  const d = Object.fromEntries(new FormData(form));
  const strandOpt = strandSelect.selectedOptions[0];
  const docs = requirements()
    .filter((t) => uploads.has(t.id))
    .map((t) => reviewRow(t.name, uploads.get(t.id).fileName))
    .join("");

  reviewBody.innerHTML = `
    <div class="review-block">
      <div class="review-block__head">Personal Information
        <button type="button" class="review-block__edit" data-step="1">Edit</button>
      </div>
      <dl class="review-grid">
        ${reviewRow("Applicant Type", d.applicantType)}
        ${reviewRow("Name", `${d.lastName}, ${d.firstName}${d.middleName ? " " + d.middleName : ""}`)}
        ${reviewRow("Gender", d.gender)}
        ${reviewRow("Birth Date", d.birthDate)}
        ${reviewRow("LRN", d.lrn)}
        ${reviewRow("Email", d.email)}
        ${reviewRow("Contact", d.contact)}
        ${reviewRow("Address", d.address)}
      </dl>
    </div>
    <div class="review-block">
      <div class="review-block__head">Family &amp; Emergency Contact
        <button type="button" class="review-block__edit" data-step="2">Edit</button>
      </div>
      <dl class="review-grid">
        ${reviewRow("Father", d.fatherName)}
        ${reviewRow("Father's Contact", d.fatherContact)}
        ${reviewRow("Mother", d.motherName)}
        ${reviewRow("Mother's Contact", d.motherContact)}
        ${reviewRow("Guardian", d.guardianName)}
        ${reviewRow("Guardian Relationship", d.guardianRelationship)}
        ${reviewRow("Guardian Contact", d.guardianContact)}
        ${reviewRow("Emergency Contact", `${d.emergencyName || "—"} (${d.emergencyRelationship || "—"})`)}
        ${reviewRow("Emergency Number", d.emergencyContact)}
      </dl>
    </div>
    <div class="review-block">
      <div class="review-block__head">Enrollment Preference
        <button type="button" class="review-block__edit" data-step="3">Edit</button>
      </div>
      <dl class="review-grid">
        ${reviewRow("Grade Level", d.gradeLevel ? "Grade " + d.gradeLevel : "")}
        ${reviewRow("Strand", strandOpt && strandOpt.value ? strandOpt.textContent : "")}
        ${reviewRow("School Year", d.schoolYear)}
      </dl>
    </div>
    <div class="review-block">
      <div class="review-block__head">Uploaded Documents
        <button type="button" class="review-block__edit" data-step="4">Edit</button>
      </div>
      <dl class="review-grid">${docs || reviewRow("Documents", "None uploaded")}</dl>
    </div>`;
}

reviewBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-step]");
  if (btn) goTo(Number(btn.dataset.step));
});

nextBtn.addEventListener("click", () => {
  if (validateStep(current)) goTo(current + 1);
});

backBtn.addEventListener("click", () => {
  if (current === 1) {
    window.location.href = "../index.html";
  } else {
    goTo(current - 1);
  }
});

// ---------- Submission ----------

function buildApplicantFormData(d, strandOpt) {
  const fd = new FormData();
  fd.append("action", "submit");
  fd.append("applicantType", d.applicantType);
  fd.append("lastName", d.lastName.trim());
  fd.append("firstName", d.firstName.trim());
  fd.append("middleName", (d.middleName || "").trim());
  fd.append("gender", d.gender);
  fd.append("birthDate", d.birthDate);
  fd.append("lrn", (d.lrn || "").trim());
  fd.append("email", d.email.trim());
  fd.append("contact", d.contact.trim());
  fd.append("address", d.address.trim());
  fd.append("fatherName", (d.fatherName || "").trim());
  fd.append("fatherContact", (d.fatherContact || "").trim());
  fd.append("motherName", (d.motherName || "").trim());
  fd.append("motherContact", (d.motherContact || "").trim());
  fd.append("guardianName", (d.guardianName || "").trim());
  fd.append("guardianRelationship", (d.guardianRelationship || "").trim());
  fd.append("guardianContact", (d.guardianContact || "").trim());
  fd.append("emergencyName", d.emergencyName.trim());
  fd.append("emergencyRelationship", d.emergencyRelationship.trim());
  fd.append("emergencyContact", d.emergencyContact.trim());
  fd.append("desiredGradeLevel", d.gradeLevel);
  fd.append("desiredStrandId", d.strand);
  fd.append("schoolYear", d.schoolYear);
  return fd;
}

async function uploadOneDocument(applicantId, referenceNumber, docTypeId, fileEntry) {
  const fd = new FormData();
  fd.append("action", "upload");
  fd.append("applicant_id", applicantId);
  fd.append("document_type_id", docTypeId);
  fd.append("reference_number", referenceNumber);
  fd.append("document", fileEntry.file);

  const response = await fetch(DOCUMENTS_API_URL, { method: "POST", body: fd });
  const result = await response.json();
  if (!result.success) {
    throw new Error(`${fileEntry.documentTypeName || "Document"}: ${result.message || "Upload failed."}`);
  }
  return result;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!declaration.checked) {
    return setMsg("Please tick the declaration checkbox to confirm your information.", "is-error");
  }
  for (let s = 1; s <= 4; s++) {
    if (!validateStep(s)) {
      goTo(s);
      validateStep(s);
      return;
    }
  }

  const d = Object.fromEntries(new FormData(form));
  const strandOpt = strandSelect.selectedOptions[0];
  const files = requirements()
    .filter((t) => uploads.has(t.id))
    .map((t) => uploads.get(t.id));

  submitBtn.disabled = true;
  setMsg("Submitting your application…");

  try {
    const applicantResponse = await fetch(APPLICANTS_API_URL, {
      method: "POST",
      body: buildApplicantFormData(d, strandOpt)
    });
    const applicantResult = await applicantResponse.json();
    if (!applicantResult.success) {
      throw new Error(applicantResult.message || "Could not submit your application.");
    }

    const { applicant_id: applicantId, reference_number: referenceNumber } = applicantResult;

    setMsg("Uploading your documents…");
    for (const fileEntry of files) {
      await uploadOneDocument(applicantId, referenceNumber, fileEntry.documentTypeId, fileEntry);
    }

    refNumber.textContent = referenceNumber;
    wizard.hidden = true;
    successPanel.hidden = false;
    applyShell.classList.add("is-complete");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Error submitting application:", err);
    setMsg(err.message || "Something went wrong while submitting. Please try again.", "is-error");
  } finally {
    submitBtn.disabled = false;
  }
});

copyRefBtn.addEventListener("click", () => {
  const done = () => {
    copyRefBtn.classList.add("is-copied");
    copyRefBtn.lastChild.textContent = " Copied!";
    setTimeout(() => {
      copyRefBtn.classList.remove("is-copied");
      copyRefBtn.lastChild.textContent = " Copy";
    }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(refNumber.textContent).then(done).catch(done);
  } else {
    const range = document.createRange();
    range.selectNodeContents(refNumber);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
    done();
  }
});

(async function init() {
  await Promise.all([loadStrandOptions(), loadActiveSchoolYear()]);
  goTo(1);
})();
