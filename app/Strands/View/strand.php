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
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Strand &middot; Enrollment Management System</title>
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
          <span aria-current="page">Strand</span>
        </nav>
        <h1 class="page-head__title">Strand</h1>
        <p class="page-head__desc">Manage the senior high school strands offered by the school.</p>
      </header>

      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by code or name..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--primary" id="addStrandBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Strand
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Strand Code</th>
                <th>Strand Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="strandRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No strands yet. Click "Add Strand" to get started.</p>
        <div class="pagination" id="pagination" hidden>
          <span class="pagination__info" id="pageInfo"></span>
          <div class="pagination__controls" id="pageControls"></div>
        </div>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <div class="modal-overlay" id="strandModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <h2 id="modalTitle">Add Strand</h2>
        <button class="modal__close" id="closeStrandModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="strandForm" class="settings-form" novalidate>
          <label class="field">
            <span>Strand Code</span>
            <input type="text" name="code" placeholder="e.g. STEM" autocomplete="off" maxlength="12" required />
          </label>
          <label class="field">
            <span>Strand Name</span>
            <input type="text" name="name" placeholder="e.g. Science, Technology, Engineering, and Mathematics" autocomplete="off" required />
          </label>
          <p class="form-msg" id="strandMsg" role="status"></p>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelStrandBtn">Cancel</button>
            <button type="submit" class="btn btn--primary">Save Strand</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="deleteModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
      <div class="modal__head">
        <h2 id="deleteTitle">Delete Strand</h2>
        <button class="modal__close" id="closeDeleteModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="deleteName"></p>
        <p class="archive-note" id="deleteNote">This permanently removes the strand. This cannot be undone.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelDeleteBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmDeleteBtn">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role']); ?>
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Strands/strand.js"></script>
</body>
</html>
