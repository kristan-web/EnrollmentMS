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
  <title>Admin Login &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/shared/styles.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/portal.css" />
  <style>
    body {
      justify-content: flex-start;
      gap: clamp(18px, 3vh, 34px);
      padding: clamp(20px, 4vh, 44px) 20px clamp(16px, 3vh, 28px);
    }

    main.login {
      max-width: min(100%, 1040px);
      gap: 0;
      margin-inline: auto;
    }

    main.login .topbar {
      width: 100%;
      max-width: 1040px;
      justify-content: space-between;
      margin-bottom: clamp(20px, 4vh, 46px);
    }
    main.login .topbar__cta { margin-left: auto; }

    main.login .brand,
    main.login .login__title,
    main.login .login__subtitle,
    main.login .form,
    main.login .portal-nav {
      width: 100%;
      max-width: 448px;
      margin-inline: auto;
    }

    main.login .login__title { margin-bottom: 4px; }
    main.login .login__subtitle { margin-bottom: clamp(14px, 2vh, 22px); }

    main.login .form .form__meta { justify-content: flex-end; }

    #loginBtn {
      align-self: center;
      width: min(100%, 230px);
      min-width: 0;
      margin-top: 8px;
      padding: 15px 30px;
      border-radius: 13px;
      font-size: 15px;
    }

    main.login .alert {
      display: block;
      margin: 16px 0 0;
      padding: 12px 15px;
      border: 0;
      border-radius: 11px;
      text-align: center;
      font-size: 13.5px;
      font-weight: 600;
      color: #dc2626;
      background: rgba(220, 38, 38, 0.07);
      box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.2), inset 3px 0 0 #dc2626;
      animation: rise 0.25s ease;
    }
    main.login .alert[hidden] { display: none; }
    main.login .alert__icon { display: none; }
    main.login .alert__title {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: inherit;
    }
    main.login .alert__text {
      margin: 2px 0 0;
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.5;
      color: inherit;
      opacity: 0.85;
    }
    main.login .alert--success {
      color: #15803d;
      background: rgba(34, 197, 94, 0.09);
      box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.25), inset 3px 0 0 #22c55e;
    }

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
  <div class="blob blob--2"></div>
  <div class="blob blob--3"></div>
  <div class="blob blob--4"></div>
  <div class="blob blob--5"></div>

  <main class="login">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Student Portal home">
        <img class="topbar__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag">Admin Portal</span>
        </span>
      </a>

      <a class="topbar__cta" href="/EnrollmentMS/app/Admission/View/index.php">
          <span>Student Admission</span>
      </a>
    </header>

    <div class="brand">
      <img class="brand__logo" src="assets/images/logo.png" alt="Enrollment Management System crest" />
    </div>

    <h1 class="login__title">Welcome Back Admin</h1>
    <p class="login__subtitle">Enter Your Login Details Below</p>

    <form class="form" id="loginForm" novalidate>
      <input type="hidden" name="form_type" value="login">
      <div class="field" id="emailField">
        <label class="field__inner" for="email">
          <span class="field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
          </span>
          <span class="field__label">Email:</span>
          <input type="email" id="emailLogin" name="emailLogin" autocomplete="username" required placeholder="" />
        </label>
        <p class="field__error" id="emailError"></p>
      </div>

      <div class="field" id="passwordField">
        <div class="field__inner">
          <span class="field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </span>
          <label class="field__label" for="password">Password:</label>
          <input type="password" id="passwordLogin" name="passwordLogin" autocomplete="current-password" required placeholder="" />
          <button type="button" class="field__toggle" id="togglePassword" aria-label="Show password" aria-pressed="false">
            <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.7 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.8"/><path d="m4 4 16 16"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
        <p class="field__error" id="passwordError"></p>
      </div>

      <div class="form__meta">
        <a class="form__forgot" href="#">Forgot password?</a>
      </div>

      <button type="submit" class="btn" id="loginBtn">
        <span class="btn__label">Login</span>
        <span class="btn__spinner" aria-hidden="true"></span>
      </button>

      <div class="alert" id="alert" role="alert" hidden>
        <span class="alert__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>
        </span>
        <div class="alert__body">
          <p class="alert__title" id="alertTitle">Something Went Wrong</p>
          <p class="alert__text" id="alertText">A server error occurred. Please try again later.</p>
        </div>
      </div>
    </form>

    <nav class="portal-nav" aria-label="Other staff portals">
      <span class="portal-nav__label">Other staff portals</span>
      <div class="portal-nav__grid">
        <a class="portal-link portal-link--registrar" href="/EnrollmentMS/app/Registrar/View/index.php">
          <span class="portal-link__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>
          </span>
          <span class="portal-link__text">
            <strong>Registrar</strong>
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

  <footer class="footer">&copy; 2026 Enrollment Management System</footer>

  <!-- <script src="assets/js/shared/script.js"></script> -->
  <script src="assets/js/Accounts/Users.js"></script>


  
</body>
</html>
