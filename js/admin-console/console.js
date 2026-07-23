// console.js — shared bits for the admin console's Staff Accounts + Audit Logs
// pages. These pages are open (reached from the admin dashboard, no separate
// sign-in), so this just reveals the content, wires the sidebar Logout back to
// the admin login, and exposes esc() + an init() the page controllers call.
(function () {
  "use strict";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var consoleEl = document.getElementById("console");
  if (consoleEl) consoleEl.hidden = false;

  // No sign-in here, so there's no signed-in name to show.
  var who = document.getElementById("consoleWho");
  if (who) who.hidden = true;

  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "../../index.html";
    });
  }

  window.AdminConsole = {
    init: function (opts) { if (opts && opts.onReady) opts.onReady(); },
    esc: esc
  };
})();
