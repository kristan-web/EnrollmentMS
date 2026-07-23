<!DOCTYPE html>
<!-- Check a payment by its reference (a PayMongo cs_... session id). -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Check a Payment &middot; Cashier</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/portal.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/Accounting/accounting.css" />
</head>
<body>
  <div class="blob blob--1"></div>
  <div class="blob blob--3"></div>
  <div class="blob blob--5"></div>

  <div class="wrap wrap--status">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Cashier home">
        <img class="topbar__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag topbar__tag--cashier">Cashier &amp; Accounting</span>
        </span>
      </a>
      <div class="topbar__actions">
        <a class="topbar__login" href="pay.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <span>Pay Fees</span>
        </a>
        <a class="topbar__login" href="index.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          <span>Back</span>
        </a>
      </div>
    </header>

    <div class="card">
      <div class="lookup-head">
        <h1>Check a Payment</h1>
        <p>Enter the payment reference from your receipt (it starts with <b>cs_</b>) to see if PayMongo received your payment.</p>
      </div>

      <form id="statusForm" class="lookup-grid" novalidate>
        <label class="field field--wide">
          <span>Payment Reference <b class="req">*</b></span>
          <input type="text" name="session" class="input-mono" placeholder="cs_xxxxxxxxxxxxxxxx" autocomplete="off" required />
          <span class="field__hint">This is the reference shown on your receipt page after paying.</span>
        </label>
        <button type="submit" class="btn btn--primary" id="statusBtn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Check status
        </button>
      </form>

      <div id="statusMsg" class="form-msg" role="alert"></div>

      <!-- result gets drawn in here -->
      <div id="statusResult" hidden></div>
    </div>
  </div>

  <footer class="footer">&copy; 2026 Enrollment Management System &middot; Cashier &amp; Accounting</footer>

  <script src="/EnrollmentMS/public/assets/js/Accounting/accounting-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/status.js"></script>
</body>
</html>
