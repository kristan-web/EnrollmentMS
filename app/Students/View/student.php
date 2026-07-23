<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
  echo $_SESSION['role'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Student &middot; Enrollment Management System</title>
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

    <h1 class="main__title">Student</h1>

    <section class="content">
      <div class="toolbar">
        <div class="tabs">
          <button class="tab is-active" data-tab="active">Active <span class="tab__count" id="activeCount">0</span></button>
          <button class="tab" data-tab="archived">Archived <span class="tab__count" id="archivedCount">0</span></button>
          <a class="tab" href="applications.php">Applications</a>
        </div>
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by name, LRN, or contact..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--primary" id="addStudentBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Student
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>LRN</th>
                <th>Name</th>
                <th>Student #</th>
                <th>Grade Level</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="studentRows"></tbody>
          </table>
        </div>
        <div id="loadingState" style="text-align:center;padding:2rem;color:var(--text-muted);display:none;">Loading students...</div>
        <p class="empty" id="emptyState" hidden>No students yet. Click "Add Student" to get started.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <!-- Student Modal -->
  <div class="modal-overlay" id="studentModal" hidden>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <h2 id="modalTitle">Add Student</h2>
        <button class="modal__close" id="closeStudentModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="studentForm" novalidate>
          <div id="formError" style="display:none;background:#fee;color:#c00;padding:0.75rem;border-radius:6px;margin-bottom:1rem;"></div>
          
          <h3 class="form-section">Learner's Information</h3>
          <div class="form-grid">
            <label class="field">
              <span>LRN <span style="color:red;">*</span></span>
              <input type="text" name="lrn" required placeholder="12-digit LRN" maxlength="12" pattern="[0-9]{12}" />
            </label>
            <!-- Student Number field removed - will be auto-generated -->
            <label class="field">
              <span>First Name <span style="color:red;">*</span></span>
              <input type="text" name="first_name" required />
            </label>
            <label class="field">
              <span>Middle Name</span>
              <input type="text" name="middle_name" />
            </label>
            <label class="field">
              <span>Last Name <span style="color:red;">*</span></span>
              <input type="text" name="last_name" required />
            </label>
            <label class="field">
              <span>Gender <span style="color:red;">*</span></span>
              <select name="gender" required>
                <option value="" disabled selected>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label class="field">
              <span>Birth Date <span style="color:red;">*</span></span>
              <input type="date" name="birthdate" required />
            </label>
            <label class="field">
              <span>Grade Level <span style="color:red;">*</span></span>
              <select name="grade_level" required>
                <option value="" disabled selected>Select grade</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </label>
            <label class="field">
              <span>Email <span style="color:red;">*</span></span>
              <input type="email" name="email" required placeholder="student@example.com" />
            </label>
            <label class="field">
              <span>Contact Number</span>
              <input type="tel" name="contact_number" placeholder="09XXXXXXXXX" />
            </label>
            <label class="field field--wide">
              <span>Address <span style="color:red;">*</span></span>
              <textarea name="address" rows="2" required></textarea>
            </label>
          </div>

          <h3 class="form-section">Parent's Information</h3>
          <div class="form-grid">
            <label class="field">
              <span>Father's Name</span>
              <input type="text" name="father_name" />
            </label>
            <label class="field">
              <span>Father's Occupation</span>
              <input type="text" name="father_occupation" />
            </label>
            <label class="field">
              <span>Father's Contact</span>
              <input type="tel" name="father_contact_number" placeholder="09XXXXXXXXX" />
            </label>
            <label class="field">
              <span>Mother's Name</span>
              <input type="text" name="mother_name" />
            </label>
            <label class="field">
              <span>Mother's Occupation</span>
              <input type="text" name="mother_occupation" />
            </label>
            <label class="field">
              <span>Mother's Contact</span>
              <input type="tel" name="mother_contact_number" placeholder="09XXXXXXXXX" />
            </label>
          </div>

          <h3 class="form-section">Guardian Information</h3>
          <div class="form-grid">
            <label class="field">
              <span>Guardian's Name</span>
              <input type="text" name="guardian_name" />
            </label>
            <label class="field">
              <span>Relationship</span>
              <input type="text" name="guardian_relationship" />
            </label>
            <label class="field">
              <span>Guardian's Contact</span>
              <input type="tel" name="guardian_contact_number" placeholder="09XXXXXXXXX" />
            </label>
            <label class="field field--wide">
              <span>Guardian's Address</span>
              <textarea name="guardian_address" rows="2"></textarea>
            </label>
          </div>

          <h3 class="form-section">Emergency Contact <span style="color:red;">*</span></h3>
          <div class="form-grid">
            <label class="field">
              <span>Emergency Contact Name <span style="color:red;">*</span></span>
              <input type="text" name="emergency_contact_name" required />
            </label>
            <label class="field">
              <span>Relationship <span style="color:red;">*</span></span>
              <input type="text" name="emergency_contact_relationship" required />
            </label>
            <label class="field">
              <span>Contact Number <span style="color:red;">*</span></span>
              <input type="tel" name="emergency_contact_number" required placeholder="09XXXXXXXXX" />
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelStudentBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" id="saveStudentBtn">Save Student</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Archive Modal -->
  <div class="modal-overlay" id="archiveModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="archiveTitle">
      <div class="modal__head">
        <h2 id="archiveTitle">Archive Student</h2>
        <button class="modal__close" id="closeArchiveModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="archiveName"></p>
        <label class="field">
          <span>Reason</span>
          <select id="archiveReason">
            <option value="Transferred Out">Transferred Out</option>
            <option value="Stopped Education">Stopped Education</option>
            <option value="Graduated">Graduated</option>
          </select>
        </label>
        <p class="archive-note">The student will be moved to the Archived tab. You can restore them anytime.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelArchiveBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmArchiveBtn">Archive</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role']); ?>
  </script>
  <script src="../../../public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Students/student.js"></script>
</body>
</html>