<!DOCTYPE html>
<!-- Step 3 of 3: pick a method, review, then hand off to PayMongo. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Payment Method &middot; Pay School Fees</title>
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

  <div class="wrap wrap--apply">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Cashier home">
        <img class="topbar__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag topbar__tag--cashier">Cashier &amp; Accounting</span>
        </span>
      </a>
      <div class="topbar__actions">
        <a class="topbar__login" href="status.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span>Check a Payment</span>
        </a>
      </div>
    </header>

    <p id="offlineNote" class="form-msg is-error" hidden>
      Heads up: I couldn't reach the server, so this is an offline preview. Start Apache/XAMPP to enable paying.
    </p>

    <div class="acct-shell">
      <aside class="rail">
        <div class="rail-card">
          <h3 class="rail-card__title">Review</h3>
          <!-- Filled in from the draft by pay-method.js. -->
          <dl class="receipt-lines" id="reviewLines" style="max-width:none;margin:0;"></dl>
        </div>
      </aside>

      <div class="card">
        <div class="wizard-head">
          <span class="step-chip">Step 3 of 3</span>
          <div class="progress" aria-hidden="true">
            <span class="progress__bar" style="width:100%;"></span>
          </div>
        </div>

        <form id="methodForm" novalidate>
          <section class="step">
            <div class="step__head">
              <span class="step__icon step__icon--green" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              </span>
              <div class="step__headtext">
                <h2 class="step__title">Payment Method</h2>
                <p class="step__desc">Pick one and we'll open it for you on PayMongo's secure page.</p>
              </div>
            </div>

            <!-- Method options are built by pay-method.js from AccountingModel.METHODS. -->
            <div class="plans" id="methodList"></div>

            <div class="pay-amount">
              <span class="pay-amount__label">Amount to pay now</span>
              <span class="pay-amount__value" id="payNow">₱0.00</span>
            </div>
          </section>

          <div id="methodMsg" class="form-msg" role="alert"></div>

          <div class="wizard-nav">
            <a class="btn btn--ghost" href="pay-amount.php">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Back
            </a>
            <div class="wizard-nav__spacer"></div>
            <button type="submit" class="btn btn--submit" id="payBtn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
              Proceed to PayMongo
            </button>
          </div>

          <p class="secure-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your card details are entered on PayMongo's secure page — this site never sees them.
          </p>
        </form>
      </div>
    </div>
  </div>

  <footer class="footer">&copy; 2026 Enrollment Management System &middot; Cashier &amp; Accounting</footer>

  <script src="/EnrollmentMS/public/assets/js/Accounting/accounting-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/pay-method.js"></script>
</body>
</html>
