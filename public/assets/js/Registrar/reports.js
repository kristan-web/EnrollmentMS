// reports.js — the registrar’s enrollment reports page (Registrar/View/reports.php).
// Its own page rather than a modal, so it has a real URL the sidebar redirects to.
// Guarded: no registrar session -> back to the login.
//
// Renders two data tables from ?action=report:
//   - Admissions by strand (the admission funnel per strand/grade)
//   - Section fill (seats taken vs capacity, and how many are still reserved)
(function () {
  "use strict";

  var M = window.RegistrarModel;

  var registrarWho = document.getElementById("registrarWho");
  var logoutBtn = document.getElementById("logoutBtn");
  var reportYear = document.getElementById("reportYear");
  var reportMeta = document.getElementById("reportMeta");
  var printReportBtn = document.getElementById("printReportBtn");

  var admissionRows = document.getElementById("admissionRows");
  var admissionFoot = document.getElementById("admissionFoot");
  var admissionEmpty = document.getElementById("admissionEmpty");
  var sectionRows = document.getElementById("sectionRows");
  var sectionEmpty = document.getElementById("sectionEmpty");

  var yearsLoaded = false;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // The year dropdown is populated from the queue endpoint's school-year list.
  function loadYears() {
    return M.queue({}).then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = "/EnrollmentMS/app/Registrar/View/index.php";
        return;
      }
      (data.school_years || []).forEach(function (y) {
        var opt = document.createElement("option");
        opt.value = y.year;
        opt.textContent = "S.Y. " + y.year + (y.status === "active" ? " (active)" : "");
        reportYear.appendChild(opt);
      });
      if (data.active_school_year) reportYear.value = data.active_school_year.year;
      yearsLoaded = true;
    });
  }

  function loadReport() {
    reportMeta.textContent = "Loading\u2026";

    return M.report(reportYear.value).then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = "/EnrollmentMS/app/Registrar/View/index.php";
        return;
      }
      if (!data.success) {
        reportMeta.textContent = data.message || "Could not build the report.";
        return;
      }
      render(data);
    });
  }

  function render(data) {
    reportMeta.textContent = "S.Y. " + data.school_year + " \u00b7 Generated " + data.generated_at +
      (data.generated_by ? " by " + data.generated_by : "");

    // ---- Admissions by strand ----
    admissionEmpty.hidden = data.admission.length > 0;
    var totals = { pending: 0, under_review: 0, approved: 0, rejected: 0, enrolled: 0, total: 0 };

    admissionRows.innerHTML = data.admission.map(function (r) {
      totals.pending += Number(r.pending);
      totals.under_review += Number(r.under_review);
      totals.approved += Number(r.approved);
      totals.rejected += Number(r.rejected);
      totals.enrolled += Number(r.enrolled);
      totals.total += Number(r.total);
      return "<tr>" +
        "<td>" + esc(r.strand_code) + "</td>" +
        "<td>Grade " + esc(r.grade_level) + "</td>" +
        '<td class="reg-num">' + esc(r.pending) + "</td>" +
        '<td class="reg-num">' + esc(r.under_review) + "</td>" +
        '<td class="reg-num">' + esc(r.approved) + "</td>" +
        '<td class="reg-num">' + esc(r.rejected) + "</td>" +
        '<td class="reg-num">' + esc(r.enrolled) + "</td>" +
        '<td class="reg-num">' + esc(r.total) + "</td>" +
      "</tr>";
    }).join("");

    admissionFoot.innerHTML = data.admission.length
      ? "<tr>" +
          '<td colspan="2">All strands</td>' +
          '<td class="reg-num">' + totals.pending + "</td>" +
          '<td class="reg-num">' + totals.under_review + "</td>" +
          '<td class="reg-num">' + totals.approved + "</td>" +
          '<td class="reg-num">' + totals.rejected + "</td>" +
          '<td class="reg-num">' + totals.enrolled + "</td>" +
          '<td class="reg-num">' + totals.total + "</td>" +
        "</tr>"
      : "";

    // ---- Section fill ----
    sectionEmpty.hidden = data.sections.length > 0;
    sectionRows.innerHTML = data.sections.map(function (s) {
      var taken = Number(s.enrolled_count) + Number(s.pending_count);
      return "<tr>" +
        '<td><span class="cell-name">' + esc(s.section_name) + "</span></td>" +
        "<td>" + esc(s.strand_code) + " \u00b7 Grade " + esc(s.grade_level) + "</td>" +
        "<td>" + esc(s.adviser_name || "\u2014") + "</td>" +
        '<td class="reg-num">' + esc(s.enrolled_count) + "</td>" +
        '<td class="reg-num">' + esc(s.pending_count) + "</td>" +
        '<td class="reg-num">' + taken + " / " + esc(s.max_slots) + "</td>" +
      "</tr>";
    }).join("");
  }

  reportYear.addEventListener("change", loadReport);
  printReportBtn.addEventListener("click", function () { window.print(); });

  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    RegAlert.confirmLogout().then(function (ok) {
      if (ok) M.logout();
    });
  });

  function initials(name) {
    var parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (parts[0].charAt(0) + last).toUpperCase();
  }

  function whoHtml(name, role) {
    return (
      '<span class="who__avatar" aria-hidden="true">' + esc(initials(name)) + "</span>" +
      '<span class="who__meta">' +
        '<strong class="who__name">' + esc(name || "") + "</strong>" +
        '<span class="who__role">' + esc(role || "Staff") + "</span>" +
      "</span>"
    );
  }

  // ---- Boot ----
  // M.requireAuth("/EnrollmentMS/app/Registrar/View/index.php").then(function (user) {
  //   if (!user) return;
  //   registrarWho.innerHTML = whoHtml(user.full_name, user.role);
  //   loadYears().then(loadReport);
  // });
})();
