<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
  // echo $_SESSION['role'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Teacher &middot; Enrollment Management System</title>
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

    <h1 class="main__title">Teacher</h1>

    <section class="content">
      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by name, email, or specialization..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--primary" id="addTeacherBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Teacher
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Teacher ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact Number</th>
                <th>Specialization</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="teacherRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No teachers yet. Click "Add Teacher" to get started.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <div class="modal-overlay" id="teacherModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <h2 id="modalTitle">Add Teacher</h2>
        <button class="modal__close" id="closeTeacherModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="teacherForm" class="settings-form" novalidate>
          <input type="hidden" name="id" id="editId" />
          <label class="field">
            <span>First Name</span>
            <input type="text" name="firstName" id="firstName" required />
            <small class="field-error" id="firstNameError"></small>
          </label>
          <label class="field">
            <span>Last Name</span>
            <input type="text" name="lastName" id="lastName" required />
            <small class="field-error" id="lastNameError"></small>
          </label>
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" id="email" placeholder="name@school.edu.ph" />
            <small class="field-error" id="emailError"></small>
          </label>
          <label class="field">
            <span>Contact Number</span>
            <input type="tel" name="contact" id="contact" placeholder="09XXXXXXXXX" />
            <small class="field-error" id="contactError"></small>
          </label>
          <label class="field">
            <span>Specialization</span>
            <input type="text" name="specialization" id="specialization" list="specializations" placeholder="e.g. Mathematics" />
            <datalist id="specializations">
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
              <option>Filipino</option>
              <option>Social Studies</option>
              <option>Physical Education</option>
              <option>TLE / ICT</option>
              <option>Values Education</option>
            </datalist>
            <small class="field-error" id="specializationError"></small>
          </label>
          <p class="form-msg" id="teacherMsg" role="status"></p>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelTeacherBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" id="saveTeacherBtn">Save Teacher</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="deleteModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
      <div class="modal__head">
        <h2 id="deleteTitle">Delete Teacher</h2>
        <button class="modal__close" id="closeDeleteModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="deleteName"></p>
        <p class="archive-note">This permanently removes the teacher record. This cannot be undone.</p>
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
  <script src="../../../public/assets/js/Teachers/teacher.js"></script>
</body>
</html>