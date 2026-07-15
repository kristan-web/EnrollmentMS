<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Section &middot; Enrollment Management System</title>
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
        <li><a href="../../Dashboards/Views/RegistrarSide/data-entry.php">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </span>
          <span>Data entry</span>
        </a></li>
        <li><a href="../../Dashboards/Views/RegistrarSide/transaction.php">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>
          </span>
          <span>Transaction</span>
        </a></li>
        <li><a href="../../Dashboards/Views/AdminSide/settings.ph">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
          </span>
          <span>Settings</span>
        </a></li>
        <li><a href="../../Dashboards/Views/AdminSide/maintenance.php" class="is-active">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>
          </span>
          <span>Maintenance</span>
        </a></li>
        <li><a href="../../Dashboards/Views/RegistrarSide/records.php">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </span>
          <span>Records &amp; reports</span>
        </a></li>
      </ul>
    </nav>

    <a class="sidebar__logout" href="../../../public/index.php">
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
          <span aria-current="page">Section</span>
        </nav>
        <h1 class="page-head__title">Section</h1>
        <p class="page-head__desc">Manage class sections, their year level, and the teacher advising each one.</p>
      </header>

      <div class="toolbar">
        <select class="filter-select" id="gradeFilter">
          <option value="">All Year Levels</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </select>
        <select class="filter-select" id="yearFilter">
          <option value="">All School Years</option>
        </select>
        <select class="filter-select" id="statusFilter">
          <option value="">Open &amp; Closed</option>
          <option value="Open">Open only</option>
          <option value="Closed">Closed only</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchInput" class="search" placeholder="Search by section, strand, or adviser..." />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <a class="btn btn--ghost" href="cancelled-sections.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Cancelled Sections
        </a>
        <button class="btn btn--primary" id="addSectionBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Section
        </button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Year Level</th>
                <th>Section</th>
                <th>Adviser</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="sectionRows"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>No sections yet. Click "Add Section" to get started.</p>
        <div class="pagination" id="pagination" hidden>
          <span class="pagination__info" id="pageInfo"></span>
          <div class="pagination__controls" id="pageControls"></div>
        </div>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <div class="modal-overlay" id="sectionModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <h2 id="modalTitle">Add Section</h2>
        <button class="modal__close" id="closeSectionModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <form id="sectionForm" class="settings-form" novalidate>
          <div class="form-row">
            <label class="field">
              <span>Year Level <span class="required">*</span></span>
              <select name="grade" required>
                <option value="" disabled selected>Select year level</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </label>
            <label class="field">
              <span>Strand <span class="required">*</span></span>
              <select name="strand" required>
                <option value="" disabled selected>Select strand</option>
              </select>
            </label>
          </div>
          <div class="form-row">
            <label class="field">
              <span>Section Name <span class="required">*</span></span>
              <input type="text" name="name" placeholder="e.g. STEM 11-A" autocomplete="off" required />
            </label>
            <label class="field">
              <span>Capacity <span class="required">*</span></span>
              <input type="number" name="capacity" min="1" max="100" placeholder="40" required />
            </label>
          </div>
          <div class="form-row">
            <label class="field">
              <span>School Year (A.Y) <span class="required">*</span></span>
              <select name="schoolYear" required>
                <option value="" disabled selected>Select school year</option>
              </select>
            </label>
            <label class="field">
              <span>Status <span class="required">*</span></span>
              <select name="status" required>
                <option value="Open" selected>Open</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Adviser <span class="required">*</span></span>
            <select name="adviserId" required>
              <option value="" disabled selected>Select adviser</option>
            </select>
          </label>
          <p class="form-msg" id="sectionMsg" role="status"></p>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" id="cancelSectionBtn">Cancel</button>
            <button type="submit" class="btn btn--primary">Save Section</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="deleteModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
      <div class="modal__head">
        <h2 id="deleteTitle">Cancel Section</h2>
        <button class="modal__close" id="closeDeleteModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <p class="archive-name" id="deleteName"></p>
        <p class="archive-note" id="deleteNote">The section will be marked Cancelled and hidden from the active list. You can restore it later from the Status filter.</p>
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" id="cancelDeleteBtn">Cancel</button>
          <button type="button" class="btn btn--danger" id="confirmDeleteBtn">Cancel Section</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="loadingModal" hidden>
    <div class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__body" style="text-align: center; padding: 2rem;">
        <p>Loading...</p>
      </div>
    </div>
  </div>

  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Sections/section.js"></script>
</body>
</html>