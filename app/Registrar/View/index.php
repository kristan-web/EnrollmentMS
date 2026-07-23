<!DOCTYPE html>
<!-- Registrar module entry point: the registrar login (flowchart: START ->
     Login Page -> Input credentials -> click login). Staff sign in with their
     existing account; registrar-login.js sends them to View/admission.php
     once the account checks out. Theme is portal.css. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <link rel="apple-touch-icon" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Registrar Login &middot; Admission &amp; Registrar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <!-- The login keeps the portal theme (like Accounting/View/index.php does).
       public/assets/css/Registrar/registrar.css is for the console only — it
       builds on shared/dashboard.css, which would fight portal.css here. -->
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/portal.css" />

  <style>
    .portal-nav {
      margin-top: clamp(22px, 3.4vh, 32px);
      animation: rise 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) 0.3s both;
    }
    .portal-nav__label {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.1px;
      text-transform: uppercase;
      color: rgba(22, 36, 79, 0.42);
    }
    .portal-nav__label::before,
    .portal-nav__label::after {
      content: "";
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(22, 36, 79, 0.16), transparent);
    }
    .portal-nav__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .portal-link {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 14px 15px;
      border: 1px solid rgba(22, 36, 79, 0.09);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(6px);
      box-shadow: 0 8px 22px rgba(22, 36, 79, 0.08);
      text-align: left;
      text-decoration: none;
      transition: transform 0.2s cubic-bezier(0.22, 0.8, 0.3, 1),
                  box-shadow 0.2s cubic-bezier(0.22, 0.8, 0.3, 1),
                  border-color 0.2s cubic-bezier(0.22, 0.8, 0.3, 1);
    }
    .portal-link:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 34px rgba(22, 36, 79, 0.15);
    }
    .portal-link:focus-visible {
      outline: 3px solid rgba(55, 205, 255, 0.55);
      outline-offset: 3px;
    }
    .portal-link__icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 13px;
      color: #fff;
    }
    .portal-link__icon svg { width: 20px; height: 20px; }
    .portal-link__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .portal-link__text strong {
      font-size: 14.5px;
      font-weight: 800;
      line-height: 1.2;
      color: #16244f;
    }
    .portal-link__text span {
      font-size: 11.5px;
      font-weight: 600;
      color: rgba(22, 36, 79, 0.55);
    }
    .portal-link__arrow {
      flex: none;
      margin-left: auto;
      width: 18px;
      height: 18px;
      color: rgba(22, 36, 79, 0.28);
      transition: transform 0.2s cubic-bezier(0.22, 0.8, 0.3, 1), color 0.2s;
    }
    .portal-link:hover .portal-link__arrow { transform: translateX(3px); color: #2f5fd0; }

    .portal-link--registrar:hover { border-color: rgba(47, 95, 208, 0.4); }
    .portal-link--registrar .portal-link__icon {
      background: linear-gradient(150deg, #4f8bf5, #2f5fd0);
      box-shadow: 0 7px 16px rgba(47, 95, 208, 0.34);
    }
    .portal-link--accounting:hover { border-color: rgba(13, 148, 136, 0.45); }
    .portal-link--accounting .portal-link__icon {
      background: linear-gradient(150deg, #2dd4bf, #0f766e);
      box-shadow: 0 7px 16px rgba(13, 148, 136, 0.34);
    }
    .portal-link--accounting:hover .portal-link__arrow { color: #0f766e; }

    body > footer.footer {
      position: static;
      margin-top: auto;
      padding-top: 12px;
      font-size: 13px;
      letter-spacing: 0.2px;
      color: rgba(22, 36, 79, 0.5);
    }

    @media (min-width: 560px) {
      main.login .portal-nav { max-width: 520px; }
      .portal-nav__grid { grid-template-columns: 1fr 1fr; }
    }

    @media (min-width: 1024px) {
      body { padding-top: clamp(24px, 5vh, 56px); }
      main.login .brand,
      main.login .login__title,
      main.login .login__subtitle,
      main.login .form { max-width: 460px; }
      main.login .portal-nav { max-width: 560px; }
      .portal-link { padding: 15px 17px; }
      .portal-link__text strong { font-size: 15px; }
    }

    @media (min-width: 1440px) {
      main.login .topbar { max-width: 1180px; }
      main.login { max-width: min(100%, 1180px); }
    }

    @media (max-height: 900px) {
      main.login .topbar { margin-bottom: 22px; }
      main.login .brand__logo { width: clamp(62px, 6.5vw, 82px); }
      main.login .login__subtitle { margin-bottom: 14px; }
      .portal-nav { margin-top: 18px; }
    }

    @media (max-height: 780px) {
      body { gap: 14px; padding-top: 18px; padding-bottom: 14px; }
      main.login .topbar { margin-bottom: 16px; }
      main.login .brand__logo { width: clamp(54px, 5.5vw, 70px); }
      main.login .login__subtitle { margin-bottom: 12px; }
      .portal-nav { margin-top: 16px; }
      .portal-nav__label { margin-bottom: 10px; }
      .portal-link { padding: 11px 14px; }
      body > footer.footer { padding-top: 8px; font-size: 12px; }
    }

    @media (max-height: 700px) {
      main.login .brand { display: none; }
      main.login .topbar { margin-bottom: 12px; }
      .portal-link__text span { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      main.login .alert, .portal-nav { animation: none; }
      .portal-link, .portal-link__arrow { transition: none; }
      .portal-link:hover { transform: none; }
      .portal-link:hover .portal-link__arrow { transform: none; }
    }
  </style>
</head>
<body>
  <div class="blob blob--1"></div>
  <div class="blob blob--3"></div>
  <div class="blob blob--5"></div>

  <div class="wrap wrap--status">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Registrar login">
        <img class="topbar__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag">Admission &amp; Registrar</span>
        </span>
      </a>

      <div class="topbar__actions">
        <a class="topbar__cta" href="/EnrollmentMS/app/Admission/View/index.php">
          <span>Student Admission</span>
        </a>

        <!-- Students don't log in here — this keeps the online pay flow reachable. -->
        <a class="topbar__cta" href="/EnrollmentMS/app/Accounting/View/pay.php">
          <span>Pay Now</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    </header>

    <main class="login">
      <div class="brand">
        <img class="brand__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>

      <h1 class="login__title">Registrar Login</h1>
      <p class="login__subtitle">Sign in with your staff account to review admissions</p>

      <form class="form" id="loginForm" novalidate>
        <div class="field" id="identifierField">
          <label class="field__inner">
            <span class="field__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </span>
            <span class="field__label">Email:</span>
            <input type="email" name="identifier" autocomplete="username" required />
          </label>
        </div>

        <div class="field" id="passwordField">
          <div class="field__inner" id="pwWrap">
            <span class="field__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            </span>
            <span class="field__label">Password:</span>
            <input type="password" name="password" autocomplete="current-password" required aria-label="Password" />
            <button type="button" class="field__toggle" id="pwToggle" aria-label="Show password" aria-pressed="false">
              <svg class="pw__eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="pw__eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn--submit btn--compact" id="loginSubmit">Log In</button>
        <p class="form-msg" id="loginMsg"></p>
      </form>

      <nav class="portal-nav" aria-label="Other staff portals">
      <span class="portal-nav__label">Other staff portals</span>
      <div class="portal-nav__grid">
        <a class="portal-link portal-link--registrar" href="/EnrollmentMS/public/index.php">
          <span class="portal-link__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>
          </span>
          <span class="portal-link__text">
            <strong>Admin</strong>
            <span>Admissions &amp; enrollment</span>
          </span>
          <svg class="portal-link__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>

        <a class="portal-link portal-link--accounting" href="/EnrollmentMS/app/Accounting/View/index.php">
          <span class="portal-link__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
          </span>
          <span class="portal-link__text">
            <strong>Cashier</strong>
            <span>Payments &amp; receipts</span>
          </span>
          <svg class="portal-link__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    </nav>
  </main>
  </div>

  <footer class="footer">&copy; 2026 Enrollment Management System &middot; Admission &amp; Registrar</footer>

  <script src="/EnrollmentMS/public/assets/js/Registrar/registrar-model.js"></script>
  <script src="/EnrollmentMS/public/assets/js/Registrar/registrar-login.js"></script>
</body>
</html>
