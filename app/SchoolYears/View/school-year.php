<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>School Year &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/dashboard.css" />
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <img src="../../../public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>
      <p class="sidebar__title">Admission</p>
    </div>

    <nav class="sidebar__nav">
      <button class="nav__group-toggle" id="dashToggle" aria-expanded="true" aria-controls="dashMenu">
        <span class="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        <span class="nav__label">Dashboard</span>
        <span class="nav__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      <ul class="nav__submenu is-open" id="dashMenu">
        <!-- Dashboard Menu Goes Here -->
      </ul>
    </nav>

    <a class="sidebar__logout" onclick="window.location.href='/EnrollmentMS/config/destroysession.php'">
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

    <section class="content content--settings">
      <header class="page-head">
        <nav class="page-head__crumbs" aria-label="Breadcrumb">
          <a href="../../Dashboards/Views/AdminSide/maintenance.php">Maintenance</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">School year</span>
        </nav>
        <h1 class="page-head__title">School Year</h1>
        <p class="page-head__desc">Open, close, and manage academic years. Only one school year can be active at a time.</p>
      </header>

      <div class="active-sy active-sy--none" id="activeSy">
        <span class="active-sy__dot" aria-hidden="true"></span>
        <div class="active-sy__text">
          <strong id="activeSyLabel">No active school year</strong>
          <span id="activeSyHint">Open a school year to activate it for enrollment.</span>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search school year..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--primary" id="addSyBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add School Year
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>School Year</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="syRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No school years yet. Click "Add School Year" to get started.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <div class="modal-overlay" id="syModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <h2 id="modalTitle">Add School Year</h2>
        <button class="modal__close" id="closeSyModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="syForm" class="settings-form" novalidate>
          <label class="field">
            <span>School Year</span>
            <input type="text" name="year" placeholder="e.g. 2026-2027" autocomplete="off" required />
          </label>
          <label class="check">
            <input type="checkbox" name="makeActive" />
            <span>Set as the active school year</span>
          </label>
          <p class="form-msg" id="syMsg" role="status"></p>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelSyBtn">Cancel</button>
            <button type="submit" class="btn btn--primary">Save School Year</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="confirmModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div class="modal__head">
        <h2 id="confirmTitle">Confirm</h2>
        <button class="modal__close" id="closeConfirmModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="confirmName"></p>
        <p class="archive-note" id="confirmNote"></p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelConfirmBtn">Cancel</button>
          <button type="button" class="btn btn--primary" id="confirmActionBtn">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role']); ?>
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/SchoolYears/school-year.js"></script>
</body>
</html>
