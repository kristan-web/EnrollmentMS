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
  <title>Enrollment &middot; Enrollment Management System</title>
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

    <h1 class="main__title">Enrollment</h1>

    <section class="content">
      <div class="toolbar">
        <!-- Status Filter Dropdown -->
        <select id="statusFilter" class="filter-select" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 150px;">
          <option value="all">All Status</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Dropped">Dropped</option>
          <option value="Pending">Pending</option>
          <option value="Not Enrolled">Not Enrolled</option>
        </select>

        <!-- School Year Filter -->
        <select id="schoolYearFilter" class="filter-select" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 150px;">
          <option value="">All School Years</option>
        </select>

        <!-- Semester Filter -->
        <select id="semesterFilter" class="filter-select" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 130px;">
          <option value="">All Semesters</option>
          <option value="1st Semester">1st Semester</option>
          <option value="2nd Semester">2nd Semester</option>
        </select>

        <!-- Strand Filter -->
        <select id="strandFilter" class="filter-select" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 150px;">
          <option value="">All Strands</option>
        </select>

        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by name or student no..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <button class="btn btn--ghost" id="printBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
          Print
        </button>
        <button class="btn btn--primary" id="enrollBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Enroll Student
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table data-table--wide">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Full Name</th>
                <th>A.Y</th>
                <th>Term</th>
                <th>Strand</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Date</th>
                <th>Status</th>
                <th class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody id="masterRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No enrollments found. Click "Enroll Student" to begin.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <!-- Enroll Modal -->
  <div class="modal-overlay" id="enrollModal" hidden>
    <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="enrollTitle">
      <div class="modal__head">
        <h2 id="enrollTitle">Enroll Student</h2>
        <button class="modal__close" id="closeEnrollModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <h3 class="form-section">1 &middot; Find Student</h3>
        <div class="input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="studentSearch" placeholder="Type the student's name..." autocomplete="off" />
        </div>
        <div class="search-results" id="studentResults" hidden></div>
        <div class="selected-student" id="selectedStudentChip" hidden>
          <span class="selected-student__avatar" id="chipInitials"></span>
          <span class="selected-student__info">
            <strong id="chipName"></strong>
            <em id="chipMeta"></em>
          </span>
          <button type="button" class="modal__close" id="clearStudentBtn" aria-label="Clear selection">&times;</button>
        </div>

        <h3 class="form-section">2 &middot; Enrollment Details</h3>
        <div class="form-grid">
            <label class="field">
                <span>School Year <span class="required">*</span></span>
                <select id="schoolYear">
                    <option value="" disabled selected>Select school year</option>
                </select>
            </label>
            <label class="field">
                <span>Term <span class="required">*</span></span>
                <select id="term">
                    <option value="" disabled selected>Select term</option>
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                </select>
            </label>
            <label class="field">
                <span>Strand <span class="required">*</span></span>
                <select id="strand">
                    <option value="" disabled selected>Select strand</option>
                </select>
            </label>
            <label class="field">
                <span>Grade Level <span class="required">*</span></span>
                <select id="gradeLevel">
                    <option value="" disabled selected>Select grade</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                </select>
            </label>
        </div>

        <h3 class="form-section">3 &middot; Choose Section</h3>
        <p class="enroll-hint" id="sectionHint">Select a strand and grade level to view available sections.</p>
        <div class="table-wrap">
          <table class="data-table" id="sectionsTable" hidden>
            <thead>
              <tr>
                <th>Section</th>
                <th>Currently Enrolled</th>
                <th>Max Capacity</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody id="sectionRows"></tbody>
          </table>
        </div>

        <p class="form-msg" id="enrollMsg" role="status"></p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelEnrollBtn">Cancel</button>
          <button type="button" class="btn btn--primary" id="confirmEnrollBtn" disabled>Enroll Student</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  <div class="modal-overlay" id="confirmModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div class="modal__head">
        <h2 id="confirmTitle"></h2>
        <button class="modal__close" id="closeConfirmModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="confirmName"></p>
        <p class="archive-note" id="confirmNote"></p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelConfirmBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmActionBtn"></button>
        </div>
      </div>
    </div>
  </div>

  <!-- Schedule Modal -->
  <div class="modal-overlay" id="scheduleModal" hidden>
    <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="scheduleTitle">
      <div class="modal__head">
        <h2 id="scheduleTitle">Student Schedule</h2>
        <button class="modal__close" id="closeScheduleModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <div id="scheduleStudentInfo" class="schedule-student-info"></div>
        <div class="schedule-actions">
          <button class="btn btn--primary" id="printScheduleBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print Schedule
          </button>
        </div>
        <div class="table-wrap" id="scheduleTableWrap">
          <table class="data-table" id="scheduleTable">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Day</th>
                <th>Time</th>
                <th>Room</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody id="scheduleRows">
              <tr>
                <td colspan="6" class="text-center">Loading schedule...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="schedule-summary" id="scheduleSummary"></div>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="closeScheduleModalBtn">Close</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo isset($_SESSION['role']) ? json_encode($_SESSION['role']) : json_encode('guest'); ?>;
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Enrollment/enrollment.js"></script>
</body>
</html>