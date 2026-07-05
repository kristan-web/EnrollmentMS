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
const uploads = new Map();

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
  return ApplicantModel.requirementsFor(applicantType() || "New Student");
}

for (const s of ApplicantModel.strandOptions()) {
  const opt = document.createElement("option");
  opt.value = s.code;
  opt.textContent = `${s.code} — ${s.name}`;
  opt.dataset.name = s.name;
  strandSelect.appendChild(opt);
}
schoolYearInput.value = ApplicantModel.activeSchoolYear();

form.elements.applicantType.addEventListener("change", () => {
  const isTransferee = applicantType() === "Transferee";
  form.elements.lrn.required = isTransferee;
  lrnReq.hidden = !isTransferee;
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
  if (step === 4) renderDocList();
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
  return `<div class="doc-slot${file ? " has-file" : ""}" data-type-id="${t.id}">
    <img class="doc-slot__thumb" alt="" ${file ? `src="${file.dataUrl}"` : "hidden"} />
    <div class="doc-slot__info">
      <div class="doc-slot__name">${esc(t.name)}
        <span class="tag ${t.isRequired ? "tag--required" : "tag--optional"}">${t.isRequired ? "Required" : "Optional"}</span>
      </div>
      <div class="doc-slot__desc">${esc(t.description || "")}</div>
      <div class="doc-slot__error" hidden></div>
    </div>
    ${file ? `<span class="doc-slot__file" title="${esc(file.fileName)}" data-no-translate>${esc(file.fileName)}</span>` : ""}
    <label class="btn btn--ghost btn--sm">${file ? "Replace" : "Choose File"}
      <input type="file" accept="image/jpeg,image/png" />
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

  const error = ApplicantModel.validateFile(file);
  if (error) {
    errorEl.textContent = error;
    errorEl.hidden = false;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const type = requirements().find((t) => t.id === typeId);
    uploads.set(typeId, {
      documentTypeId: typeId,
      documentTypeName: type ? type.name : "",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      dataUrl: reader.result
    });
    renderDocList();
    setMsg("");
  };
  reader.readAsDataURL(file);
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

form.addEventListener("submit", (e) => {
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
  const data = {
    applicantType: d.applicantType,
    lastName: d.lastName.trim(),
    firstName: d.firstName.trim(),
    middleName: (d.middleName || "").trim(),
    gender: d.gender,
    birthDate: d.birthDate,
    lrn: (d.lrn || "").trim(),
    email: d.email.trim(),
    contact: d.contact.trim(),
    address: d.address.trim(),
    fatherName: (d.fatherName || "").trim(),
    fatherContact: (d.fatherContact || "").trim(),
    motherName: (d.motherName || "").trim(),
    motherContact: (d.motherContact || "").trim(),
    guardianName: (d.guardianName || "").trim(),
    guardianRelationship: (d.guardianRelationship || "").trim(),
    guardianContact: (d.guardianContact || "").trim(),
    emergencyName: d.emergencyName.trim(),
    emergencyRelationship: d.emergencyRelationship.trim(),
    emergencyContact: d.emergencyContact.trim(),
    desiredGradeLevel: d.gradeLevel,
    desiredStrand: d.strand,
    desiredStrandName: strandOpt ? strandOpt.dataset.name || "" : "",
    schoolYear: d.schoolYear
  };
  const files = requirements()
    .filter((t) => uploads.has(t.id))
    .map((t) => uploads.get(t.id));

  try {
    const record = ApplicantModel.submitApplication(data, files);
    refNumber.textContent = record.referenceNumber;
    wizard.hidden = true;
    successPanel.hidden = false;
    applyShell.classList.add("is-complete");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    setMsg(err.message, "is-error");
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

goTo(1);
