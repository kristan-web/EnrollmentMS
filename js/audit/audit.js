// audit.js \u2014 the admin console's Audit Logs viewer. Read-only list of console
// sign-ins and staff account changes, with action / keyword / date filters.
// Session/gate handled by AdminConsole (console.js).
(function () {
  "use strict";

  var API = "../../Controllers/audit/audit_controllers.php";
  var esc = window.AdminConsole.esc;

  var logRows = document.getElementById("logRows");
  var emptyState = document.getElementById("emptyState");
  var logCount = document.getElementById("logCount");
  var searchBox = document.getElementById("searchBox");
  var actionFilter = document.getElementById("actionFilter");
  var fromDate = document.getElementById("fromDate");
  var toDate = document.getElementById("toDate");

  var state = { keyword: "", action: "", from: "", to: "", actionsLoaded: false };
  var searchTimer = null;

  // Action code -> readable label + badge tone.
  var ACTION_LABEL = {
    login: "Signed in", logout: "Signed out",
    create_account: "Created account", update_account: "Updated account",
    reset_password: "Reset password", delete_account: "Deleted account"
  };
  var ACTION_BADGE = {
    login: "badge--active", logout: "badge--closed",
    create_account: "badge--core", update_account: "badge--specialized",
    reset_password: "badge--specialized", delete_account: "badge--archived"
  };

  function formatWhen(v) {
    if (!v) return "\u2014";
    var d = new Date(String(v).replace(" ", "T"));
    if (isNaN(d)) return v;
    return d.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function load() {
    var q = new URLSearchParams({
      action: "list",
      action_filter: state.action,
      keyword: state.keyword,
      from: state.from,
      to: state.to
    }).toString();

    return fetch(API + "?" + q, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (r) { if (r.status === 401) return { authenticated: false }; return r.json(); })
      .then(function (data) {
        if (!data || data.authenticated === false) { window.location.reload(); return; }
        if (!data.success) return;
        if (!state.actionsLoaded) { fillActions(data.actions || []); state.actionsLoaded = true; }
        render(data.logs || []);
      });
  }

  function fillActions(actions) {
    actions.forEach(function (a) {
      var opt = document.createElement("option");
      opt.value = a;
      opt.textContent = ACTION_LABEL[a] || a;
      actionFilter.appendChild(opt);
    });
  }

  function render(logs) {
    emptyState.hidden = logs.length > 0;
    logCount.textContent = logs.length ? logs.length + (logs.length === 1 ? " entry" : " entries") : "";

    logRows.innerHTML = logs.map(function (l) {
      return "<tr>" +
        '<td><span class="mono">' + esc(formatWhen(l.created_at)) + "</span></td>" +
        '<td><span class="cell-name">' + esc(l.actor_name || "\u2014") + "</span></td>" +
        "<td>" + esc(l.actor_role || "\u2014") + "</td>" +
        '<td><span class="badge ' + (ACTION_BADGE[l.action] || "badge--closed") + '">' + esc(ACTION_LABEL[l.action] || l.action) + "</span></td>" +
        "<td>" + esc(l.details || "\u2014") + "</td>" +
        '<td><span class="mono">' + esc(l.ip_address || "\u2014") + "</span></td>" +
      "</tr>";
    }).join("");
  }

  searchBox.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.keyword = searchBox.value.trim(); load(); }, 250);
  });
  actionFilter.addEventListener("change", function () { state.action = actionFilter.value; load(); });
  fromDate.addEventListener("change", function () { state.from = fromDate.value; load(); });
  toDate.addEventListener("change", function () { state.to = toDate.value; load(); });

  window.AdminConsole.init({ onReady: function () { load(); } });
})();
