const syChip = document.getElementById("syChip");
const reqList = document.getElementById("reqList");

const ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
const ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_PHOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';
const ICON_TRANSFER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 15h8"/><path d="m13 12 3 3-3 3"/></svg>';

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function docIcon(name) {
  if (/photo/i.test(name)) return ICON_PHOTO;
  if (/moral/i.test(name)) return ICON_SHIELD;
  if (/transfer|dismissal/i.test(name)) return ICON_TRANSFER;
  return ICON_FILE;
}

syChip.textContent = `Admissions open · S.Y. ${ApplicantModel.activeSchoolYear()}`;

reqList.innerHTML = ApplicantModel.requirementsFor("Transferee").map((t) => `
  <li class="need-item">
    <span class="need-item__icon" aria-hidden="true">${docIcon(t.name)}</span>
    <span class="need-item__name">${esc(t.name)}</span>
    ${t.applicantType === "Transferee" ? '<span class="tag tag--transferee">Transferees only</span>' : ""}
  </li>`).join("");
