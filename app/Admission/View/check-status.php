<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Check Application Status &middot; Student Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/portal.css" />
</head>
<body>
  <div class="blob blob--1"></div>
  <div class="blob blob--3"></div>
  <div class="blob blob--5"></div>

  <div class="wrap wrap--status">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Student Portal home">
        <img class="topbar__logo" src="../../../public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag">Student Portal</span>
        </span>
      </a>
      <div class="topbar__actions">
        <div class="lang" data-no-translate>
          <button type="button" class="lang__btn" id="langBtn" aria-haspopup="listbox" aria-expanded="false" title="Language / Wika">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="lang__current" id="langCurrent">English</span>
            <svg class="lang__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <ul class="lang__menu" id="langMenu" role="listbox" aria-label="Language">
            <li class="lang__opt" role="option" data-lang="en">English</li>
            <li class="lang__opt" role="option" data-lang="tl">Tagalog</li>
            <li class="lang__opt" role="option" data-lang="ceb">Bisaya</li>
            <li class="lang__opt" role="option" data-lang="tgl">Taglish</li>
          </ul>
        </div>
        <a class="topbar__login" href="apply.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>Apply Now</span>
        </a>

        <a class="topbar__login" href="/EnrollmentMS/app/Admission/View/index.php">
          <span>Back to Home</span>
        </a>

      </div>
    </header>

    <div class="card">
      <div class="lookup-head">
        <h1>Track your application</h1>
        <p>Enter the reference number you received when you applied, together with the email address you used.</p>
      </div>

      <form id="statusForm" novalidate>
        <div class="lookup-grid">
          <label class="field">
            <span>Reference Number <b class="req">*</b></span>
            <input type="text" name="referenceNumber" class="input-mono" required placeholder="APP-2026-000001" />
          </label>
          <label class="field">
            <span>Email Address <b class="req">*</b></span>
            <input type="email" name="email" required placeholder="you@example.com" />
          </label>
          <button type="submit" class="btn btn--primary">View Status</button>
        </div>
        <p class="form-msg" id="lookupMsg"></p>
      </form>

      <div class="status-result" id="statusResult" hidden></div>
    </div>
  </div>

  <footer class="footer">&copy; 2026 Enrollment Management System</footer>

  <script src="../../../public/assets/js/Admission/applicant-model.js"></script>
  <script src="../../../public/assets/js/Admission/translator.js"></script>
  <script src="../../../public/assets/js/Admission/check-status.js"></script>
</body>
</html>
