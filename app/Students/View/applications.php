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
  <title>Applications &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/dashboard.css" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/applications.css" />
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

    <h1 class="main__title">Applications</h1>

    <section class="content">
      <div class="toolbar">
        <div class="tabs">
          <button class="tab is-active" data-status="Pending">Pending <span class="tab__count" id="pendingCount">0</span></button>
          <button class="tab" data-status="Approved">Approved <span class="tab__count" id="approvedCount">0</span></button>
          <button class="tab" data-status="Refused">Refused <span class="tab__count" id="refusedCount">0</span></button>
          <a class="tab" href="student.php">Students</a>
        </div>
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by name, reference #, or email..." />
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
                <th>Reference #</th>
                <th>Applicant</th>
                <th>Type</th>
                <th>Grade &amp; Strand</th>
                <th>School Year</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="applicationRows"></tbody>
          </table>
        </div>
        <div id="loadingState" style="text-align:center;padding:2rem;color:var(--text-muted);display:none;">Loading applications...</div>
        <p class="empty" id="emptyState" hidden>No applications found.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <!-- Review Modal -->
  <div class="modal-overlay" id="reviewModal" hidden>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reviewModalTitle">
      <div class="modal__head">
        <h2 id="reviewModalTitle">Review Application</h2>
        <button class="modal__close" id="closeReviewModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <div id="reviewError" style="display:none;background:#fee;color:#c00;padding:0.75rem;border-radius:6px;margin-bottom:1rem;"></div>

        <div class="review-hero">
          <div class="review-hero__who">
            <h3 id="reviewName">&nbsp;</h3>
            <span class="review-hero__ref" id="reviewRef" data-no-translate></span>
          </div>
          <span class="badge" id="reviewCurrentBadge"></span>
        </div>

        <h3 class="form-section">Learner's Information</h3>
        <div class="detail-grid" id="reviewLearnerInfo"></div>

        <h3 class="form-section">Family &amp; Guardian</h3>
        <div class="detail-grid" id="reviewFamilyInfo"></div>

        <h3 class="form-section">Emergency Contact</h3>
        <div class="detail-grid" id="reviewEmergencyInfo"></div>

        <!-- Documents Section -->
        <h3 class="form-section">Submitted Documents</h3>
        <div id="reviewDocuments" class="documents-grid"></div>
        <div id="noDocuments" class="text-muted" style="display:none; padding: 1rem 0; color: #6c757d; font-style: italic;">
          No documents uploaded for this application.
        </div>

        <form id="decisionForm">
          <h3 class="form-section">Decision</h3>
          <div class="form-grid">
            <label class="field">
              <span>Status <span style="color:red;">*</span></span>
              <select name="status" id="statusSelect" required>
                <option value="Approved">Approve</option>
                <option value="Refused">Refuse</option>
              </select>
            </label>
            <label class="field field--wide" id="refusalReasonField" hidden>
              <span>Refusal Reason <span style="color:red;">*</span></span>
              <textarea name="refusal_reason" id="refusalReasonInput" rows="3" placeholder="Explain why this application is being refused."></textarea>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelReviewBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" id="saveReviewBtn">Submit Decision</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Document Preview Modal -->
  <div class="modal-overlay" id="docPreviewModal" hidden>
    <div class="modal modal--doc-preview" role="dialog" aria-modal="true" aria-labelledby="docPreviewTitle">
      <div class="modal__head">
        <h2 id="docPreviewTitle">Document Preview</h2>
        <button class="modal__close" id="closeDocPreview" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body modal__body--doc-preview">
        <div id="docPreviewContent">
          <div id="docLoading" style="text-align:center;padding:2rem;">
            <div class="spinner"></div>
            <p style="margin-top:1rem;color:var(--text-muted);">Loading document...</p>
          </div>
          <div id="docViewer" style="display:none;">
            <div id="docPreviewInfo" class="doc-preview-info"></div>
            <div id="docPreviewFrame" class="doc-preview-frame"></div>
          </div>
          <div id="docError" style="display:none;color:#c00;text-align:center;padding:2rem;">
            <p>Could not load document.</p>
          </div>
        </div>
      </div>
      <div class="modal__foot">
        <button type="button" class="btn btn--ghost" id="closeDocPreviewBtn">Close</button>
        <button type="button" class="btn btn--primary" id="downloadDocBtn">Download</button>
      </div>
    </div>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role'] ?? null); ?>
  </script>
 
  <script src="../../../public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Students/applications.js"></script>
</body>
</html>