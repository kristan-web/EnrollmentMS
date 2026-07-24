<?php 
  $projectFilePath =  "C:/xampp/htdocs/EnrollmentMS";
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
  redirectToLoginPage();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Archive &middot; Enrollment Management System</title>
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

    <h1 class="main__title">Archive</h1>

    <section class="content">
      <div class="toolbar">
        <select class="filter-select" id="filterReason">
          <option value="">All Reasons</option>
          <option>Transferred Out</option>
          <option>Stopped Education</option>
        </select>
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search archived students..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Name</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Reason</th>
                <th>Date Archived</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="archiveRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden></p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <div class="modal-overlay" id="restoreModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="restoreTitle">
      <div class="modal__head">
        <h2 id="restoreTitle">Restore Student</h2>
        <button class="modal__close" id="closeRestoreModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="restoreName"></p>
        <p class="archive-note">The student will be moved back to the active list in Data Entry &rsaquo; Student and can be enrolled again.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelRestoreBtn">Cancel</button>
          <button type="button" class="btn btn--primary" id="confirmRestoreBtn">Restore</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role']); ?>
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Archives/archive.js"></script>
</body>
</html>
