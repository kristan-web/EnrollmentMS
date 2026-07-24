<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
  redirectToLoginPage();
  // echo $_SESSION['role'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Rooms &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/dashboard.css" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/enrollment.css" />
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
        <!-- Dynamically populated by sidebar.js -->
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

    <h1 class="main__title">Room Management</h1>

    <section class="content">
      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by room name or building..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--primary" id="addRoomBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Room
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table data-table--wide">
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Room Name</th>
                <th>Building</th>
                <th>Capacity</th>
                <th class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody id="roomRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No rooms found. Click "Add Room" to begin.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <!-- Add / Edit Room Modal -->
  <div class="modal-overlay" id="roomModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="roomModalTitle">
      <div class="modal__head">
        <h2 id="roomModalTitle">Add Room</h2>
        <button class="modal__close" id="closeRoomModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <input type="hidden" id="roomId" value="" />
        <div class="form-grid">
          <label class="field">
            <span>Room Name <span class="required">*</span></span>
            <input type="text" id="roomName" placeholder="e.g. SHS-101" autocomplete="off" />
          </label>
          <label class="field">
            <span>Building <span class="required">*</span></span>
            <input type="text" id="roomBuilding" placeholder="e.g. Main Building" autocomplete="off" />
          </label>
          <label class="field">
            <span>Capacity <span class="required">*</span></span>
            <input type="number" id="roomCapacity" min="1" step="1" placeholder="e.g. 40" />
          </label>
        </div>

        <p class="form-msg" id="roomMsg" role="status"></p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelRoomBtn">Cancel</button>
          <button type="button" class="btn btn--primary" id="saveRoomBtn">Save Room</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Delete Modal -->
  <div class="modal-overlay" id="confirmModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div class="modal__head">
        <h2 id="confirmTitle">Delete Room</h2>
        <button class="modal__close" id="closeConfirmModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="confirmName"></p>
        <p class="archive-note" id="confirmNote">This action cannot be undone.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelConfirmBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmActionBtn">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo isset($_SESSION['role']) ? json_encode($_SESSION['role']) : json_encode('guest'); ?>;
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Rooms/rooms.js"></script>
</body>
</html>