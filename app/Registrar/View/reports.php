<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";
  safeStartSession();
  echo $_SESSION['role'];
?>

<!DOCTYPE html>
<!-- Registrar-side enrollment reports. Its own page (not a modal) so it has a
     real URL the sidebar redirects to. Same admin shell as admission.php:
     shared/dashboard.css supplies the sidebar/toolbar/panels/data-tables.
     Guarded by reports.js: no registrar session -> login. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Enrollment Reports &middot; Admission &amp; Registrar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/dashboard.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/sweetalert2/sweetalert2.min.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/Registrar/registrar.css" />
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <img src="/EnrollmentMS/public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>
      <p class="sidebar__title">Registrar</p>
    </div>

    <nav class="sidebar__nav">
      <button class="nav__group-toggle" id="dashToggle" aria-expanded="true" aria-controls="dashMenu">
        <span class="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        <span class="nav__label">Admission</span>
        <span class="nav__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      <ul class="nav__submenu is-open" id="dashMenu">
        <li><a href="admission.php">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>
          </span>
          <span>Review queue</span>
        </a></li>
        <li><a href="admission.php#walkin">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
          </span>
          <span>Walk-in enrollment</span>
        </a></li>
        <li><a href="reports.php" class="is-active">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </span>
          <span>Reports</span>
        </a></li>
      </ul>
    </nav>

    <div class="sidebar__who" id="registrarWho" data-no-translate></div>

    <a class="sidebar__logout" href="#" id="logoutBtn">
      <span class="nav__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
      </span>
      <span>Logout</span>
    </a>
  </aside>

  <div class="main">
    <button class="hamburger" id="hamburger" aria-label="Toggle navigation" aria-expanded="true">
      <span class="hamburger__box" aria-hidden="true">
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
      </span>
    </button>

    <h1 class="main__title main__title--hero">Enrollment Reports</h1>
    <p class="main__subtitle">Admission funnel and section fill for the school year</p>

    <section class="content">
      <div class="toolbar">
        <select class="filter-select" id="reportYear" aria-label="Report school year"></select>
        <button class="btn btn--ghost" id="printReportBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
          Print
        </button>
        <p class="reg-count" id="reportMeta" role="status">Loading…</p>
      </div>

      <h2 class="reg-report-title">Admissions by strand</h2>
      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Strand</th>
                <th>Grade</th>
                <th class="reg-num">Pending</th>
                <th class="reg-num">Review</th>
                <th class="reg-num">Approved</th>
                <th class="reg-num">Rejected</th>
                <th class="reg-num">Enrolled</th>
                <th class="reg-num">Total</th>
              </tr>
            </thead>
            <tbody id="admissionRows"></tbody>
            <tfoot id="admissionFoot"></tfoot>
          </table>
        </div>
        <p class="empty" id="admissionEmpty" hidden>No applications for this school year.</p>
      </div>

      <h2 class="reg-report-title">Section fill</h2>
      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Strand &amp; Grade</th>
                <th>Adviser</th>
                <th class="reg-num">Enrolled</th>
                <th class="reg-num">Reserved</th>
                <th class="reg-num">Taken / Slots</th>
              </tr>
            </thead>
            <tbody id="sectionRows"></tbody>
          </table>
        </div>
        <p class="empty" id="sectionEmpty" hidden>No sections for this school year.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System &middot; Admission &amp; Registrar</footer>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role'] ?? null); ?>;
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="/EnrollmentMS/public/assets/js/sweetalert2/sweetalert2.min.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/alerts.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/registrar-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/reports.js"></script>
</body>
</html>
