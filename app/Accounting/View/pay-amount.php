<!DOCTYPE html>
<!-- Step 2 of 3: how much to pay. Continues to pay-method.php. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Amount &middot; Pay School Fees</title>
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
      Heads up: I couldn't reach the server, so this is an offline preview using sample fees. Start Apache/XAMPP to load the real statement and enable paying.
    </p>

    <div class="acct-shell">
      <aside class="rail">
        <div class="rail-card">
          <h3 class="rail-card__title">Statement of Account</h3>
          <p class="step__desc" id="soaMeta" style="margin:-4px 0 12px;font-size:13px;">S.Y. 2026–2027 &middot; 1st Semester</p>
          <ul class="soa" id="soaList">
            <li class="skeleton"></li>
            <li class="skeleton"></li>
            <li class="skeleton"></li>
          </ul>
          <div class="soa__total" id="soaTotalRow" hidden>
            <span class="soa__total-label">Total Assessment</span>
            <span class="soa__total-amount" id="soaTotal">₱0.00</span>
          </div>
        </div>
      </aside>

      <div class="card">
        <div class="wizard-head">
          <span class="step-chip">Step 2 of 3</span>
          <div class="progress" aria-hidden="true">
            <span class="progress__bar" style="width:66.66%;"></span>
          </div>
        </div>

        <form id="amountForm" novalidate>
          <section class="step">
            <div class="step__head">
              <span class="step__icon step__icon--amber" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <div class="step__headtext">
                <h2 class="step__title">How Much Today?</h2>
                <p class="step__desc" id="payingAs">Choose how much of your assessment to settle now.</p>
              </div>
            </div>

            <div class="plans">
              <label class="plan">
                <input type="radio" name="plan" value="full" checked />
                <span class="plan__dot" aria-hidden="true"></span>
                <span class="plan__text">
                  <span class="plan__name">Pay in Full <span class="plan__price" id="priceFull">₱0.00</span></span>
                  <span class="plan__desc">Settle the whole assessment for this semester in one go.</span>
                </span>
              </label>

              <label class="plan">
                <input type="radio" name="plan" value="down" />
                <span class="plan__dot" aria-hidden="true"></span>
                <span class="plan__text">
                  <span class="plan__name">Down Payment <span class="plan__price" id="priceDown">₱0.00</span></span>
                  <span class="plan__desc" id="downDesc">Pay 40% now and settle the balance later at the cashier.</span>
                </span>
              </label>

              <label class="plan">
                <input type="radio" name="plan" value="custom" />
                <span class="plan__dot" aria-hidden="true"></span>
                <span class="plan__text">
                  <span class="plan__name">Partial / Custom Amount</span>
                  <span class="plan__desc">Enter any amount you can pay right now (minimum ₱500).</span>
                </span>
              </label>
            </div>

            <!-- Shown only when "custom" is selected. -->
            <div class="plan-custom" id="customWrap" hidden>
              <label class="field field--wide">
                <span>Amount to pay <b class="req">*</b></span>
                <div class="peso-input">
                  <input type="number" id="customAmount" name="customAmount" min="500" step="0.01" placeholder="0.00" inputmode="decimal" />
                </div>
              </label>
            </div>

            <div class="pay-amount">
              <span class="pay-amount__label">Amount to pay now</span>
              <span class="pay-amount__value" id="payNow">₱0.00</span>
            </div>
          </section>

          <div id="amountMsg" class="form-msg" role="alert"></div>

          <div class="wizard-nav">
            <a class="btn btn--ghost" href="pay.php">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Back
            </a>
            <div class="wizard-nav__spacer"></div>
            <button type="submit" class="btn btn--primary">
              Continue
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <footer class="footer">&copy; 2026 Enrollment Management System &middot; Cashier &amp; Accounting</footer>

  <script src="/EnrollmentMS/public/assets/js/Accounting/accounting-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Accounting/pay-amount.js"></script>
</body>
</html>
