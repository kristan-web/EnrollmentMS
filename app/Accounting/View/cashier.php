<?php 
  $projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
  include_once "$projectFilePath/config/session.php";
  safeStartSession();
  // echo $_SESSION['role'];
?>

<!DOCTYPE html>
<!-- Accounting-side (cashier) console. Guarded by cashier.js: no session -> login.
     Shares the admin ("Admission") shell: shared/dashboard.css supplies the navy
     sidebar, hamburger, title, toolbar, panels and buttons; accounting.css
     still supplies the console's own pieces (awaiting list, statement of
     account, proof review, printable receipt) and cashier-console.css glues
     the two together.
     Left: students awaiting payment. Right: the selected student. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Cashier Console &middot; Cashier &amp; Accounting</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/dashboard.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/sweetalert2/sweetalert2.min.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/Accounting/accounting.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/Accounting/cashier-console.css" />
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <img src="/EnrollmentMS/public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>
      <p class="sidebar__title">Accounting</p>
    </div>

    <nav class="sidebar__nav">
      <button class="nav__group-toggle" id="dashToggle" aria-expanded="true" aria-controls="dashMenu">
        <span class="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        <span class="nav__label">Cashier</span>
        <span class="nav__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      <!-- Only what this module actually has, so every link stays inside the
           cashier session. -->
      <ul class="nav__submenu is-open" id="dashMenu">
        <li><a href="cashier.php" class="is-active">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
          </span>
          <span>Payment console</span>
        </a>
        </li>
      </ul>
    </nav>

    <div class="sidebar__who" id="cashierWho" data-no-translate></div>

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

    <h1 class="main__title main__title--hero">Cashier Console</h1>
    <p class="main__subtitle">Record tuition payments, update the payment status, and verify uploaded proofs of payment</p>

    <section class="content">
      <div class="toolbar">
        <div class="search-box">
          <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" id="searchBox" class="search" placeholder="Search name or student no..." autocomplete="off" aria-label="Search students awaiting payment" />
          <button type="button" class="search-clear" aria-label="Clear search" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <p class="cash-count" id="queueCount" role="status">Loading…</p>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Full Name</th>
                <th>Section</th>
                <th>Term</th>
                <th>Assessment</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody id="awaitingRows" aria-live="polite"></tbody>
          </table>
        </div>
        <p class="empty" id="emptyState" hidden>Everyone with an enrollment is fully paid — nothing to collect right now.</p>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System &middot; Cashier &amp; Accounting</footer>
  </div>

  <!-- One student: statement of account, payment, and proof review. -->
  <div class="modal-overlay" id="studentModal" hidden>
    <div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="studentModalTitle">
      <div class="modal__head">
        <h2 id="studentModalTitle">Student</h2>
        <button class="modal__close" id="closeStudentModal" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body" id="detailPanel"></div>
    </div>
  </div>

  <!-- Print-only official receipt, filled in by cashier.js after a payment. -->
  <div class="receipt-print" id="receiptPrint" aria-hidden="true"></div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role'] ?? null); ?>;
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>

  <script src="/EnrollmentMS/public/assets/js/sweetalert2/sweetalert2.min.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/alerts.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/sidebar.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/cashier-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/cashier.js"></script>
</body>
</html>
