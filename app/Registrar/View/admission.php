<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";

  safeStartSession();

  echo $_SESSION['role'];
?>

<!DOCTYPE html>
<!-- Registrar-side admission console. Guarded by admission.js: no session -> login.
     Shares the admin ("Admission") shell: shared/dashboard.css supplies the navy
     sidebar, hamburger, title, toolbar, panels, tables and modals; the
     module's own pieces are in /EnrollmentMS/public/assets/css/Registrar/registrar.css.
     Left: the review queue. Right: the selected application. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Admission Console &middot; Admission &amp; Registrar</title>
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

      <!-- Only what this module actually has, so every link stays inside the
           registrar session. -->
      <ul class="nav__submenu is-open" id="dashMenu">
        
      </ul>
    </nav>

    <!-- <div class="sidebar__who" id="registrarWho" data-no-translate></div> -->

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

    <h1 class="main__title main__title--hero">Registrar Review</h1>
    <p class="main__subtitle">Review online submissions, verify documents, assign a section, and finalize enrollment</p>

    <section class="content">
      <div class="tabs" id="statusTabs" role="tablist">
        <button class="tab is-active" data-status="All" role="tab">All <span class="tab__count" id="countAll">0</span></button>
        <button class="tab" data-status="Pending" role="tab">Pending <span class="tab__count" id="countPending">0</span></button>
        <button class="tab" data-status="Under Review" role="tab">Under Review <span class="tab__count" id="countUnderReview">0</span></button>
        <button class="tab" data-status="Approved" role="tab">Approved <span class="tab__count" id="countApproved">0</span></button>
        <button class="tab" data-status="Rejected" role="tab">Rejected <span class="tab__count" id="countRejected">0</span></button>
        <button class="tab" data-status="Enrolled" role="tab">Enrolled <span class="tab__count" id="countEnrolled">0</span></button>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchBox" class="search" placeholder="Search reference no., name, email, or LRN..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <select class="filter-select" id="schoolYearFilter" aria-label="Filter by school year">
          <option value="">All school years</option>
        </select>
        <button class="btn btn--primary" id="walkinBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Walk-in enrollment
        </button>
        <p class="reg-count" id="queueCount" role="status">Loading…</p>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th data-sort="reference" aria-sort="none" tabindex="0">Reference No.</th>
                <th data-sort="applicant" aria-sort="none" tabindex="0">Applicant</th>
                <th data-sort="type" aria-sort="none" tabindex="0">Type</th>
                <th data-sort="grade" aria-sort="none" tabindex="0">Grade &amp; Strand</th>
                <th data-sort="documents" aria-sort="none" tabindex="0">Documents</th>
                <th data-sort="submitted" aria-sort="none" tabindex="0">Submitted</th>
                <th data-sort="status" aria-sort="none" tabindex="0">Status</th>
                <th class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody id="queueRows" aria-live="polite"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No applications match this view.</p>
        <div class="pagination" id="pagination" hidden>
          <span class="pagination__info" id="pageInfo"></span>
          <div class="pagination__controls" id="pageControls"></div>
        </div>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System &middot; Admission &amp; Registrar</footer>
  </div>

  <!-- One application: details, documents, decision, assignment, finalize. -->
  <div class="modal-overlay" id="applicantModal" hidden>
    <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="applicantModalTitle">
      <div class="modal__head">
        <h2 id="applicantModalTitle">Application</h2>
        <button class="modal__close" id="closeApplicantModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body" id="detailPanel"></div>
    </div>
  </div>

  <!-- Walk-in enrollment (flowchart: Walk in? -> YES). Type the student's
       credentials, pick a strand/grade/section, submit, print the report card. -->
  <div class="modal-overlay" id="walkinModal" hidden>
    <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="walkinTitle">
      <div class="modal__head">
        <h2 id="walkinTitle">Walk-in Enrollment</h2>
        <button class="modal__close" id="closeWalkinModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="walkinForm" novalidate>
          <p class="reg-muted">Enter the walk-in student's details, then choose a grade level and section. All fields marked <span class="required">*</span> are required.</p>

          <h3 class="form-section">1 &middot; Student credentials</h3>
          <div class="form-grid">
            <label class="field"><span>First name <span class="required">*</span></span><input type="text" name="firstName" /></label>
            <label class="field"><span>Middle name</span><input type="text" name="middleName" /></label>
            <label class="field"><span>Last name <span class="required">*</span></span><input type="text" name="lastName" /></label>
            <label class="field"><span>LRN <span class="required">*</span></span><input type="text" name="lrn" inputmode="numeric" maxlength="12" placeholder="12-digit LRN" /></label>
            <label class="field"><span>Gender <span class="required">*</span></span>
              <select name="gender"><option value="" disabled selected>Select</option><option>Male</option><option>Female</option><option>Other</option></select>
            </label>
            <label class="field"><span>Birthdate <span class="required">*</span></span><input type="date" name="birthdate" /></label>
            <label class="field"><span>Email <span class="required">*</span></span><input type="email" name="email" /></label>
            <label class="field"><span>Contact number</span><input type="text" name="contact" maxlength="11" placeholder="09XXXXXXXXX" /></label>
            <label class="field field--wide"><span>Address <span class="required">*</span></span><input type="text" name="address" /></label>
          </div>

          <h3 class="form-section">2 &middot; Parents / Guardian</h3>
          <div class="form-grid">
            <label class="field"><span>Father's name</span><input type="text" name="fatherName" /></label>
            <label class="field"><span>Father's contact</span><input type="text" name="fatherContact" maxlength="11" placeholder="09XXXXXXXXX" /></label>
            <label class="field"><span>Mother's name</span><input type="text" name="motherName" /></label>
            <label class="field"><span>Mother's contact</span><input type="text" name="motherContact" maxlength="11" placeholder="09XXXXXXXXX" /></label>
            <label class="field"><span>Guardian's name</span><input type="text" name="guardianName" /></label>
            <label class="field"><span>Guardian's relationship</span><input type="text" name="guardianRelationship" /></label>
            <label class="field"><span>Guardian's contact</span><input type="text" name="guardianContact" maxlength="11" placeholder="09XXXXXXXXX" /></label>
          </div>

          <h3 class="form-section">3 &middot; Emergency contact</h3>
          <div class="form-grid">
            <label class="field"><span>Name <span class="required">*</span></span><input type="text" name="emergencyName" /></label>
            <label class="field"><span>Relationship <span class="required">*</span></span><input type="text" name="emergencyRelationship" /></label>
            <label class="field"><span>Contact number <span class="required">*</span></span><input type="text" name="emergencyContact" maxlength="11" placeholder="09XXXXXXXXX" /></label>
          </div>

          <h3 class="form-section">4 &middot; Grade level &amp; section</h3>
          <div class="form-grid">
            <label class="field"><span>Grade level <span class="required">*</span></span>
              <select name="gradeLevel" id="walkinGrade"><option value="" disabled selected>Select grade</option><option value="11">Grade 11</option><option value="12">Grade 12</option></select>
            </label>
            <label class="field"><span>Strand <span class="required">*</span></span>
              <select name="strandId" id="walkinStrand"><option value="" disabled selected>Select strand</option></select>
            </label>
            <label class="field"><span>Semester <span class="required">*</span></span>
              <select name="semester" id="walkinSemester"><option value="1st Semester" selected>1st Semester</option><option value="2nd Semester">2nd Semester</option></select>
            </label>
          </div>
          <p class="reg-muted" id="walkinSectionHint">Select a grade level and strand to see open sections.</p>
          <div class="reg-sections" id="walkinSectionRows"></div>

          <p class="form-msg" id="walkinMsg" role="status"></p>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelWalkinBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" id="walkinSubmit">Enroll &amp; generate report card</button>
          </div>
        </form>

        <!-- Shown after a successful enrolment: the print action. -->
        <div id="walkinDone" hidden>
          <div class="reg-flash is-success" id="walkinDoneMsg"></div>
          <div class="reg-actions">
            <button type="button" class="btn btn--ghost" id="walkinAnotherBtn">Enroll another</button>
            <button type="button" class="btn btn--primary" id="walkinPrintBtn">Print temporary report card</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Print-only temporary report card, filled in by admission.js. -->
  <div class="reg-print-card" id="reportCardPrint" aria-hidden="true"></div>

  <!-- Shared note prompt: rejection reason, correction note, document remarks.
       Declared after the applicant modal so it stacks on top of it. -->
  <div class="modal-overlay" id="noteModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="noteTitle">
      <div class="modal__head">
        <h2 id="noteTitle"></h2>
        <button class="modal__close" id="closeNoteModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-note" id="noteHint"></p>
        <label class="field field--wide">
          <span>Note <span class="required">*</span></span>
          <textarea id="noteText" rows="4" maxlength="255" placeholder="Explain what the applicant needs to do…"></textarea>
        </label>
        <p class="form-msg" id="noteMsg" role="status"></p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelNoteBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmNoteBtn">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role'] ?? null); ?>;
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="/EnrollmentMS/public/assets/js/sweetalert2/sweetalert2.min.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/alerts.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/sidebar.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/registrar-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/admission.js"></script>
</body>
</html>
