// staff.js \u2014 the admin console's Staff Accounts page. Lists Admin / Registrar /
// Accounting accounts and lets an Admin create, edit, reset-password, and
// delete them. Session/gate is handled by AdminConsole (console.js).
(function () {
  "use strict";

  var API = "../../Controllers/staff/staff_controllers.php";
  var esc = window.AdminConsole.esc;

  var staffRows = document.getElementById("staffRows");
  var emptyState = document.getElementById("emptyState");
  var roleTabs = document.getElementById("roleTabs");
  var searchBox = document.getElementById("searchBox");
  var searchClear = document.querySelector(".search-clear");
  var addBtn = document.getElementById("addBtn");

  var staffModal = document.getElementById("staffModal");
  var staffModalTitle = document.getElementById("staffModalTitle");
  var staffForm = document.getElementById("staffForm");
  var staffId = document.getElementById("staffId");
  var staffName = document.getElementById("staffName");
  var staffEmail = document.getElementById("staffEmail");
  var staffRole = document.getElementById("staffRole");
  var passwordField = document.getElementById("passwordField");
  var staffPassword = document.getElementById("staffPassword");
  var staffMsg = document.getElementById("staffMsg");

  var resetModal = document.getElementById("resetModal");
  var resetName = document.getElementById("resetName");
  var resetPassword = document.getElementById("resetPassword");
  var resetMsg = document.getElementById("resetMsg");

  var deleteModal = document.getElementById("deleteModal");
  var deleteName = document.getElementById("deleteName");
  var deleteMsg = document.getElementById("deleteMsg");

  var state = { role: "", keyword: "", currentUserId: null, resetId: null, deleteId: null };
  var searchTimer = null;

  var ROLE_BADGE = { "Admin": "badge--core", "Registrar": "badge--active", "Accounting": "badge--specialized" };

  // ---- helpers ----
  function get(params) {
    var q = new URLSearchParams(params).toString();
    return fetch(API + "?" + q, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (r) { if (r.status === 401) return { authenticated: false }; return r.json(); });
  }
  function post(data) {
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { body.set(k, data[k]); });
    return fetch(API, { method: "POST", body: body }).then(function (r) { return r.json(); })
      .catch(function () { return { success: false, message: "We couldn't reach the server." }; });
  }
  function formatDate(v) {
    if (!v) return "\u2014";
    var d = new Date(String(v).replace(" ", "T"));
    return isNaN(d) ? v : d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  // ---- list ----
  function load() {
    return get({ action: "list", role: state.role, keyword: state.keyword }).then(function (data) {
      if (!data || data.authenticated === false) { window.location.reload(); return; }
      if (!data.success) return;
      state.currentUserId = data.current_user ? data.current_user.user_id : null;
      renderCounts(data.counts || {});
      render(data.staff || []);
    });
  }

  function renderCounts(counts) {
    var all = (counts.Admin || 0) + (counts.Registrar || 0) + (counts.Accounting || 0);
    document.getElementById("countAll").textContent = all;
    document.getElementById("countAdmin").textContent = counts.Admin || 0;
    document.getElementById("countRegistrar").textContent = counts.Registrar || 0;
    document.getElementById("countAccounting").textContent = counts.Accounting || 0;
  }

  function render(staff) {
    emptyState.hidden = staff.length > 0;
    staffRows.innerHTML = staff.map(function (u) {
      var isMe = String(u.user_id) === String(state.currentUserId);
      return "<tr>" +
        '<td><span class="cell-name">' + esc(u.full_name || "\u2014") + (isMe ? ' <span class="badge badge--closed">You</span>' : "") + "</span></td>" +
        "<td>" + esc(u.email) + "</td>" +
        '<td><span class="badge ' + (ROLE_BADGE[u.role] || "badge--closed") + '">' + esc(u.role || "\u2014") + "</span></td>" +
        "<td>" + esc(formatDate(u.created_at)) + "</td>" +
        '<td class="no-print"><div class="row-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm" data-edit="' + u.user_id + '">Edit</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-reset="' + u.user_id + '">Reset password</button>' +
          (isMe ? "" : '<button type="button" class="btn btn--danger btn--sm" data-delete="' + u.user_id + '">Delete</button>') +
        "</div></td>" +
      "</tr>";
    }).join("");
  }

  // ---- create / edit ----
  function openStaffModal(user) {
    staffForm.reset();
    staffMsg.textContent = "";
    staffMsg.className = "form-msg";
    if (user) {
      staffModalTitle.textContent = "Edit staff account";
      staffId.value = user.user_id;
      staffName.value = user.full_name;
      staffEmail.value = user.email;
      staffRole.value = user.role;
      passwordField.hidden = true;                 // password changed via Reset
    } else {
      staffModalTitle.textContent = "Add staff account";
      staffId.value = "";
      passwordField.hidden = false;
    }
    staffModal.hidden = false;
  }
  function closeStaffModal() { staffModal.hidden = true; }

  addBtn.addEventListener("click", function () { openStaffModal(null); });
  document.getElementById("closeStaffModal").addEventListener("click", closeStaffModal);
  document.getElementById("cancelStaffBtn").addEventListener("click", closeStaffModal);
  staffModal.addEventListener("click", function (e) { if (e.target === staffModal) closeStaffModal(); });

  staffForm.addEventListener("submit", function (e) {
    e.preventDefault();
    staffMsg.textContent = "";
    staffMsg.className = "form-msg";
    var editing = staffId.value !== "";
    var data = {
      action: editing ? "update" : "create",
      full_name: staffName.value.trim(),
      email: staffEmail.value.trim(),
      role: staffRole.value
    };
    if (editing) data.user_id = staffId.value;
    else data.password = staffPassword.value;

    var btn = document.getElementById("saveStaffBtn");
    btn.disabled = true;
    post(data).then(function (res) {
      btn.disabled = false;
      if (res && res.success) {
        closeStaffModal();
        load();
      } else {
        staffMsg.textContent = (res && res.message) || "Could not save the account.";
        staffMsg.className = "form-msg is-error";
      }
    });
  });

  // ---- reset password ----
  function openReset(user) {
    state.resetId = user.user_id;
    resetName.textContent = user.full_name + " (" + user.email + ")";
    resetPassword.value = "";
    resetMsg.textContent = "";
    resetMsg.className = "form-msg";
    resetModal.hidden = false;
  }
  function closeReset() { resetModal.hidden = true; }
  document.getElementById("closeResetModal").addEventListener("click", closeReset);
  document.getElementById("cancelResetBtn").addEventListener("click", closeReset);
  resetModal.addEventListener("click", function (e) { if (e.target === resetModal) closeReset(); });
  document.getElementById("confirmResetBtn").addEventListener("click", function () {
    resetMsg.textContent = "";
    resetMsg.className = "form-msg";
    post({ action: "reset_password", user_id: state.resetId, password: resetPassword.value }).then(function (res) {
      if (res && res.success) { closeReset(); load(); }
      else { resetMsg.textContent = (res && res.message) || "Could not reset the password."; resetMsg.className = "form-msg is-error"; }
    });
  });

  // ---- delete ----
  function openDelete(user) {
    state.deleteId = user.user_id;
    deleteName.textContent = user.full_name + " (" + user.email + ")";
    deleteMsg.textContent = "";
    deleteMsg.className = "form-msg";
    deleteModal.hidden = false;
  }
  function closeDelete() { deleteModal.hidden = true; }
  document.getElementById("closeDeleteModal").addEventListener("click", closeDelete);
  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDelete);
  deleteModal.addEventListener("click", function (e) { if (e.target === deleteModal) closeDelete(); });
  document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
    post({ action: "delete", user_id: state.deleteId }).then(function (res) {
      if (res && res.success) { closeDelete(); load(); }
      else { deleteMsg.textContent = (res && res.message) || "Could not delete the account."; deleteMsg.className = "form-msg is-error"; }
    });
  });

  // Row action delegation \u2014 needs the account's current values, so re-fetch
  // the row's data from the rendered cells is fragile; instead keep a lookup.
  var byId = {};
  var origRender = render;
  render = function (staff) { byId = {}; staff.forEach(function (u) { byId[u.user_id] = u; }); origRender(staff); };

  staffRows.addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var reset = e.target.closest("[data-reset]");
    var del = e.target.closest("[data-delete]");
    if (edit) openStaffModal(byId[edit.getAttribute("data-edit")]);
    else if (reset) openReset(byId[reset.getAttribute("data-reset")]);
    else if (del) openDelete(byId[del.getAttribute("data-delete")]);
  });

  // ---- filters ----
  roleTabs.addEventListener("click", function (e) {
    var tab = e.target.closest(".tab");
    if (!tab) return;
    state.role = tab.dataset.role;
    roleTabs.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("is-active", t === tab); });
    load();
  });
  searchBox.addEventListener("input", function () {
    if (searchClear) searchClear.hidden = searchBox.value.length === 0;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.keyword = searchBox.value.trim(); load(); }, 250);
  });
  if (searchClear) searchClear.addEventListener("click", function () {
    searchBox.value = ""; searchClear.hidden = true; state.keyword = ""; load(); searchBox.focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!staffModal.hidden) closeStaffModal();
    else if (!resetModal.hidden) closeReset();
    else if (!deleteModal.hidden) closeDelete();
  });

  // ---- boot ----
  window.AdminConsole.init({ onReady: function () { load(); } });
})();
