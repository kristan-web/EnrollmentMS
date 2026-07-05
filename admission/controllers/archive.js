const STUDENTS_KEY = "ems_students";

const filterReason = document.getElementById("filterReason");
const searchInput = document.getElementById("searchInput");
const archiveRows = document.getElementById("archiveRows");
const emptyState = document.getElementById("emptyState");

const restoreModal = document.getElementById("restoreModal");
const restoreName = document.getElementById("restoreName");
const closeRestoreModal = document.getElementById("closeRestoreModal");
const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");

let students = load();
let restoringId = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function fullName(s) {
  return `${s.lastName}, ${s.firstName}${s.middleName ? " " + s.middleName : ""}`;
}

function render() {
  const reason = filterReason.value;
  const q = searchInput.value.trim().toLowerCase();
  const archived = students.filter((s) => s.status === "archived");
  const list = archived
    .filter((s) => !reason || s.archiveReason === reason)
    .filter((s) =>
      !q ||
      fullName(s).toLowerCase().includes(q) ||
      (s.studentNo || "").toLowerCase().includes(q) ||
      (s.contact || "").toLowerCase().includes(q)
    );

  archiveRows.innerHTML = list.map((s) => `<tr>
    <td>${esc(s.studentNo || "—")}</td>
    <td>
      <div class="avatar-cell">
        <span class="avatar">${esc(`${(s.firstName || "?")[0]}${(s.lastName || "?")[0]}`.toUpperCase())}</span>
        <span>
          <span class="cell-name">${esc(fullName(s))}</span>
          <span class="cell-sub">${esc(s.address || "")}</span>
        </span>
      </div>
    </td>
    <td>${esc(s.studentType || "—")}</td>
    <td>${esc(s.gender || "—")}</td>
    <td>${esc(s.contact || "—")}</td>
    <td><span class="badge badge--archived">${esc(s.archiveReason || "—")}</span></td>
    <td>${esc(s.archivedAt || "—")}</td>
    <td>
      <div class="row-actions">
        <button class="btn btn--primary btn--sm" data-id="${s.id}">Restore</button>
      </div>
    </td>
  </tr>`).join("");

  emptyState.hidden = list.length > 0;
  emptyState.textContent = archived.length
    ? "No archived students match your filters."
    : "No archived students. Students archived in Data Entry › Student will appear here.";
}

filterReason.addEventListener("change", render);
searchInput.addEventListener("input", render);

archiveRows.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const s = students.find((x) => x.id === btn.dataset.id);
  if (!s) return;
  restoringId = s.id;
  restoreName.textContent = fullName(s);
  restoreModal.hidden = false;
});

function hideModal() {
  restoreModal.hidden = true;
}

closeRestoreModal.addEventListener("click", hideModal);
cancelRestoreBtn.addEventListener("click", hideModal);
restoreModal.addEventListener("click", (e) => {
  if (e.target === restoreModal) hideModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideModal();
});

confirmRestoreBtn.addEventListener("click", () => {
  const s = students.find((x) => x.id === restoringId);
  if (s) {
    s.status = "active";
    delete s.archiveReason;
    delete s.archivedAt;
    persist();
  }
  hideModal();
  render();
});

render();
